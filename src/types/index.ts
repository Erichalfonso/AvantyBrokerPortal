export type UserRole = "broker" | "provider" | "admin";

export type TripStatus =
  | "pending"
  | "assigned"
  | "accepted"
  | "rejected"
  | "driver_en_route"
  | "passenger_picked_up"
  | "completed"
  | "cancelled"
  | "no_show";

export type MobilityType = "ambulatory" | "wheelchair" | "stretcher";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  providerId?: string;
}

export interface Provider {
  id: string;
  code: string;
  name: string;
  contactName: string;
  phone: string;
  email: string;
  serviceAreas: string[];
  vehicleTypes: MobilityType[];
  active: boolean;
}

export interface Trip {
  id: string;
  patientName: string;
  patientPhone: string;
  pickupAddress: string;
  destinationAddress: string;
  appointmentDate: string;
  appointmentTime: string;
  mobilityType: MobilityType;
  specialInstructions: string;
  status: TripStatus;
  providerId?: string;
  providerName?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  statusHistory: StatusChange[];
}

export interface StatusChange {
  status: TripStatus;
  timestamp: string;
  changedBy: string;
  note?: string;
}

export const TRIP_STATUS_LABELS: Record<TripStatus, string> = {
  pending: "Pending",
  assigned: "Assigned",
  accepted: "Accepted",
  rejected: "Rejected",
  driver_en_route: "Driver En Route",
  passenger_picked_up: "Picked Up",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No Show",
};

export const TRIP_STATUS_COLORS: Record<TripStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  assigned: "bg-blue-100 text-blue-800",
  accepted: "bg-teal/10 text-teal-dark",
  rejected: "bg-red-100 text-red-800",
  driver_en_route: "bg-indigo-100 text-indigo-800",
  passenger_picked_up: "bg-purple-100 text-purple-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-gray-100 text-gray-800",
  no_show: "bg-orange-100 text-orange-800",
};

export const MOBILITY_LABELS: Record<MobilityType, string> = {
  ambulatory: "Ambulatory",
  wheelchair: "Wheelchair",
  stretcher: "Stretcher",
};

// Reimbursement Forms
export type ReimbursementFormType = "medicaid_trip" | "provider_invoice" | "cms_1500";
export type ReimbursementFormStatus = "draft" | "submitted" | "under_review" | "approved" | "denied" | "paid" | "void";

export const REIMBURSEMENT_FORM_TYPE_LABELS: Record<ReimbursementFormType, string> = {
  medicaid_trip: "Medicaid Trip Reimbursement",
  provider_invoice: "Provider Invoice",
  cms_1500: "CMS-1500 Claim",
};

export const REIMBURSEMENT_STATUS_LABELS: Record<ReimbursementFormStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  under_review: "Under Review",
  approved: "Approved",
  denied: "Denied",
  paid: "Paid",
  void: "Void",
};

export const REIMBURSEMENT_STATUS_COLORS: Record<ReimbursementFormStatus, string> = {
  draft: "bg-gray-100 text-gray-800",
  submitted: "bg-blue-100 text-blue-800",
  under_review: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  denied: "bg-red-100 text-red-800",
  paid: "bg-teal-100 text-teal-800",
  void: "bg-gray-100 text-gray-500",
};
