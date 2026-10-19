'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { Shop, ThemeConfig } from '@prisma/client';

const TenantContext = createContext<{ shop: Shop; theme: ThemeConfig | null } | null>(null);

export function TenantProvider({
  children,
  shop,
  theme,
}: {
  children: React.ReactNode;
  shop: Shop;
  theme: ThemeConfig | null;
}) {
  useEffect(() => {
    const root = document.documentElement;
    
    // Apply category defaults if no custom theme
    const defaults = getCategoryDefaults(shop.category);
    
    root.style.setProperty('--primary', theme?.primaryColor || defaults.primary);
    root.style.setProperty('--secondary', theme?.secondaryColor || defaults.secondary);
    root.style.setProperty('--surface', theme?.surfaceColor || defaults.surface);
    root.style.setProperty('--text', theme?.textColor || defaults.text);
    root.style.setProperty('--accent', defaults.accent);
    root.style.setProperty('--font-family', theme?.fontFamily || 'Inter');
  }, [shop, theme]);

  return <TenantContext.Provider value={{ shop, theme }}>{children}</TenantContext.Provider>;
}

function getCategoryDefaults(category: string) {
  switch (category) {
    case 'BARBER':
      return { primary: '#D4AF37', secondary: '#FFFFFF', surface: '#FAFAFA', text: '#1A1A1A', accent: '#B4941F' };
    case 'BEAUTY':
      return { primary: '#D946EF', secondary: '#F0ABFC', surface: '#FAE8FF', text: '#4A044E', accent: '#C026D3' };
    case 'TATTOO':
      return { primary: '#D4AF37', secondary: '#262626', surface: '#0A0A0A', text: '#E5E5E5', accent: '#A16207' };
    default:
      return { primary: '#000', secondary: '#fff', surface: '#fff', text: '#000', accent: '#666' };
  }
}

export const useTenant = () => {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error('useTenant must be used within TenantProvider');
  return ctx;
};
