import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { encrypt, decryptPHI } from "@/lib/encryption";
type TripStatus = string;

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const status = searchParams.get("status") as TripStatus | null;
  const search = searchParams.get("search") || "";

  const where: Record<string, unknown> = {};

  // Providers only see their trips
  if (session.user.role === "provider" && session.user.providerId) {
    where.providerId = session.user.providerId;
  }

  if (status) {
    where.status = status;
  }

  if (search) {
    // Note: patientName is encrypted and cannot be searched via DB query
    where.OR = [
      { tripNumber: { contains: search, mode: "insensitive" } },
      { pickupAddress: { contains: search, mode: "insensitive" } },
    ];
  }

  const [trips, total] = await Promise.all([
    prisma.trip.findMany({
      where,
      include: {
        provider: { select: { id: true, name: true } },
        statusHistory: {
          orderBy: { createdAt: "asc" },
          include: { changedBy: { select: { id: true, name: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.trip.count({ where }),
  ]);

  // HIPAA: Decrypt PHI fields before returning
  const decryptedTrips = trips.map((trip) => decryptPHI(trip));

  return NextResponse.json({
    trips: decryptedTrips,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role === "provider") {
    return NextResponse.json({ error: "Providers cannot create trips" }, { status: 403 });
  }

  const body = await request.json();

  // Generate next trip number
  const lastTrip = await prisma.trip.findFirst({
    orderBy: { tripNumber: "desc" },
    select: { tripNumber: true },
  });
  const lastNum = lastTrip ? parseInt(lastTrip.tripNumber.replace("T-", "")) : 1000;
  const tripNumber = `T-${lastNum + 1}`;

  const trip = await prisma.trip.create({
    data: {
      tripNumber,
      patientName: encrypt(body.patientName),
      patientPhone: encrypt(body.patientPhone || ""),
      pickupAddress: body.pickupAddress,
      destinationAddress: body.destinationAddress,
      appointmentDate: new Date(body.appointmentDate),
      appointmentTime: body.appointmentTime,
      mobilityType: body.mobilityType as never,
      specialInstructions: body.specialInstructions || "",
      medicaidId: body.medicaidId || null,
      authorizationNumber: body.authorizationNumber || null,
      status: "pending" as never,
      createdById: session.user.id,
      statusHistory: {
        create: {
          status: "pending" as never,
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

  await logAudit("TRIP_CREATED", "Trip", trip.id, session.user.id, `Created trip ${tripNumber}`);

  return NextResponse.json(decryptPHI(trip), { status: 201 });
}
