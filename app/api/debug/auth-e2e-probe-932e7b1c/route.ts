import crypto from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { authNoStoreHeaders } from "@/lib/auth/http";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET(request: NextRequest) {
  const email = `codex-auth-${Date.now()}-${crypto.randomUUID().slice(0, 8)}@lockintalks.test`;
  const password = crypto.randomBytes(24).toString("base64url");
  const admin = createAdminClient();
  let userId: string | null = null;

  try {
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: "Codex Auth Probe"
      }
    });

    userId = created.user?.id || null;

    if (createError || !userId) {
      return json({
        ok: false,
        stage: "create-user",
        error: createError?.message || "No user id returned."
      }, 500);
    }

    await admin.from("profiles").upsert({ id: userId, email, role: "admin" }, { onConflict: "id" });

    const loginResponse = await fetch(new URL("/api/auth/login", request.url), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, next: "/dashboard" }),
      redirect: "manual",
      cache: "no-store"
    });
    const loginBody = await safeJson(loginResponse);
    const setCookieHeaders = getSetCookieHeaders(loginResponse.headers);
    const cookieNames = setCookieHeaders.map((header) => header.split(";")[0]?.split("=")[0]).filter(Boolean);
    const appSessionCookie = setCookieHeaders.find((header) => header.startsWith("lockintalks_app_session="));
    const sessionResponse = appSessionCookie
      ? await fetch(new URL("/api/auth/session", request.url), {
          headers: { Cookie: appSessionCookie.split(";")[0] },
          cache: "no-store"
        })
      : null;
    const sessionBody = sessionResponse ? await safeJson(sessionResponse) : null;

    const adminChecks = appSessionCookie
      ? await Promise.all([
          probeProtectedPath(request, "/admin", appSessionCookie),
          probeProtectedPath(request, "/admin/competitions", appSessionCookie),
          probeProtectedPath(request, "/admin/registrations", appSessionCookie),
          probeProtectedPath(request, "/api/admin/competitions", appSessionCookie)
        ])
      : [];

    return json({
      ok: Boolean(loginResponse.ok && appSessionCookie && sessionBody?.authenticated),
      createdUser: Boolean(userId),
      login: {
        status: loginResponse.status,
        ok: loginResponse.ok,
        bodyOk: Boolean(loginBody?.ok),
        redirectTo: typeof loginBody?.redirectTo === "string" ? loginBody.redirectTo : null,
        cookieNames,
        hasSetCookieHeader: setCookieHeaders.length > 0,
        hasAppSessionCookie: Boolean(appSessionCookie)
      },
      session: {
        status: sessionResponse?.status || null,
        authenticated: Boolean(sessionBody?.authenticated),
        source: typeof sessionBody?.source === "string" ? sessionBody.source : null,
        role: typeof sessionBody?.role === "string" ? sessionBody.role : null,
        emailMatches: sessionBody?.user?.email === email
      },
      adminChecks
    });
  } catch (error) {
    return json({
      ok: false,
      stage: "unexpected",
      error: error instanceof Error ? error.message : "Unknown auth probe error."
    }, 500);
  } finally {
    if (userId) {
      await admin.auth.admin.deleteUser(userId);
      await admin.from("profiles").delete().eq("id", userId);
    }
  }
}

async function probeProtectedPath(request: NextRequest, path: string, setCookieHeader: string) {
  const response = await fetch(new URL(path, request.url), {
    headers: { Cookie: setCookieHeader.split(";")[0] },
    cache: "no-store",
    redirect: "manual"
  });
  const text = await response.text();
  return {
    path,
    status: response.status,
    denied: text.includes("Please log in with an admin account") || text.includes("You do not have admin access")
  };
}

function json(payload: unknown, status = 200) {
  return NextResponse.json(payload, { status, headers: authNoStoreHeaders });
}

async function safeJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function getSetCookieHeaders(headers: Headers) {
  const getSetCookie = (headers as Headers & { getSetCookie?: () => string[] }).getSetCookie;
  if (typeof getSetCookie === "function") return getSetCookie.call(headers);
  const header = headers.get("set-cookie");
  if (!header) return [];
  return header.split(/,(?=\s*[^;,\s]+=)/g).map((value) => value.trim()).filter(Boolean);
}
