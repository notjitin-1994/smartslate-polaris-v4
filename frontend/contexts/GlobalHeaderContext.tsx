'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface GlobalHeaderConfig {
  title?: string | ReactNode;
  subtitle?: string;
  showBackButton?: boolean;
  backHref?: string;
  backLabel?: string;
  rightActions?: ReactNode;
  showUserMenu?: boolean;
  showDarkMode?: boolean;
  showNotifications?: boolean;
  showSearch?: boolean;
}

interface GlobalHeaderContextType {
  config: GlobalHeaderConfig;
  setHeaderConfig: (config: Partial<GlobalHeaderConfig>) => void;
  resetHeaderConfig: () => void;
}

const GlobalHeaderContext = createContext<GlobalHeaderContextType | undefined>(undefined);

const defaultConfig: GlobalHeaderConfig = {
  showUserMenu: true,
  showDarkMode: true,
  showNotifications: true,
  showSearch: false,
  showBackButton: false,
  backHref: '/',
  backLabel: 'Back to Dashboard',
};

export function GlobalHeaderProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<GlobalHeaderConfig>(defaultConfig);

  const setHeaderConfig = useCallback((newConfig: Partial<GlobalHeaderConfig>) => {
    setConfig((prevConfig) => ({
      ...prevConfig,
      ...newConfig,
    }));
  }, []);

  const resetHeaderConfig = useCallback(() => {
    setConfig(defaultConfig);
  }, []);

  return (
    <GlobalHeaderContext.Provider value={{ config, setHeaderConfig, resetHeaderConfig }}>
      {children}
    </GlobalHeaderContext.Provider>
  );
}

export function useGlobalHeader() {
  const context = useContext(GlobalHeaderContext);
  if (!context) {
    throw new Error('useGlobalHeader must be used within a GlobalHeaderProvider');
  }
  return context;
}
