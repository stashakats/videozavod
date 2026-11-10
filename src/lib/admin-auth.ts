import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_SESSION_COOKIE = "videozavod_admin_session";
export const ADMIN_SESSION_SECONDS = 90 * 24 * 60 * 60;
export const ADMIN_RENEWAL_WINDOW_SECONDS = 30 * 24 * 60 * 60;

function constantTimeEqual(left: string, right: string): boolean {
  const leftDigest = createHash("sha256").update(left).digest();
  const rightDigest = createHash("sha256").update(right).digest();
  return timingSafeEqual(leftDigest, rightDigest);
}

export function matchesAdminPassword(
  submitted: string,
  password = process.env.ADMIN_PASSWORD,
): boolean {
  return Boolean(password) && constantTimeEqual(submitted, password!);
}

export function signAdminSession(
  expiresAtSeconds: number,
  password: string,
): string {
  const expiresAt = String(expiresAtSeconds);
  const signature = createHmac("sha256", password)
    .update(expiresAt)
    .digest("base64url");
  return `${expiresAt}.${signature}`;
}

export function verifyAdminSession(
  value: string | undefined,
  password: string,
  nowSeconds = Math.floor(Date.now() / 1000),
): number | null {
  if (!value) {
    return null;
  }

  const [expiresAtText, signature, ...extra] = value.split(".");
  if (extra.length > 0 || !/^\d+$/.test(expiresAtText ?? "") || !signature) {
    return null;
  }

  const expected = createHmac("sha256", password)
    .update(expiresAtText)
    .digest("base64url");
  if (!constantTimeEqual(signature, expected)) {
    return null;
  }

  const expiresAt = Number(expiresAtText);
  return Number.isSafeInteger(expiresAt) && expiresAt > nowSeconds
    ? expiresAt
    : null;
}

export function hasValidBasicAuthorization(
  authorization: string | null,
  password: string,
): boolean {
  if (!authorization) {
    return false;
  }

  const match = authorization.match(/^Basic\s+([A-Za-z0-9+/]+=*)$/i);
  if (!match) {
    return false;
  }

  const credentials = Buffer.from(match[1], "base64").toString("utf8");
  const separator = credentials.indexOf(":");
  return (
    separator >= 0 &&
    matchesAdminPassword(credentials.slice(separator + 1), password)
  );
}

export function isSecureCookieRequired(hostname: string): boolean {
  return hostname.toLowerCase() !== "localhost";
}
