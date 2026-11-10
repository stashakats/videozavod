"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_SECONDS,
  isSecureCookieRequired,
  matchesAdminPassword,
  signAdminSession,
} from "@/lib/admin-auth";

function safeNextPath(value: FormDataEntryValue | null): string {
  if (
    typeof value === "string" &&
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !value.includes("\\")
  ) {
    return value;
  }

  return "/admin";
}

function getRequestHostname(host: string | null): string {
  if (!host) {
    return "";
  }

  try {
    return new URL(`http://${host}`).hostname;
  } catch {
    return "";
  }
}

export async function loginAction(formData: FormData): Promise<void> {
  const password = process.env.ADMIN_PASSWORD;
  const nextPath = safeNextPath(formData.get("next"));
  const submitted = formData.get("password");

  if (
    !password ||
    typeof submitted !== "string" ||
    !matchesAdminPassword(submitted, password)
  ) {
    const loginUrl = new URL("/login", "http://localhost");
    loginUrl.searchParams.set("next", nextPath);
    loginUrl.searchParams.set(password ? "error" : "setup", "1");
    redirect(`${loginUrl.pathname}${loginUrl.search}`);
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  const expiresAt = nowSeconds + ADMIN_SESSION_SECONDS;
  const requestHeaders = await headers();
  const hostname = getRequestHostname(
    requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host"),
  );
  const cookieStore = await cookies();

  cookieStore.set(ADMIN_SESSION_COOKIE, signAdminSession(expiresAt, password), {
    expires: new Date(expiresAt * 1000),
    httpOnly: true,
    maxAge: ADMIN_SESSION_SECONDS,
    path: "/",
    sameSite: "lax",
    secure: isSecureCookieRequired(hostname),
  });

  redirect(nextPath);
}
