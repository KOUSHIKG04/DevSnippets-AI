import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useAppAlert } from "../../components/AppAlert";
import { SyntaxHighlightedCode } from "../../components/SyntaxHighlightedCode";
import {
  addSnippetAttachment,
  deleteSnippetAttachment,
  deleteSnippet,
  getSnippetAttachments,
  getSnippetById,
  toggleFavorite,
} from "../../db/snippet";
import {
  deleteFile,
  saveSnippetImageAttachment,
  saveSnippetExport,
  shareFile,
  type SnippetExportFormat,
} from "../../files/fileService";
import { fontStyles } from "../../fontDefaults";
import { useAppTheme } from "../../theme";
import { Snippet, SnippetAttachment } from "../../types/snippet";

export default function SnippetDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const snippetId = Number(id);
  const [snippet, setSnippet] = useState<Snippet | null>(() =>
    Number.isFinite(snippetId) ? getSnippetById(snippetId) : null,
  );
  const [attachments, setAttachments] = useState<SnippetAttachment[]>(() =>
    Number.isFinite(snippetId) ? getSnippetAttachments(snippetId) : [],
  );
  const { colors, editorFontSize, fonts } = useAppTheme();
  const { showAlert } = useAppAlert();

  function loadSnippet() {
    if (!Number.isFinite(snippetId)) {
      setSnippet((currentSnippet) => (currentSnippet === null ? currentSnippet : null));
      setAttachments((currentAttachments) =>
        currentAttachments.length === 0 ? currentAttachments : [],
      );
      return;
    }

    const savedSnippet = getSnippetById(snippetId);
    setSnippet((currentSnippet) =>
      isSameSnippet(currentSnippet, savedSnippet) ? currentSnippet : savedSnippet,
    );

    if (savedSnippet) {
      const savedAttachments = getSnippetAttachments(savedSnippet.id);
      setAttachments((currentAttachments) =>
        areSameAttachments(currentAttachments, savedAttachments)
          ? currentAttachments
          : savedAttachments,
      );
    } else {
      setAttachments((currentAttachments) =>
        currentAttachments.length === 0 ? currentAttachments : [],
      );
    }
  }

  useFocusEffect(() => {
    loadSnippet();
  });

  function handleToggleFavorite() {
    if (!snippet) return;

    toggleFavorite(snippet.id, !snippet.isFavorite);
    loadSnippet();
  }

  function handleDelete() {
    if (!snippet) {
      return;
    }

    showAlert("Delete snippet", "This snippet will be permanently deleted.", [
      { label: "Cancel", variant: "cancel" },
      {
        label: "Delete",
        variant: "destructive",
        onPress: () => {
          deleteSnippet(snippet.id);
          router.back();
        },
      },
    ]);
  }

  if (snippet === null) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
          Snippet not found
        </Text>
        <Pressable
          style={[styles.secondaryButton, { backgroundColor: colors.primary }]}
          onPress={() => router.back()}
        >
          <Text
            style={[
              styles.secondaryButtonText,
              { color: colors.primaryForeground },
            ]}
          >
            Go Back
          </Text>
        </Pressable>
      </View>
    );
  }

  async function handleExport(format: SnippetExportFormat) {
    if (!snippet) return;

    try {
      const filename = getExportFilename(snippet, format);
      const content = getExportContent(snippet, format);

      await saveSnippetExport(filename, content);

      showAlert("Exported", `${filename} saved to local files.`);
    } catch {
      showAlert("Export failed", "Could not export this snippet.");
    }
  }

  async function handleShare(format: SnippetExportFormat) {
    if (!snippet) return;

    try {
      const filename = getExportFilename(snippet, format);
      const content = getExportContent(snippet, format);
      const uri = await saveSnippetExport(filename, content);

      await shareFile(uri);
    } catch {
      showAlert("Share failed", "Could not share this snippet.");
    }
  }

  async function handleAttachScreenshot() {
    if (!snippet) return;

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        showAlert(
          "Permission needed",
          "Allow photo access to attach screenshots.",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.9,
      });

      if (result.canceled) {
        return;
      }

      const sourceUri = result.assets[0]?.uri;

      if (!sourceUri) {
        showAlert("Attachment failed", "Could not read selected image.");
        return;
      }

      const savedUri = await saveSnippetImageAttachment(sourceUri, snippet.id);
      addSnippetAttachment(snippet.id, savedUri);
      setAttachments(getSnippetAttachments(snippet.id));
    } catch {
      showAlert("Attachment failed", "Could not attach this screenshot.");
    }
  }

  async function handleDeleteAttachment(attachment: SnippetAttachment) {
    try {
      deleteSnippetAttachment(attachment.id);
      await deleteFile(attachment.uri);
      setAttachments(getSnippetAttachments(attachment.snippetId));
    } catch {
      showAlert("Delete failed", "Could not delete this attachment.");
    }
  }

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.container}
    >
      <View style={styles.header}>
        <View style={styles.titleArea}>
          <Text style={[styles.title, { color: colors.foreground }]}>
            {snippet.title}
          </Text>
          <Text style={[styles.language, { color: colors.codeAccent }]}>
            {snippet.language}
          </Text>
        </View>

        <Pressable
          style={[
            styles.favoriteButton,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
          onPress={handleToggleFavorite}
        >
          <Ionicons
            name={snippet.isFavorite ? "star" : "star-outline"}
            size={22}
            color={colors.codeAccent}
          />
        </Pressable>
      </View>

      <View style={styles.tags}>
        {snippet.tags.map((tag) => (
          <View
            key={tag}
            style={[
              styles.tagChip,
              {
                backgroundColor: colors.tagBackground,
              },
            ]}
          >
            <Text style={[styles.tagText, { color: colors.tagForeground }]}>
              #{tag}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Code
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator
          style={[
            styles.codeBlock,
            {
              backgroundColor: colors.code,
            },
          ]}
        >
          <SyntaxHighlightedCode
            code={snippet.code}
            selectable
            style={[
              styles.codeText,
              {
                fontSize: editorFontSize,
                lineHeight: Math.round(editorFontSize * 1.55),
                fontFamily: fonts.mono,
              },
            ]}
          />
        </ScrollView>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Attachments
          </Text>

          <Pressable
            style={[styles.attachButton, { backgroundColor: colors.secondary }]}
            onPress={handleAttachScreenshot}
          >
            <Ionicons
              name="image-outline"
              size={18}
              color={colors.foreground}
            />
            <Text style={[styles.attachButtonText, { color: colors.foreground }]}>
              Add
            </Text>
          </Pressable>
        </View>

        {attachments.length === 0 ? (
          <Text
            style={[
              styles.emptyAttachmentText,
              { color: colors.mutedForeground },
            ]}
          >
            No screenshots attached.
          </Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.attachmentRow}>
              {attachments.map((attachment) => (
                <View
                  key={attachment.id}
                  style={[
                    styles.attachmentCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Image
                    source={{ uri: attachment.uri }}
                    style={styles.attachmentImage}
                  />

                  <Pressable
                    style={[
                      styles.attachmentDeleteButton,
                      { backgroundColor: colors.destructive },
                    ]}
                    onPress={() => handleDeleteAttachment(attachment)}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={16}
                      color={colors.destructiveForeground}
                    />
                  </Pressable>
                </View>
              ))}
            </View>
          </ScrollView>
        )}
      </View>

      <View style={styles.actions}>
        <Pressable
          style={[styles.primaryButton, { backgroundColor: colors.primary }]}
          onPress={() =>
            router.push({
              pathname: "/snippet/edit",
              params: { id: String(snippet.id) },
            })
          }
        >
          <Ionicons
            name="create-outline"
            size={18}
            color={colors.primaryForeground}
          />
          <Text
            style={[
              styles.primaryButtonText,
              { color: colors.primaryForeground },
            ]}
          >
            Edit
          </Text>
        </Pressable>

        <Pressable
          style={[styles.dangerButton, { backgroundColor: colors.destructive }]}
          onPress={handleDelete}
        >
          <Ionicons
            name="trash-outline"
            size={18}
            color={colors.destructiveForeground}
          />
          <Text
            style={[
              styles.dangerButtonText,
              { color: colors.destructiveForeground },
            ]}
          >
            Delete
          </Text>
        </Pressable>
      </View>

      <View style={styles.exportActions}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Export
        </Text>
        <View style={styles.exportGrid}>
          <Pressable
            style={[styles.exportButton, { backgroundColor: colors.secondary }]}
            onPress={() => handleExport("txt")}
          >
            <Ionicons
              name="download-outline"
              size={18}
              color={colors.foreground}
            />
            <Text
              style={[styles.secondaryActionText, { color: colors.foreground }]}
            >
              TXT
            </Text>
          </Pressable>

          <Pressable
            style={[styles.exportButton, { backgroundColor: colors.secondary }]}
            onPress={() => handleExport("js")}
          >
            <Ionicons
              name="download-outline"
              size={18}
              color={colors.foreground}
            />
            <Text
              style={[styles.secondaryActionText, { color: colors.foreground }]}
            >
              JS
            </Text>
          </Pressable>

          <Pressable
            style={[styles.exportButton, { backgroundColor: colors.secondary }]}
            onPress={() => handleExport("json")}
          >
            <Ionicons
              name="download-outline"
              size={18}
              color={colors.foreground}
            />
            <Text
              style={[styles.secondaryActionText, { color: colors.foreground }]}
            >
              JSON
            </Text>
          </Pressable>
        </View>

        <View style={styles.exportGrid}>
          <Pressable
            style={[styles.shareButton, { backgroundColor: colors.primary }]}
            onPress={() => handleShare("txt")}
          >
            <Ionicons
              name="share-social-outline"
              size={18}
              color={colors.primaryForeground}
            />
            <Text
              style={[
                styles.shareButtonText,
                { color: colors.primaryForeground },
              ]}
            >
              TXT
            </Text>
          </Pressable>

          <Pressable
            style={[styles.shareButton, { backgroundColor: colors.primary }]}
            onPress={() => handleShare("js")}
          >
            <Ionicons
              name="share-social-outline"
              size={18}
              color={colors.primaryForeground}
            />
            <Text
              style={[
                styles.shareButtonText,
                { color: colors.primaryForeground },
              ]}
            >
              JS
            </Text>
          </Pressable>

          <Pressable
            style={[styles.shareButton, { backgroundColor: colors.primary }]}
            onPress={() => handleShare("json")}
          >
            <Ionicons
              name="share-social-outline"
              size={18}
              color={colors.primaryForeground}
            />
            <Text
              style={[
                styles.shareButtonText,
                { color: colors.primaryForeground },
              ]}
            >
              JSON
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.meta}>
        <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
          Created: {formatDate(snippet.createdAt)}
        </Text>
        <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
          Updated: {formatDate(snippet.updatedAt)}
        </Text>
      </View>
    </ScrollView>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

function isSameSnippet(current: Snippet | null, next: Snippet | null) {
  if (current === next) {
    return true;
  }

  if (!current || !next) {
    return false;
  }

  return (
    current.id === next.id &&
    current.title === next.title &&
    current.language === next.language &&
    current.code === next.code &&
    current.isFavorite === next.isFavorite &&
    current.createdAt === next.createdAt &&
    current.updatedAt === next.updatedAt &&
    current.tags.join("\u0000") === next.tags.join("\u0000")
  );
}

function areSameAttachments(
  current: SnippetAttachment[],
  next: SnippetAttachment[],
) {
  return current.length === next.length && current.every((attachment, index) => {
    const nextAttachment = next[index];

    return (
      attachment.id === nextAttachment.id &&
      attachment.snippetId === nextAttachment.snippetId &&
      attachment.uri === nextAttachment.uri &&
      attachment.createdAt === nextAttachment.createdAt
    );
  });
}

function getExportContent(snippet: Snippet, format: SnippetExportFormat) {
  if (format === "json") {
    return JSON.stringify(snippet, null, 2);
  }

  return snippet.code;
}

function getExportFilename(snippet: Snippet, format: SnippetExportFormat) {
  const safeTitle = snippet.title.replace(/[^a-z0-9]/gi, "-").toLowerCase();

  return `${safeTitle}.${format}`;
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
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  header: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  titleArea: {
    flex: 1,
  },
  title: {
    ...fontStyles.extraBold,
    fontSize: 28,
  },
  language: {
    ...fontStyles.extraBold,
    fontSize: 14,
    marginTop: 6,
  },
  favoriteButton: {
    minWidth: 52,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 18,
  },
  tagChip: {
    height: 28,
    paddingHorizontal: 10,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  tagText: {
    ...fontStyles.bold,
    fontSize: 12,
    lineHeight: 16,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    ...fontStyles.extraBold,
    fontSize: 15,
    marginBottom: 10,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 10,
  },
  attachButton: {
    height: 36,
    borderRadius: 8,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  attachButtonText: {
    ...fontStyles.bold,
    fontSize: 12,
  },
  emptyAttachmentText: {
    ...fontStyles.regular,
    fontSize: 13,
  },
  attachmentRow: {
    flexDirection: "row",
    gap: 12,
  },
  attachmentCard: {
    width: 140,
    height: 110,
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
  },
  attachmentImage: {
    width: "100%",
    height: "100%",
  },
  attachmentDeleteButton: {
    position: "absolute",
    right: 8,
    top: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  codeBlock: {
    borderRadius: 8,
    padding: 14,
  },
  codeText: {
    minWidth: "100%",
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  primaryButton: {
    flex: 1,
    height: 50,
    borderRadius: 8,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    ...fontStyles.extraBold,
    fontSize: 15,
  },
  dangerButton: {
    flex: 1,
    height: 50,
    borderRadius: 8,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  dangerButtonText: {
    ...fontStyles.extraBold,
    fontSize: 15,
  },
  secondaryButton: {
    marginTop: 16,
    height: 46,
    paddingHorizontal: 18,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    ...fontStyles.extraBold,
    fontSize: 15,
  },
  emptyTitle: {
    ...fontStyles.extraBold,
    fontSize: 18,
  },
  meta: {
    marginTop: 22,
    gap: 6,
  },
  metaText: {
    ...fontStyles.regular,
    fontSize: 12,
  },
  exportButton: {
    flex: 1,
    height: 50,
    borderRadius: 8,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryActionText: {
    ...fontStyles.extraBold,
    fontSize: 14,
  },
  exportActions: {
    marginTop: 24,
  },
  exportGrid: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  shareButton: {
    flex: 1,
    height: 50,
    borderRadius: 8,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  shareButtonText: {
    ...fontStyles.extraBold,
    fontSize: 14,
  },
});
