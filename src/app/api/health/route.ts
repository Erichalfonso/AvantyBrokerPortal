import { NextResponse } from "next/server";

export async function GET() {
  // Test 1: Basic response
  const checks: Record<string, string> = {
    status: "ok",
    env_database_url: process.env.DATABASE_URL ? "set" : "missing",
    env_nextauth_secret: process.env.NEXTAUTH_SECRET ? "set" : "missing",
    env_nextauth_url: process.env.NEXTAUTH_URL || "missing",
  };

  // Test 2: Try Prisma connection
  try {
    const { prisma } = await import("@/lib/prisma");
    const count = await prisma.user.count();
    checks.database = `connected (${count} users)`;
  } catch (error) {
    checks.database = `error: ${(error as Error).message}`;
  }

  return NextResponse.json(checks);
}
