import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { sendEmail, userInvitedEmail } from "@/lib/email";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      providerId: true,
      provider: { select: { id: true, name: true } },
      createdAt: true,
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(users);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const body = await request.json();

  if (!body.name || !body.email) {
    return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
  }

  const email = String(body.email).trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email already in use" }, { status: 400 });
  }

  const role = body.role || "broker";
  if (role === "provider" && !body.providerId) {
    return NextResponse.json({ error: "Provider role requires a providerId" }, { status: 400 });
  }

  const tempPassword = crypto.randomBytes(9).toString("base64url");
  const passwordHash = await bcrypt.hash(tempPassword, 10);

  const user = await prisma.user.create({
    data: {
      name: String(body.name).trim(),
      email,
      passwordHash,
      role,
      providerId: role === "provider" ? body.providerId : null,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      providerId: true,
      createdAt: true,
    },
  });

  const invite = userInvitedEmail(user.name, user.email, tempPassword, user.role);
  const emailed = await sendEmail({ to: user.email, ...invite });

  await logAudit(
    "USER_CREATED",
    "User",
    user.id,
    session.user.id,
    `Created ${user.role} ${user.email}${emailed ? "" : " (email delivery failed)"}`
  );

  return NextResponse.json({ ...user, emailed }, { status: 201 });
}
