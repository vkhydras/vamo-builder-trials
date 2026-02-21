import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const publicRoutes = ["/", "/login", "/signup", "/marketplace"];
  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith("/marketplace")
  ) || pathname.startsWith("/auth/callback");

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Redirect logged-in users away from auth pages
  if (user && (pathname === "/login" || pathname === "/signup")) {
    const url = request.nextUrl.clone();
    url.pathname = "/projects";
    return NextResponse.redirect(url);
  }

  // Admin route check — cache result for 60s to avoid DB query on every request
  if (user && pathname.startsWith("/admin")) {
    const adminCacheKey = `is_admin_${user.id}`;
    const cached = request.cookies.get(adminCacheKey)?.value;
    let isAdmin = cached === "true";

    if (cached === undefined) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .single();

      isAdmin = !!profile?.is_admin;
      supabaseResponse.cookies.set(adminCacheKey, String(isAdmin), {
        maxAge: 60,
        httpOnly: true,
        sameSite: "lax",
        path: "/admin",
      });
    }

    if (!isAdmin) {
      const url = request.nextUrl.clone();
      url.pathname = "/projects";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
