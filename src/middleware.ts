import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Refresh the session — this must run on every request
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Redirect unauthenticated users away from protected routes
  if ((pathname.startsWith("/dashboard") || pathname.startsWith("/admin")) && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from auth pages
  if (
    (pathname === "/login" ||
      pathname === "/signup" ||
      pathname === "/forgot-password") &&
    user
  ) {
    const plan = request.nextUrl.searchParams.get("plan");
    const course = request.nextUrl.searchParams.get("course");
    const discount = request.nextUrl.searchParams.get("discount");
    const url = request.nextUrl.clone();

    if (plan && course) {
      // Preserve checkout intent — send to pricing with auto-checkout
      url.pathname = "/pricing";
      url.searchParams.set("plan", plan);
      url.searchParams.set("course", course);
      url.searchParams.set("autoCheckout", "true");
      if (discount) url.searchParams.set("discount", discount);
    } else {
      // Check admin status — query own profile (allowed by RLS)
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .single();

      url.pathname = profile?.is_admin ? "/admin" : "/dashboard";
    }
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/login", "/signup", "/forgot-password", "/reset-password"],
};
