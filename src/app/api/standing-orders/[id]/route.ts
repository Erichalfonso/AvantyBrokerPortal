import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const order = await prisma.standingOrder.findUnique({
    where: { id },
    include: { trips: { select: { id: true, tripNumber: true, status: true, appointmentDate: true } } },
  });

  if (!order) return NextResponse.json({ error: "Standing order not found" }, { status: 404 });

  return NextResponse.json(order);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role === "provider") {
    return NextResponse.json({ error: "Brokers/admins only" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();

  const order = await prisma.standingOrder.findUnique({ where: { id } });
  if (!order) return NextResponse.json({ error: "Standing order not found" }, { status: 404 });

  const updated = await prisma.standingOrder.update({
    where: { id },
    data: {
      ...(body.active !== undefined && { active: body.active }),
      ...(body.endDate && { endDate: new Date(body.endDate) }),
      ...(body.daysOfWeek && { daysOfWeek: body.daysOfWeek }),
      ...(body.providerId !== undefined && { providerId: body.providerId || null }),
      ...(body.appointmentTime && { appointmentTime: body.appointmentTime }),
      ...(body.specialInstructions !== undefined && { specialInstructions: body.specialInstructions }),
    },
  });

  await logAudit(
    "STANDING_ORDER_UPDATED",
    "StandingOrder",
    id,
    session.user.id,
    `Updated: ${Object.keys(body).join(", ")}`
  );

  return NextResponse.json(updated);
}
