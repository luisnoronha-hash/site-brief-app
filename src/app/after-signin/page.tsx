import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";

/**
 * Landing route after any sign-in. Admins go straight to the fulfillment
 * queue; agents to their dashboard. Kept as a server page so it works for
 * both the credentials flow (client-side push) and the Google OAuth callback.
 */
export default async function AfterSignInPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");
  redirect(user.role === "admin" ? "/admin" : "/dashboard");
}
