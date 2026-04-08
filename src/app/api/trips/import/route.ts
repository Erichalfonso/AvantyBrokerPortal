import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { encrypt } from "@/lib/encryption";
import * as XLSX from "xlsx";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role === "provider") {
    return NextResponse.json({ error: "Providers cannot import trips" }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  // Read the file
  const buffer = Buffer.from(await file.arrayBuffer());
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet);

  if (rows.length === 0) {
    return NextResponse.json({ error: "File is empty" }, { status: 400 });
  }

  // Get next trip number
  const lastTrip = await prisma.trip.findFirst({
    orderBy: { tripNumber: "desc" },
    select: { tripNumber: true },
  });
  let nextNum = lastTrip ? parseInt(lastTrip.tripNumber.replace("T-", "")) + 1 : 1001;

  const results = { created: 0, errors: [] as string[] };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2; // Excel row (1-indexed + header)

    // Map column names (flexible - accepts various formats)
    const patientName = row["Patient Name"] || row["patient_name"] || row["patientName"] || row["Name"];
    const patientPhone = row["Patient Phone"] || row["patient_phone"] || row["patientPhone"] || row["Phone"] || "";
    const pickupAddress = row["Pickup Address"] || row["pickup_address"] || row["pickupAddress"] || row["Pickup"];
    const destinationAddress = row["Destination Address"] || row["destination_address"] || row["destinationAddress"] || row["Destination"] || row["Dropoff"];
    const appointmentDate = row["Appointment Date"] || row["appointment_date"] || row["appointmentDate"] || row["Date"];
    const appointmentTime = row["Appointment Time"] || row["appointment_time"] || row["appointmentTime"] || row["Time"] || "09:00";
    const mobilityType = (row["Mobility Type"] || row["mobility_type"] || row["mobilityType"] || row["Type"] || "ambulatory").toLowerCase();
    const specialInstructions = row["Special Instructions"] || row["special_instructions"] || row["specialInstructions"] || row["Instructions"] || row["Notes"] || "";

    // Validate required fields
    if (!patientName) { results.errors.push(`Row ${rowNum}: Missing patient name`); continue; }
    if (!pickupAddress) { results.errors.push(`Row ${rowNum}: Missing pickup address`); continue; }
    if (!destinationAddress) { results.errors.push(`Row ${rowNum}: Missing destination address`); continue; }
    if (!appointmentDate) { results.errors.push(`Row ${rowNum}: Missing appointment date`); continue; }

    // Validate mobility type
    const validMobility = ["ambulatory", "wheelchair", "stretcher"];
    const normalizedMobility = validMobility.includes(mobilityType) ? mobilityType : "ambulatory";

    // Parse date
    let parsedDate: Date;
    try {
      // Handle various date formats
      if (typeof appointmentDate === "number") {
        // Excel serial date
        parsedDate = new Date((appointmentDate - 25569) * 86400 * 1000);
      } else {
        parsedDate = new Date(appointmentDate);
      }
      if (isNaN(parsedDate.getTime())) throw new Error("Invalid date");
    } catch {
      results.errors.push(`Row ${rowNum}: Invalid date "${appointmentDate}"`);
      continue;
    }

    const tripNumber = `T-${nextNum}`;
    nextNum++;

    try {
      await prisma.trip.create({
        data: {
          tripNumber,
          patientName: encrypt(patientName),
          patientPhone: encrypt(patientPhone),
          pickupAddress,
          destinationAddress,
          appointmentDate: parsedDate,
          appointmentTime: appointmentTime,
          mobilityType: normalizedMobility as never,
          specialInstructions,
          status: "pending" as never,
          createdById: session.user.id,
          statusHistory: {
            create: {
              status: "pending" as never,
              changedById: session.user.id,
              note: "Imported from spreadsheet",
            },
          },
        },
      });
      results.created++;
    } catch (error) {
      results.errors.push(`Row ${rowNum}: Failed to create - ${(error as Error).message}`);
    }
  }

  await logAudit(
    "TRIPS_IMPORTED",
    "Trip",
    "bulk",
    session.user.id,
    `Imported ${results.created} trips from ${file.name}${results.errors.length > 0 ? `, ${results.errors.length} errors` : ""}`
  );

  return NextResponse.json({
    total: rows.length,
    created: results.created,
    errors: results.errors,
  });
}
