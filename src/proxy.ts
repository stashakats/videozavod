import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_RENEWAL_WINDOW_SECONDS,
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_SECONDS,
  hasValidBasicAuthorization,
  isSecureCookieRequired,
  signAdminSession,
  verifyAdminSession,
} from "@/lib/admin-auth";

export function proxy(request: NextRequest) {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    return NextResponse.next();
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  const sessionExpiresAt = verifyAdminSession(
    request.cookies.get(ADMIN_SESSION_COOKIE)?.value,
    password,
    nowSeconds,
  );
  const hasBasicAuth = hasValidBasicAuthorization(
    request.headers.get("authorization"),
    password,
  );

  if (!sessionExpiresAt && !hasBasicAuth) {
    if (request.method === "GET") {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set(
        "next",
        `${request.nextUrl.pathname}${request.nextUrl.search}`,
      );
      return NextResponse.redirect(loginUrl);
    }

    return new NextResponse("Unauthorized", { status: 401 });
  }

  const response = NextResponse.next();
  if (
    sessionExpiresAt &&
    sessionExpiresAt - nowSeconds <= ADMIN_RENEWAL_WINDOW_SECONDS
  ) {
    const renewedExpiresAt = nowSeconds + ADMIN_SESSION_SECONDS;
    response.cookies.set(
      ADMIN_SESSION_COOKIE,
      signAdminSession(renewedExpiresAt, password),
      {
        expires: new Date(renewedExpiresAt * 1000),
        httpOnly: true,
        maxAge: ADMIN_SESSION_SECONDS,
        path: "/",
        sameSite: "lax",
        secure: isSecureCookieRequired(request.nextUrl.hostname),
      },
    );
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
