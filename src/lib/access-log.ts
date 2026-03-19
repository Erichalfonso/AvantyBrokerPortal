import { prisma } from "@/lib/prisma";

// HIPAA requires logging access to PHI, not just modifications
export async function logAccess(
  entityType: string,
  entityId: string,
  userId: string,
  action: string = "VIEWED"
) {
  try {
    await prisma.auditLog.create({
      data: {
        action: `PHI_${action}`,
        entityType,
        entityId,
        userId,
        details: `${entityType} ${action.toLowerCase()} by user`,
      },
    });
  } catch (error) {
    console.error("[access-log] Failed to log access:", error);
  }
}
