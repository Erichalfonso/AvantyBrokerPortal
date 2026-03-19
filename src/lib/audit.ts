import { prisma } from "@/lib/prisma";

export async function logAudit(
  action: string,
  entityType: string,
  entityId: string,
  userId: string,
  details?: string
) {
  try {
    await prisma.auditLog.create({
      data: { action, entityType, entityId, userId, details },
    });
  } catch (error) {
    console.error("[audit] Failed to log:", error);
  }
}
