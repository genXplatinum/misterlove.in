import { useExperience } from './ExperienceProvider';
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
  const { immersive } = useExperience();
  return (
    <span className={`wordmark ${className}`}>
      <Mark />
      <span className="wordmark__text">{immersive ? 'misterlove.' : 'Lovepreet Singh'}</span>
    </span>
  );
}
