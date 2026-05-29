import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: do not add code between createServerClient and getUser()
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Public routes — allow without auth
  if (
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/best-") ||
    pathname.startsWith("/driving-") ||
    pathname.startsWith("/reduce-") ||
    pathname.startsWith("/how-adis")
  ) {
    return supabaseResponse;
  }

  // No user → redirect to login
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  const role = user.user_metadata?.role as string | undefined;

  // Role-based route gating
  const routeResult = checkRoleAccess(pathname, role);
  if (routeResult) {
    const url = request.nextUrl.clone();
    url.pathname = routeResult;
    return NextResponse.redirect(url);
  }

  // Onboarding gate: instructors must complete onboarding before accessing dashboard
  if (
    role === "instructor" &&
    pathname.startsWith("/instructor") &&
    !pathname.startsWith("/instructor/onboarding")
  ) {
    const { data: settings } = await supabase
      .from("instructor_settings")
      .select("instructor_id")
      .eq("instructor_id", user.id)
      .single();

    if (!settings) {
      const url = request.nextUrl.clone();
      url.pathname = "/instructor/onboarding";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

/**
 * Returns redirect path if user lacks access, or null if allowed.
 * Exported for testing.
 */
export function checkRoleAccess(
  pathname: string,
  role: string | undefined
): string | null {
  if (pathname.startsWith("/instructor") && role !== "instructor") {
    return role === "student" ? "/student/dashboard" : "/login";
  }

  if (pathname.startsWith("/student") && role !== "student") {
    return role === "instructor" ? "/instructor/dashboard" : "/login";
  }

  if (pathname.startsWith("/admin") && role !== "admin") {
    return "/login";
  }

  return null;
}
