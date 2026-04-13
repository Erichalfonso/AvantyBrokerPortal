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
  if (form.formType !== "CMS_1500") {
    return NextResponse.json({ error: "Service lines are only for CMS-1500 forms" }, { status: 400 });
  }

  const lines = await prisma.cMS1500ServiceLine.findMany({
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
    include: { serviceLines: true },
  });

  if (!form) return NextResponse.json({ error: "Form not found" }, { status: 404 });
  if (form.formType !== "CMS_1500") {
    return NextResponse.json({ error: "Service lines are only for CMS-1500 forms" }, { status: 400 });
  }
  if (form.status !== "DRAFT") {
    return NextResponse.json({ error: "Can only add lines to draft forms" }, { status: 400 });
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
