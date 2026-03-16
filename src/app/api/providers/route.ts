import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const activeOnly = searchParams.get("active") === "true";
  const vehicleType = searchParams.get("vehicleType");

  const where: Record<string, unknown> = {};
  if (activeOnly) where.active = true;
  if (vehicleType) where.vehicleTypes = { has: vehicleType };

  const providers = await prisma.provider.findMany({
    where,
    orderBy: { name: "asc" },
  });

  return NextResponse.json(providers);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const body = await request.json();

  const provider = await prisma.provider.create({
    data: {
      name: body.name,
      contactName: body.contactName,
      phone: body.phone,
      email: body.email,
      serviceAreas: body.serviceAreas || [],
      vehicleTypes: body.vehicleTypes || [],
      active: body.active ?? true,
    },
  });

  return NextResponse.json(provider, { status: 201 });
}
