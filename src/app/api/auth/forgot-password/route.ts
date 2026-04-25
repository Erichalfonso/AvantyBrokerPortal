import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendEmail, forgotPasswordEmail } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";

const TOKEN_TTL_MS = 60 * 60 * 1000;

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

  // Same response shape regardless of whether email exists or rate limit was hit,
  // so attackers cannot enumerate accounts.
  const ok = NextResponse.json({ ok: true });

  if (!email) return ok;

  const ipKey = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  const { allowed: allowedByIp } = rateLimit(`forgot-password:ip:${ipKey}`, { maxRequests: 10, windowMs: 60 * 60 * 1000 });
  const { allowed: allowedByEmail } = rateLimit(`forgot-password:email:${email}`, { maxRequests: 5, windowMs: 60 * 60 * 1000 });
  if (!allowedByIp || !allowedByEmail) return ok;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return ok;

  // Invalidate previous unused tokens for this user
  await prisma.passwordResetToken.updateMany({
    where: { userId: user.id, usedAt: null, expiresAt: { gt: new Date() } },
    data: { usedAt: new Date() },
  });

  const rawToken = crypto.randomBytes(32).toString("base64url");
  const tokenHash = hashToken(rawToken);

  await prisma.passwordResetToken.create({
    data: {
      tokenHash,
      userId: user.id,
      expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
    },
  });

  const baseUrl = process.env.NEXTAUTH_URL || new URL(request.url).origin;
  const resetUrl = `${baseUrl}/reset-password/${rawToken}`;
  const template = forgotPasswordEmail(user.name, resetUrl);
  await sendEmail({ to: user.email, ...template }).catch(() => {});

  await logAudit("PASSWORD_RESET_REQUESTED", "User", user.id, user.id, `Reset link issued to ${user.email}`);

  return ok;
}
