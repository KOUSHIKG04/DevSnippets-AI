import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
  import { useEffect, useState } from "react";
  import {
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
  import { getDefaultLanguage } from "../../storage/preference";
  import { useAppTheme } from "../../theme";

  export default function CreateSnippetScreen() {
    const [title, setTitle] = useState("");
    const [language, setLanguage] = useState("");
    const [isLanguagePickerOpen, setIsLanguagePickerOpen] = useState(false);
    const [tags, setTags] = useState("");
    const [code, setCode] = useState("");
    const { colors, editorFontSize, fonts } = useAppTheme();
    const { showAlert } = useAppAlert();

    useEffect(() => {
      async function loadDefaultLanguage() {
        setLanguage(await getDefaultLanguage());
      }

      loadDefaultLanguage();
    }, []);

    function handleSave() {
      const trimmedTitle = title.trim();
      const trimmedLanguage = language.trim();
      const trimmedCode = code.trim();

      if (!trimmedTitle || !trimmedLanguage || !trimmedCode) {
        showAlert("Missing details", "Title, language, and code are required.");
        return;
      }

      const tagList = tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);

      createSnippet({
        title: trimmedTitle,
        language: trimmedLanguage,
        code: code.replace(/\r\n/g, "\n"),
        tags: tagList,
      });

      router.back();
    }

    return (
      <KeyboardAvoidingView
        style={[styles.screen, { backgroundColor: colors.background }]}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.foreground }]}>
              New Snippet
            </Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              Save reusable code for later.
            </Text>
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>Title</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
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
                {language || "TypeScript"}
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
                <ScrollView style={styles.languageOptions}>
                  {LANGUAGE_OPTIONS.map((option) => (
                    <Pressable
                      key={option}
                      style={[
                        styles.languageOption,
                        language === option && {
                          backgroundColor: colors.secondary,
                        },
                      ]}
                      onPress={() => {
                        setLanguage(option);
                        setIsLanguagePickerOpen(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.languageOptionText,
                          {
                            color:
                              language === option
                                ? colors.codeAccent
                                : colors.foreground,
                          },
                        ]}
                      >
                        {option}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </Pressable>
            </Pressable>
          </Modal>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>Tags</Text>
            <TextInput
              value={tags}
              onChangeText={setTags}
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
              value={code}
              onChangeText={setCode}
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

          <Pressable style={styles.cancelButton} onPress={() => router.back()}>
            <Text
              style={[
                styles.cancelButtonText,
                { color: colors.mutedForeground },
              ]}
            >
              Cancel
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
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
    subtitle: {
      ...fontStyles.regular,
      fontSize: 14,
      marginTop: 4,
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
    cancelButton: {
      height: 48,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 8,
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
  });
