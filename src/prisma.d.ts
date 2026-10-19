declare module '@prisma/client' {
  export interface Shop {
    id: string;
    name: string;
    category: string;
  }

  export interface ThemeConfig {
    id: string;
    primaryColor?: string;
    secondaryColor?: string;
    surfaceColor?: string;
    textColor?: string;
    fontFamily?: string;
  }
}
