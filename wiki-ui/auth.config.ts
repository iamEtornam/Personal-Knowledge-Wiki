import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe auth config — no Node.js imports (no fs/path/bcrypt).
 * Used by the proxy (middleware) to validate JWT sessions at the edge.
 * The credentials provider and user-lookup live in auth.ts (Node.js runtime only).
 */
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = nextUrl;

      const isAuthPage = pathname === "/login" || pathname === "/register";
      const isAuthApi = pathname.startsWith("/api/auth/");
      const isStaticAsset =
        pathname.startsWith("/_next/") || pathname === "/favicon.ico";

      if (isAuthApi || isStaticAsset) return true;
      if (isAuthPage) return true; // allow through; redirect handled below
      return isLoggedIn; // protect everything else
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.name = token.name as string;
      }
      return session;
    },
  },
  providers: [], // filled in auth.ts at the Node.js layer
};
