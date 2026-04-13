import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/encryption";

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

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { formType, submitterName, submitterEmail, submitterPhone, ...formData } = body;

  if (!submitterName || !submitterEmail) {
    return NextResponse.json({ error: "Submitter name and email are required" }, { status: 400 });
  }

  if (!formType || !["medicaid_trip", "provider_invoice", "cms_1500"].includes(formType)) {
    return NextResponse.json({ error: "Invalid form type" }, { status: 400 });
  }

  // Generate form number
  const prefixMap: Record<string, string> = {
    medicaid_trip: "MR",
    provider_invoice: "PI",
    cms_1500: "CMS",
  };
  const prefix = prefixMap[formType] || "RF";

  const lastForm = await prisma.reimbursementForm.findFirst({
    where: { formNumber: { startsWith: prefix } },
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

  // Get a system/admin user for createdById (required FK)
  const adminUser = await prisma.user.findFirst({
    where: { role: "ADMIN" },
    select: { id: true },
  });

  if (!adminUser) {
    return NextResponse.json({ error: "System configuration error" }, { status: 500 });
  }

  try {
    const form = await prisma.reimbursementForm.create({
      data: {
        formNumber,
        formType: formType.toUpperCase().replace("MEDICAID_TRIP", "MEDICAID_TRIP").replace("PROVIDER_INVOICE", "PROVIDER_INVOICE").replace("CMS_1500", "CMS_1500") as never,
        status: "SUBMITTED",
        submittedAt: new Date(),
        createdById: adminUser.id,
        isPublicSubmission: true,
        submitterName,
        submitterEmail,
        submitterPhone: submitterPhone || null,
        totalAmount: formData.totalAmount || 0,
        providerId: formData.providerId || null,
        tripId: null,
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
    });

    return NextResponse.json({ id: form.id, formNumber: form.formNumber }, { status: 201 });
  } catch (err) {
    console.error("Public form submission error:", err);
    return NextResponse.json({ error: "Failed to submit form" }, { status: 500 });
  }
}
