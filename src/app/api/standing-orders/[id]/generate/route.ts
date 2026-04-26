import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { generateTripsForOrderInRange } from "@/lib/standing-orders";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role === "provider") {
    return NextResponse.json({ error: "Brokers/admins only" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const { fromDate, toDate } = body;

  if (!fromDate || !toDate) {
    return NextResponse.json({ error: "fromDate and toDate are required" }, { status: 400 });
  }

  const order = await prisma.standingOrder.findUnique({ where: { id } });
  if (!order) return NextResponse.json({ error: "Standing order not found" }, { status: 404 });
  if (!order.active) return NextResponse.json({ error: "Standing order is inactive" }, { status: 400 });

  const result = await generateTripsForOrderInRange(
    order,
    new Date(fromDate),
    new Date(toDate),
    session.user.id
  );

  if (result.generated > 0) {
    await logAudit(
      "STANDING_ORDER_GENERATED",
      "StandingOrder",
      id,
      session.user.id,
      `Generated ${result.generated} trips: ${result.tripNumbers.join(", ")}`
    );
  }

  return NextResponse.json({
    generated: result.generated,
    tripNumbers: result.tripNumbers,
    skipped: result.skipped,
  });
}
