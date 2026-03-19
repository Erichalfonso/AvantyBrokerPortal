import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAccess } from "@/lib/access-log";
import { logAudit } from "@/lib/audit";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const trip = await prisma.trip.findFirst({
    where: { OR: [{ id }, { tripNumber: id }] },
    include: {
      provider: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
      statusHistory: {
        orderBy: { createdAt: "asc" },
        include: { changedBy: { select: { id: true, name: true } } },
      },
      notes: {
        orderBy: { createdAt: "desc" },
        include: { author: { select: { id: true, name: true } } },
      },
    },
  });

  if (!trip) return NextResponse.json({ error: "Trip not found" }, { status: 404 });

  // Providers can only see their own trips
  if (session.user.role === "provider" && trip.providerId !== session.user.providerId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // HIPAA: Log access to PHI
  await logAccess("Trip", trip.id, session.user.id);

  return NextResponse.json(trip);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role === "provider") {
    return NextResponse.json({ error: "Providers cannot edit trips" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();

  const trip = await prisma.trip.findFirst({
    where: { OR: [{ id }, { tripNumber: id }] },
  });

  if (!trip) return NextResponse.json({ error: "Trip not found" }, { status: 404 });

  // Only allow editing certain statuses
  if (["completed", "cancelled"].includes(trip.status)) {
    return NextResponse.json({ error: "Cannot edit a completed or cancelled trip" }, { status: 400 });
  }

  const updated = await prisma.trip.update({
    where: { id: trip.id },
    data: {
      ...(body.patientName && { patientName: body.patientName }),
      ...(body.patientPhone && { patientPhone: body.patientPhone }),
      ...(body.pickupAddress && { pickupAddress: body.pickupAddress }),
      ...(body.destinationAddress && { destinationAddress: body.destinationAddress }),
      ...(body.appointmentDate && { appointmentDate: new Date(body.appointmentDate) }),
      ...(body.appointmentTime && { appointmentTime: body.appointmentTime }),
      ...(body.mobilityType && { mobilityType: body.mobilityType as never }),
      ...(body.specialInstructions !== undefined && { specialInstructions: body.specialInstructions }),
    },
    include: {
      provider: { select: { id: true, name: true } },
      statusHistory: {
        orderBy: { createdAt: "asc" },
        include: { changedBy: { select: { id: true, name: true } } },
      },
    },
  });

  await logAudit("TRIP_UPDATED", "Trip", trip.id, session.user.id, `Fields updated: ${Object.keys(body).join(", ")}`);

  return NextResponse.json(updated);
}
