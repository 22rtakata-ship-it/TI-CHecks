/** A technical journal: paper, binding and a small circuit trace. */
export function BrandMark({
  className = "brand-mark",
}: {
  className?: string;
}) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 52"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M13 4h21l7 7v33a4 4 0 0 1-4 4H13a4 4 0 0 1-4-4V8a4 4 0 0 1 4-4Z"
        fill="#f7f5ef"
        stroke="#40515e"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M17 5v42M34 4v7h7" stroke="#40515e" strokeWidth="2" />
      <path d="M22 4h6v12l-3-2-3 2V4Z" fill="#187d69" />
      <path
        d="M23 23h10M23 29h7"
        stroke="#7c8992"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M23 36h6l4 5h7"
        stroke="#187d69"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="41" cy="41" r="3" fill="#187d69" />
    </svg>
  );
}
