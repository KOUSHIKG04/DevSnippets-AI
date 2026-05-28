 import { router, useLocalSearchParams } from "expo-router";
  import { useEffect, useState } from "react";
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

  export default function EditSnippetScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const snippetId = Number(id);
    const [initialSnippet] = useState(() =>
      Number.isFinite(snippetId) ? getSnippetById(snippetId) : null,
    );

    const [title, setTitle] = useState(initialSnippet?.title ?? "");
    const [language, setLanguage] = useState(initialSnippet?.language ?? "");
    const [tags, setTags] = useState(initialSnippet?.tags.join(", ") ?? "");
    const [code, setCode] = useState(initialSnippet?.code ?? "");
    const { colors, editorFontSize, fonts } = useAppTheme();
    const { showAlert } = useAppAlert();

    

    useEffect(() => {
      if (!Number.isFinite(snippetId)) {
        return;
      }

      if (!initialSnippet) {
        showAlert("Not found", "This snippet does not exist.");
        router.back();
      }
    }, [initialSnippet, showAlert, snippetId]);
    

    function handleSave() {
      const trimmedTitle = title.trim();
      const trimmedLanguage = language.trim();
      const trimmedCode = code.trim();

      if (!trimmedTitle || !trimmedLanguage || !trimmedCode) {
        showAlert("Missing details", "Title, language, and code are required.");
        return;
      }

      updateSnippet(snippetId, {
        title: trimmedTitle,
        language: trimmedLanguage,
        code: code.replace(/\r\n/g, "\n"),
        tags: tags
          .split(",")
          .flatMap((tag) => {
            const trimmedTag = tag.trim();
            return trimmedTag ? [trimmedTag] : [];
          }),
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
              Edit Snippet
            </Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              Update saved code details.
            </Text>
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>Title</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
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
              value={language}
              onChangeText={setLanguage}
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
              value={tags}
              onChangeText={setTags}
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
              value={code}
              onChangeText={setCode}
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
  });
