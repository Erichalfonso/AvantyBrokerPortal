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

  const form = await prisma.reimbursementForm.findFirst({
    where: { OR: [{ id }, { formNumber: id }] },
    select: { id: true, formType: true },
  });

  if (!form) return NextResponse.json({ error: "Form not found" }, { status: 404 });
  if (form.formType !== "PROVIDER_INVOICE") {
    return NextResponse.json({ error: "Invoice lines are only for provider invoices" }, { status: 400 });
  }

  const lines = await prisma.providerInvoiceLine.findMany({
    where: { formId: form.id },
    orderBy: { lineNumber: "asc" },
  });

  return NextResponse.json(lines);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  const form = await prisma.reimbursementForm.findFirst({
    where: { OR: [{ id }, { formNumber: id }] },
    include: { invoiceLines: true },
  });

  if (!form) return NextResponse.json({ error: "Form not found" }, { status: 404 });
  if (form.formType !== "PROVIDER_INVOICE") {
    return NextResponse.json({ error: "Invoice lines are only for provider invoices" }, { status: 400 });
  }
  if (form.status !== "DRAFT") {
    return NextResponse.json({ error: "Can only add lines to draft forms" }, { status: 400 });
  }

  const lineNumber = form.invoiceLines.length + 1;

  // If tripId provided, auto-populate from trip
  let tripData: Record<string, unknown> = {};
  if (body.tripId) {
    const trip = await prisma.trip.findUnique({
      where: { id: body.tripId },
      select: {
        tripNumber: true,
        appointmentDate: true,
        pickupAddress: true,
        destinationAddress: true,
        actualMileage: true,
        mobilityType: true,
      },
    });
    if (trip) {
      tripData = {
        tripNumber: trip.tripNumber,
        serviceDate: trip.appointmentDate,
        pickupAddress: trip.pickupAddress,
        destinationAddress: trip.destinationAddress,
        mileage: trip.actualMileage,
        serviceDescription: `${trip.mobilityType} transport`,
      };
    }
  }

  const line = await prisma.providerInvoiceLine.create({
    data: {
      formId: form.id,
      lineNumber,
      tripId: body.tripId || null,
      tripNumber: body.tripNumber || tripData.tripNumber as string || null,
      serviceDate: new Date(body.serviceDate || tripData.serviceDate as string),
      serviceDescription: body.serviceDescription || tripData.serviceDescription as string || "",
      pickupAddress: body.pickupAddress || tripData.pickupAddress as string || null,
      destinationAddress: body.destinationAddress || tripData.destinationAddress as string || null,
      mileage: body.mileage ? parseFloat(body.mileage) : tripData.mileage as number || null,
      rate: parseFloat(body.rate),
      amount: parseFloat(body.amount),
    },
  });

  return NextResponse.json(line, { status: 201 });
}
