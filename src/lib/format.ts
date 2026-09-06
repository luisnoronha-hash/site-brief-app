export function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(d);
}

export const PROPERTY_TYPE_LABELS: Record<string, string> = {
  vacant_land: "Vacant land",
  teardown_single_family: "Teardown — single family",
  small_multifamily: "Small multifamily",
  other: "Other",
};

export const RELATIONSHIP_LABELS: Record<string, string> = {
  has_listing: "Has the listing",
  competing_for_listing: "Competing for the listing",
  representing_buyer: "Representing a buyer",
};

export const DEADLINE_LABELS: Record<string, string> = {
  standard_48h: "Standard (48 hours)",
  rush_24h: "Rush (24 hours)",
};

export const STATUS_LABELS: Record<string, string> = {
  submitted: "Submitted",
  in_progress: "In progress",
  delivered: "Delivered",
  on_hold: "On hold",
  cancelled: "Cancelled",
};

export const STATUS_COLORS: Record<string, string> = {
  submitted: "bg-navy-100 text-navy-700",
  in_progress: "bg-amber-100 text-amber-800",
  delivered: "bg-emerald-100 text-emerald-800",
  on_hold: "bg-graystone-light/20 text-graystone-dark",
  cancelled: "bg-red-100 text-red-700",
};
