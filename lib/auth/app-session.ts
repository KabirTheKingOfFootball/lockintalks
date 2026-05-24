import crypto from "node:crypto";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import type { AppRole } from "@/lib/auth/redirect";

export const appSessionCookieName = "lockintalks_app_session";
const sessionLifetimeMs = 1000 * 60 * 60 * 24 * 7;
const placeholderSecrets = new Set(["replace-with-a-secure-random-32-byte-secret"]);

export type AppSession = {
  userId: string;
  email: string;
  role: AppRole;
  expiresAt: number;
};

export class AppSessionConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AppSessionConfigError";
  }
}

export async function readAppSession() {
  const cookieStore = await cookies();
  const rawSession = cookieStore.get(appSessionCookieName)?.value;
  if (!rawSession) return null;
  return verifyAppSessionValue(rawSession);
}

export function setAppSessionCookie(response: NextResponse, session: Omit<AppSession, "expiresAt">) {
  const expiresAt = Date.now() + sessionLifetimeMs;
  response.cookies.set(appSessionCookieName, signAppSessionValue({ ...session, expiresAt }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(expiresAt)
  });
}

export function clearAppSessionCookie(response: NextResponse) {
  response.cookies.set(appSessionCookieName, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
    maxAge: 0
  });
}

export function getAppSessionDiagnostics() {
  const appSecret = process.env.APP_SESSION_SECRET || "";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const appSessionSecretConfigured = isUsableSecret(appSecret);
  const serviceRoleFallbackAvailable = isUsableSecret(serviceRoleKey);

  return {
    appSessionSecretConfigured,
    appSessionSigningReady: appSessionSecretConfigured || serviceRoleFallbackAvailable,
    appSessionSecretSource: appSessionSecretConfigured ? "APP_SESSION_SECRET" : serviceRoleFallbackAvailable ? "SUPABASE_SERVICE_ROLE_KEY_FALLBACK" : null
  };
}

function signAppSessionValue(session: AppSession) {
  const payload = toBase64Url(JSON.stringify(session));
  const signature = sign(payload);
  return `${payload}.${signature}`;
}

function verifyAppSessionValue(value: string) {
  const [payload, signature] = value.split(".");
  if (!payload || !signature) return null;

  const expectedSignature = sign(payload);
  if (!safeEqual(signature, expectedSignature)) return null;

  try {
    const session = JSON.parse(fromBase64Url(payload)) as Partial<AppSession>;
    if (!session.userId || !session.email || (session.role !== "admin" && session.role !== "user")) return null;
    if (!session.expiresAt || session.expiresAt <= Date.now()) return null;
    return session as AppSession;
  } catch {
    return null;
  }
}

function sign(payload: string) {
  return crypto.createHmac("sha256", getAppSessionSecret()).update(payload).digest("base64url");
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function toBase64Url(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function fromBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function getAppSessionSecret() {
  const appSecret = process.env.APP_SESSION_SECRET || "";
  if (isUsableSecret(appSecret)) {
    return appSecret;
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (isUsableSecret(serviceRoleKey)) {
    console.warn("[LockInTalks app session] APP_SESSION_SECRET is missing. Using server-only SUPABASE_SERVICE_ROLE_KEY as a temporary signing fallback.");
    return serviceRoleKey;
  }

  throw new AppSessionConfigError("APP_SESSION_SECRET is missing, too short, or still using the example value. Add a secure random value of at least 32 characters in Vercel Environment Variables, then redeploy.");
}

function isUsableSecret(value: string) {
  return Boolean(value) && value.length >= 32 && !placeholderSecrets.has(value);
}
