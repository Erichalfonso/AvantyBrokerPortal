import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const provider = await prisma.provider.findUnique({
    where: { id },
    include: {
      users: { select: { id: true, name: true, email: true, role: true } },
    },
  });

  if (!provider) return NextResponse.json({ error: "Provider not found" }, { status: 404 });

  return NextResponse.json(provider);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();

  const provider = await prisma.provider.findUnique({ where: { id } });
  if (!provider) return NextResponse.json({ error: "Provider not found" }, { status: 404 });

  const updated = await prisma.provider.update({
    where: { id },
    data: {
      ...(body.name && { name: body.name }),
      ...(body.contactName && { contactName: body.contactName }),
      ...(body.phone && { phone: body.phone }),
      ...(body.email && { email: body.email }),
      ...(body.serviceAreas && { serviceAreas: body.serviceAreas }),
      ...(body.vehicleTypes && { vehicleTypes: body.vehicleTypes }),
      ...(body.active !== undefined && { active: body.active }),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const { id } = await params;

  // Soft delete — just deactivate
  const updated = await prisma.provider.update({
    where: { id },
    data: { active: false },
  });

  return NextResponse.json(updated);
}
