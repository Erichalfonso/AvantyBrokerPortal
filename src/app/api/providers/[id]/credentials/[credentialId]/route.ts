import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; credentialId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const { id, credentialId } = await params;
  const body = await request.json();

  const credential = await prisma.providerCredential.findFirst({
    where: { id: credentialId, providerId: id },
  });

  if (!credential) return NextResponse.json({ error: "Credential not found" }, { status: 404 });

  const updateData: Record<string, unknown> = {};
  if (body.status) updateData.status = body.status;
  if (body.documentNumber !== undefined) updateData.documentNumber = body.documentNumber;
  if (body.issuedDate) updateData.issuedDate = new Date(body.issuedDate);
  if (body.expirationDate) updateData.expirationDate = new Date(body.expirationDate);
  if (body.notes !== undefined) updateData.notes = body.notes;

  // If verifying, capture who and when
  if (body.status === "valid") {
    updateData.verifiedById = session.user.id;
    updateData.verifiedAt = new Date();
  }

  const updated = await prisma.providerCredential.update({
    where: { id: credentialId },
    data: updateData,
  });

  await logAudit(
    "CREDENTIAL_UPDATED",
    "Provider",
    id,
    session.user.id,
    `Updated ${credential.type} credential: ${Object.keys(updateData).join(", ")}`
  );

  return NextResponse.json(updated);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; credentialId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const { id, credentialId } = await params;

  const credential = await prisma.providerCredential.findFirst({
    where: { id: credentialId, providerId: id },
  });

  if (!credential) return NextResponse.json({ error: "Credential not found" }, { status: 404 });

  await prisma.providerCredential.delete({ where: { id: credentialId } });

  await logAudit(
    "CREDENTIAL_DELETED",
    "Provider",
    id,
    session.user.id,
    `Deleted ${credential.type} credential`
  );

  return NextResponse.json({ success: true });
}
