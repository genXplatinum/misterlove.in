/**
 * Brand mark — a targeting reticle wrapping the "L" monogram.
 * Uses currentColor so it adapts to whatever theme it sits in.
 */
export function Mark({ size = 24, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <circle cx="32" cy="32" r="19" stroke="currentColor" strokeWidth="2.2" opacity="0.5" />
      <path d="M32 6v8M32 50v8M6 32h8M50 32h8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" opacity="0.5" />
      <path d="M25 43V21" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M25 43h13" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <circle cx="32" cy="32" r="2.6" fill="var(--accent)" />
    </svg>
  );
}

export function Wordmark({ className = '' }) {
  return (
    <span className={`wordmark ${className}`}>
      <Mark size={22} />
      <span className="wordmark__text">
        Lovepreet<span className="wordmark__last">Singh</span>
      </span>
    </span>
  );
}
