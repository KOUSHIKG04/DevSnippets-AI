import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { type ReactElement, useEffect, useReducer, useState } from "react";
import {
  FlatList,
  type GestureResponderHandlers,
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

type SettingsState = {
  apiKey: string;
  defaultLanguage?: string;
  fontSize?: number;
  fontSliderWidth: number;
  hasSavedApiKey?: boolean;
};

type SettingsAction =
  | {
      defaultLanguage: string;
      fontSize: number;
      hasSavedApiKey: boolean;
      type: "load";
    }
  | { defaultLanguage: string; type: "setDefaultLanguage" }
  | { fontSize: number; type: "setFontSize" }
  | { fontSliderWidth: number; type: "setFontSliderWidth" }
  | { apiKey: string; type: "setApiKey" }
  | { type: "saveApiKey" }
  | { type: "deleteApiKey" };

const initialSettingsState: SettingsState = {
  apiKey: "",
  defaultLanguage: undefined,
  fontSize: undefined,
  fontSliderWidth: 0,
  hasSavedApiKey: undefined,
};

function settingsReducer(
  state: SettingsState,
  action: SettingsAction,
): SettingsState {
  switch (action.type) {
    case "load":
      return {
        ...state,
        defaultLanguage: action.defaultLanguage,
        fontSize: action.fontSize,
        hasSavedApiKey: action.hasSavedApiKey,
      };
    case "setDefaultLanguage":
      return { ...state, defaultLanguage: action.defaultLanguage };
    case "setFontSize":
      return { ...state, fontSize: action.fontSize };
    case "setFontSliderWidth":
      return { ...state, fontSliderWidth: action.fontSliderWidth };
    case "setApiKey":
      return { ...state, apiKey: action.apiKey };
    case "saveApiKey":
      return { ...state, apiKey: "", hasSavedApiKey: true };
    case "deleteApiKey":
      return { ...state, apiKey: "", hasSavedApiKey: false };
    default:
      return state;
  }
}

export default function SettingsScreen() {
  const [isLanguagePickerOpen, setIsLanguagePickerOpen] = useState(false);
  const [settings, dispatchSettings] = useReducer(
    settingsReducer,
    initialSettingsState,
  );
  const { colors, setEditorFontSize } = useAppTheme();
  const { showAlert } = useAppAlert();

  useEffect(() => {
    async function loadSettings() {
      const [storedLanguage, storedFontSize, storedApiKey] = await Promise.all([
        getDefaultLanguage(),
        getEditorFontSize(),
        getAiApiKey(),
      ]);

      dispatchSettings({
        defaultLanguage: storedLanguage,
        fontSize: storedFontSize,
        hasSavedApiKey: Boolean(storedApiKey),
        type: "load",
      });
    }

    loadSettings();
  }, []);

  const fontSliderProgress =
    ((settings.fontSize ?? 14) - MIN_EDITOR_FONT_SIZE) /
    (MAX_EDITOR_FONT_SIZE - MIN_EDITOR_FONT_SIZE);

  function updateFontSizeFromSlider(positionX: number) {
    if (settings.fontSliderWidth <= 0) {
      return;
    }

    const clampedPosition = Math.min(
      Math.max(positionX, 0),
      settings.fontSliderWidth,
    );
    const nextFontSize = Math.round(
      MIN_EDITOR_FONT_SIZE +
        (clampedPosition / settings.fontSliderWidth) *
          (MAX_EDITOR_FONT_SIZE - MIN_EDITOR_FONT_SIZE),
    );

    if (nextFontSize !== settings.fontSize) {
      dispatchSettings({ fontSize: nextFontSize, type: "setFontSize" });
    }
  }

  const fontSizePanResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (event) => {
      updateFontSizeFromSlider(event.nativeEvent.locationX);
    },
    onPanResponderMove: (event) => {
      updateFontSizeFromSlider(event.nativeEvent.locationX);
    },
  });

  async function handleSave() {
    if (!settings.defaultLanguage?.trim()) {
      showAlert("Missing language", "Default language is required.");
      return;
    }

    const nextFontSize = settings.fontSize ?? 14;

    if (
      !Number.isFinite(nextFontSize) ||
      nextFontSize < MIN_EDITOR_FONT_SIZE ||
      nextFontSize > MAX_EDITOR_FONT_SIZE
    ) {
      showAlert("Invalid font size", "Use a font size between 10 and 24.");
      return;
    }

    await saveDefaultLanguage(settings.defaultLanguage.trim());
    await setEditorFontSize(nextFontSize);

    if (settings.apiKey.trim()) {
      await saveAiApiKey(settings.apiKey.trim());
      dispatchSettings({ type: "saveApiKey" });
    }

    showAlert("Saved", "Preferences saved locally.");
  }

  function handleDeleteApiKey() {
    showAlert(
      "Remove Gemini key",
      "The saved Gemini API key will be removed from this device.",
      [
        { label: "Cancel", variant: "cancel" },
        {
          label: "Remove",
          variant: "destructive",
          onPress: async () => {
            await deleteAiApiKey();
            dispatchSettings({ type: "deleteApiKey" });
            showAlert("Removed", "Gemini API key was removed from this device.");
          },
        },
      ],
    );
  }

  function handleSelectLanguage(language: string) {
    dispatchSettings({
      defaultLanguage: language,
      type: "setDefaultLanguage",
    });
    setIsLanguagePickerOpen(false);
  }

  function renderLanguageOption({ item }: { item: string }) {
    return (
      <SettingsLanguageOptionRow
        isSelected={settings.defaultLanguage === item}
        language={item}
        onSelect={handleSelectLanguage}
      />
    );
  }

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.container}
    >
      <SettingsHeader />
      <ApiKeySettingsCard
        apiKey={settings.apiKey}
        hasSavedApiKey={settings.hasSavedApiKey}
        onApiKeyChange={(apiKey) =>
          dispatchSettings({ apiKey, type: "setApiKey" })
        }
        onDeleteApiKey={handleDeleteApiKey}
      />
      <DefaultLanguageCard
        defaultLanguage={settings.defaultLanguage}
        onOpenPicker={() => setIsLanguagePickerOpen(true)}
      />
      <LanguagePickerModal
        isVisible={isLanguagePickerOpen}
        onClose={() => setIsLanguagePickerOpen(false)}
        renderLanguageOption={renderLanguageOption}
      />
      <EditorFontSizeCard
        fontSize={settings.fontSize ?? 14}
        fontSliderProgress={fontSliderProgress}
        fontSliderWidth={settings.fontSliderWidth}
        onSliderLayout={(fontSliderWidth) =>
          dispatchSettings({
            fontSliderWidth,
            type: "setFontSliderWidth",
          })
        }
        panHandlers={fontSizePanResponder.panHandlers}
      />

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

function SettingsHeader() {
  const { colors } = useAppTheme();

  return (
    <View style={styles.header}>
      <View>
        <View style={styles.headerTitleRow}>
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.title, { color: colors.foreground }]}>
            Settings
          </Text>
        </View>
      </View>
    </View>
  );
}

function ApiKeySettingsCard({
  apiKey,
  hasSavedApiKey,
  onApiKeyChange,
  onDeleteApiKey,
}: {
  apiKey: string;
  hasSavedApiKey?: boolean;
  onApiKeyChange: (apiKey: string) => void;
  onDeleteApiKey: () => void;
}) {
  const { colors } = useAppTheme();

  return (
    <View
      style={[
        styles.settingCard,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={styles.settingHeader}>
        <View style={styles.settingHeaderText}>
          <Text style={[styles.settingTitle, { color: colors.foreground }]}>
            Gemini API Key
          </Text>
          <Text style={[styles.settingMeta, { color: colors.mutedForeground }]}>
            {hasSavedApiKey ? "Secure Gemini key saved" : "No secure key saved"}
          </Text>
        </View>
      </View>

      <TextInput
        value={apiKey}
        onChangeText={onApiKeyChange}
        placeholder={
          hasSavedApiKey
            ? "API key saved. Enter a new key to replace it."
            : "Paste your Gemini API key"
        }
        placeholderTextColor={colors.mutedForeground}
        style={[
          styles.input,
          {
            backgroundColor: colors.background,
            borderColor: colors.input,
            color: colors.foreground,
          },
        ]}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
      />

      {hasSavedApiKey && (
        <Pressable
          style={[styles.removeButton, { backgroundColor: colors.destructive }]}
          onPress={onDeleteApiKey}
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
  );
}

function DefaultLanguageCard({
  defaultLanguage,
  onOpenPicker,
}: {
  defaultLanguage?: string;
  onOpenPicker: () => void;
}) {
  const { colors } = useAppTheme();

  return (
    <View
      style={[
        styles.settingCard,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={styles.settingHeader}>
        <View style={styles.settingHeaderText}>
          <Text style={[styles.settingTitle, { color: colors.foreground }]}>
            Default Language
          </Text>
          <Text style={[styles.settingMeta, { color: colors.mutedForeground }]}>
            Used when creating new snippets
          </Text>
        </View>
      </View>

      <Pressable
        style={[
          styles.dropdownButton,
          {
            backgroundColor: colors.background,
            borderColor: colors.input,
          },
        ]}
        onPress={onOpenPicker}
      >
        <Text style={[styles.dropdownText, { color: colors.foreground }]}>
          {defaultLanguage ?? "TypeScript"}
        </Text>
        <Ionicons
          name="chevron-down"
          size={20}
          color={colors.mutedForeground}
        />
      </Pressable>
    </View>
  );
}

function LanguagePickerModal({
  isVisible,
  onClose,
  renderLanguageOption,
}: {
  isVisible: boolean;
  onClose: () => void;
  renderLanguageOption: ({ item }: { item: string }) => ReactElement;
}) {
  const { colors } = useAppTheme();

  return (
    <Modal
      transparent
      animationType="fade"
      visible={isVisible}
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable
          style={[
            styles.languageMenu,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
          onPress={(event) => event.stopPropagation()}
        >
          <Text style={[styles.languageMenuTitle, { color: colors.foreground }]}>
            Default Language
          </Text>
          <FlatList
            data={LANGUAGE_OPTIONS}
            keyExtractor={(language) => language}
            style={styles.languageOptions}
            contentContainerStyle={styles.languageOptionsContent}
            renderItem={renderLanguageOption}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function EditorFontSizeCard({
  fontSize,
  fontSliderProgress,
  fontSliderWidth,
  onSliderLayout,
  panHandlers,
}: {
  fontSize: number;
  fontSliderProgress: number;
  fontSliderWidth: number;
  onSliderLayout: (fontSliderWidth: number) => void;
  panHandlers: GestureResponderHandlers;
}) {
  const { colors } = useAppTheme();

  return (
    <View
      style={[
        styles.settingCard,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={styles.settingHeader}>
        <View style={styles.settingHeaderText}>
          <Text style={[styles.settingTitle, { color: colors.foreground }]}>
            Editor Font Size
          </Text>
          <Text style={[styles.settingMeta, { color: colors.mutedForeground }]}>
            Code preview and editor text scale
          </Text>
        </View>
        <Text
          style={[
            styles.sliderValue,
            { backgroundColor: colors.secondary, color: colors.codeAccent },
          ]}
        >
          {fontSize}px
        </Text>
      </View>

      <View
        style={styles.sliderHitArea}
        onLayout={(event) => {
          const nextWidth = event.nativeEvent.layout.width;

          if (Math.round(fontSliderWidth) !== Math.round(nextWidth)) {
            onSliderLayout(nextWidth);
          }
        }}
        {...panHandlers}
      >
        <View style={[styles.sliderTrack, { backgroundColor: colors.secondary }]}>
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
        <Text style={[styles.sliderRangeText, { color: colors.mutedForeground }]}>
          {MIN_EDITOR_FONT_SIZE}px
        </Text>
        <Text style={[styles.sliderRangeText, { color: colors.mutedForeground }]}>
          {MAX_EDITOR_FONT_SIZE}px
        </Text>
      </View>
    </View>
  );
}

function SettingsLanguageOptionRow({
  isSelected,
  language,
  onSelect,
}: {
  isSelected: boolean;
  language: string;
  onSelect: (language: string) => void;
}) {
  const { colors } = useAppTheme();

  function handlePress() {
    onSelect(language);
  }

  return (
    <Pressable
      style={[
        styles.languageOption,
        isSelected && {
          backgroundColor: colors.secondary,
        },
      ]}
      onPress={handlePress}
    >
      <Text
        style={[
          styles.languageOptionText,
          {
            color: isSelected ? colors.codeAccent : colors.foreground,
          },
        ]}
      >
        {language}
      </Text>
    </Pressable>
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
    marginBottom: 22,
  },
  title: {
    ...fontStyles.extraBold,
    fontSize: 30,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    padding: 8,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -6,
  },
  settingCard: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
  },
  settingHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  settingHeaderText: {
    flex: 1,
    minWidth: 0,
  },
  settingTitle: {
    ...fontStyles.extraBold,
    fontSize: 15,
  },
  settingMeta: {
    ...fontStyles.regular,
    fontSize: 12,
    marginTop: 4,
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
    fontSize: 11,
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
    flex: 1,
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
  languageOptionsContent: {
    paddingRight: 10,
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
  saveButton: {
    height: 52,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
  },
  saveButtonText: {
    ...fontStyles.extraBold,
    fontSize: 16,
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
