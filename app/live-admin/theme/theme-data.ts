// app/live-admin/theme/theme-data.ts

export interface ThemePreset {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    accent: string;
  };
  typography: {
    fontFamily: string;
    weight: number;
    letterSpacing: string;
  };
  motion: {
    ease: string;
    duration: number;
  };
  radii: {
    base: string;
    card: string;
    button: string;
  };
}

export const defaultTheme: ThemePreset = {
  id: 'default',
  name: 'Default Ritual Theme',
  colors: {
    primary: '#00ffc2',
    secondary: '#4ad6ff',
    background: '#0b0f14',
    accent: '#ff94e0',
  },
  typography: {
    fontFamily: 'Inter',
    weight: 500,
    letterSpacing: '0.02em',
  },
  motion: {
    ease: 'cubic-bezier(0.25, 0.1, 0.25, 1.0)',
    duration: 0.45,
  },
  radii: {
    base: '0.4rem',
    card: '0.75rem',
    button: '0.5rem',
  },
};

export const exampleThemes: ThemePreset[] = [
  defaultTheme,
  {
    id: 'nebula',
    name: 'Nebula Emerald',
    colors: {
      primary: '#00ffbf',
      secondary: '#0088ff',
      background: '#05070a',
      accent: '#00ffff',
    },
    typography: {
      fontFamily: 'Inter',
      weight: 600,
      letterSpacing: '0.04em',
    },
    motion: {
      ease: 'easeInOut',
      duration: 0.55,
    },
    radii: {
      base: '0.5rem',
      card: '1rem',
      button: '0.6rem',
    },
  },
];