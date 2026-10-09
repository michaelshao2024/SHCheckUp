// Prominent JCI accreditation badge — gold shield, consistent with the site's
// navy/amber brand palette. Shown for hospitals with verified JCI accreditation.
export function JciBadge({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const cls =
    size === 'sm'
      ? 'px-2.5 py-1.5 text-[11px] gap-2'
      : 'px-3 py-1.5 text-sm gap-2';
  return (
    <span
      className={`inline-flex items-center rounded-full bg-amber-100 border border-amber-300 text-amber-800 font-semibold shadow-sm ${cls}`}
      title="Accredited by Joint Commission International (JCI) — the global gold standard for hospital quality and patient safety"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={size === 'sm' ? 'h-7 w-7' : 'h-5 w-5'}
        aria-hidden="true"
      >
        <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
      JCI 2026 Accredited
    </span>
  );
}
