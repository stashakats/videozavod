import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, isSecureCookieRequired } from "@/lib/admin-auth";

function logout(request: NextRequest) {
  const response = NextResponse.redirect(
    new URL("/login?loggedOut=1", request.url),
  );
  response.cookies.set(ADMIN_SESSION_COOKIE, "", {
    expires: new Date(0),
    httpOnly: true,
    maxAge: 0,
    path: "/",
    sameSite: "lax",
    secure: isSecureCookieRequired(request.nextUrl.hostname),
  });
  return response;
}

export function GET(request: NextRequest) {
  return logout(request);
}

export function POST(request: NextRequest) {
  return logout(request);
}
