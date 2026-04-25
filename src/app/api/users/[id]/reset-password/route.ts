import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { sendEmail, passwordResetEmail } from "@/lib/email";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const { id } = await params;

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const newPassword = crypto.randomBytes(9).toString("base64url");
  const passwordHash = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id },
    data: { passwordHash, failedLoginAttempts: 0, lockedUntil: null },
  });

  const email = passwordResetEmail(user.name, newPassword);
  const emailed = await sendEmail({ to: user.email, ...email });

  await logAudit(
    "PASSWORD_RESET",
    "User",
    user.id,
    session.user.id,
    `Admin reset password for ${user.email}${emailed ? "" : " (email delivery failed)"}`
  );

  return NextResponse.json({ ok: true, emailed, email: user.email });
}
