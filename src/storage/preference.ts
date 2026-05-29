import AsyncStorage from "@react-native-async-storage/async-storage";
import { Appearance } from "react-native";

export type AppTheme = "light" | "dark";

const THEME_KEY = "app_theme";
const DEFAULT_LANGUAGE_KEY = "default_language";
const EDITOR_FONT_SIZE_KEY = "editor_font_size";

type PreferenceSnapshot = {
  defaultLanguage: string;
  editorFontSize: number;
  isReady: boolean;
  theme: AppTheme;
};

const listeners = new Set<() => void>();
let preferenceSnapshot: PreferenceSnapshot = {
  defaultLanguage: "TypeScript",
  editorFontSize: 14,
  isReady: false,
  theme: getSystemTheme(),
};

function getSystemTheme(): AppTheme {
  return Appearance.getColorScheme() === "dark" ? "dark" : "light";
}

function emitPreferenceChange() {
  listeners.forEach((listener) => listener());
}

function setPreferenceSnapshot(nextSnapshot: Partial<PreferenceSnapshot>) {
  preferenceSnapshot = { ...preferenceSnapshot, ...nextSnapshot };
  emitPreferenceChange();
}

export function getPreferenceSnapshot() {
  return preferenceSnapshot;
}

export function subscribePreferences(listener: () => void) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export async function loadPreferences() {
  const [theme, defaultLanguage, editorFontSize] = await Promise.all([
    getTheme(),
    getDefaultLanguage(),
    getEditorFontSize(),
  ]);

  setPreferenceSnapshot({
    defaultLanguage,
    editorFontSize,
    isReady: true,
    theme,
  });
}

export async function getTheme(): Promise<AppTheme> {
  const value = await AsyncStorage.getItem(THEME_KEY);
  if (value === "light" || value === "dark") {
    return value;
  }

  return getSystemTheme();
}

export async function saveTheme(theme: AppTheme) {
  await AsyncStorage.setItem(THEME_KEY, theme);
  setPreferenceSnapshot({ theme });
}

export async function getDefaultLanguage() {
  return (await AsyncStorage.getItem(DEFAULT_LANGUAGE_KEY)) ?? "TypeScript";
}

export async function saveDefaultLanguage(language: string) {
  await AsyncStorage.setItem(DEFAULT_LANGUAGE_KEY, language);
  setPreferenceSnapshot({ defaultLanguage: language });
}

export async function getEditorFontSize() {
  const value = await AsyncStorage.getItem(EDITOR_FONT_SIZE_KEY);
  return value ? Number(value) : 14;
}

export async function saveEditorFontSize(size: number) {
  await AsyncStorage.setItem(EDITOR_FONT_SIZE_KEY, String(size));
  setPreferenceSnapshot({ editorFontSize: size });
}
