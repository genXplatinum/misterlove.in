export function Mark({ className = '' }) {
  return (
    <span className={`folio-mark ${className}`} aria-hidden="true">
      <i />
      <i />
      <i />
    </span>
  );
}

export function Wordmark({ className = '' }) {
  return (
    <span className={`wordmark ${className}`}>
      <Mark />
      <span className="wordmark__text">Lovepreet Singh</span>
    </span>
  );
}
