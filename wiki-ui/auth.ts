import { findUserByUsername, verifyPassword } from "@/lib/users";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "./auth.config";

// Full auth with credentials — Node.js runtime only.
// Imported by API route handlers and server components, never by proxy.ts.
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const username = credentials?.username as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!username || !password) return null;

        const user = findUserByUsername(username);
        if (!user) return null;

        const valid = await verifyPassword(password, user.passwordHash);
        if (!valid) return null;

        return { id: user.id, name: user.username, email: null };
      },
    }),
  ],
});
