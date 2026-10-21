import { NextRequest, NextResponse } from "next/server";
import { createClient } from "./utils/supabase/middleware";

const AUTH_ROUTES = ["/login", "/register"];

const PROTECTED_ROUTES = [
  "/dashboard",
  "/onboarding",
  "/courses",
  "/settings",
  "calendar",
];

export async function proxy(request: NextRequest) {
  const supabase = createClient(request);

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  const isAuthRoute = AUTH_ROUTES.some((route) =>
    request.nextUrl.pathname.startsWith(route),
  );

  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    request.nextUrl.pathname.startsWith(route),
  );

  // check auth routes
  if (session && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";

    // if not completed onboarding, redirect to onboarding page
    if (!session.user.app_metadata?.is_onboarding_complete) {
      url.pathname = "/onboarding";
    }

    return NextResponse.redirect(url);
  }

  if (!session && !isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  //   if onboarding route
  if (session && request.nextUrl.pathname.startsWith("/onboarding")) {
    // if completed onboarding, redirect to dashboard
    if (session.user.app_metadata?.is_onboarding_complete) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  // check protected routes
  if (session && isProtectedRoute) {
    // if not completed onboarding, redirect to onboarding page
    if (!session.user.app_metadata?.is_onboarding_complete) {
      const url = request.nextUrl.clone();
      url.pathname = "/onboarding";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
