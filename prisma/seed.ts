import "dotenv/config";
import { PrismaClient, MobilityType, TripStatus, UserRole } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // Clean existing data
  await prisma.note.deleteMany();
  await prisma.tripStatusHistory.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.user.deleteMany();
  await prisma.provider.deleteMany();

  // Create providers
  const safeRide = await prisma.provider.create({
    data: {
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

  const careWheels = await prisma.provider.create({
    data: {
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

  await prisma.provider.create({
    data: {
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

  // Create users
  const brokerHash = await bcrypt.hash("broker123", 10);
  const adminHash = await bcrypt.hash("admin123", 10);
  const providerHash = await bcrypt.hash("provider123", 10);

  const maria = await prisma.user.create({
    data: {
      id: "u1",
      name: "Maria Lopez",
      email: "maria@avantycare.com",
      passwordHash: brokerHash,
      role: UserRole.BROKER,
    },
  });

  const james = await prisma.user.create({
    data: {
      id: "u2",
      name: "James Carter",
      email: "james@avantycare.com",
      passwordHash: brokerHash,
      role: UserRole.BROKER,
    },
  });

  await prisma.user.create({
    data: {
      id: "u3",
      name: "Admin User",
      email: "admin@avantycare.com",
      passwordHash: adminHash,
      role: UserRole.ADMIN,
    },
  });

  const safeRideUser = await prisma.user.create({
    data: {
      id: "u4",
      name: "SafeRide Transport",
      email: "dispatch@saferide.com",
      passwordHash: providerHash,
      role: UserRole.PROVIDER,
      providerId: safeRide.id,
    },
  });

  const careWheelsUser = await prisma.user.create({
    data: {
      id: "u5",
      name: "CareWheels LLC",
      email: "ops@carewheels.com",
      passwordHash: providerHash,
      role: UserRole.PROVIDER,
      providerId: careWheels.id,
    },
  });

  // Create trips with status history
  await prisma.trip.create({
    data: {
      tripNumber: "T-1001",
      patientName: "John Martinez",
      patientPhone: "(555) 111-2222",
      pickupAddress: "123 SW 8th St, Miami, FL 33130",
      destinationAddress: "Jackson Memorial Hospital, 1611 NW 12th Ave, Miami, FL 33136",
      appointmentDate: new Date("2026-03-17"),
      appointmentTime: "09:00",
      mobilityType: MobilityType.AMBULATORY,
      specialInstructions: "Patient needs assistance walking. Please arrive 15 min early.",
      status: TripStatus.ACCEPTED,
      providerId: safeRide.id,
      createdById: maria.id,
      statusHistory: {
        create: [
          { status: TripStatus.PENDING, changedById: maria.id, createdAt: new Date("2026-03-15T10:30:00Z") },
          { status: TripStatus.ASSIGNED, changedById: maria.id, note: "Assigned to SafeRide", createdAt: new Date("2026-03-15T11:00:00Z") },
          { status: TripStatus.ACCEPTED, changedById: safeRideUser.id, createdAt: new Date("2026-03-15T14:00:00Z") },
        ],
      },
    },
  });

  await prisma.trip.create({
    data: {
      tripNumber: "T-1002",
      patientName: "Rosa Gonzalez",
      patientPhone: "(555) 222-3333",
      pickupAddress: "456 NW 27th Ave, Miami, FL 33125",
      destinationAddress: "Baptist Health South Florida, 8900 N Kendall Dr, Miami, FL 33176",
      appointmentDate: new Date("2026-03-17"),
      appointmentTime: "10:30",
      mobilityType: MobilityType.WHEELCHAIR,
      specialInstructions: "Wheelchair-accessible vehicle required. Return trip needed.",
      status: TripStatus.ASSIGNED,
      providerId: careWheels.id,
      createdById: maria.id,
      statusHistory: {
        create: [
          { status: TripStatus.PENDING, changedById: maria.id, createdAt: new Date("2026-03-15T11:00:00Z") },
          { status: TripStatus.ASSIGNED, changedById: maria.id, note: "Assigned to CareWheels", createdAt: new Date("2026-03-15T11:45:00Z") },
        ],
      },
    },
  });

  await prisma.trip.create({
    data: {
      tripNumber: "T-1003",
      patientName: "William Chen",
      patientPhone: "(555) 333-4444",
      pickupAddress: "789 Brickell Ave, Miami, FL 33131",
      destinationAddress: "Mount Sinai Medical Center, 4300 Alton Rd, Miami Beach, FL 33140",
      appointmentDate: new Date("2026-03-17"),
      appointmentTime: "14:00",
      mobilityType: MobilityType.STRETCHER,
      specialInstructions: "Stretcher transport. Patient is non-ambulatory. Two-person assist required.",
      status: TripStatus.PENDING,
      createdById: james.id,
      statusHistory: {
        create: [
          { status: TripStatus.PENDING, changedById: james.id, createdAt: new Date("2026-03-16T08:00:00Z") },
        ],
      },
    },
  });

  await prisma.trip.create({
    data: {
      tripNumber: "T-1004",
      patientName: "Angela Davis",
      patientPhone: "(555) 444-5555",
      pickupAddress: "321 Collins Ave, Miami Beach, FL 33139",
      destinationAddress: "University of Miami Hospital, 1400 NW 12th Ave, Miami, FL 33136",
      appointmentDate: new Date("2026-03-16"),
      appointmentTime: "08:00",
      mobilityType: MobilityType.AMBULATORY,
      specialInstructions: "",
      status: TripStatus.COMPLETED,
      providerId: safeRide.id,
      createdById: maria.id,
      statusHistory: {
        create: [
          { status: TripStatus.PENDING, changedById: maria.id, createdAt: new Date("2026-03-14T16:00:00Z") },
          { status: TripStatus.ASSIGNED, changedById: maria.id, createdAt: new Date("2026-03-14T16:30:00Z") },
          { status: TripStatus.ACCEPTED, changedById: safeRideUser.id, createdAt: new Date("2026-03-14T17:00:00Z") },
          { status: TripStatus.DRIVER_EN_ROUTE, changedById: safeRideUser.id, createdAt: new Date("2026-03-16T07:30:00Z") },
          { status: TripStatus.PASSENGER_PICKED_UP, changedById: safeRideUser.id, createdAt: new Date("2026-03-16T07:55:00Z") },
          { status: TripStatus.COMPLETED, changedById: safeRideUser.id, createdAt: new Date("2026-03-16T08:40:00Z") },
        ],
      },
    },
  });

  await prisma.trip.create({
    data: {
      tripNumber: "T-1005",
      patientName: "Michael Torres",
      patientPhone: "(555) 555-6666",
      pickupAddress: "555 NE 15th St, Fort Lauderdale, FL 33304",
      destinationAddress: "Broward Health Medical Center, 1600 S Andrews Ave, Fort Lauderdale, FL 33316",
      appointmentDate: new Date("2026-03-18"),
      appointmentTime: "11:00",
      mobilityType: MobilityType.AMBULATORY,
      specialInstructions: "Patient is hearing impaired. Please text upon arrival.",
      status: TripStatus.PENDING,
      createdById: james.id,
      statusHistory: {
        create: [
          { status: TripStatus.PENDING, changedById: james.id, createdAt: new Date("2026-03-16T09:00:00Z") },
        ],
      },
    },
  });

  await prisma.trip.create({
    data: {
      tripNumber: "T-1006",
      patientName: "Patricia Brown",
      patientPhone: "(555) 666-7777",
      pickupAddress: "890 Palm Ave, Hialeah, FL 33010",
      destinationAddress: "Palmetto General Hospital, 2001 W 68th St, Hialeah, FL 33016",
      appointmentDate: new Date("2026-03-16"),
      appointmentTime: "13:00",
      mobilityType: MobilityType.WHEELCHAIR,
      specialInstructions: "Patient uses motorized wheelchair. Van transport required.",
      status: TripStatus.DRIVER_EN_ROUTE,
      providerId: careWheels.id,
      createdById: maria.id,
      statusHistory: {
        create: [
          { status: TripStatus.PENDING, changedById: maria.id, createdAt: new Date("2026-03-15T09:00:00Z") },
          { status: TripStatus.ASSIGNED, changedById: maria.id, createdAt: new Date("2026-03-15T09:30:00Z") },
          { status: TripStatus.ACCEPTED, changedById: careWheelsUser.id, createdAt: new Date("2026-03-15T10:00:00Z") },
          { status: TripStatus.DRIVER_EN_ROUTE, changedById: careWheelsUser.id, createdAt: new Date("2026-03-16T12:30:00Z") },
        ],
      },
    },
  });

  console.log("Seed complete!");
  console.log("  - 3 providers created");
  console.log("  - 5 users created");
  console.log("  - 6 trips created with status history");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
