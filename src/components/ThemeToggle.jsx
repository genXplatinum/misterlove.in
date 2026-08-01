import { useTheme } from './ThemeProvider';
import './ThemeToggle.css';

export default function ThemeToggle({
  className = '',
  compact = false,
  label = 'Dark mode',
  ariaLabel = 'Dark theme',
  darkAction = 'Switch to dark mode',
  lightAction = 'Switch to light mode',
}) {
  const { isDark, toggleTheme } = useTheme();
  const action = isDark ? lightAction : darkAction;

  return (
    <button
      type="button"
      className={`theme-toggle ${compact ? 'theme-toggle--compact' : ''} ${className}`.trim()}
      onClick={toggleTheme}
      aria-label={ariaLabel}
      aria-pressed={isDark}
      data-active={isDark ? 'true' : 'false'}
      title={action}
    >
      <span className="theme-toggle__track" aria-hidden="true">
        <span className="theme-toggle__thumb" />
      </span>
      {!compact && (
        <span className="theme-toggle__label">{label}</span>
      )}
    </button>
  );
}
