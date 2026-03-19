import { z } from "zod/v4";

export const createUserSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  email: z.email("Valid email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["broker", "provider", "admin"]).optional().default("broker"),
  providerId: z.string().nullable().optional(),
});
