#!/usr/bin/env node

const baseUrl = normalizeBaseUrl(process.env.LOCKINTALKS_TEST_BASE_URL || "http://localhost:3000");
const testEmail = process.env.LOCKINTALKS_TEST_EMAIL || "";
const testPassword = process.env.LOCKINTALKS_TEST_PASSWORD || "";
const cookieJar = new Map();
const failures = [];

console.log(`[auth-smoke] Base URL: ${baseUrl}`);
console.log(`[auth-smoke] Real login test: ${testEmail && testPassword ? `enabled for ${maskEmail(testEmail)}` : "skipped; set LOCKINTALKS_TEST_EMAIL and LOCKINTALKS_TEST_PASSWORD"}`);

try {
  await checkPage("/login");
  await checkPage("/signup");
  await checkJson("/api/debug/auth-cookies");
await checkNoStore("/api/auth/session");
await checkNoStore("/api/debug/auth-cookies");
await checkFirstPartyCookie();
await checkAuthStyleCookie();
await checkHtmlAuthStyleCookie();

  if (testEmail && testPassword) {
    await checkRealLogin();
  }
} catch (error) {
  fail(error instanceof Error ? error.message : "Auth smoke test crashed.");
}

if (failures.length > 0) {
  console.error("\n[auth-smoke] Failed checks:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("\n[auth-smoke] Passed.");

async function checkPage(path) {
  const { response } = await request(path);
  if (!response.ok) fail(`${path} returned ${response.status}`);
  else console.log(`[auth-smoke] ${path} loads (${response.status}).`);
}

async function checkJson(path) {
  const { response, body } = await request(path);
  if (!response.ok) {
    if (response.status === 503 && isExpectedLocalConfigError(body)) {
      console.log(`[auth-smoke] ${path} returned a readable config diagnostic (${response.status}).`);
      return;
    }
    fail(`${path} returned ${response.status}`);
  }
  if (typeof body !== "object" || body === null) fail(`${path} did not return JSON.`);
  else console.log(`[auth-smoke] ${path} returns JSON.`);
}

async function checkNoStore(path) {
  const { response } = await request(path);
  const cacheControl = response.headers.get("cache-control") || "";
  if (!cacheControl.toLowerCase().includes("no-store")) fail(`${path} is missing Cache-Control: no-store.`);
  else console.log(`[auth-smoke] ${path} has no-store cache headers.`);
}

async function checkFirstPartyCookie() {
  const set = await request("/api/debug/set-test-cookie");
  if (!set.response.ok) fail(`/api/debug/set-test-cookie returned ${set.response.status}`);

  const read = await request("/api/debug/read-test-cookie");
  if (!read.response.ok) fail(`/api/debug/read-test-cookie returned ${read.response.status}`);
  if (!read.body?.present) fail("First-party test cookie was not readable by the server.");
  else console.log("[auth-smoke] First-party test cookie set/read works.");
}

async function checkAuthStyleCookie() {
  const set = await request("/api/debug/set-auth-style-cookie");
  if (set.response.status !== 303) fail(`/api/debug/set-auth-style-cookie returned ${set.response.status}`);

  const read = await request("/api/debug/read-test-cookie");
  if (!read.response.ok) fail(`/api/debug/read-test-cookie returned ${read.response.status} after auth-style cookie set`);
  if (!read.body?.authStylePresent) fail("Auth-style httpOnly redirect cookie was not readable by the server.");
  else console.log("[auth-smoke] Auth-style httpOnly redirect cookie set/read works.");
}

async function checkHtmlAuthStyleCookie() {
  const set = await request("/api/debug/set-html-auth-style-cookie");
  if (set.response.status !== 200) fail(`/api/debug/set-html-auth-style-cookie returned ${set.response.status}`);

  const read = await request("/api/debug/read-test-cookie");
  if (!read.response.ok) fail(`/api/debug/read-test-cookie returned ${read.response.status} after html auth-style cookie set`);
  if (!read.body?.htmlAuthStylePresent) fail("HTML auth-style httpOnly cookie was not readable by the server.");
  else console.log("[auth-smoke] HTML auth-style httpOnly cookie set/read works.");
}

async function checkRealLogin() {
  const login = await request("/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      email: testEmail,
      password: testPassword,
      next: "/dashboard"
    }).toString()
  });

  if (login.response.status !== 200 && login.response.status !== 303) {
    fail(`/api/auth/login failed (${login.response.status}): ${safeError(login.body)}`);
    return;
  }

  const cookieNames = [...cookieJar.keys()].sort();
  if (!cookieNames.some(isAuthCookieName)) {
    fail("Login response did not store an app-session or Supabase auth cookie in the smoke-test cookie jar.");
  } else {
    console.log(`[auth-smoke] Login stored auth cookie name(s): ${cookieNames.filter(isAuthCookieName).join(", ") || "none"}.`);
  }

  const location = login.response.headers.get("location") || login.response.headers.get("x-lockintalks-redirect") || "";
  if (!location.includes("/dashboard") && !location.includes("/admin")) {
    fail(`Login redirect target was unexpected: ${location || "missing redirect header"}.`);
  } else {
    console.log(`[auth-smoke] Login redirected to ${location}.`);
  }

  const session = await request("/api/auth/session");
  if (!session.body?.authenticated) {
    fail("/api/auth/session did not become authenticated after login.");
  } else {
    console.log(`[auth-smoke] Session authenticated as ${maskEmail(session.body.user?.email || testEmail)} with role ${session.body.role || "unknown"}.`);
  }

  await request("/logout");
  const afterLogout = await request("/api/auth/session");
  if (afterLogout.body?.authenticated) fail("/api/auth/session stayed authenticated after logout.");
  else console.log("[auth-smoke] Logout clears the server session.");
}

async function request(path, options = {}) {
  const headers = new Headers(options.headers || {});
  if (cookieJar.size > 0) {
    headers.set("cookie", [...cookieJar.entries()].map(([name, value]) => `${name}=${value}`).join("; "));
  }

  const response = await fetch(new URL(path, baseUrl), {
    ...options,
    headers,
    redirect: "manual"
  });

  storeCookies(response.headers);

  const text = await response.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text.slice(0, 180);
  }

  return { response, body, text };
}

function storeCookies(headers) {
  const setCookieHeaders = typeof headers.getSetCookie === "function" ? headers.getSetCookie() : splitSetCookieHeader(headers.get("set-cookie"));

  for (const setCookieHeader of setCookieHeaders) {
    const [cookiePair, ...attributes] = setCookieHeader.split(";");
    const [name, ...valueParts] = cookiePair.split("=");
    if (!name || valueParts.length === 0) continue;

    const shouldDelete = attributes.some((attribute) => {
      const normalized = attribute.trim().toLowerCase();
      return normalized === "max-age=0" || normalized.startsWith("expires=thu, 01 jan 1970");
    });

    if (shouldDelete) cookieJar.delete(name.trim());
    else cookieJar.set(name.trim(), valueParts.join("="));
  }
}

function splitSetCookieHeader(header) {
  if (!header) return [];
  return header.split(/,(?=\s*[^;,\s]+=)/g).map((value) => value.trim()).filter(Boolean);
}

function isAuthCookieName(name) {
  return name === "lockintalks_app_session" || name === "supabase.auth.token" || (name.startsWith("sb-") && name.includes("auth-token"));
}

function fail(message) {
  failures.push(message);
  console.error(`[auth-smoke] FAIL: ${message}`);
}

function safeError(body) {
  if (body && typeof body === "object" && "error" in body) return String(body.error);
  return "No readable error returned.";
}

function isExpectedLocalConfigError(body) {
  if (!body || typeof body !== "object") return false;
  const supabase = body.supabase;
  return Boolean(
    body.authError ||
      body.error ||
      (supabase && typeof supabase === "object" && supabase.configured === false)
  );
}

function maskEmail(value) {
  const [name = "", domain = ""] = String(value).split("@");
  if (!name || !domain) return "invalid-email";
  return `${name.slice(0, 2)}***${name.slice(-1)}@${domain}`;
}

function normalizeBaseUrl(value) {
  return value.endsWith("/") ? value : `${value}/`;
}
