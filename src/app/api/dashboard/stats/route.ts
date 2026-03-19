import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const providerFilter = session.user.role === "provider" && session.user.providerId
    ? { providerId: session.user.providerId }
    : {};

  const [
    totalTrips,
    pendingTrips,
    activeTrips,
    completedTrips,
    cancelledTrips,
    todayTrips,
    providerStats,
  ] = await Promise.all([
    prisma.trip.count({ where: providerFilter }),
    prisma.trip.count({ where: { ...providerFilter, status: "pending" as never } }),
    prisma.trip.count({
      where: {
        ...providerFilter,
        status: { in: ["assigned", "accepted", "driver_en_route", "passenger_picked_up"] as never[] },
      },
    }),
    prisma.trip.count({ where: { ...providerFilter, status: "completed" as never } }),
    prisma.trip.count({ where: { ...providerFilter, status: "cancelled" as never } }),
    prisma.trip.count({
      where: {
        ...providerFilter,
        appointmentDate: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lt: new Date(new Date().setHours(23, 59, 59, 999)),
        },
      },
    }),
    // Top providers by trip count (broker/admin only)
    session.user.role !== "provider"
      ? prisma.provider.findMany({
          where: { active: true },
          select: {
            id: true,
            name: true,
            _count: { select: { trips: true } },
          },
          orderBy: { trips: { _count: "desc" } },
          take: 5,
        })
      : [],
  ]);

  // Status breakdown
  const statusBreakdown = [
    { status: "pending", count: pendingTrips, color: "#F59E0B" },
    { status: "active", count: activeTrips, color: "#2BBCB3" },
    { status: "completed", count: completedTrips, color: "#22C55E" },
    { status: "cancelled", count: cancelledTrips, color: "#64748B" },
  ];

  return NextResponse.json({
    totalTrips,
    pendingTrips,
    activeTrips,
    completedTrips,
    cancelledTrips,
    todayTrips,
    statusBreakdown,
    providerStats: providerStats.map((p) => ({
      id: p.id,
      name: p.name,
      tripCount: p._count.trips,
    })),
  });
}
