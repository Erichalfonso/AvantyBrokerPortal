import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { encrypt, decrypt } from "@/lib/encryption";

const PHI_FIELDS = ["patientName", "patientDob", "patientPhone", "insuredName"];

function encryptFormPHI(data: Record<string, unknown>): Record<string, unknown> {
  const result = { ...data };
  for (const field of PHI_FIELDS) {
    if (typeof result[field] === "string" && result[field]) {
      result[field] = encrypt(result[field] as string);
    }
  }
  return result;
}

function decryptFormPHI<T extends Record<string, unknown>>(data: T): T {
  const result = { ...data };
  for (const field of PHI_FIELDS) {
    if (typeof result[field] === "string") {
      (result as Record<string, unknown>)[field] = decrypt(result[field] as string);
    }
  }
  return result;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const form = await prisma.reimbursementForm.findFirst({
    where: { OR: [{ id }, { formNumber: id }] },
    include: {
      trip: { select: { id: true, tripNumber: true, patientName: true, pickupAddress: true, destinationAddress: true } },
      provider: { select: { id: true, name: true, code: true } },
      createdBy: { select: { id: true, name: true } },
      reviewedBy: { select: { id: true, name: true } },
      serviceLines: { orderBy: { lineNumber: "asc" } },
      invoiceLines: { orderBy: { lineNumber: "asc" } },
    },
  });

  if (!form) return NextResponse.json({ error: "Form not found" }, { status: 404 });

  // Providers can only see their own forms
  if (session.user.role === "provider" && form.providerId !== session.user.providerId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(decryptFormPHI(form as unknown as Record<string, unknown>));
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  const form = await prisma.reimbursementForm.findFirst({
    where: { OR: [{ id }, { formNumber: id }] },
  });

  if (!form) return NextResponse.json({ error: "Form not found" }, { status: 404 });

  // Only creator can edit DRAFT forms
  if (form.status === "DRAFT" && form.createdById !== session.user.id && session.user.role !== "admin") {
    return NextResponse.json({ error: "Only the creator or admin can edit draft forms" }, { status: 403 });
  }

  // Non-draft forms can only have status changed by broker/admin
  if (form.status !== "DRAFT" && body.status === undefined) {
    return NextResponse.json({ error: "Submitted forms can only have their status changed" }, { status: 400 });
  }

  const updateData: Record<string, unknown> = {};

  // Status transition
  if (body.status) {
    const validTransitions: Record<string, string[]> = {
      DRAFT: ["SUBMITTED", "VOID"],
      SUBMITTED: ["UNDER_REVIEW", "APPROVED", "DENIED", "VOID"],
      UNDER_REVIEW: ["APPROVED", "DENIED", "VOID"],
      APPROVED: ["PAID", "VOID"],
      DENIED: ["VOID"],
      PAID: ["VOID"],
    };
    const newStatus = body.status.toUpperCase();
    const allowed = validTransitions[form.status] || [];
    if (!allowed.includes(newStatus)) {
      return NextResponse.json({ error: `Cannot transition from ${form.status} to ${newStatus}` }, { status: 400 });
    }

    updateData.status = newStatus;
    if (newStatus === "SUBMITTED") updateData.submittedAt = new Date();
    if (newStatus === "APPROVED" || newStatus === "DENIED") {
      updateData.reviewedAt = new Date();
      updateData.reviewedById = session.user.id;
    }
    if (newStatus === "DENIED" && !body.reviewNotes) {
      return NextResponse.json({ error: "Review notes are required when denying a form" }, { status: 400 });
    }
    if (newStatus === "PAID") updateData.paidAt = new Date();
    if (body.reviewNotes) updateData.reviewNotes = body.reviewNotes;

    await logAudit(
      "REIMBURSEMENT_FORM_STATUS_CHANGED",
      "ReimbursementForm",
      form.id,
      session.user.id,
      `Status changed from ${form.status} to ${newStatus}`
    );
  }

  // Field updates (only for DRAFT forms)
  if (form.status === "DRAFT" && !body.status) {
    const encrypted = encryptFormPHI(body);
    const allowedFields = [
      "patientName", "patientDob", "medicaidId", "authorizationNumber",
      "healthPlanName", "healthPlanId", "pickupAddress", "destinationAddress",
      "tripDate", "pickupTime", "dropoffTime", "mobilityType",
      "mileage", "mileageRate", "baseRate", "tolls", "waitTime", "waitTimeRate",
      "driverName", "driverId", "vehicleId", "vehicleType",
      "memberSignatureUrl", "driverSignatureUrl", "attendantName",
      "returnTrip", "tripPurpose", "totalAmount",
      "invoiceNumber", "invoiceDate", "billingPeriodStart", "billingPeriodEnd",
      "providerTaxId", "providerNpi", "remitToName", "remitToAddress", "paymentTerms",
      "insuranceType", "insuredIdNumber", "patientSex", "insuredName",
      "patientAddress", "patientCity", "patientState", "patientZip", "patientPhone",
      "patientRelToInsured", "insuredAddress", "insuredCity", "insuredState", "insuredZip",
      "patientConditionRelTo", "insuredPolicyGroup", "insuredDob", "insuredSex",
      "insuredPlanName", "patientSignatureOnFile", "insuredSignatureOnFile",
      "conditionDateOfOnset", "referringProviderName", "referringProviderNpi",
      "diagnosisCode1", "diagnosisCode2", "diagnosisCode3", "diagnosisCode4",
      "priorAuthNumber", "federalTaxId", "federalTaxIdType", "patientAccountNumber",
      "acceptAssignment", "amountPaid", "billingProviderName", "billingProviderAddress",
      "billingProviderNpi", "billingProviderTaxonomy", "facilityName", "facilityAddress", "facilityNpi",
      "tripId", "providerId",
    ];

    for (const field of allowedFields) {
      const value = PHI_FIELDS.includes(field) ? encrypted[field] : body[field];
      if (value !== undefined) {
        if (field === "tripDate" || field === "invoiceDate" || field === "billingPeriodStart" || field === "billingPeriodEnd" || field === "conditionDateOfOnset") {
          updateData[field] = value ? new Date(value as string) : null;
        } else if (field === "mobilityType") {
          updateData[field] = value ? (value as string).toUpperCase() : null;
        } else {
          updateData[field] = value;
        }
      }
    }

    await logAudit(
      "REIMBURSEMENT_FORM_UPDATED",
      "ReimbursementForm",
      form.id,
      session.user.id,
      `Updated form ${form.formNumber}: ${Object.keys(updateData).join(", ")}`
    );
  }

  const updated = await prisma.reimbursementForm.update({
    where: { id: form.id },
    data: updateData,
    include: {
      trip: { select: { id: true, tripNumber: true } },
      provider: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
      reviewedBy: { select: { id: true, name: true } },
      serviceLines: { orderBy: { lineNumber: "asc" } },
      invoiceLines: { orderBy: { lineNumber: "asc" } },
    },
  });

  return NextResponse.json(decryptFormPHI(updated as unknown as Record<string, unknown>));
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const form = await prisma.reimbursementForm.findFirst({
    where: { OR: [{ id }, { formNumber: id }] },
  });

  if (!form) return NextResponse.json({ error: "Form not found" }, { status: 404 });

  if (form.status !== "DRAFT") {
    return NextResponse.json({ error: "Only draft forms can be deleted" }, { status: 400 });
  }

  if (form.createdById !== session.user.id && session.user.role !== "admin") {
    return NextResponse.json({ error: "Only the creator or admin can delete this form" }, { status: 403 });
  }

  await prisma.reimbursementForm.delete({ where: { id: form.id } });

  await logAudit(
    "REIMBURSEMENT_FORM_DELETED",
    "ReimbursementForm",
    form.id,
    session.user.id,
    `Deleted form ${form.formNumber}`
  );

  return NextResponse.json({ success: true });
}
