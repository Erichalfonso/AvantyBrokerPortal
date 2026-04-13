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

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const status = searchParams.get("status");
  const formType = searchParams.get("formType");
  const providerId = searchParams.get("providerId");

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (formType) where.formType = formType;
  if (providerId) where.providerId = providerId;

  // Providers only see their own forms
  if (session.user.role === "provider" && session.user.providerId) {
    where.providerId = session.user.providerId;
  }

  const [forms, total] = await Promise.all([
    prisma.reimbursementForm.findMany({
      where,
      include: {
        trip: { select: { id: true, tripNumber: true } },
        provider: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
        reviewedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.reimbursementForm.count({ where }),
  ]);

  const decryptedForms = forms.map((form) => decryptFormPHI(form as unknown as Record<string, unknown>));

  return NextResponse.json({
    forms: decryptedForms,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { formType, ...formData } = body;

  // Role guard
  if (formType === "provider_invoice" && session.user.role !== "provider") {
    return NextResponse.json({ error: "Only providers can create invoices" }, { status: 403 });
  }
  if ((formType === "medicaid_trip" || formType === "cms_1500") && session.user.role === "provider") {
    return NextResponse.json({ error: "Providers cannot create this form type" }, { status: 403 });
  }

  // Generate form number
  const prefixMap: Record<string, string> = {
    medicaid_trip: "MR",
    provider_invoice: "PI",
    cms_1500: "CMS",
  };
  const prefix = prefixMap[formType] || "RF";

  const lastForm = await prisma.reimbursementForm.findFirst({
    where: { formType: formType.toUpperCase().replace("MEDICAID_TRIP", "MEDICAID_TRIP").replace("PROVIDER_INVOICE", "PROVIDER_INVOICE").replace("CMS_1500", "CMS_1500") },
    orderBy: { formNumber: "desc" },
    select: { formNumber: true },
  });

  let nextNum = 1001;
  if (lastForm) {
    const match = lastForm.formNumber.match(/(\d+)$/);
    if (match) nextNum = parseInt(match[1]) + 1;
  }
  const formNumber = `${prefix}-${nextNum}`;

  // Encrypt PHI fields
  const encryptedData = encryptFormPHI(formData);

  // Set provider from session for provider invoices
  const providerId = formType === "provider_invoice"
    ? session.user.providerId
    : formData.providerId || null;

  const form = await prisma.reimbursementForm.create({
    data: {
      formNumber,
      formType: formType.toUpperCase() as never,
      status: "DRAFT",
      createdById: session.user.id,
      providerId,
      tripId: formData.tripId || null,
      totalAmount: formData.totalAmount || 0,
      // Medicaid fields
      patientName: encryptedData.patientName as string | undefined,
      patientDob: encryptedData.patientDob as string | undefined,
      medicaidId: formData.medicaidId,
      authorizationNumber: formData.authorizationNumber,
      healthPlanName: formData.healthPlanName,
      healthPlanId: formData.healthPlanId,
      pickupAddress: formData.pickupAddress,
      destinationAddress: formData.destinationAddress,
      tripDate: formData.tripDate ? new Date(formData.tripDate) : undefined,
      pickupTime: formData.pickupTime,
      dropoffTime: formData.dropoffTime,
      mobilityType: formData.mobilityType ? formData.mobilityType.toUpperCase() as never : undefined,
      mileage: formData.mileage ? parseFloat(formData.mileage) : undefined,
      mileageRate: formData.mileageRate ? parseFloat(formData.mileageRate) : undefined,
      baseRate: formData.baseRate ? parseFloat(formData.baseRate) : undefined,
      tolls: formData.tolls ? parseFloat(formData.tolls) : undefined,
      waitTime: formData.waitTime ? parseInt(formData.waitTime) : undefined,
      waitTimeRate: formData.waitTimeRate ? parseFloat(formData.waitTimeRate) : undefined,
      driverName: formData.driverName,
      driverId: formData.driverId,
      vehicleId: formData.vehicleId,
      vehicleType: formData.vehicleType,
      memberSignatureUrl: formData.memberSignatureUrl,
      driverSignatureUrl: formData.driverSignatureUrl,
      attendantName: formData.attendantName,
      returnTrip: formData.returnTrip,
      tripPurpose: formData.tripPurpose,
      // Provider Invoice fields
      invoiceNumber: formData.invoiceNumber,
      invoiceDate: formData.invoiceDate ? new Date(formData.invoiceDate) : undefined,
      billingPeriodStart: formData.billingPeriodStart ? new Date(formData.billingPeriodStart) : undefined,
      billingPeriodEnd: formData.billingPeriodEnd ? new Date(formData.billingPeriodEnd) : undefined,
      providerTaxId: formData.providerTaxId,
      providerNpi: formData.providerNpi,
      remitToName: formData.remitToName,
      remitToAddress: formData.remitToAddress,
      paymentTerms: formData.paymentTerms,
      // CMS-1500 fields
      insuranceType: formData.insuranceType,
      insuredIdNumber: formData.insuredIdNumber,
      patientSex: formData.patientSex,
      insuredName: encryptedData.insuredName as string | undefined,
      patientAddress: formData.patientAddress,
      patientCity: formData.patientCity,
      patientState: formData.patientState,
      patientZip: formData.patientZip,
      patientPhone: encryptedData.patientPhone as string | undefined,
      patientRelToInsured: formData.patientRelToInsured,
      insuredAddress: formData.insuredAddress,
      insuredCity: formData.insuredCity,
      insuredState: formData.insuredState,
      insuredZip: formData.insuredZip,
      patientConditionRelTo: formData.patientConditionRelTo,
      insuredPolicyGroup: formData.insuredPolicyGroup,
      insuredDob: formData.insuredDob,
      insuredSex: formData.insuredSex,
      insuredPlanName: formData.insuredPlanName,
      patientSignatureOnFile: formData.patientSignatureOnFile,
      insuredSignatureOnFile: formData.insuredSignatureOnFile,
      conditionDateOfOnset: formData.conditionDateOfOnset ? new Date(formData.conditionDateOfOnset) : undefined,
      referringProviderName: formData.referringProviderName,
      referringProviderNpi: formData.referringProviderNpi,
      diagnosisCode1: formData.diagnosisCode1,
      diagnosisCode2: formData.diagnosisCode2,
      diagnosisCode3: formData.diagnosisCode3,
      diagnosisCode4: formData.diagnosisCode4,
      priorAuthNumber: formData.priorAuthNumber,
      federalTaxId: formData.federalTaxId,
      federalTaxIdType: formData.federalTaxIdType,
      patientAccountNumber: formData.patientAccountNumber,
      acceptAssignment: formData.acceptAssignment,
      amountPaid: formData.amountPaid ? parseFloat(formData.amountPaid) : undefined,
      billingProviderName: formData.billingProviderName,
      billingProviderAddress: formData.billingProviderAddress,
      billingProviderNpi: formData.billingProviderNpi,
      billingProviderTaxonomy: formData.billingProviderTaxonomy,
      facilityName: formData.facilityName,
      facilityAddress: formData.facilityAddress,
      facilityNpi: formData.facilityNpi,
    },
    include: {
      trip: { select: { id: true, tripNumber: true } },
      provider: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
    },
  });

  await logAudit(
    "REIMBURSEMENT_FORM_CREATED",
    "ReimbursementForm",
    form.id,
    session.user.id,
    `Created ${formType} form ${formNumber}`
  );

  return NextResponse.json(decryptFormPHI(form as unknown as Record<string, unknown>), { status: 201 });
}
