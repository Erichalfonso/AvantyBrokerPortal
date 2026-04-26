import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { decryptPHI } from "@/lib/encryption";
import { sendEmail, tripAssignedEmail } from "@/lib/email";
import { tripStatusForPrisma } from "@/lib/enums";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role === "provider") {
    return NextResponse.json({ error: "Providers cannot assign trips" }, { status: 403 });
  }

  const { id } = await params;
  const { providerId } = await request.json();

  const trip = await prisma.trip.findFirst({
    where: { OR: [{ id }, { tripNumber: id }] },
  });

  if (!trip) return NextResponse.json({ error: "Trip not found" }, { status: 404 });

  const currentStatus = String(trip.status).toLowerCase();
  if (!["pending", "rejected"].includes(currentStatus)) {
    return NextResponse.json(
      { error: "Trip can only be assigned when pending or rejected" },
      { status: 400 }
    );
  }

  const provider = await prisma.provider.findUnique({
    where: { id: providerId },
  });

  if (!provider || !provider.active) {
    return NextResponse.json({ error: "Provider not found or inactive" }, { status: 400 });
  }

  const tripMobility = trip.mobilityType.toString().toLowerCase();
  const supportsMobility = provider.vehicleTypes.some(
    (v) => v.toString().toLowerCase() === tripMobility
  );
  if (!supportsMobility) {
    return NextResponse.json(
      {
        error: `${provider.name} cannot service ${tripMobility} trips. Choose a provider whose vehicle types include ${tripMobility}.`,
      },
      { status: 400 }
    );
  }

  const assignedStatus = tripStatusForPrisma("assigned")!;
  const updated = await prisma.trip.update({
    where: { id: trip.id },
    data: {
      providerId: provider.id,
      status: assignedStatus as never,
      statusHistory: {
        create: {
          status: assignedStatus as never,
          note: `Assigned to ${provider.name}`,
          changedById: session.user.id,
        },
      },
    },
    include: {
      provider: { select: { id: true, name: true } },
      statusHistory: {
        orderBy: { createdAt: "asc" },
        include: { changedBy: { select: { id: true, name: true } } },
      },
    },
  });

  await logAudit("PROVIDER_ASSIGNED", "Trip", trip.id, session.user.id, `Assigned to ${provider.name}`);

  const email = tripAssignedEmail(
    provider.name,
    trip.tripNumber,
    new Date(trip.appointmentDate).toLocaleDateString(),
    trip.pickupAddress
  );
  sendEmail({ to: provider.email, ...email }).catch(() => {});

  return NextResponse.json(decryptPHI(updated));
}
