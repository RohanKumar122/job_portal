import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'jobpulse-theme';

// public/index.html runs a blocking inline script that already applies the
// `dark` class (from localStorage, else system preference) before React
// mounts, to avoid a flash of the wrong theme. Reading the class here instead
// of re-deriving from localStorage/matchMedia keeps this in sync with that.
function getInitialTheme() {
  if (typeof document === 'undefined') return 'dark';
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

export function useTheme() {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // localStorage unavailable (private mode, storage quota, etc.) - theme just won't persist
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  return { theme, toggleTheme };
}
