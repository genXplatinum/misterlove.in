import './Logo.css';

export function Wordmark({ className = '' }) {
  const base = import.meta.env.BASE_URL;
  return (
    <span className={`official-wordmark ${className}`} role="img" aria-label="misterlove.">
      <img className="official-wordmark__ink" src={`${base}brand/wordmark-ink.svg`} width="141" height="24" alt="" />
      <img className="official-wordmark__white" src={`${base}brand/wordmark-white.svg`} width="141" height="24" alt="" />
    </span>
  );
}
