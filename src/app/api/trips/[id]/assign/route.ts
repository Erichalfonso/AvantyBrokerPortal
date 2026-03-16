import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

  // Allow assignment from pending or rejected
  if (!["pending", "rejected"].includes(trip.status)) {
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

  const updated = await prisma.trip.update({
    where: { id: trip.id },
    data: {
      providerId: provider.id,
      status: "assigned" as never,
      statusHistory: {
        create: {
          status: "assigned" as never,
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

  return NextResponse.json(updated);
}
