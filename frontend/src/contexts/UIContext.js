import React, { createContext, useState, useCallback } from 'react';

export const UIContext = createContext({
  sidebarOpen: false,
  setSidebarOpen: () => {},
  sidebarCollapsed: false,
  toggleSidebarCollapsed: () => {}
});

export const UIProvider = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);          // mobile drawer
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false); // desktop collapse

  const toggleSidebarCollapsed = useCallback(() => {
    setSidebarCollapsed(c => !c);
  }, []);

  return (
    <UIContext.Provider value={{
      sidebarOpen,
      setSidebarOpen,
      sidebarCollapsed,
      toggleSidebarCollapsed
    }}>
      {children}
    </UIContext.Provider>
  );
};