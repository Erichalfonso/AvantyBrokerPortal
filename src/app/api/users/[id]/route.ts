import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

const ALLOWED_ROLES = ["broker", "provider", "admin"] as const;
type Role = (typeof ALLOWED_ROLES)[number];

interface PatchBody {
  name?: string;
  email?: string;
  role?: Role;
  providerId?: string | null;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as PatchBody;

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const updateData: Record<string, unknown> = {};
  const changes: string[] = [];

  if (typeof body.name === "string") {
    const name = body.name.trim();
    if (!name) return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 });
    if (name !== existing.name) {
      updateData.name = name;
      changes.push(`name: ${existing.name} → ${name}`);
    }
  }

  if (typeof body.email === "string") {
    const email = body.email.trim().toLowerCase();
    if (!email) return NextResponse.json({ error: "Email cannot be empty" }, { status: 400 });
    if (email !== existing.email) {
      const dup = await prisma.user.findUnique({ where: { email } });
      if (dup && dup.id !== existing.id) {
        return NextResponse.json({ error: "Email already in use" }, { status: 400 });
      }
      updateData.email = email;
      changes.push(`email: ${existing.email} → ${email}`);
    }
  }

  if (typeof body.role === "string") {
    if (!ALLOWED_ROLES.includes(body.role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }
    const newRoleEnum = body.role.toUpperCase() as "BROKER" | "PROVIDER" | "ADMIN";
    if (newRoleEnum !== existing.role) {
      updateData.role = newRoleEnum;
      changes.push(`role: ${existing.role.toLowerCase()} → ${body.role}`);
    }

    if (body.role !== "provider" && existing.providerId) {
      updateData.providerId = null;
      changes.push(`providerId cleared (no longer provider)`);
    }
  }

  if (body.providerId !== undefined) {
    const targetRole = (updateData.role as string | undefined) ?? existing.role;
    if (targetRole === "PROVIDER" || targetRole === "provider") {
      if (body.providerId === null || body.providerId === "") {
        return NextResponse.json({ error: "Provider role requires a providerId" }, { status: 400 });
      }
      const provider = await prisma.provider.findUnique({ where: { id: body.providerId } });
      if (!provider) return NextResponse.json({ error: "Provider not found" }, { status: 400 });
      if (body.providerId !== existing.providerId) {
        updateData.providerId = body.providerId;
        changes.push(`providerId: ${existing.providerId ?? "—"} → ${body.providerId}`);
      }
    }
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ ok: true, unchanged: true });
  }

  if (existing.id === session.user.id && updateData.role && updateData.role !== "ADMIN") {
    return NextResponse.json({ error: "You cannot remove your own admin role" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      providerId: true,
      provider: { select: { id: true, name: true } },
      createdAt: true,
    },
  });

  await logAudit(
    "USER_UPDATED",
    "User",
    id,
    session.user.id,
    `Updated ${existing.email}: ${changes.join("; ")}`
  );

  return NextResponse.json(updated);
}
