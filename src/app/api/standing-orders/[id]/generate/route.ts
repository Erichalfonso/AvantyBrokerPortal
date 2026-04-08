import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { encrypt } from "@/lib/encryption";

export async function POST(
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
  const { fromDate, toDate } = body;

  if (!fromDate || !toDate) {
    return NextResponse.json({ error: "fromDate and toDate are required" }, { status: 400 });
  }

  const order = await prisma.standingOrder.findUnique({ where: { id } });
  if (!order) return NextResponse.json({ error: "Standing order not found" }, { status: 404 });
  if (!order.active) return NextResponse.json({ error: "Standing order is inactive" }, { status: 400 });

  const start = new Date(fromDate);
  const end = new Date(toDate);
  const dates: Date[] = [];

  // Collect all matching dates in the range
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    if (order.daysOfWeek.includes(d.getDay())) {
      dates.push(new Date(d));
    }
  }

  if (dates.length === 0) {
    return NextResponse.json({ error: "No matching dates in range" }, { status: 400 });
  }

  // Get next trip number
  const lastTrip = await prisma.trip.findFirst({
    orderBy: { tripNumber: "desc" },
    select: { tripNumber: true },
  });
  let nextNum = lastTrip ? parseInt(lastTrip.tripNumber.replace("T-", "")) + 1 : 1001;

  const created: string[] = [];

  for (const date of dates) {
    // Check if a trip already exists for this standing order + date
    const existing = await prisma.trip.findFirst({
      where: {
        standingOrderId: order.id,
        appointmentDate: date,
      },
    });
    if (existing) continue;

    const tripNumber = `T-${nextNum}`;
    nextNum++;

    await prisma.trip.create({
      data: {
        tripNumber,
        patientName: order.patientName, // Already encrypted from standing order creation
        patientPhone: order.patientPhone,
        medicaidId: order.medicaidId,
        pickupAddress: order.pickupAddress,
        destinationAddress: order.destinationAddress,
        appointmentDate: date,
        appointmentTime: order.appointmentTime,
        mobilityType: order.mobilityType,
        specialInstructions: order.specialInstructions,
        status: "pending" as never,
        providerId: order.providerId,
        createdById: session.user.id,
        standingOrderId: order.id,
        statusHistory: {
          create: {
            status: (order.providerId ? "assigned" : "pending") as never,
            note: "Generated from standing order",
            changedById: session.user.id,
          },
        },
      },
    });
    created.push(tripNumber);
  }

  if (created.length > 0) {
    await logAudit(
      "STANDING_ORDER_GENERATED",
      "StandingOrder",
      id,
      session.user.id,
      `Generated ${created.length} trips: ${created.join(", ")}`
    );
  }

  return NextResponse.json({ generated: created.length, tripNumbers: created });
}
