import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/encryption";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role === "provider") {
    return NextResponse.json({ error: "Brokers/admins only" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "performance";
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const providerId = searchParams.get("providerId");

  const dateFilter: Record<string, unknown> = {};
  if (from) dateFilter.gte = new Date(from);
  if (to) dateFilter.lte = new Date(to);

  const where: Record<string, unknown> = {};
  if (Object.keys(dateFilter).length > 0) where.appointmentDate = dateFilter;
  if (providerId) where.providerId = providerId;

  if (type === "performance") {
    return await performanceReport(where);
  } else if (type === "trip-log") {
    return await tripLogReport(where);
  } else if (type === "complaints") {
    return await complaintReport(from, to);
  }

  return NextResponse.json({ error: "Invalid report type" }, { status: 400 });
}

async function performanceReport(where: Record<string, unknown>) {
  const trips = await prisma.trip.findMany({
    where,
    include: {
      provider: { select: { id: true, name: true } },
      statusHistory: { orderBy: { createdAt: "asc" } },
    },
  });

  // Aggregate by provider
  const providerStats: Record<string, {
    name: string;
    total: number;
    completed: number;
    cancelled: number;
    noShow: number;
    rejected: number;
    onTimePickups: number;
    totalWithPickup: number;
  }> = {};

  for (const trip of trips) {
    const pid = trip.providerId || "unassigned";
    const pname = trip.provider?.name || "Unassigned";

    if (!providerStats[pid]) {
      providerStats[pid] = { name: pname, total: 0, completed: 0, cancelled: 0, noShow: 0, rejected: 0, onTimePickups: 0, totalWithPickup: 0 };
    }

    const s = providerStats[pid];
    const status = trip.status as string;
    s.total++;
    if (status === "completed") s.completed++;
    if (status === "cancelled") s.cancelled++;
    if (status === "no_show") s.noShow++;
    if (status === "rejected") s.rejected++;

    // On-time calculation: actual pickup within 15 min of scheduled
    if (trip.actualPickupTime) {
      s.totalWithPickup++;
      const scheduled = new Date(trip.appointmentDate);
      const [h, m] = trip.appointmentTime.split(":").map(Number);
      scheduled.setHours(h, m, 0, 0);
      const diff = Math.abs(new Date(trip.actualPickupTime).getTime() - scheduled.getTime());
      if (diff <= 15 * 60 * 1000) s.onTimePickups++;
    }
  }

  const providers = Object.entries(providerStats).map(([id, stats]) => ({
    providerId: id,
    providerName: stats.name,
    totalTrips: stats.total,
    completed: stats.completed,
    cancelled: stats.cancelled,
    noShow: stats.noShow,
    rejected: stats.rejected,
    completionRate: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
    onTimeRate: stats.totalWithPickup > 0 ? Math.round((stats.onTimePickups / stats.totalWithPickup) * 100) : null,
  }));

  return NextResponse.json({
    reportType: "performance",
    generatedAt: new Date().toISOString(),
    totalTrips: trips.length,
    summary: {
      completed: trips.filter((t) => (t.status as string) === "completed").length,
      cancelled: trips.filter((t) => (t.status as string) === "cancelled").length,
      noShow: trips.filter((t) => (t.status as string) === "no_show").length,
      pending: trips.filter((t) => (t.status as string) === "pending").length,
    },
    providers,
  });
}

async function tripLogReport(where: Record<string, unknown>) {
  const trips = await prisma.trip.findMany({
    where,
    include: {
      provider: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
      statusHistory: {
        orderBy: { createdAt: "asc" },
        include: { changedBy: { select: { name: true } } },
      },
    },
    orderBy: { appointmentDate: "asc" },
  });

  const logs = trips.map((trip) => ({
    tripNumber: trip.tripNumber,
    patientName: decrypt(trip.patientName),
    patientPhone: decrypt(trip.patientPhone),
    medicaidId: trip.medicaidId,
    authorizationNumber: trip.authorizationNumber,
    pickupAddress: trip.pickupAddress,
    destinationAddress: trip.destinationAddress,
    appointmentDate: trip.appointmentDate,
    appointmentTime: trip.appointmentTime,
    mobilityType: trip.mobilityType,
    status: trip.status,
    provider: trip.provider?.name || null,
    driverName: trip.driverName,
    driverId: trip.driverId,
    vehicleId: trip.vehicleId,
    actualPickupTime: trip.actualPickupTime,
    actualDropoffTime: trip.actualDropoffTime,
    actualMileage: trip.actualMileage,
    hasSignature: !!trip.memberSignatureUrl,
    createdBy: trip.createdBy.name,
    createdAt: trip.createdAt,
    statusHistory: trip.statusHistory.map((h) => ({
      status: h.status,
      note: h.note,
      changedBy: h.changedBy.name,
      at: h.createdAt,
    })),
  }));

  return NextResponse.json({
    reportType: "trip-log",
    generatedAt: new Date().toISOString(),
    totalTrips: logs.length,
    trips: logs,
  });
}

async function complaintReport(from: string | null, to: string | null) {
  const where: Record<string, unknown> = {};
  if (from || to) {
    const dateFilter: Record<string, unknown> = {};
    if (from) dateFilter.gte = new Date(from);
    if (to) dateFilter.lte = new Date(to);
    where.createdAt = dateFilter;
  }

  const complaints = await prisma.complaint.findMany({
    where,
    include: {
      provider: { select: { name: true } },
      trip: { select: { tripNumber: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const byCategory: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  const byProvider: Record<string, number> = {};

  for (const c of complaints) {
    byCategory[c.category] = (byCategory[c.category] || 0) + 1;
    byStatus[c.status] = (byStatus[c.status] || 0) + 1;
    const pName = c.provider?.name || "No Provider";
    byProvider[pName] = (byProvider[pName] || 0) + 1;
  }

  // Average resolution time for resolved complaints
  const resolved = complaints.filter((c) => c.resolvedAt);
  const avgResolutionHours = resolved.length > 0
    ? Math.round(resolved.reduce((sum, c) => sum + (new Date(c.resolvedAt!).getTime() - new Date(c.createdAt).getTime()) / 3600000, 0) / resolved.length)
    : null;

  return NextResponse.json({
    reportType: "complaints",
    generatedAt: new Date().toISOString(),
    totalComplaints: complaints.length,
    byCategory,
    byStatus,
    byProvider,
    avgResolutionHours,
    complaints: complaints.map((c) => ({
      complaintNumber: c.complaintNumber,
      category: c.category,
      status: c.status,
      provider: c.provider?.name,
      trip: c.trip?.tripNumber,
      description: c.description,
      resolution: c.resolution,
      createdAt: c.createdAt,
      resolvedAt: c.resolvedAt,
    })),
  });
}
