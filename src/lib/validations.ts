import { z } from "zod";

export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const brokerProfileSchema = z.object({
  fullName: z.string().min(2),
  licenseNumber: z.string().min(3),
  brokerage: z.string().min(2),
  officeAddress: z.string().min(5),
  phone: z.string().min(7),
  email: z.string().email(),
  website: z.string().url().optional().or(z.literal("")),
  reportLanguage: z.enum(["en", "pt"]).default("en"),
  headshotKey: z.string().optional().nullable(),
  logoKey: z.string().optional().nullable(),
});

export const REQUIRED_PROFILE_FIELDS = [
  "fullName",
  "licenseNumber",
  "brokerage",
  "officeAddress",
  "phone",
  "email",
] as const;

export const orderSchema = z.object({
  address: z.string().min(5),
  placeId: z.string().optional().nullable(),
  propertyType: z.enum(["vacant_land", "teardown_single_family", "small_multifamily", "other"]),
  askingPrice: z.number().int().positive(),
  relationship: z.enum(["has_listing", "competing_for_listing", "representing_buyer"]),
  deadlineTier: z.enum(["standard_48h", "rush_24h"]),
  mlsNumber: z.string().optional().nullable(),
  folio: z.string().optional().nullable(),
  notes: z.string().max(4000).optional().nullable(),
  fileKeys: z.array(z.object({ key: z.string(), filename: z.string() })).optional().default([]),
});

export function isProfileComplete(
  profile: Partial<Record<(typeof REQUIRED_PROFILE_FIELDS)[number], string | null>> | null
): boolean {
  if (!profile) return false;
  return REQUIRED_PROFILE_FIELDS.every((field) => Boolean(profile[field]?.trim()));
}
