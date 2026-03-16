import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const protectedPaths = ["/dashboard", "/campaigns"];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  let isAuth = false;
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    isAuth = !!token;
  } catch {
    isAuth = false;
  }

  if (pathname === "/") {
    return NextResponse.redirect(new URL(isAuth ? "/dashboard" : "/login", request.url));
  }

  if ((pathname === "/login" || pathname === "/register") && isAuth) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (pathname.match(/^\/campaigns\/[^/]+\/join$/)) {
    return NextResponse.next();
  }
  if (protectedPaths.some((p) => pathname.startsWith(p)) && !isAuth) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = { matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"] };
