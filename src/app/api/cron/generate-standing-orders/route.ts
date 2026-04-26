import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { rateLimit } from "@/lib/rate-limit";
import { generateTripsForAllActiveOrders } from "@/lib/standing-orders";

const DEFAULT_HORIZON_DAYS = 7;

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  const expected = process.env.CRON_SECRET;
  if (!expected) {
    console.error("[cron.standing-orders] CRON_SECRET is not set; refusing to run.");
    return NextResponse.json({ error: "Cron not configured" }, { status: 500 });
  }
  if (request.headers.get("x-cron-secret") !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { allowed } = rateLimit(`cron:standing-orders:${ip}`, {
    maxRequests: 5,
    windowMs: 60_000,
  });
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const url = new URL(request.url);
  const horizonDays = Math.max(
    1,
    Math.min(30, parseInt(url.searchParams.get("days") || `${DEFAULT_HORIZON_DAYS}`, 10) || DEFAULT_HORIZON_DAYS)
  );

  const fromDate = new Date();
  fromDate.setHours(0, 0, 0, 0);
  const toDate = new Date(fromDate);
  toDate.setDate(toDate.getDate() + horizonDays);

  const systemUser = await prisma.user.findFirst({
    where: { role: "ADMIN" },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  if (!systemUser) {
    console.error("[cron.standing-orders] No admin user found to attribute generated trips to.");
    return NextResponse.json({ error: "No admin user available" }, { status: 500 });
  }

  const { results, totals } = await generateTripsForAllActiveOrders(
    fromDate,
    toDate,
    systemUser.id
  );

  if (totals.createdTrips > 0 || totals.errors > 0) {
    await logAudit(
      "CRON_STANDING_ORDERS_RUN",
      "StandingOrder",
      "batch",
      systemUser.id,
      `Generated ${totals.createdTrips} trips across ${totals.processedOrders} orders (skipped ${totals.skippedExisting}, errors ${totals.errors})`
    );
  }

  console.log(
    `[cron.standing-orders] processed=${totals.processedOrders} created=${totals.createdTrips} skipped=${totals.skippedExisting} errors=${totals.errors}`
  );

  return NextResponse.json({
    horizonDays,
    fromDate: fromDate.toISOString(),
    toDate: toDate.toISOString(),
    totals,
    results,
  });
}
