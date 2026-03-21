import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  // NextAuth v5 uses AUTH_SECRET; fall back to NEXTAUTH_SECRET for compat
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "dev-secret-do-not-use-in-production";

  const token = await getToken({
    req: request,
    secret,
    // NextAuth v5 beta uses "authjs.session-token" cookie by default
    cookieName: process.env.NODE_ENV === "production"
      ? "__Secure-authjs.session-token"
      : "authjs.session-token",
  });

  if (!token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
