import Link from "next/link";
import { requireAdmin } from "@/lib/session";
import { SignOutButton } from "@/components/SignOutButton";
import { Logo } from "@/components/Logo";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="min-h-screen bg-sand-100">
      <header className="border-b border-sand-400 bg-navy text-sand-100">
        <div className="container-content flex h-16 items-center justify-between">
          <Link href="/admin" className="flex items-center gap-2.5">
            <Logo variant="reversed" iconSize={24} textSize="text-lg" />
            <span className="font-sans text-xs uppercase tracking-[0.2em] text-sand-300">Admin</span>
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            <Link href="/admin" className="hover:text-sand-300">
              Queue
            </Link>
            <Link href="/admin/settings" className="hover:text-sand-300">
              Settings
            </Link>
            <Link href="/admin/metrics" className="hover:text-sand-300">
              Metrics
            </Link>
            <Link href="/dashboard" className="hover:text-sand-300">
              Agent view
            </Link>
            <SignOutButton />
          </nav>
        </div>
      </header>
      <main className="container-content py-10">{children}</main>
    </div>
  );
}
