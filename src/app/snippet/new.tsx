import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useLocalSearchParams } from "expo-router";
  import { useState } from "react";
  import {
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
  } from "react-native";
  import { useAppAlert } from "../../components/AppAlert";
  import { LANGUAGE_OPTIONS } from "../../constants/languages";
  import { createSnippet } from "../../db/snippet";
  import { fontStyles } from "../../fontDefaults";
  import { getPreferenceSnapshot } from "../../storage/preference";
  import { useAppTheme } from "../../theme";

  type SnippetFormState = {
    code: string;
    language?: string;
    tags: string;
    title: string;
  };

  export default function CreateSnippetScreen() {
    const params = useLocalSearchParams<{ code?: string }>();
    const [isLanguagePickerOpen, setIsLanguagePickerOpen] = useState(false);
    const [form, setForm] = useState<SnippetFormState>({
      code: params.code ?? "",
      language: getPreferenceSnapshot().defaultLanguage,
      tags: "",
      title: "",
    });
    const { colors, editorFontSize, fonts } = useAppTheme();
    const { showAlert } = useAppAlert();

    function handleSave() {
      const trimmedTitle = form.title.trim();
      const trimmedLanguage = (form.language ?? "").trim();
      const trimmedCode = form.code.trim();

      if (!trimmedTitle || !trimmedLanguage || !trimmedCode) {
        showAlert("Missing details", "Title, language, and code are required.");
        return;
      }

      const tagList = form.tags
        .split(",")
        .flatMap((tag) => {
          const trimmedTag = tag.trim();
          return trimmedTag ? [trimmedTag] : [];
        });

      createSnippet({
        title: trimmedTitle,
        language: trimmedLanguage,
        code: form.code.replace(/\r\n/g, "\n"),
        tags: tagList,
      });

      router.back();
    }

    function handleSelectLanguage(language: string) {
      setForm((currentForm) => ({ ...currentForm, language }));
      setIsLanguagePickerOpen(false);
    }

    function renderLanguageOption({ item }: { item: string }) {
      return (
        <LanguageOptionRow
          isSelected={form.language === item}
          option={item}
          onSelect={handleSelectLanguage}
        />
      );
    }

    return (
      <KeyboardAvoidingView
        style={[styles.screen, { backgroundColor: colors.background }]}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Pressable
                style={styles.backButton}
                onPress={() => router.back()}
              >
                <Ionicons
                  name="arrow-back"
                  size={24}
                  color={colors.foreground}
                />
              </Pressable>
              <Text style={[styles.title, { color: colors.foreground }]}>
                New Snippet
              </Text>
            </View>
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>Title</Text>
            <TextInput
              value={form.title}
              onChangeText={(title) =>
                setForm((currentForm) => ({ ...currentForm, title }))
              }
              placeholder="React Native fetch helper"
              placeholderTextColor={colors.mutedForeground}
              style={[
                styles.input,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.input,
                  color: colors.foreground,
                },
              ]}
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>
              Language
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
                {form.language || "TypeScript"}
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
                <Text
                  style={[styles.languageMenuTitle, { color: colors.foreground }]}
                >
                  Language
                </Text>
                <FlatList
                  data={LANGUAGE_OPTIONS}
                  keyExtractor={(option) => option}
                  style={styles.languageOptions}
                  contentContainerStyle={styles.languageOptionsContent}
                  renderItem={renderLanguageOption}
                />
              </Pressable>
            </Pressable>
          </Modal>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>Tags</Text>
            <TextInput
              value={form.tags}
              onChangeText={(tags) =>
                setForm((currentForm) => ({ ...currentForm, tags }))
              }
              placeholder="react-native, api, helper"
              placeholderTextColor={colors.mutedForeground}
              style={[
                styles.input,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.input,
                  color: colors.foreground,
                },
              ]}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>Code</Text>
            <TextInput
              value={form.code}
              onChangeText={(code) =>
                setForm((currentForm) => ({ ...currentForm, code }))
              }
              placeholder="Paste your code here"
              placeholderTextColor={colors.mutedForeground}
              style={[
                styles.input,
                styles.codeInput,
                {
                  backgroundColor: colors.code,
                  borderColor: colors.border,
                  color: colors.codeForeground,
                  fontSize: editorFontSize,
                  fontFamily: fonts.mono,
                },
              ]}
              multiline
              textAlignVertical="top"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.actionRow}>
            <Pressable
              style={[styles.cancelButton, { borderColor: colors.input }]}
              onPress={() => router.back()}
            >
              <Text
                style={[
                  styles.cancelButtonText,
                  { color: colors.mutedForeground },
                ]}
              >
                Cancel
              </Text>
            </Pressable>

            <Pressable
              style={[styles.saveButton, { backgroundColor: colors.primary }]}
              onPress={handleSave}
            >
              <Text
                style={[
                  styles.saveButtonText,
                  { color: colors.primaryForeground },
                ]}
              >
                Save Snippet
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  function LanguageOptionRow({
    isSelected,
    onSelect,
    option,
  }: {
    isSelected: boolean;
    onSelect: (option: string) => void;
    option: string;
  }) {
    const { colors } = useAppTheme();

    function handlePress() {
      onSelect(option);
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
          {option}
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
      marginBottom: 24,
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
    field: {
      marginBottom: 16,
    },
    label: {
      ...fontStyles.bold,
      fontSize: 14,
      marginBottom: 8,
    },
    input: {
      ...fontStyles.regular,
      minHeight: 48,
      borderRadius: 8,
      borderWidth: 1,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
    },
    codeInput: {
      minHeight: 240,
    },
    actionRow: {
      flexDirection: "row",
      gap: 12,
      marginTop: 8,
    },
    saveButton: {
      flex: 1,
      height: 52,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
    },
    saveButtonText: {
      ...fontStyles.extraBold,
      fontSize: 16,
    },
    cancelButton: {
      flex: 1,
      height: 52,
      borderRadius: 8,
      borderWidth: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    cancelButtonText: {
      ...fontStyles.bold,
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
  });
