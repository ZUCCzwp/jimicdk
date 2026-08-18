/** Same mark as jimiaiweb `BrandLogo` variant `blue`. */
export function BrandLogo({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      shapeRendering="geometricPrecision"
      viewBox="0 0 48 48"
    >
      <rect x="4" y="4" width="40" height="40" rx="12" fill="#2563EB" />
      <path
        d="M13.5 14.5L24 33.5L34.5 14.5"
        fill="none"
        stroke="#FFFFFF"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="5"
      />
    </svg>
  );
}
