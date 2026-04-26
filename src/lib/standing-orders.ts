import { prisma } from "@/lib/prisma";
import type { StandingOrder } from "@/generated/prisma";

export interface GenerationResult {
  orderId: string;
  patientName: string;
  generated: number;
  tripNumbers: string[];
  skipped: number;
  error?: string;
}

export interface BatchTotals {
  processedOrders: number;
  createdTrips: number;
  skippedExisting: number;
  errors: number;
}

function nextTripNumber(seed: number): string {
  return `T-${seed}`;
}

async function getNextTripSeed(): Promise<number> {
  const lastTrip = await prisma.trip.findFirst({
    orderBy: { tripNumber: "desc" },
    select: { tripNumber: true },
  });
  return lastTrip ? parseInt(lastTrip.tripNumber.replace("T-", ""), 10) + 1 : 1001;
}

export async function generateTripsForOrderInRange(
  order: StandingOrder,
  fromDate: Date,
  toDate: Date,
  changedById: string
): Promise<GenerationResult> {
  const effectiveStart = order.startDate > fromDate ? order.startDate : fromDate;
  const effectiveEnd = order.endDate && order.endDate < toDate ? order.endDate : toDate;

  const baseResult: Omit<GenerationResult, "generated" | "tripNumbers" | "skipped"> = {
    orderId: order.id,
    patientName: order.patientName,
  };

  if (effectiveStart > effectiveEnd) {
    return { ...baseResult, generated: 0, tripNumbers: [], skipped: 0 };
  }

  const dates: Date[] = [];
  for (
    let d = new Date(effectiveStart);
    d <= effectiveEnd;
    d.setDate(d.getDate() + 1)
  ) {
    if (order.daysOfWeek.includes(d.getDay())) {
      dates.push(new Date(d));
    }
  }

  if (dates.length === 0) {
    return { ...baseResult, generated: 0, tripNumbers: [], skipped: 0 };
  }

  let nextNum = await getNextTripSeed();
  const created: string[] = [];
  let skipped = 0;

  for (const date of dates) {
    const existing = await prisma.trip.findFirst({
      where: { standingOrderId: order.id, appointmentDate: date },
      select: { id: true },
    });
    if (existing) {
      skipped++;
      continue;
    }

    const tripNumber = nextTripNumber(nextNum);
    nextNum++;

    const initialStatus = (order.providerId ? "assigned" : "pending") as never;
    await prisma.trip.create({
      data: {
        tripNumber,
        patientName: order.patientName,
        patientPhone: order.patientPhone,
        medicaidId: order.medicaidId,
        pickupAddress: order.pickupAddress,
        destinationAddress: order.destinationAddress,
        appointmentDate: date,
        appointmentTime: order.appointmentTime,
        mobilityType: order.mobilityType,
        specialInstructions: order.specialInstructions,
        status: initialStatus,
        providerId: order.providerId,
        createdById: changedById,
        standingOrderId: order.id,
        statusHistory: {
          create: {
            status: initialStatus,
            note: "Generated from standing order",
            changedById,
          },
        },
      },
    });
    created.push(tripNumber);
  }

  return {
    ...baseResult,
    generated: created.length,
    tripNumbers: created,
    skipped,
  };
}

export async function generateTripsForAllActiveOrders(
  fromDate: Date,
  toDate: Date,
  changedById: string
): Promise<{ results: GenerationResult[]; totals: BatchTotals }> {
  const orders = await prisma.standingOrder.findMany({ where: { active: true } });

  const results: GenerationResult[] = [];
  let createdTrips = 0;
  let skippedExisting = 0;
  let errors = 0;

  for (const order of orders) {
    try {
      const result = await generateTripsForOrderInRange(order, fromDate, toDate, changedById);
      results.push(result);
      createdTrips += result.generated;
      skippedExisting += result.skipped;
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      console.error(`[standing-orders] Failed to generate for ${order.id}:`, e);
      results.push({
        orderId: order.id,
        patientName: order.patientName,
        generated: 0,
        tripNumbers: [],
        skipped: 0,
        error: message,
      });
      errors++;
    }
  }

  return {
    results,
    totals: {
      processedOrders: orders.length,
      createdTrips,
      skippedExisting,
      errors,
    },
  };
}
