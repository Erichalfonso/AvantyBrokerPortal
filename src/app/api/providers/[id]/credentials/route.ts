import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const credentials = await prisma.providerCredential.findMany({
    where: { providerId: id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(credentials);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();

  const provider = await prisma.provider.findUnique({ where: { id } });
  if (!provider) return NextResponse.json({ error: "Provider not found" }, { status: 404 });

  const credential = await prisma.providerCredential.create({
    data: {
      providerId: id,
      type: body.type,
      status: body.status || "pending",
      documentNumber: body.documentNumber || null,
      issuedDate: body.issuedDate ? new Date(body.issuedDate) : null,
      expirationDate: body.expirationDate ? new Date(body.expirationDate) : null,
      verifiedById: body.status === "valid" ? session.user.id : null,
      verifiedAt: body.status === "valid" ? new Date() : null,
      notes: body.notes || null,
    },
  });

  await logAudit(
    "CREDENTIAL_ADDED",
    "Provider",
    id,
    session.user.id,
    `Added ${body.type} credential for ${provider.name}`
  );

  return NextResponse.json(credential, { status: 201 });
}
