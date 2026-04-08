import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAccess } from "@/lib/access-log";
import { logAudit } from "@/lib/audit";
import { encrypt, decryptPHI } from "@/lib/encryption";

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

  return NextResponse.json(decryptPHI(trip));
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  // Providers can update trip documentation fields (driver info, GPS, mileage)
  const isProvider = session.user.role === "provider";
  const docFields = ["driverName", "driverId", "vehicleId", "actualPickupTime", "actualDropoffTime", "actualMileage", "memberSignatureUrl"];
  const bodyKeys = Object.keys(body);
  if (isProvider && bodyKeys.some((k) => !docFields.includes(k))) {
    return NextResponse.json({ error: "Providers can only update trip documentation fields" }, { status: 403 });
  }

  const trip = await prisma.trip.findFirst({
    where: { OR: [{ id }, { tripNumber: id }] },
  });

  if (!trip) return NextResponse.json({ error: "Trip not found" }, { status: 404 });

  // Only allow editing certain statuses (but allow doc field updates on any non-terminal status)
  if (!isProvider && ["completed", "cancelled"].includes(trip.status)) {
    return NextResponse.json({ error: "Cannot edit a completed or cancelled trip" }, { status: 400 });
  }

  const updated = await prisma.trip.update({
    where: { id: trip.id },
    data: {
      ...(body.patientName && { patientName: encrypt(body.patientName) }),
      ...(body.patientPhone && { patientPhone: encrypt(body.patientPhone) }),
      ...(body.pickupAddress && { pickupAddress: body.pickupAddress }),
      ...(body.destinationAddress && { destinationAddress: body.destinationAddress }),
      ...(body.appointmentDate && { appointmentDate: new Date(body.appointmentDate) }),
      ...(body.appointmentTime && { appointmentTime: body.appointmentTime }),
      ...(body.mobilityType && { mobilityType: body.mobilityType as never }),
      ...(body.specialInstructions !== undefined && { specialInstructions: body.specialInstructions }),
      // Trip documentation fields
      ...(body.medicaidId !== undefined && { medicaidId: body.medicaidId }),
      ...(body.authorizationNumber !== undefined && { authorizationNumber: body.authorizationNumber }),
      ...(body.driverName && { driverName: body.driverName }),
      ...(body.driverId && { driverId: body.driverId }),
      ...(body.vehicleId && { vehicleId: body.vehicleId }),
      ...(body.actualPickupTime && { actualPickupTime: new Date(body.actualPickupTime) }),
      ...(body.actualDropoffTime && { actualDropoffTime: new Date(body.actualDropoffTime) }),
      ...(body.actualMileage !== undefined && { actualMileage: parseFloat(body.actualMileage) }),
      ...(body.memberSignatureUrl && { memberSignatureUrl: body.memberSignatureUrl }),
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

  return NextResponse.json(decryptPHI(updated));
}
