import { NextResponse, type NextRequest } from "next/server";
import { AppSessionConfigError } from "@/lib/auth/app-session";
import { getServerAuthSession } from "@/lib/auth/server-session";
import { formatPaiseAsInr, getRegistrationAmountRepairPatch, resolvePayableAmountPaise } from "@/lib/payment/amounts";
import { isPaymentInProgress, isSeatConfirmed } from "@/lib/payment/status";
import { RazorpayConfigError } from "@/lib/razorpay/env";
import { createRazorpayClient, getPublicRazorpayKey, paymentCurrency } from "@/lib/razorpay/payments";
import { normalizeCreateCheckoutRequest, type RegistrationCheckoutDetailsCode } from "@/lib/registration/checkout-request";
import { classifySupabaseMutationError, shouldRetryWithLegacyRegistrationPayload, type SafeSupabaseMutationError } from "@/lib/registration/supabase-mutation-error";
import { areLockInPointsEnabled } from "@/lib/rewards/feature";
import { calculateLockInPointCheckout, getUserLockInPointsBalance } from "@/lib/rewards/points";
import { getReadableSupabaseError } from "@/lib/readable-error";
import { createAdminClient } from "@/lib/supabase/admin";
import { SupabaseConfigError } from "@/lib/supabase/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CheckoutRegistration = {
  id: string;
  user_id: string;
  competition_slug: string;
  competition_name: string;
  student_name: string;
  guardian_email: string;
  entry_fee: string | null;
  payment_status: string | null;
  razorpay_order_id: string | null;
  payment_order_id: string | null;
  payment_amount: number | null;
  amount_due: number | null;
  payment_currency: string | null;
  points_redeemed: number | null;
};

type RazorpayOrder = {
  id: string;
  amount: number;
  currency: string;
  status?: string;
};

const noStoreHeaders = { "Cache-Control": "no-store, no-cache, max-age=0, must-revalidate" };
const registrationSelectColumns =
  "id,user_id,competition_slug,competition_name,student_name,guardian_email,entry_fee,payment_status,razorpay_order_id,payment_amount,payment_currency";

export async function POST(request: NextRequest) {
  let activeRegistrationId: string | null = null;

  try {
    const body = await readJsonBody(request);
    const normalizedRequest = normalizeCreateCheckoutRequest(body);

    if (!normalizedRequest.ok) {
      console.warn(
        `[LockInTalks checkout registration] Validation failed. details=${normalizedRequest.detailsCode} slug=${normalizedRequest.slugForRedirect || "missing"}`
      );
      return jsonError(normalizedRequest.error, 400, "REGISTRATION_CREATE_FAILED", normalizedRequest.detailsCode);
    }

    const { competitionSlug, studentName, studentAge, guardianName, guardianEmail, city, country } = normalizedRequest.values;

    const session = await getServerAuthSession();

    if (!session.authenticated) {
      console.warn("[LockInTalks checkout registration] Auth check failed: No active server session.");
      return NextResponse.json(
        {
          errorCode: "AUTH_MISSING",
          detailsCode: "AUTH_MISSING",
          error: "Please Log In or Create an Account Before Registering for a Competition.",
          loginTo: `/login?next=${encodeURIComponent(`/register/${competitionSlug}`)}`
        },
        { status: 401, headers: noStoreHeaders }
      );
    }

    const userId = session.user.id;
    console.info(`[LockInTalks checkout registration] Request received. user=${userId} competition=${competitionSlug}`);
    const supabaseAdmin = createAdminClient();
    const { data: competition, error: competitionError } = await supabaseAdmin
      .from("competitions")
      .select("slug,name,fee_label,fee_amount,status")
      .eq("slug", competitionSlug)
      .eq("status", "live")
      .maybeSingle();

    if (competitionError) {
      console.error(`[LockInTalks checkout registration] Competition lookup failed: ${competitionError.message}`);
      return jsonError("This competition could not be loaded right now. Please try again.", 500, "REGISTRATION_CREATE_FAILED", "COMPETITION_NOT_FOUND");
    }

    if (!competition) {
      return jsonError("This competition is not available for registration right now.", 404, "REGISTRATION_CREATE_FAILED", "COMPETITION_NOT_FOUND");
    }

    const { data: existingRegistrations, error: existingError } = await supabaseAdmin
      .from("registrations")
      .select(registrationSelectColumns)
      .eq("user_id", userId)
      .eq("competition_slug", competition.slug)
      .order("created_at", { ascending: false })
      .limit(10);

    if (existingError) {
      console.warn(`[LockInTalks checkout registration] Duplicate registration check skipped: ${existingError.message}`);
    }

    const normalizedExistingRegistrations = (existingRegistrations || []).map(normalizeCheckoutRegistration);
    const paidRegistration = normalizedExistingRegistrations.find((registration) => isSeatConfirmed(registration.payment_status));

    if (paidRegistration) {
      console.info(`[LockInTalks checkout registration] Paid duplicate rejected. user=${userId} registration=${paidRegistration.id}`);
      return NextResponse.json(
        {
          errorCode: "REGISTRATION_CREATE_FAILED",
          error: "You already have a paid registration for this competition. Please check your dashboard.",
          alreadyPaid: true,
          registrationId: paidRegistration.id,
          redirectTo: "/dashboard"
        },
        { status: 409, headers: noStoreHeaders }
      );
    }

    const pendingRegistration = normalizedExistingRegistrations.find((registration) => !isSeatConfirmed(registration.payment_status));
    let registration: CheckoutRegistration;
    const resolvedNewAmount = resolvePayableAmountPaise({ competition, competitionSlug: competition.slug });
    const feeAmount = resolvedNewAmount.amountPaise;
    const feeLabel = formatPaiseAsInr(feeAmount);

    if (!feeAmount) {
      console.error(`[LockInTalks checkout registration] Invalid registration amount. competition=${competition.slug} source=${resolvedNewAmount.source}`);
      return jsonError("This competition does not have a valid registration fee configured. Please contact support.", 400, "ORDER_CREATE_FAILED", "ORDER_FAILED");
    }

    if (pendingRegistration) {
      activeRegistrationId = pendingRegistration.id;
      const resolvedExistingAmount = resolvePayableAmountPaise({
        registration: pendingRegistration,
        competition,
        competitionSlug: competition.slug
      });
      const amountPatch = getRegistrationAmountRepairPatch(resolvedExistingAmount, pendingRegistration.payment_status) || {};
      const updateResult = await updatePendingRegistration({
        supabaseAdmin,
        registrationId: pendingRegistration.id,
        userId,
        fields: {
          studentName,
          studentAge,
          guardianName,
          guardianEmail,
          city,
          country,
          entryFee: formatPaiseAsInr(resolvedExistingAmount.amountPaise),
          amountPaise: resolvedExistingAmount.amountPaise,
          amountPatch
        }
      });

      if (updateResult.error || !updateResult.registration) {
        const classifiedError = updateResult.error || {
          detailsCode: "INSERT_UNKNOWN_SUPABASE_ERROR" as const,
          supabaseError: { code: null, message: "Pending registration update returned no row.", details: null, hint: null }
        };
        console.error(
          `[LockInTalks checkout registration] Pending registration update failed. details=${classifiedError.detailsCode} supabase_code=${classifiedError.supabaseError.code || "none"}`
        );
        return jsonError("Registration could not be updated. Please try again.", 500, "REGISTRATION_CREATE_FAILED", classifiedError.detailsCode, {
          registrationId: activeRegistrationId,
          supabaseError: classifiedError.supabaseError
        });
      }

      registration = updateResult.registration;
      console.info(
        `[LockInTalks checkout registration] Pending registration reused. user=${userId} registration=${registration.id} amount=${resolvedExistingAmount.amountPaise} source=${resolvedExistingAmount.source}`
      );
    } else {
      const insertResult = await insertCheckoutRegistration({
        supabaseAdmin,
        userId,
        competition: {
          slug: competition.slug,
          name: competition.name
        },
        fields: {
          studentName,
          studentAge,
          guardianName,
          guardianEmail,
          city,
          country,
          entryFee: feeLabel,
          amountPaise: feeAmount
        }
      });

      if (insertResult.error || !insertResult.registration) {
        const classifiedError = insertResult.error || {
          detailsCode: "INSERT_UNKNOWN_SUPABASE_ERROR" as const,
          supabaseError: { code: null, message: "Registration insert returned no row.", details: null, hint: null }
        };
        console.error(
          `[LockInTalks checkout registration] Insert failed. details=${classifiedError.detailsCode} supabase_code=${classifiedError.supabaseError.code || "none"} message=${classifiedError.supabaseError.message || "none"}`
        );
        return jsonError(getReadableSupabaseError(insertResult.originalError, "Registration could not be saved."), 400, "REGISTRATION_CREATE_FAILED", classifiedError.detailsCode, {
          supabaseError: classifiedError.supabaseError
        });
      }

      registration = insertResult.registration;
      activeRegistrationId = registration.id;
      console.info(
        `[LockInTalks checkout registration] Registration created. user=${userId} registration=${registration.id} competition=${registration.competition_slug} amount=${feeAmount} source=${resolvedNewAmount.source}`
      );
    }

    const checkoutPayload = await createCheckoutOrder({
      registration,
      competition,
      supabaseAdmin,
      userId
    });

    return NextResponse.json(
      {
        ok: true,
        errorCode: null,
        ...checkoutPayload
      },
      { status: 200, headers: noStoreHeaders }
    );
  } catch (error) {
    if (error instanceof SupabaseConfigError || error instanceof AppSessionConfigError) {
      console.error(`[LockInTalks checkout registration] ${error.message}`);
      return jsonError(error.message, 503, "AUTH_MISSING", "ORDER_FAILED");
    }

    if (error instanceof RazorpayConfigError) {
      console.error(`[LockInTalks checkout registration] ${error.message}`);
      return NextResponse.json(
        {
          errorCode: "RAZORPAY_KEY_MISSING",
          detailsCode: "ORDER_FAILED",
          error: "Payments are not fully configured yet. Please contact support or try again later.",
          registrationId: activeRegistrationId
        },
        { status: 503, headers: noStoreHeaders }
      );
    }

    if (error instanceof CheckoutOrderSaveError) {
      return jsonError("Payment order was created, but could not be saved. Please contact support.", 500, "ORDER_CREATE_FAILED", error.classifiedError.detailsCode, {
        registrationId: activeRegistrationId,
        supabaseError: error.classifiedError.supabaseError
      });
    }

    console.error("[LockInTalks checkout registration] Unexpected checkout registration error:", error);
    return jsonError("Registration payment is temporarily unavailable. Please try again.", 500, "ORDER_CREATE_FAILED", "ORDER_FAILED", {
      registrationId: activeRegistrationId
    });
  }
}

async function readJsonBody(request: NextRequest) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

async function insertCheckoutRegistration({
  supabaseAdmin,
  userId,
  competition,
  fields
}: {
  supabaseAdmin: ReturnType<typeof createAdminClient>;
  userId: string;
  competition: { slug: string; name: string };
  fields: RegistrationWriteFields;
}) {
  const modernPayload = buildModernRegistrationInsertPayload({ userId, competition, fields });
  const modernResult = await supabaseAdmin.from("registrations").insert(modernPayload).select(registrationSelectColumns).single();

  if (!modernResult.error && modernResult.data) {
    return {
      registration: normalizeCheckoutRegistration(modernResult.data),
      error: null,
      originalError: null
    };
  }

  const modernError = classifySupabaseMutationError(modernResult.error);
  console.warn(
    `[LockInTalks checkout registration] Modern insert failed. details=${modernError.detailsCode} supabase_code=${modernError.supabaseError.code || "none"}`
  );

  if (!shouldRetryWithLegacyRegistrationPayload(modernError.detailsCode)) {
    return {
      registration: null,
      error: modernError,
      originalError: modernResult.error
    };
  }

  const legacyPayload = buildLegacyRegistrationInsertPayload({ userId, competition, fields });
  const legacyResult = await supabaseAdmin.from("registrations").insert(legacyPayload).select(registrationSelectColumns).single();

  if (!legacyResult.error && legacyResult.data) {
    console.info(`[LockInTalks checkout registration] Legacy-safe insert succeeded after ${modernError.detailsCode}. competition=${competition.slug}`);
    return {
      registration: normalizeCheckoutRegistration(legacyResult.data),
      error: null,
      originalError: null
    };
  }

  const legacyError = classifySupabaseMutationError(legacyResult.error);
  console.error(
    `[LockInTalks checkout registration] Legacy-safe insert failed. details=${legacyError.detailsCode} supabase_code=${legacyError.supabaseError.code || "none"}`
  );

  return {
    registration: null,
    error: legacyError,
    originalError: legacyResult.error || modernResult.error
  };
}

async function updatePendingRegistration({
  supabaseAdmin,
  registrationId,
  userId,
  fields
}: {
  supabaseAdmin: ReturnType<typeof createAdminClient>;
  registrationId: string;
  userId: string;
  fields: RegistrationUpdateFields;
}) {
  const modernPayload = buildModernRegistrationUpdatePayload(fields);
  const modernResult = await supabaseAdmin
    .from("registrations")
    .update(modernPayload)
    .eq("id", registrationId)
    .eq("user_id", userId)
    .select(registrationSelectColumns)
    .single();

  if (!modernResult.error && modernResult.data) {
    return {
      registration: normalizeCheckoutRegistration(modernResult.data),
      error: null
    };
  }

  const modernError = classifySupabaseMutationError(modernResult.error);
  console.warn(
    `[LockInTalks checkout registration] Modern pending update failed. details=${modernError.detailsCode} supabase_code=${modernError.supabaseError.code || "none"}`
  );

  if (!shouldRetryWithLegacyRegistrationPayload(modernError.detailsCode)) {
    return {
      registration: null,
      error: modernError
    };
  }

  const legacyPayload = buildLegacyRegistrationUpdatePayload(fields);
  const legacyResult = await supabaseAdmin
    .from("registrations")
    .update(legacyPayload)
    .eq("id", registrationId)
    .eq("user_id", userId)
    .select(registrationSelectColumns)
    .single();

  if (!legacyResult.error && legacyResult.data) {
    console.info(`[LockInTalks checkout registration] Legacy-safe pending update succeeded after ${modernError.detailsCode}. registration=${registrationId}`);
    return {
      registration: normalizeCheckoutRegistration(legacyResult.data),
      error: null
    };
  }

  return {
    registration: null,
    error: classifySupabaseMutationError(legacyResult.error)
  };
}

type RegistrationWriteFields = {
  studentName: string;
  studentAge: number;
  guardianName: string;
  guardianEmail: string;
  city: string;
  country: string;
  entryFee: string;
  amountPaise: number;
};

type RegistrationUpdateFields = RegistrationWriteFields & {
  amountPatch: Record<string, string | number>;
};

function buildModernRegistrationInsertPayload({
  userId,
  competition,
  fields
}: {
  userId: string;
  competition: { slug: string; name: string };
  fields: RegistrationWriteFields;
}) {
  return {
    ...buildLegacyRegistrationInsertPayload({ userId, competition, fields }),
    registration_status: "submitted",
    age_proof_status: "not_required_yet",
    payment_required: true,
    payment_provider: "razorpay",
    amount_due: fields.amountPaise
  };
}

function buildLegacyRegistrationInsertPayload({
  userId,
  competition,
  fields
}: {
  userId: string;
  competition: { slug: string; name: string };
  fields: RegistrationWriteFields;
}) {
  return {
    user_id: userId,
    competition_slug: competition.slug,
    competition_name: competition.name,
    student_name: fields.studentName,
    student_age: fields.studentAge,
    guardian_name: fields.guardianName,
    guardian_email: fields.guardianEmail,
    city: fields.city,
    country: fields.country,
    city_country: `${fields.city}, ${fields.country}`,
    entry_fee: fields.entryFee,
    payment_status: "pending",
    payment_amount: fields.amountPaise,
    payment_currency: "INR"
  };
}

function buildModernRegistrationUpdatePayload(fields: RegistrationUpdateFields) {
  return {
    ...fields.amountPatch,
    ...buildLegacyRegistrationUpdatePayload(fields),
    updated_at: new Date().toISOString()
  };
}

function buildLegacyRegistrationUpdatePayload(fields: RegistrationWriteFields) {
  return {
    student_name: fields.studentName,
    student_age: fields.studentAge,
    guardian_name: fields.guardianName,
    guardian_email: fields.guardianEmail,
    city: fields.city,
    country: fields.country,
    city_country: `${fields.city}, ${fields.country}`,
    entry_fee: fields.entryFee,
    payment_amount: fields.amountPaise,
    payment_currency: "INR"
  };
}

function normalizeCheckoutRegistration(row: Partial<CheckoutRegistration>): CheckoutRegistration {
  return {
    id: String(row.id || ""),
    user_id: String(row.user_id || ""),
    competition_slug: String(row.competition_slug || ""),
    competition_name: String(row.competition_name || ""),
    student_name: String(row.student_name || ""),
    guardian_email: String(row.guardian_email || ""),
    entry_fee: row.entry_fee ?? null,
    payment_status: row.payment_status ?? null,
    razorpay_order_id: row.razorpay_order_id ?? null,
    payment_order_id: row.payment_order_id ?? null,
    payment_amount: row.payment_amount ?? null,
    amount_due: row.amount_due ?? null,
    payment_currency: row.payment_currency ?? null,
    points_redeemed: row.points_redeemed ?? null
  };
}

async function createCheckoutOrder({
  registration,
  competition,
  supabaseAdmin,
  userId
}: {
  registration: CheckoutRegistration;
  competition: { fee_amount?: number | null };
  supabaseAdmin: ReturnType<typeof createAdminClient>;
  userId: string;
}) {
  const resolvedAmount = resolvePayableAmountPaise({
    registration,
    competition,
    competitionSlug: registration.competition_slug
  });
  const feeAmount = resolvedAmount.amountPaise;

  if (!feeAmount) {
    throw new Error("Invalid payment amount.");
  }

  await repairRegistrationAmountIfNeeded({
    registration,
    resolvedAmount,
    supabaseAdmin,
    source: "registration_checkout"
  });

  const pointsEnabled = areLockInPointsEnabled();
  const availablePoints = pointsEnabled ? await getUserLockInPointsBalance(userId) : 0;
  const checkout = pointsEnabled
    ? calculateLockInPointCheckout({
        feeAmountPaise: feeAmount,
        requestedPoints: 0,
        availablePoints
      })
    : {
        feeAmountPaise: feeAmount,
        requestedPoints: 0,
        availablePoints: 0,
        maxUsablePoints: 0,
        appliedPoints: 0,
        discountAmountPaise: 0,
        payableAmountPaise: feeAmount
      };
  const amount = checkout.payableAmountPaise;
  const existingOrderId = registration.payment_order_id || registration.razorpay_order_id;
  const existingAmountBeforeRepair = Number(registration.amount_due || registration.payment_amount || 0);

  if (
    existingOrderId &&
    isPaymentInProgress(registration.payment_status) &&
    existingAmountBeforeRepair === amount &&
    Number(registration.points_redeemed || 0) === checkout.appliedPoints
  ) {
    await savePaymentAttempt({
      registrationId: registration.id,
      userId,
      providerOrderId: existingOrderId,
      amount,
      currency: registration.payment_currency || paymentCurrency,
      status: "reused"
    });

    return {
      keyId: getPublicRazorpayKey(),
      orderId: existingOrderId,
      amount,
      originalAmount: checkout.feeAmountPaise,
      currency: registration.payment_currency || paymentCurrency,
      name: "LockInTalks",
      description: registration.competition_name,
      competitionName: registration.competition_name,
      participantName: registration.student_name,
      registrationId: registration.id,
      paymentStatus: registration.payment_status || "order_created",
      entryFee: formatPaiseAsInr(amount),
      prefill: {
        name: registration.student_name,
        email: registration.guardian_email
      }
    };
  }

  const razorpay = createRazorpayClient();
  const order = (await razorpay.orders.create({
    amount,
    currency: paymentCurrency,
    receipt: `reg_${registration.id.slice(0, 24)}`,
    notes: {
      registration_id: registration.id,
      competition: registration.competition_name
    }
  })) as RazorpayOrder;

  const orderSaveResult = await saveOrderOnRegistration({
    supabaseAdmin,
    registrationId: registration.id,
    userId,
    order,
    amount,
    pointsRedeemed: pointsEnabled ? checkout.appliedPoints : 0,
    pointsDiscountAmount: pointsEnabled ? checkout.discountAmountPaise : 0
  });

  if (orderSaveResult.error) {
    console.error(
      `[LockInTalks checkout registration] Failed to save Razorpay order. details=${orderSaveResult.error.detailsCode} supabase_code=${orderSaveResult.error.supabaseError.code || "none"}`
    );
    throw new CheckoutOrderSaveError(orderSaveResult.error);
  }

  await savePaymentAttempt({
    registrationId: registration.id,
    userId,
    providerOrderId: order.id,
    amount: order.amount,
    currency: order.currency,
    status: order.status || "created"
  });

  return {
    keyId: getPublicRazorpayKey(),
    orderId: order.id,
    amount: order.amount,
    originalAmount: checkout.feeAmountPaise,
    currency: order.currency,
    name: "LockInTalks",
    description: registration.competition_name,
    competitionName: registration.competition_name,
    participantName: registration.student_name,
    registrationId: registration.id,
    paymentStatus: "order_created",
    entryFee: formatPaiseAsInr(order.amount),
    prefill: {
      name: registration.student_name,
      email: registration.guardian_email
    }
  };
}

async function saveOrderOnRegistration({
  supabaseAdmin,
  registrationId,
  userId,
  order,
  amount,
  pointsRedeemed,
  pointsDiscountAmount
}: {
  supabaseAdmin: ReturnType<typeof createAdminClient>;
  registrationId: string;
  userId: string;
  order: RazorpayOrder;
  amount: number;
  pointsRedeemed: number;
  pointsDiscountAmount: number;
}) {
  const modernPayload = {
    payment_status: "order_created",
    registration_status: "payment_pending",
    payment_provider: "razorpay",
    razorpay_order_id: order.id,
    payment_order_id: order.id,
    payment_amount: amount,
    amount_due: amount,
    points_redeemed: pointsRedeemed,
    points_discount_amount: pointsDiscountAmount,
    payment_currency: paymentCurrency,
    updated_at: new Date().toISOString()
  };
  const modernResult = await supabaseAdmin.from("registrations").update(modernPayload).eq("id", registrationId).eq("user_id", userId);

  if (!modernResult.error) {
    return { error: null };
  }

  const modernError = classifySupabaseMutationError(modernResult.error);
  console.warn(
    `[LockInTalks checkout registration] Modern order save failed. details=${modernError.detailsCode} supabase_code=${modernError.supabaseError.code || "none"}`
  );

  if (!shouldRetryWithLegacyRegistrationPayload(modernError.detailsCode)) {
    return { error: modernError };
  }

  const legacyPayload = {
    payment_status: modernError.detailsCode === "INSERT_CHECK_CONSTRAINT_FAILED" ? "payment_created" : "order_created",
    razorpay_order_id: order.id,
    payment_amount: amount,
    payment_currency: paymentCurrency
  };
  const legacyResult = await supabaseAdmin.from("registrations").update(legacyPayload).eq("id", registrationId).eq("user_id", userId);

  if (!legacyResult.error) {
    console.info(`[LockInTalks checkout registration] Legacy-safe order save succeeded after ${modernError.detailsCode}. registration=${registrationId}`);
    return { error: null };
  }

  return { error: classifySupabaseMutationError(legacyResult.error) };
}

class CheckoutOrderSaveError extends Error {
  classifiedError: {
    detailsCode: RegistrationCheckoutDetailsCode;
    supabaseError: SafeSupabaseMutationError;
  };

  constructor(classifiedError: { detailsCode: RegistrationCheckoutDetailsCode; supabaseError: SafeSupabaseMutationError }) {
    super("Payment order was created, but could not be saved.");
    this.name = "CheckoutOrderSaveError";
    this.classifiedError = classifiedError;
  }
}

async function savePaymentAttempt({
  registrationId,
  userId,
  providerOrderId,
  amount,
  currency,
  status
}: {
  registrationId: string;
  userId: string;
  providerOrderId: string;
  amount: number;
  currency: string;
  status: string;
}) {
  try {
    const supabaseAdmin = createAdminClient();
    const { error } = await supabaseAdmin.from("payment_attempts").upsert(
      {
        registration_id: registrationId,
        user_id: userId,
        provider: "razorpay",
        provider_order_id: providerOrderId,
        amount,
        currency,
        status,
        updated_at: new Date().toISOString()
      },
      { onConflict: "provider,provider_order_id" }
    );

    if (error) console.warn(`[LockInTalks checkout registration] Could not save payment attempt ${providerOrderId}: ${error.message}`);
  } catch (error) {
    console.warn("[LockInTalks checkout registration] Payment attempt logging skipped:", error);
  }
}

async function repairRegistrationAmountIfNeeded({
  registration,
  resolvedAmount,
  supabaseAdmin,
  source
}: {
  registration: {
    id: string;
    payment_status: string | null;
  };
  resolvedAmount: ReturnType<typeof resolvePayableAmountPaise>;
  supabaseAdmin: ReturnType<typeof createAdminClient>;
  source: string;
}) {
  const repairPatch = getRegistrationAmountRepairPatch(resolvedAmount, registration.payment_status);
  if (!repairPatch) return;

  const { error } = await supabaseAdmin.from("registrations").update(repairPatch).eq("id", registration.id);
  if (error) {
    console.warn(`[LockInTalks checkout registration] Could not repair amount for registration=${registration.id}: ${error.message}`);
    return;
  }

  console.info(
    `[LockInTalks checkout registration] Repaired unpaid registration amount. source=${source} registration=${registration.id} amount=${resolvedAmount.amountPaise} reason=${resolvedAmount.repairReason || "unknown"}`
  );
}

function jsonError(
  error: string,
  status: number,
  errorCode: string,
  detailsCode: RegistrationCheckoutDetailsCode | "AUTH_MISSING",
  extra?: Record<string, unknown>
) {
  return NextResponse.json({ errorCode, detailsCode, error, ...extra }, { status, headers: noStoreHeaders });
}
