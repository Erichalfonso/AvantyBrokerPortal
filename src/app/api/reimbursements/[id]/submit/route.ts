import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { sendEmail, reimbursementSubmittedEmail } from "@/lib/email";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const form = await prisma.reimbursementForm.findFirst({
    where: { OR: [{ id }, { formNumber: id }] },
    include: { invoiceLines: true, serviceLines: true },
  });

  if (!form) return NextResponse.json({ error: "Form not found" }, { status: 404 });
  if (form.status !== "DRAFT") {
    return NextResponse.json({ error: "Only draft forms can be submitted" }, { status: 400 });
  }
  if (form.createdById !== session.user.id && session.user.role !== "admin") {
    return NextResponse.json({ error: "Only the creator can submit this form" }, { status: 403 });
  }

  // Validate required fields per form type
  const errors: string[] = [];
  const formType = form.formType;

  if (formType === "MEDICAID_TRIP") {
    if (!form.patientName) errors.push("Patient name is required");
    if (!form.medicaidId) errors.push("Medicaid ID is required");
    if (!form.pickupAddress) errors.push("Pickup address is required");
    if (!form.destinationAddress) errors.push("Destination address is required");
    if (!form.tripDate) errors.push("Trip date is required");
    if (!form.totalAmount || form.totalAmount <= 0) errors.push("Total amount must be greater than 0");
  } else if (formType === "PROVIDER_INVOICE") {
    if (!form.invoiceNumber) errors.push("Invoice number is required");
    if (!form.invoiceDate) errors.push("Invoice date is required");
    if (form.invoiceLines.length === 0) errors.push("At least one line item is required");
    if (!form.totalAmount || form.totalAmount <= 0) errors.push("Total amount must be greater than 0");
  } else if (formType === "CMS_1500") {
    if (!form.patientName) errors.push("Patient name is required");
    if (!form.insuredIdNumber) errors.push("Insured ID number is required");
    if (!form.diagnosisCode1) errors.push("At least one diagnosis code is required");
    if (form.serviceLines.length === 0) errors.push("At least one service line is required");
    if (!form.billingProviderName) errors.push("Billing provider name is required");
    if (!form.billingProviderNpi) errors.push("Billing provider NPI is required");
  }

  if (errors.length > 0) {
    return NextResponse.json({ error: "Validation failed", errors }, { status: 400 });
  }

  const updated = await prisma.reimbursementForm.update({
    where: { id: form.id },
    data: { status: "SUBMITTED", submittedAt: new Date() },
    include: {
      trip: { select: { id: true, tripNumber: true } },
      provider: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
    },
  });

  await logAudit(
    "REIMBURSEMENT_FORM_SUBMITTED",
    "ReimbursementForm",
    form.id,
    session.user.id,
    `Submitted form ${form.formNumber}`
  );

  // Notify admins (and brokers, who are the typical reviewers) that a form is awaiting review
  const reviewers = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "BROKER"] } },
    select: { name: true, email: true },
  });
  const submitterName = updated.createdBy?.name || "a user";
  for (const reviewer of reviewers) {
    const email = reimbursementSubmittedEmail(
      reviewer.name,
      updated.formNumber,
      updated.formType,
      submitterName,
      updated.totalAmount,
    );
    sendEmail({ to: reviewer.email, ...email }).catch(() => {});
  }

  return NextResponse.json(updated);
}
