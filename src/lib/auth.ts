import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const email = credentials.email as string;
        const password = credentials.password as string;

        try {
          const user = await prisma.user.findUnique({ where: { email } });
          if (!user) {
            console.log("[auth] User not found:", email);
            return null;
          }

          const match = await bcrypt.compare(password, user.passwordHash);
          if (!match) {
            console.log("[auth] Password mismatch for:", email);
            return null;
          }

          console.log("[auth] Login success:", email, user.role);
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            providerId: user.providerId,
          };
        } catch (error) {
          console.error("[auth] Error during authorization:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = ((user as { role: string }).role || "").toLowerCase();
        token.providerId = (user as { providerId?: string | null }).providerId;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.providerId = token.providerId;
      return session;
    },
  },
  pages: {
    signIn: "/",
    error: "/",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET || "dev-secret-do-not-use-in-production",
});
