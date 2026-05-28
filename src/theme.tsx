import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from "@react-navigation/native";
import * as SystemUI from "expo-system-ui";
import {
  createContext,
  PropsWithChildren,
  use,
  useEffect,
  useState,
} from "react";
import {
  getEditorFontSize,
  getTheme,
  saveEditorFontSize,
  saveTheme,
  type AppTheme,
} from "./storage/preference";

const lightColors = {
  background: "#ffffff",
  foreground: "#0a0a0a",
  card: "#ffffff",
  cardForeground: "#0a0a0a",
  popover: "#ffffff",
  popoverForeground: "#0a0a0a",
  primary: "#fdc700",
  primaryForeground: "#733e0a",
  secondary: "#f4f4f5",
  secondaryForeground: "#18181b",
  muted: "#f5f5f5",
  mutedForeground: "#737373",
  accent: "#f5f5f5",
  accentForeground: "#171717",
  destructive: "#e7000b",
  destructiveForeground: "#ffffff",
  border: "#e5e5e5",
  input: "#e5e5e5",
  ring: "#a1a1a1",
  chart1: "#ffdf20",
  chart2: "#f0b100",
  chart3: "#d08700",
  chart4: "#a65f00",
  chart5: "#894b00",
  sidebar: "#fafafa",
  sidebarForeground: "#0a0a0a",
  sidebarPrimary: "#d08700",
  sidebarPrimaryForeground: "#fefce8",
  sidebarAccent: "#f5f5f5",
  sidebarAccentForeground: "#171717",
  sidebarBorder: "#e5e5e5",
  sidebarRing: "#a1a1a1",
  code: "#171717",
  codeForeground: "#fafafa",
  codeAccent: "#d08700",
  syntaxComment: "#737373",
  syntaxKeyword: "#f59e0b",
  syntaxString: "#16a34a",
  syntaxNumber: "#2563eb",
  syntaxFunction: "#7c3aed",
  tagBackground: "#fef3c7",
  tagForeground: "#713f12",
};

const darkColors = {
  background: "#0a0a0a",
  foreground: "#fafafa",
  card: "#171717",
  cardForeground: "#fafafa",
  popover: "#171717",
  popoverForeground: "#fafafa",
  primary: "#f0b100",
  primaryForeground: "#733e0a",
  secondary: "#27272a",
  secondaryForeground: "#fafafa",
  muted: "#262626",
  mutedForeground: "#a1a1a1",
  accent: "#262626",
  accentForeground: "#fafafa",
  destructive: "#ff6467",
  destructiveForeground: "#ffffff",
  border: "rgba(255, 255, 255, 0.1)",
  input: "rgba(255, 255, 255, 0.15)",
  ring: "#737373",
  chart1: "#ffdf20",
  chart2: "#f0b100",
  chart3: "#d08700",
  chart4: "#a65f00",
  chart5: "#894b00",
  sidebar: "#171717",
  sidebarForeground: "#fafafa",
  sidebarPrimary: "#f0b100",
  sidebarPrimaryForeground: "#fefce8",
  sidebarAccent: "#262626",
  sidebarAccentForeground: "#fafafa",
  sidebarBorder: "rgba(255, 255, 255, 0.1)",
  sidebarRing: "#737373",
  code: "#000000",
  codeForeground: "#fafafa",
  codeAccent: "#fbbf24",
  syntaxComment: "#a1a1a1",
  syntaxKeyword: "#fbbf24",
  syntaxString: "#86efac",
  syntaxNumber: "#93c5fd",
  syntaxFunction: "#c4b5fd",
  tagBackground: "rgba(240, 177, 0, 0.16)",
  tagForeground: "#fde68a",
};

export const appThemes = {
  light: lightColors,
  dark: darkColors,
};

type ThemeColors = typeof lightColors;

type AppThemeContextValue = {
  colors: ThemeColors;
  colorScheme: AppTheme;
  fonts: {
    mono: string;
  };
  editorFontSize: number;
  isReady: boolean;
  setColorScheme: (theme: AppTheme) => Promise<void>;
  setEditorFontSize: (size: number) => Promise<void>;
};

const AppThemeContext = createContext<AppThemeContextValue | null>(null);

export function AppThemeProvider({ children }: PropsWithChildren) {
  const [colorScheme, setColorSchemeState] = useState<AppTheme>("light");
  const [editorFontSize, setEditorFontSizeState] = useState(14);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadTheme() {
      const [storedTheme, storedEditorFontSize] = await Promise.all([
        getTheme(),
        getEditorFontSize(),
      ]);

      if (isMounted) {
        setColorSchemeState(storedTheme);
        setEditorFontSizeState(storedEditorFontSize);
        setIsReady(true);
      }
    }

    loadTheme();

    return () => {
      isMounted = false;
    };
  }, []);

  const colors = appThemes[colorScheme];

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(colors.background);
  }, [colors.background]);

  const baseNavigationTheme = colorScheme === "dark" ? DarkTheme : DefaultTheme;
  const navigationTheme = {
    ...baseNavigationTheme,
    colors: {
      ...baseNavigationTheme.colors,
      background: colors.background,
      card: colors.card,
      primary: colors.primary,
      text: colors.foreground,
      border: colors.border,
      notification: colors.primary,
    },
  };

  const value: AppThemeContextValue = {
    colors,
    colorScheme,
    fonts: {
      mono: "GeistMono_400Regular",
    },
    editorFontSize,
    isReady,
    setColorScheme: async (theme: AppTheme) => {
      setColorSchemeState(theme);
      await saveTheme(theme);
    },
    setEditorFontSize: async (size: number) => {
      setEditorFontSizeState(size);
      await saveEditorFontSize(size);
    },
  };

  return (
    <AppThemeContext.Provider value={value}>
      <NavigationThemeProvider value={navigationTheme}>
        {children}
      </NavigationThemeProvider>
    </AppThemeContext.Provider>
  );
}

export function useAppTheme() {
  const value = use(AppThemeContext);

  if (!value) {
    throw new Error("useAppTheme must be used inside AppThemeProvider");
  }

  return value;
}
