import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-sand-400 bg-sand-100">
      <div className="container-content flex h-20 items-center justify-between">
        <Link href="/" className="font-serif text-xl font-semibold tracking-wide text-navy">
          LANA <span className="font-sans text-xs font-medium uppercase tracking-[0.2em] text-graystone">Development</span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-navy-700 md:flex">
          <Link href="/#how-it-works" className="hover:text-navy">
            How it works
          </Link>
          <Link href="/#pricing" className="hover:text-navy">
            Pricing
          </Link>
          <Link href="/#sample" className="hover:text-navy">
            Sample report
          </Link>
        </nav>
        <div className="flex items-center gap-4">
          <Link href="/signin" className="text-sm text-navy-700 hover:text-navy">
            Sign in
          </Link>
          <Link href="/signup" className="btn-primary text-xs">
            Order an analysis
          </Link>
        </div>
      </div>
    </header>
  );
}
