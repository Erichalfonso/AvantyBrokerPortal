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
    include: { serviceLines: true },
  });

  if (!form) return NextResponse.json({ error: "Form not found" }, { status: 404 });
  if (form.formType !== "CMS_1500") {
    return NextResponse.json({ error: "Service lines are only for CMS-1500 forms" }, { status: 400 });
  }
  if (form.serviceLines.length >= 6) {
    return NextResponse.json({ error: "Maximum 6 service lines allowed" }, { status: 400 });
  }

  const lineNumber = form.serviceLines.length + 1;

  const line = await prisma.cMS1500ServiceLine.create({
    data: {
      formId: form.id,
      lineNumber,
      dateOfServiceFrom: new Date(body.dateOfServiceFrom),
      dateOfServiceTo: new Date(body.dateOfServiceTo),
      placeOfService: body.placeOfService,
      procedureCode: body.procedureCode,
      modifiers: body.modifiers || [],
      diagnosisPointer: body.diagnosisPointer,
      charges: parseFloat(body.charges),
      units: body.units ? parseFloat(body.units) : 1,
      renderingProviderNpi: body.renderingProviderNpi,
    },
  });

  return NextResponse.json(line, { status: 201 });
}
