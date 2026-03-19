import { z } from "zod/v4";

export const createProviderSchema = z.object({
  name: z.string().min(1, "Company name is required").max(200),
  contactName: z.string().min(1, "Contact name is required").max(200),
  phone: z.string().min(1, "Phone is required").max(20),
  email: z.email("Valid email is required"),
  serviceAreas: z.array(z.string()).min(1, "At least one service area is required"),
  vehicleTypes: z.array(z.string()).min(1, "At least one vehicle type is required"),
  active: z.boolean().optional().default(true),
});

export const updateProviderSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  contactName: z.string().min(1).max(200).optional(),
  phone: z.string().min(1).max(20).optional(),
  email: z.email().optional(),
  serviceAreas: z.array(z.string()).optional(),
  vehicleTypes: z.array(z.string()).optional(),
  active: z.boolean().optional(),
});
