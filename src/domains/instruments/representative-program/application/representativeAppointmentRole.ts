import { z } from "zod";

export const representativeAppointmentRoleSchema = z.object({
  version: z.literal(1),
  purpose: z.string().min(1).max(2000),
  activities: z.array(z.string().min(1).max(1000)).min(1).max(8),
  conditions: z.string().min(1).max(2000),
}).strict();

export const INITIAL_REPRESENTATIVE_APPOINTMENT_ROLE = {
  version: 1 as const,
  purpose: "Develop commercial relationships and support responsible engagement across French-Ward’s approved commercial activities.",
  activities: [
    "Introduce prospective commercial relationships to French-Ward.",
    "Communicate approved institutional and commercial information accurately.",
    "Present expressly released French-Ward materials without altering their content.",
    "Coordinate meetings and requested information for French-Ward review.",
  ],
  conditions: "Commercial terms, commitments, negotiation, document execution, and binding French-Ward require express authorization. Use official materials within their recorded presentation and sharing permissions.",
};
