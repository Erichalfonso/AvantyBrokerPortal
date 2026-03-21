import "dotenv/config";
import { PrismaClient, MobilityType, UserRole } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database (idempotent)...");

  // Create providers (upsert — won't overwrite existing data)
  const safeRide = await prisma.provider.upsert({
    where: { id: "p1" },
    update: {},
    create: {
      id: "p1",
      name: "SafeRide Transport",
      contactName: "David Johnson",
      phone: "(555) 123-4567",
      email: "dispatch@saferide.com",
      serviceAreas: ["Miami-Dade", "Broward"],
      vehicleTypes: [MobilityType.AMBULATORY, MobilityType.WHEELCHAIR],
      active: true,
    },
  });

  const careWheels = await prisma.provider.upsert({
    where: { id: "p2" },
    update: {},
    create: {
      id: "p2",
      name: "CareWheels LLC",
      contactName: "Sarah Mitchell",
      phone: "(555) 234-5678",
      email: "ops@carewheels.com",
      serviceAreas: ["Miami-Dade", "Palm Beach"],
      vehicleTypes: [MobilityType.AMBULATORY, MobilityType.WHEELCHAIR, MobilityType.STRETCHER],
      active: true,
    },
  });

  await prisma.provider.upsert({
    where: { id: "p3" },
    update: {},
    create: {
      id: "p3",
      name: "MedMove Services",
      contactName: "Robert Williams",
      phone: "(555) 345-6789",
      email: "info@medmove.com",
      serviceAreas: ["Broward", "Palm Beach"],
      vehicleTypes: [MobilityType.AMBULATORY],
      active: false,
    },
  });

  // Create users (upsert by email — won't overwrite existing data)
  const brokerHash = await bcrypt.hash("broker123", 10);
  const adminHash = await bcrypt.hash("admin123", 10);
  const providerHash = await bcrypt.hash("provider123", 10);

  await prisma.user.upsert({
    where: { email: "maria@avantycare.com" },
    update: {},
    create: {
      id: "u1",
      name: "Maria Lopez",
      email: "maria@avantycare.com",
      passwordHash: brokerHash,
      role: UserRole.BROKER,
    },
  });

  await prisma.user.upsert({
    where: { email: "james@avantycare.com" },
    update: {},
    create: {
      id: "u2",
      name: "James Carter",
      email: "james@avantycare.com",
      passwordHash: brokerHash,
      role: UserRole.BROKER,
    },
  });

  await prisma.user.upsert({
    where: { email: "admin@avantycare.com" },
    update: {},
    create: {
      id: "u3",
      name: "Admin User",
      email: "admin@avantycare.com",
      passwordHash: adminHash,
      role: UserRole.ADMIN,
    },
  });

  await prisma.user.upsert({
    where: { email: "dispatch@saferide.com" },
    update: {},
    create: {
      id: "u4",
      name: "SafeRide Transport",
      email: "dispatch@saferide.com",
      passwordHash: providerHash,
      role: UserRole.PROVIDER,
      providerId: safeRide.id,
    },
  });

  await prisma.user.upsert({
    where: { email: "ops@carewheels.com" },
    update: {},
    create: {
      id: "u5",
      name: "CareWheels LLC",
      email: "ops@carewheels.com",
      passwordHash: providerHash,
      role: UserRole.PROVIDER,
      providerId: careWheels.id,
    },
  });

  // One-time cleanup: remove sample trips (T-1001 through T-1006)
  const sampleTrips = await prisma.trip.findMany({
    where: { tripNumber: { in: ["T-1001", "T-1002", "T-1003", "T-1004", "T-1005", "T-1006"] } },
    select: { id: true },
  });
  if (sampleTrips.length > 0) {
    const ids = sampleTrips.map((t) => t.id);
    await prisma.note.deleteMany({ where: { tripId: { in: ids } } });
    await prisma.tripStatusHistory.deleteMany({ where: { tripId: { in: ids } } });
    await prisma.trip.deleteMany({ where: { id: { in: ids } } });
    console.log(`  - Removed ${sampleTrips.length} sample trips`);
  }

  console.log("Seed complete!");
  console.log("  - 3 providers upserted");
  console.log("  - 5 users upserted");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
