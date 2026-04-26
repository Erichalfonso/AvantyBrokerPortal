/**
 * Helpers for converting lowercase string values from request bodies into the
 * uppercase Prisma enum values that the new prisma-client generator requires.
 *
 * The Prisma schema uses @map to store enums as lowercase strings in Postgres,
 * but the Prisma client itself expects the enum NAME (uppercase) at the API
 * boundary. Passing the lowercase string directly produces a 500 with the
 * confusing message "Argument `role`: Invalid value provided".
 */

export const TRIP_STATUS_VALUES = [
  "pending",
  "assigned",
  "accepted",
  "rejected",
  "driver_en_route",
  "passenger_picked_up",
  "completed",
  "cancelled",
  "no_show",
] as const;
export type TripStatusString = (typeof TRIP_STATUS_VALUES)[number];

export function toTripStatusEnum(value: string): TripStatusString | null {
  const lower = value.toLowerCase();
  return (TRIP_STATUS_VALUES as readonly string[]).includes(lower)
    ? (lower as TripStatusString)
    : null;
}

export function tripStatusForPrisma(value: string): string | null {
  const lower = toTripStatusEnum(value);
  return lower ? lower.toUpperCase() : null;
}

export const MOBILITY_TYPE_VALUES = ["ambulatory", "wheelchair", "stretcher"] as const;
export type MobilityTypeString = (typeof MOBILITY_TYPE_VALUES)[number];

export function mobilityTypeForPrisma(value: string): string | null {
  const lower = value.toLowerCase();
  return (MOBILITY_TYPE_VALUES as readonly string[]).includes(lower)
    ? lower.toUpperCase()
    : null;
}

export const CREDENTIAL_STATUS_VALUES = [
  "valid",
  "expiring",
  "expired",
  "pending",
  "rejected",
] as const;

export function credentialStatusForPrisma(value: string): string | null {
  const lower = value.toLowerCase();
  return (CREDENTIAL_STATUS_VALUES as readonly string[]).includes(lower)
    ? lower.toUpperCase()
    : null;
}

export const USER_ROLE_VALUES = ["broker", "provider", "admin"] as const;

export function userRoleForPrisma(value: string): string | null {
  const lower = value.toLowerCase();
  return (USER_ROLE_VALUES as readonly string[]).includes(lower)
    ? lower.toUpperCase()
    : null;
}
