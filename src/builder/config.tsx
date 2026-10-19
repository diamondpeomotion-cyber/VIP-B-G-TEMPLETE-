import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from './api';
import type { PlatformConfig } from './types';

const fallback: PlatformConfig = {
  baseUrl: '',
  platformName: 'Nexora White-Label Studio',
  allowRegistrations: true,
  maintenanceMessage: '',
  googleAuthEnabled: false,
  googleClientId: '',
};

const ConfigContext = createContext<PlatformConfig>(fallback);

export function PlatformConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<PlatformConfig>(fallback);

  useEffect(() => {
    api
      .get<PlatformConfig>('/api/config')
      .then(setConfig)
      .catch(() => {});
  }, []);

  return <ConfigContext.Provider value={config}>{children}</ConfigContext.Provider>;
}

export function usePlatformConfig() {
  return useContext(ConfigContext);
}
