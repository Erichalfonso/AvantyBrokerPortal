import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { encrypt } from "@/lib/encryption";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role === "provider") {
    return NextResponse.json({ error: "Brokers/admins only" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const active = searchParams.get("active");

  const where: Record<string, unknown> = {};
  if (active !== null) where.active = active === "true";

  const orders = await prisma.standingOrder.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(orders);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role === "provider") {
    return NextResponse.json({ error: "Brokers/admins only" }, { status: 403 });
  }

  const body = await request.json();

  const order = await prisma.standingOrder.create({
    data: {
      patientName: encrypt(body.patientName),
      patientPhone: encrypt(body.patientPhone || ""),
      medicaidId: body.medicaidId || null,
      pickupAddress: body.pickupAddress,
      destinationAddress: body.destinationAddress,
      appointmentTime: body.appointmentTime,
      mobilityType: body.mobilityType,
      specialInstructions: body.specialInstructions || "",
      providerId: body.providerId || null,
      daysOfWeek: body.daysOfWeek,
      startDate: new Date(body.startDate),
      endDate: body.endDate ? new Date(body.endDate) : null,
      createdById: session.user.id,
    },
  });

  await logAudit(
    "STANDING_ORDER_CREATED",
    "StandingOrder",
    order.id,
    session.user.id,
    `Created standing order for days: ${body.daysOfWeek.join(",")}`
  );

  return NextResponse.json(order, { status: 201 });
}
