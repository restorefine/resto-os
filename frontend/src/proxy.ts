import { NextRequest, NextResponse } from "next/server";

// Set to true to bypass auth in development
const DEV_BYPASS = process.env.NODE_ENV === "development";

const PUBLIC_ROUTES = ["/login", "/portal/login"];
const PORTAL_LOGIN = "/portal/login";

export function proxy(request: NextRequest) {
  if (DEV_BYPASS) return NextResponse.next();

  const { pathname } = request.nextUrl;
  const token = request.cookies.get("access_token")?.value;

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
  const isPortalRoute =
    pathname.startsWith("/portal") && pathname !== "/portal/login";

  if (isPublicRoute && token) {
    const dest = isPortalRoute ? "/portal" : "/";
    return NextResponse.redirect(new URL(dest, request.url));
  }

  if (!isPublicRoute && !token) {
    const loginPath = isPortalRoute ? "/portal/login" : "/login";
    return NextResponse.redirect(new URL(loginPath, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/).*)",
  ],
};
