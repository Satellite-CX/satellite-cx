import { z } from "zod";

export const USER_ROLES = ["admin", "supervisor", "agent"] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const userRole = z.enum(USER_ROLES).describe("User role");
