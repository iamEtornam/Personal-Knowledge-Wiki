import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

// Proxy (middleware) runs in the Edge Runtime — only import edge-safe config here.
// auth.ts (which imports lib/users.ts with fs/path) must NEVER be imported here.
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  const isAuthApi = pathname.startsWith("/api/auth/");
  const isStaticAsset =
    pathname.startsWith("/_next/") || pathname === "/favicon.ico";

  if (isAuthApi || isStaticAsset) return;

  const isAuthPage = pathname === "/login" || pathname === "/register";

  if (isAuthPage) {
    // If already logged in, bounce back to home
    if (isLoggedIn) {
      return Response.redirect(new URL("/", req.url));
    }
    return; // allow through
  }

  if (!isLoggedIn) {
    const isApiRoute = pathname.startsWith("/api/");
    if (isApiRoute) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return Response.redirect(loginUrl);
  }
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
