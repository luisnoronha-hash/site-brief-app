import Link from "next/link";
import { requireAgent } from "@/lib/session";
import { SignOutButton } from "@/components/SignOutButton";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAgent();

  return (
    <div className="min-h-screen bg-sand-100">
      <header className="border-b border-sand-400 bg-white">
        <div className="container-content flex h-16 items-center justify-between">
          <Link href="/dashboard" className="font-serif text-lg text-navy">
            LANA <span className="font-sans text-xs uppercase tracking-[0.2em] text-graystone">Portal</span>
          </Link>
          <nav className="flex items-center gap-6 text-sm text-navy-700">
            <Link href="/dashboard" className="hover:text-navy">
              Orders
            </Link>
            <Link href="/dashboard/new" className="hover:text-navy">
              New order
            </Link>
            <Link href="/dashboard/billing" className="hover:text-navy">
              Billing
            </Link>
            <Link href="/dashboard/profile" className="hover:text-navy">
              Profile
            </Link>
            {user.role === "admin" && (
              <Link href="/admin" className="text-navy underline">
                Admin
              </Link>
            )}
            <SignOutButton />
          </nav>
        </div>
      </header>
      <main className="container-content py-10">{children}</main>
    </div>
  );
}
