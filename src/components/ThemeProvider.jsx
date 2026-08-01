import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'misterlove:theme';
const ThemeContext = createContext(null);

export function readStoredTheme() {
  if (typeof document === 'undefined') return 'light';

  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'dark' ? 'dark' : 'light';
  } catch {
    return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
  }
}

export function applyTheme(theme) {
  if (typeof document === 'undefined') return;

  const isDark = theme === 'dark';
  const root = document.documentElement;
  root.dataset.theme = isDark ? 'dark' : 'light';
  root.style.colorScheme = isDark ? 'dark' : 'light';

  const themeColor = document.head.querySelector('meta[name="theme-color"]');
  themeColor?.setAttribute('content', isDark ? '#171512' : '#F3EFE6');
}

export function ThemeProvider({ children, initialTheme = 'light' }) {
  const [theme, setTheme] = useState(initialTheme);

  useEffect(() => {
    applyTheme(theme);
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // The visual preference still works when storage is unavailable.
    }
  }, [theme]);

  const value = useMemo(() => ({
    theme,
    isDark: theme === 'dark',
    setTheme,
    toggleTheme: () => setTheme((current) => (current === 'dark' ? 'light' : 'dark')),
  }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme must be used inside ThemeProvider');
  return value;
}
