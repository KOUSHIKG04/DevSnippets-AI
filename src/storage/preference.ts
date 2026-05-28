import AsyncStorage from "@react-native-async-storage/async-storage";

export type AppTheme = "light" | "dark";

const THEME_KEY = "app_theme";
const DEFAULT_LANGUAGE_KEY = "default_language";
const EDITOR_FONT_SIZE_KEY = "editor_font_size";

export async function getTheme(): Promise<AppTheme> {
  const value = await AsyncStorage.getItem(THEME_KEY);
  return value === "dark" ? "dark" : "light";
}

export async function saveTheme(theme: AppTheme) {
  await AsyncStorage.setItem(THEME_KEY, theme);
}

export async function getDefaultLanguage() {
  return (await AsyncStorage.getItem(DEFAULT_LANGUAGE_KEY)) ?? "TypeScript";
}

export async function saveDefaultLanguage(language: string) {
  await AsyncStorage.setItem(DEFAULT_LANGUAGE_KEY, language);
}

export async function getEditorFontSize() {
  const value = await AsyncStorage.getItem(EDITOR_FONT_SIZE_KEY);
  return value ? Number(value) : 14;
}

export async function saveEditorFontSize(size: number) {
  await AsyncStorage.setItem(EDITOR_FONT_SIZE_KEY, String(size));
}
