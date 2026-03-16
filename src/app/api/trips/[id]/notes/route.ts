import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const trip = await prisma.trip.findFirst({
    where: { OR: [{ id }, { tripNumber: id }] },
    select: { id: true, providerId: true },
  });

  if (!trip) return NextResponse.json({ error: "Trip not found" }, { status: 404 });

  if (session.user.role === "provider" && trip.providerId !== session.user.providerId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const notes = await prisma.note.findMany({
    where: { tripId: trip.id },
    orderBy: { createdAt: "desc" },
    include: { author: { select: { id: true, name: true } } },
  });

  return NextResponse.json(notes);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { content } = await request.json();

  if (!content || !content.trim()) {
    return NextResponse.json({ error: "Note content is required" }, { status: 400 });
  }

  const trip = await prisma.trip.findFirst({
    where: { OR: [{ id }, { tripNumber: id }] },
    select: { id: true, providerId: true },
  });

  if (!trip) return NextResponse.json({ error: "Trip not found" }, { status: 404 });

  if (session.user.role === "provider" && trip.providerId !== session.user.providerId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const note = await prisma.note.create({
    data: {
      tripId: trip.id,
      content: content.trim(),
      authorId: session.user.id,
    },
    include: { author: { select: { id: true, name: true } } },
  });

  return NextResponse.json(note, { status: 201 });
}
