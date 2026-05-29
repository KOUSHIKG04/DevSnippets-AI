 import Ionicons from "@expo/vector-icons/Ionicons";
 import { router, useLocalSearchParams } from "expo-router";
  import { useState } from "react";
  import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
  } from "react-native";
  import { useAppAlert } from "../../components/AppAlert";
  import {
    getSnippetById,
    updateSnippet,
  } from "../../db/snippet";
  import { fontStyles } from "../../fontDefaults";
  import { useAppTheme } from "../../theme";

  type EditSnippetFormState = {
    code: string;
    language: string;
    tags: string;
    title: string;
  };

  export default function EditSnippetScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const snippetId = Number(id);
    const [initialSnippet] = useState(() =>
      Number.isFinite(snippetId) ? getSnippetById(snippetId) : null,
    );

    const [form, setForm] = useState<EditSnippetFormState>({
      code: initialSnippet?.code ?? "",
      language: initialSnippet?.language ?? "",
      tags: initialSnippet?.tags.join(", ") ?? "",
      title: initialSnippet?.title ?? "",
    });
    const { colors, editorFontSize, fonts } = useAppTheme();
    const { showAlert } = useAppAlert();

    function handleSave() {
      const trimmedTitle = form.title.trim();
      const trimmedLanguage = form.language.trim();
      const trimmedCode = form.code.trim();

      if (!trimmedTitle || !trimmedLanguage || !trimmedCode) {
        showAlert("Missing details", "Title, language, and code are required.");
        return;
      }

      updateSnippet(snippetId, {
        title: trimmedTitle,
        language: trimmedLanguage,
        code: form.code.replace(/\r\n/g, "\n"),
        tags: form.tags
          .split(",")
          .flatMap((tag) => {
            const trimmedTag = tag.trim();
            return trimmedTag ? [trimmedTag] : [];
          }),
      });

      router.back();
    }

    if (!initialSnippet) {
      return (
        <View style={[styles.centered, { backgroundColor: colors.background }]}>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            Snippet not found
          </Text>
          <Pressable
            style={[styles.saveButton, { backgroundColor: colors.primary }]}
            onPress={() => router.back()}
          >
            <Text
              style={[
                styles.saveButtonText,
                { color: colors.primaryForeground },
              ]}
            >
              Go Back
            </Text>
          </Pressable>
        </View>
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
                Edit Snippet
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
              placeholder="Snippet title"
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
            <TextInput
              value={form.language}
              onChangeText={(language) =>
                setForm((currentForm) => ({ ...currentForm, language }))
              }
              placeholder="TypeScript"
              placeholderTextColor={colors.mutedForeground}
              style={[
                styles.input,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.input,
                  color: colors.foreground,
                },
              ]}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>Tags</Text>
            <TextInput
              value={form.tags}
              onChangeText={(tags) =>
                setForm((currentForm) => ({ ...currentForm, tags }))
              }
              placeholder="react-native, helper"
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
              placeholder="Paste code here"
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
              Save Changes
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
    centered: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
    },
    emptyTitle: {
      ...fontStyles.extraBold,
      fontSize: 18,
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
  });
