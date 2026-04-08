import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const complaint = await prisma.complaint.findFirst({
    where: { OR: [{ id }, { complaintNumber: id }] },
    include: {
      provider: { select: { id: true, name: true } },
      trip: { select: { id: true, tripNumber: true } },
    },
  });

  if (!complaint) return NextResponse.json({ error: "Complaint not found" }, { status: 404 });

  return NextResponse.json(complaint);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  const complaint = await prisma.complaint.findFirst({
    where: { OR: [{ id }, { complaintNumber: id }] },
  });

  if (!complaint) return NextResponse.json({ error: "Complaint not found" }, { status: 404 });

  const updateData: Record<string, unknown> = {};
  if (body.status) updateData.status = body.status;
  if (body.resolution !== undefined) updateData.resolution = body.resolution;
  if (body.category) updateData.category = body.category;

  // If resolving, capture who and when
  if (body.status === "resolved" || body.status === "closed") {
    updateData.resolvedById = session.user.id;
    updateData.resolvedAt = new Date();
  }

  const updated = await prisma.complaint.update({
    where: { id: complaint.id },
    data: updateData,
    include: {
      provider: { select: { id: true, name: true } },
      trip: { select: { id: true, tripNumber: true } },
    },
  });

  await logAudit(
    "COMPLAINT_UPDATED",
    "Complaint",
    complaint.id,
    session.user.id,
    `Updated complaint ${complaint.complaintNumber}: ${Object.keys(updateData).join(", ")}`
  );

  return NextResponse.json(updated);
}
