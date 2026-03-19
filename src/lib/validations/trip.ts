import { z } from "zod/v4";

export const createTripSchema = z.object({
  patientName: z.string().min(1, "Patient name is required").max(200),
  patientPhone: z.string().min(1, "Phone number is required").max(20),
  pickupAddress: z.string().min(5, "Pickup address is required").max(500),
  destinationAddress: z.string().min(5, "Destination address is required").max(500),
  appointmentDate: z.string().min(1, "Appointment date is required"),
  appointmentTime: z.string().min(1, "Appointment time is required"),
  mobilityType: z.enum(["ambulatory", "wheelchair", "stretcher"]),
  specialInstructions: z.string().max(1000).optional().default(""),
});

export const updateTripSchema = z.object({
  patientName: z.string().min(1).max(200).optional(),
  patientPhone: z.string().min(1).max(20).optional(),
  pickupAddress: z.string().min(5).max(500).optional(),
  destinationAddress: z.string().min(5).max(500).optional(),
  appointmentDate: z.string().optional(),
  appointmentTime: z.string().optional(),
  mobilityType: z.enum(["ambulatory", "wheelchair", "stretcher"]).optional(),
  specialInstructions: z.string().max(1000).optional(),
});

export const updateStatusSchema = z.object({
  status: z.enum([
    "pending", "assigned", "accepted", "rejected",
    "driver_en_route", "passenger_picked_up",
    "completed", "cancelled", "no_show",
  ]),
  note: z.string().max(500).optional(),
});

export const assignProviderSchema = z.object({
  providerId: z.string().min(1, "Provider ID is required"),
});
