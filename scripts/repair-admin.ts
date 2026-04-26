/**
 * One-shot admin / user repair script.
 *
 * Resets a user's password and clears any lockout state.
 * Reads DATABASE_URL from the environment.
 *
 * Usage:
 *   DATABASE_URL='postgresql://...' npx tsx scripts/repair-admin.ts <email> <newPassword>
 *
 * Example:
 *   DATABASE_URL='postgresql://user:pass@host:5432/db' \
 *     npx tsx scripts/repair-admin.ts admin@avantycare.com 'TempPass123!'
 */
import { prisma } from "../src/lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
  const [, , email, newPassword] = process.argv;

  if (!email || !newPassword) {
    console.error("Usage: npx tsx scripts/repair-admin.ts <email> <newPassword>");
    process.exit(2);
  }

  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set. Pass it inline:");
    console.error("  DATABASE_URL='postgresql://...' npx tsx scripts/repair-admin.ts <email> <pw>");
    process.exit(2);
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      role: true,
      failedLoginAttempts: true,
      lockedUntil: true,
    },
  });

  if (!user) {
    console.error(`No user found for ${email}.`);
    console.error("If this is the bootstrap admin, edit prisma/seed.ts and redeploy,");
    console.error("or run this script with a different email that does exist.");
    process.exit(1);
  }

  console.log("Found user:");
  console.log(`  id:                  ${user.id}`);
  console.log(`  name:                ${user.name}`);
  console.log(`  role:                ${user.role}`);
  console.log(`  failedLoginAttempts: ${user.failedLoginAttempts}`);
  console.log(
    `  lockedUntil:         ${user.lockedUntil ? user.lockedUntil.toISOString() + (user.lockedUntil > new Date() ? " (CURRENTLY LOCKED)" : " (expired)") : "—"}`
  );

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
  });

  console.log("");
  console.log("Password reset and lockout cleared.");
  console.log(`Sign in at portal.avantycare.com with: ${email} / ${newPassword}`);
  console.log("Change this password from the user-management page after signing in.");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("Repair failed:", e);
    process.exit(1);
  });
