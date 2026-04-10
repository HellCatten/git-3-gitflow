import React, { createContext, useState } from 'react';

export const AppContext = createContext();

export function AppProvider({ children }) {
  

  const [settingsState, setSettingsState] = useState({
    url: localStorage.getItem('gitlabUrl') || '',
    token: localStorage.getItem('gitlabToken') || '',
    errors: {},
  });

  return (
    <AppContext.Provider value={{ settingsState, setSettingsState }}>
      {children}
    </AppContext.Provider>
  );
}