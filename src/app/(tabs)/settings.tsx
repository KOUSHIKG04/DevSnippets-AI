import Ionicons from "@expo/vector-icons/Ionicons";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useAppAlert } from "../../components/AppAlert";
import { LANGUAGE_OPTIONS } from "../../constants/languages";
import {
  AppTheme,
  getDefaultLanguage,
  getEditorFontSize,
  saveDefaultLanguage,
} from "../../storage/preference";
import {
  deleteAiApiKey,
  getAiApiKey,
  saveAiApiKey,
} from "../../storage/secureStore";
import { fontStyles } from "../../fontDefaults";
import { useAppTheme } from "../../theme";

const MIN_EDITOR_FONT_SIZE = 10;
const MAX_EDITOR_FONT_SIZE = 24;

export default function SettingsScreen() {
  const [theme, setTheme] = useState<AppTheme>("light");
  const [defaultLanguage, setDefaultLanguage] = useState("TypeScript");
  const [isLanguagePickerOpen, setIsLanguagePickerOpen] = useState(false);
  const [fontSize, setFontSize] = useState(14);
  const [fontSliderWidth, setFontSliderWidth] = useState(0);
  const fontSizeRef = useRef(fontSize);
  const [apiKey, setApiKey] = useState("");
  const [hasSavedApiKey, setHasSavedApiKey] = useState(false);
  const {
    colors,
    colorScheme,
    editorFontSize,
    setColorScheme,
    setEditorFontSize,
  } = useAppTheme();
  const { showAlert } = useAppAlert();

  useEffect(() => {
    setTheme(colorScheme);
  }, [colorScheme]);

  useEffect(() => {
    setFontSize(editorFontSize);
    fontSizeRef.current = editorFontSize;
  }, [editorFontSize]);

  useEffect(() => {
    async function loadSettings() {
      const storedLanguage = await getDefaultLanguage();
      const storedFontSize = await getEditorFontSize();
      const storedApiKey = await getAiApiKey();

      setHasSavedApiKey(Boolean(storedApiKey));
      setDefaultLanguage(storedLanguage);
      setFontSize(storedFontSize);
      fontSizeRef.current = storedFontSize;
    }

    loadSettings();
  }, []);

  const fontSliderProgress =
    (fontSize - MIN_EDITOR_FONT_SIZE) /
    (MAX_EDITOR_FONT_SIZE - MIN_EDITOR_FONT_SIZE);

  const updateFontSizeFromSlider = useCallback((positionX: number) => {
    if (fontSliderWidth <= 0) {
      return;
    }

    const clampedPosition = Math.min(Math.max(positionX, 0), fontSliderWidth);
    const nextFontSize = Math.round(
      MIN_EDITOR_FONT_SIZE +
        (clampedPosition / fontSliderWidth) *
          (MAX_EDITOR_FONT_SIZE - MIN_EDITOR_FONT_SIZE),
    );

    if (nextFontSize !== fontSizeRef.current) {
      fontSizeRef.current = nextFontSize;
      setFontSize(nextFontSize);
    }
  }, [fontSliderWidth]);

  const fontSizePanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (event) => {
          updateFontSizeFromSlider(event.nativeEvent.locationX);
        },
        onPanResponderMove: (event) => {
          updateFontSizeFromSlider(event.nativeEvent.locationX);
        },
      }),
    [updateFontSizeFromSlider],
  );

  async function handleThemeChange(nextTheme: AppTheme) {
    setTheme(nextTheme);
    await setColorScheme(nextTheme);
  }

  async function handleSave() {
    if (!defaultLanguage.trim()) {
      showAlert("Missing language", "Default language is required.");
      return;
    }

    if (
      !Number.isFinite(fontSize) ||
      fontSize < MIN_EDITOR_FONT_SIZE ||
      fontSize > MAX_EDITOR_FONT_SIZE
    ) {
      showAlert("Invalid font size", "Use a font size between 10 and 24.");
      return;
    }

    await saveDefaultLanguage(defaultLanguage.trim());
    await setEditorFontSize(fontSize);

    if (apiKey.trim()) {
      await saveAiApiKey(apiKey.trim());
      setHasSavedApiKey(true);
      setApiKey("");
    }

    showAlert("Saved", "Preferences saved locally.");
  }

  async function handleDeleteApiKey() {
    await deleteAiApiKey();
    setHasSavedApiKey(false);
    setApiKey("");
    showAlert("Removed", "AI API key was removed from this device.");
  }

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.container}
    >
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.foreground }]}>
            Settings
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Local app preferences
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.label, { color: colors.foreground }]}>Theme</Text>

        <View
          style={[
            styles.segmentedControl,
            { backgroundColor: colors.secondary },
          ]}
        >
          <Pressable
            style={[
              styles.segmentButton,
              theme === "light" && [
                styles.segmentButtonActive,
                { backgroundColor: colors.card },
              ],
            ]}
            onPress={() => handleThemeChange("light")}
          >
            <Text
              style={[
                styles.segmentText,
                { color: colors.mutedForeground },
                theme === "light" && { color: colors.foreground },
              ]}
            >
              Light
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.segmentButton,
              theme === "dark" && [
                styles.segmentButtonActive,
                { backgroundColor: colors.card },
              ],
            ]}
            onPress={() => handleThemeChange("dark")}
          >
            <Text
              style={[
                styles.segmentText,
                { color: colors.mutedForeground },
                theme === "dark" && { color: colors.foreground },
              ]}
            >
              Dark
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.label, { color: colors.foreground }]}>
          AI API Key
        </Text>

        <TextInput
          value={apiKey}
          onChangeText={setApiKey}
          placeholder={
            hasSavedApiKey
              ? "API key saved. Enter a new key to replace it."
              : "Paste your AI API key"
          }
          placeholderTextColor={colors.mutedForeground}
          style={[
            styles.input,
            {
              backgroundColor: colors.card,
              borderColor: colors.input,
              color: colors.foreground,
            },
          ]}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Text style={[styles.helperText, { color: colors.mutedForeground }]}>
          {hasSavedApiKey
            ? "A key is saved securely on this device."
            : "No AI key saved yet."}
        </Text>

        {hasSavedApiKey && (
          <Pressable
            style={[
              styles.removeButton,
              { backgroundColor: colors.destructive },
            ]}
            onPress={handleDeleteApiKey}
          >
            <Text
              style={[
                styles.removeButtonText,
                { color: colors.destructiveForeground },
              ]}
            >
              Remove API Key
            </Text>
          </Pressable>
        )}
      </View>

      <View style={styles.section}>
        <Text style={[styles.label, { color: colors.foreground }]}>
          Default Language
        </Text>

        <Pressable
          style={[
            styles.dropdownButton,
            {
              backgroundColor: colors.card,
              borderColor: colors.input,
            },
          ]}
          onPress={() => setIsLanguagePickerOpen(true)}
        >
          <Text style={[styles.dropdownText, { color: colors.foreground }]}>
            {defaultLanguage}
          </Text>
          <Ionicons
            name="chevron-down"
            size={20}
            color={colors.mutedForeground}
          />
        </Pressable>
      </View>

      <Modal
        transparent
        animationType="fade"
        visible={isLanguagePickerOpen}
        onRequestClose={() => setIsLanguagePickerOpen(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setIsLanguagePickerOpen(false)}
        >
          <Pressable
            style={[
              styles.languageMenu,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
            onPress={(event) => event.stopPropagation()}
          >
            <Text style={[styles.languageMenuTitle, { color: colors.foreground }]}>
              Default Language
            </Text>
            <ScrollView style={styles.languageOptions}>
              {LANGUAGE_OPTIONS.map((language) => (
                <Pressable
                  key={language}
                  style={[
                    styles.languageOption,
                    defaultLanguage === language && {
                      backgroundColor: colors.secondary,
                    },
                  ]}
                  onPress={() => {
                    setDefaultLanguage(language);
                    setIsLanguagePickerOpen(false);
                  }}
                >
                  <Text
                    style={[
                      styles.languageOptionText,
                      {
                        color:
                          defaultLanguage === language
                            ? colors.codeAccent
                            : colors.foreground,
                      },
                    ]}
                  >
                    {language}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <View style={styles.section}>
        <View style={styles.sliderHeader}>
          <Text style={[styles.label, { color: colors.foreground }]}>
            Editor Font Size
          </Text>
          <Text
            style={[
              styles.sliderValue,
              {
                backgroundColor: colors.secondary,
                color: colors.codeAccent,
              },
            ]}
          >
            {fontSize}px
          </Text>
        </View>

        <View
          style={styles.sliderHitArea}
          onLayout={(event) => {
            const nextWidth = event.nativeEvent.layout.width;

            setFontSliderWidth((currentWidth) =>
              Math.round(currentWidth) === Math.round(nextWidth)
                ? currentWidth
                : nextWidth,
            );
          }}
          {...fontSizePanResponder.panHandlers}
        >
          <View
            style={[
              styles.sliderTrack,
              { backgroundColor: colors.secondary },
            ]}
          >
            <View
              style={[
                styles.sliderFill,
                {
                  backgroundColor: colors.primary,
                  width: fontSliderWidth * fontSliderProgress,
                },
              ]}
            />
            <View
              style={[
                styles.sliderThumb,
                {
                  backgroundColor: colors.primary,
                  borderColor: colors.background,
                  left: fontSliderWidth * fontSliderProgress,
                },
              ]}
            />
          </View>
        </View>

        <View style={styles.sliderRange}>
          <Text
            style={[
              styles.sliderRangeText,
              { color: colors.mutedForeground },
            ]}
          >
            {MIN_EDITOR_FONT_SIZE}px
          </Text>
          <Text
            style={[
              styles.sliderRangeText,
              { color: colors.mutedForeground },
            ]}
          >
            {MAX_EDITOR_FONT_SIZE}px
          </Text>
        </View>
      </View>

      <Pressable
        style={[styles.saveButton, { backgroundColor: colors.primary }]}
        onPress={handleSave}
      >
        <Text
          style={[styles.saveButtonText, { color: colors.primaryForeground }]}
        >
          Save Settings
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  container: {
    padding: 18,
    paddingTop: 56,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "flex-start",
    marginBottom: 24,
  },
  title: {
    ...fontStyles.extraBold,
    fontSize: 30,
  },
  subtitle: {
    ...fontStyles.regular,
    fontSize: 14,
    marginTop: 1,
  },
  section: {
    marginBottom: 48,
  },
  label: {
    ...fontStyles.extraBold,
    fontSize: 14,
    marginBottom: 8,
  },
  sliderHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 8,
  },
  sliderValue: {
    ...fontStyles.extraBold,
    fontSize: 14,
    minWidth: 54,
    height: 36,
    borderRadius: 8,
    overflow: "hidden",
    textAlign: "center",
    lineHeight: 36,
  },
  sliderHitArea: {
    height: 44,
    justifyContent: "center",
  },
  sliderTrack: {
    height: 8,
    borderRadius: 999,
    overflow: "visible",
  },
  sliderFill: {
    height: 8,
    borderRadius: 999,
  },
  sliderThumb: {
    position: "absolute",
    top: -7,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 3,
    marginLeft: -11,
  },
  sliderRange: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sliderRangeText: {
    ...fontStyles.regular,
    fontSize: 12,
  },
  input: {
    ...fontStyles.regular,
    minHeight: 48,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  dropdownButton: {
    minHeight: 48,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  dropdownText: {
    ...fontStyles.regular,
    fontSize: 15,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    justifyContent: "center",
    padding: 24,
  },
  languageMenu: {
    maxHeight: "70%",
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
  },
  languageMenuTitle: {
    ...fontStyles.extraBold,
    fontSize: 16,
    marginBottom: 8,
  },
  languageOptions: {
    maxHeight: 360,
  },
  languageOption: {
    height: 42,
    borderRadius: 6,
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  languageOptionText: {
    ...fontStyles.bold,
    fontSize: 14,
  },
  segmentedControl: {
    flexDirection: "row",
    borderRadius: 8,
    padding: 4,
  },
  segmentButton: {
    flex: 1,
    height: 42,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentButtonActive: {},
  segmentText: {
    ...fontStyles.extraBold,
    fontSize: 14,
  },
  saveButton: {
    height: 52,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  saveButtonText: {
    ...fontStyles.extraBold,
    fontSize: 16,
  },
  helperText: {
    ...fontStyles.regular,
    fontSize: 12,
    marginTop: 8,
  },
  removeButton: {
    height: 44,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  removeButtonText: {
    ...fontStyles.extraBold,
    fontSize: 14,
  },
});
