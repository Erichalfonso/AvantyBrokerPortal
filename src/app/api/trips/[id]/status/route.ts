import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { decryptPHI } from "@/lib/encryption";
import { sendEmail, tripStatusChangedEmail } from "@/lib/email";
import { tripStatusForPrisma, toTripStatusEnum } from "@/lib/enums";

interface StatusBody {
  status: string;
  note?: string;
  documentation?: {
    driverName?: string;
    driverId?: string;
    vehicleId?: string;
    actualMileage?: number;
  };
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = (await request.json()) as StatusBody;
  const { status: rawStatus, note, documentation } = body;

  const trip = await prisma.trip.findFirst({
    where: { OR: [{ id }, { tripNumber: id }] },
  });

  if (!trip) return NextResponse.json({ error: "Trip not found" }, { status: 404 });

  const status = toTripStatusEnum(rawStatus);
  const currentStatus = String(trip.status).toLowerCase();
  if (!status) {
    return NextResponse.json({ error: `Invalid status: ${rawStatus}` }, { status: 400 });
  }

  const validTransitions: Record<string, string[]> = {
    pending: ["cancelled"],
    assigned: ["accepted", "rejected", "cancelled"],
    accepted: ["driver_en_route", "cancelled"],
    driver_en_route: ["passenger_picked_up", "cancelled", "no_show"],
    passenger_picked_up: ["completed", "cancelled"],
    rejected: ["cancelled"],
  };

  const allowed = validTransitions[currentStatus] || [];
  if (!allowed.includes(status)) {
    return NextResponse.json(
      { error: `Cannot transition from ${currentStatus} to ${status}` },
      { status: 400 }
    );
  }

  if (session.user.role === "provider") {
    if (trip.providerId !== session.user.providerId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const providerAllowed = ["accepted", "rejected", "driver_en_route", "passenger_picked_up", "completed", "no_show"];
    if (!providerAllowed.includes(status)) {
      return NextResponse.json({ error: "Providers cannot set this status" }, { status: 403 });
    }
  }

  const statusEnum = tripStatusForPrisma(status)!;

  const tripUpdate: Record<string, unknown> = {
    status: statusEnum as never,
    statusHistory: {
      create: {
        status: statusEnum as never,
        note,
        changedById: session.user.id,
      },
    },
  };

  if (status === "passenger_picked_up" && !trip.actualPickupTime) {
    tripUpdate.actualPickupTime = new Date();
  }

  if (status === "completed") {
    if (!trip.actualPickupTime) {
      return NextResponse.json(
        { error: "Cannot complete a trip with no recorded pickup time. Mark Passenger Picked Up first." },
        { status: 400 }
      );
    }

    const submittedDriverName = documentation?.driverName?.trim();
    const finalDriverName = trip.driverName || submittedDriverName;
    if (!finalDriverName) {
      return NextResponse.json(
        {
          error: "Driver name is required to complete a trip.",
          missingFields: ["driverName"],
        },
        { status: 400 }
      );
    }

    if (!trip.driverName && submittedDriverName) {
      tripUpdate.driverName = submittedDriverName;
    }
    if (!trip.driverId && documentation?.driverId) {
      tripUpdate.driverId = documentation.driverId.trim();
    }
    if (!trip.vehicleId && documentation?.vehicleId) {
      tripUpdate.vehicleId = documentation.vehicleId.trim();
    }
    if (typeof documentation?.actualMileage === "number" && Number.isFinite(documentation.actualMileage)) {
      tripUpdate.actualMileage = documentation.actualMileage;
    }
    if (!trip.actualDropoffTime) {
      tripUpdate.actualDropoffTime = new Date();
    }
  }

  const updated = await prisma.trip.update({
    where: { id: trip.id },
    data: tripUpdate,
    include: {
      provider: { select: { id: true, name: true } },
      statusHistory: {
        orderBy: { createdAt: "asc" },
        include: { changedBy: { select: { id: true, name: true } } },
      },
    },
  });

  await logAudit("STATUS_CHANGED", "Trip", trip.id, session.user.id, `${currentStatus} → ${status}`);

  if (session.user.role === "provider" && trip.createdById) {
    const creator = await prisma.user.findUnique({ where: { id: trip.createdById }, select: { name: true, email: true } });
    if (creator) {
      const email = tripStatusChangedEmail(creator.name, trip.tripNumber, trip.status, status);
      sendEmail({ to: creator.email, ...email }).catch(() => {});
    }
  }

  return NextResponse.json(decryptPHI(updated));
}
