import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const form = await prisma.reimbursementForm.findFirst({
    where: { id, isPublicSubmission: true },
    include: { invoiceLines: true },
  });

  if (!form) return NextResponse.json({ error: "Form not found" }, { status: 404 });
  if (form.formType !== "PROVIDER_INVOICE") {
    return NextResponse.json({ error: "Invoice lines are only for provider invoices" }, { status: 400 });
  }

  const lineNumber = form.invoiceLines.length + 1;

  const line = await prisma.providerInvoiceLine.create({
    data: {
      formId: form.id,
      lineNumber,
      tripId: null,
      tripNumber: body.tripNumber || null,
      serviceDate: new Date(body.serviceDate),
      serviceDescription: body.serviceDescription || "",
      pickupAddress: body.pickupAddress || null,
      destinationAddress: body.destinationAddress || null,
      mileage: body.mileage ? parseFloat(body.mileage) : null,
      rate: parseFloat(body.rate),
      amount: parseFloat(body.amount),
    },
  });

  return NextResponse.json(line, { status: 201 });
}
