import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { status, note } = await request.json() as { status: string; note?: string };

  const trip = await prisma.trip.findFirst({
    where: { OR: [{ id }, { tripNumber: id }] },
  });

  if (!trip) return NextResponse.json({ error: "Trip not found" }, { status: 404 });

  // Validate status transitions
  const validTransitions: Record<string, string[]> = {
    pending: ["cancelled"],
    assigned: ["accepted", "rejected", "cancelled"],
    accepted: ["driver_en_route", "cancelled"],
    driver_en_route: ["passenger_picked_up", "cancelled", "no_show"],
    passenger_picked_up: ["completed", "cancelled"],
    rejected: ["cancelled"],
  };

  const allowed = validTransitions[trip.status] || [];
  if (!allowed.includes(status)) {
    return NextResponse.json(
      { error: `Cannot transition from ${trip.status} to ${status}` },
      { status: 400 }
    );
  }

  // Provider role checks
  if (session.user.role === "provider") {
    if (trip.providerId !== session.user.providerId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const providerAllowed = ["accepted", "rejected", "driver_en_route", "passenger_picked_up", "completed", "no_show"];
    if (!providerAllowed.includes(status)) {
      return NextResponse.json({ error: "Providers cannot set this status" }, { status: 403 });
    }
  }

  const updated = await prisma.trip.update({
    where: { id: trip.id },
    data: {
      status: status as never,
      statusHistory: {
        create: {
          status: status as never,
          note,
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

  await logAudit("STATUS_CHANGED", "Trip", trip.id, session.user.id, `${trip.status} → ${status}`);

  return NextResponse.json(updated);
}
