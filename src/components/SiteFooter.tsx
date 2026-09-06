export function SiteFooter() {
  return (
    <footer className="border-t border-sand-400 bg-navy py-12 text-sand-200">
      <div className="container-content flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
        <div>
          <p className="font-serif text-lg">Site Brief</p>
          <p className="mt-1 text-sm text-sand-300">site-brief.com</p>
        </div>
        <p className="max-w-md text-xs leading-relaxed text-sand-300">
          Development analyses are prepared for marketing purposes and are not appraisals, surveys,
          engineering opinions, or guarantees of any permitting outcome.
        </p>
      </div>
    </footer>
  );
}
