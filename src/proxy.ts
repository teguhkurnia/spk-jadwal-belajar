import { NextRequest, NextResponse } from "next/server";
import { createClient } from "./utils/supabase/middleware";

const AUTH_ROUTES = ["/login", "/register"];

const PROTECTED_ROUTES = ["/dashboard", "/courses", "/settings", "/calendar"];

export async function proxy(request: NextRequest) {
  const supabase = createClient(request);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const user = session?.user;

  const pathname = request.nextUrl.pathname;
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));
  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route),
  );
  const isOnboardingRoute = pathname.startsWith("/onboarding");

  if (!user) {
    if (isProtectedRoute || isOnboardingRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  const isOnboardingComplete = Boolean(
    user.app_metadata?.is_onboarding_complete,
  );

  if (isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = isOnboardingComplete ? "/dashboard" : "/onboarding";
    return NextResponse.redirect(url);
  }

  if (!isOnboardingComplete && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/onboarding";
    return NextResponse.redirect(url);
  }

  if (isOnboardingComplete && isOnboardingRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
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
