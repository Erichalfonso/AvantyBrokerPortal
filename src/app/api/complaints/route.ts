import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const status = searchParams.get("status");
  const category = searchParams.get("category");

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (category) where.category = category;

  // Providers only see complaints about them
  if (session.user.role === "provider" && session.user.providerId) {
    where.providerId = session.user.providerId;
  }

  const [complaints, total] = await Promise.all([
    prisma.complaint.findMany({
      where,
      include: {
        provider: { select: { id: true, name: true } },
        trip: { select: { id: true, tripNumber: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.complaint.count({ where }),
  ]);

  return NextResponse.json({
    complaints,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  // Generate complaint number
  const lastComplaint = await prisma.complaint.findFirst({
    orderBy: { complaintNumber: "desc" },
    select: { complaintNumber: true },
  });
  const lastNum = lastComplaint
    ? parseInt(lastComplaint.complaintNumber.replace("C-", ""))
    : 1000;
  const complaintNumber = `C-${lastNum + 1}`;

  const complaint = await prisma.complaint.create({
    data: {
      complaintNumber,
      category: body.category,
      description: body.description,
      providerId: body.providerId || null,
      tripId: body.tripId || null,
      reportedBy: session.user.id,
    },
    include: {
      provider: { select: { id: true, name: true } },
      trip: { select: { id: true, tripNumber: true } },
    },
  });

  await logAudit(
    "COMPLAINT_CREATED",
    "Complaint",
    complaint.id,
    session.user.id,
    `Created complaint ${complaintNumber}: ${body.category}`
  );

  return NextResponse.json(complaint, { status: 201 });
}
