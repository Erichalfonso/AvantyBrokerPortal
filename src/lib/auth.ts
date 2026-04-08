import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { SESSION_CONFIG } from "@/lib/session-config";
import { logAudit } from "@/lib/audit";
import { rateLimit } from "@/lib/rate-limit";

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

        // HIPAA: Rate limit login attempts (10 per minute per email)
        const { allowed } = rateLimit(`login:${email}`, { maxRequests: 10, windowMs: 60_000 });
        if (!allowed) {
          console.log("[auth] Rate limited:", email);
          return null;
        }

        try {
          const user = await prisma.user.findUnique({ where: { email } });
          if (!user) {
            console.log("[auth] User not found:", email);
            return null;
          }

          // HIPAA: Check account lockout
          if (user.lockedUntil && user.lockedUntil > new Date()) {
            const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
            console.log(`[auth] Account locked for ${minutesLeft} more minutes:`, email);
            await logAudit("LOGIN_BLOCKED_LOCKED", "User", user.id, user.id, `Account locked, ${minutesLeft}min remaining`);
            return null;
          }

          const match = await bcrypt.compare(password, user.passwordHash);
          if (!match) {
            console.log("[auth] Password mismatch for:", email);
            const attempts = user.failedLoginAttempts + 1;
            const updateData: { failedLoginAttempts: number; lockedUntil?: Date } = {
              failedLoginAttempts: attempts,
            };

            // Lock account after max attempts
            if (attempts >= SESSION_CONFIG.maxLoginAttempts) {
              updateData.lockedUntil = new Date(Date.now() + SESSION_CONFIG.lockoutMinutes * 60000);
              console.log(`[auth] Account locked after ${attempts} failed attempts:`, email);
              await logAudit("ACCOUNT_LOCKED", "User", user.id, user.id, `Locked after ${attempts} failed login attempts`);
            }

            await prisma.user.update({ where: { id: user.id }, data: updateData });
            return null;
          }

          // Reset failed attempts on successful login
          if (user.failedLoginAttempts > 0 || user.lockedUntil) {
            await prisma.user.update({
              where: { id: user.id },
              data: { failedLoginAttempts: 0, lockedUntil: null },
            });
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
