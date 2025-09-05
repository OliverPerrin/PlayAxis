import React, { createContext, useState, useEffect, useCallback } from 'react';

export const ThemeContext = createContext({
  theme: 'dark',
  setTheme: () => {},
  toggleTheme: () => {}
});

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(
    () => localStorage.getItem('theme') || 'dark'
  );

  const applyTheme = useCallback((next) => {
    // Remove both classes then add the one we want
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(next);
    // Optional: set a data attribute if you want CSS selectors (e.g., [data-theme="dark"])
    document.documentElement.setAttribute('data-theme', next);
  }, []);

  useEffect(() => {
    localStorage.setItem('theme', theme);
    applyTheme(theme);
  }, [theme, applyTheme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {/* Provide a wrapper class if some components rely on a parent .dark/.light */}
      <div className={theme === 'dark' ? 'dark' : 'light'}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
};