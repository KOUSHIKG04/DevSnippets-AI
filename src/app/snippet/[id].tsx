import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useEffect, useReducer, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import {
  AiInsightKind,
  generateSnippetInsight,
} from "../../ai/aiService";
import { AiFormattedText } from "../../components/AiFormattedText";
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
import { getAiApiKey } from "../../storage/secureStore";
import { useAppTheme } from "../../theme";
import { Snippet, SnippetAttachment } from "../../types/snippet";

const EXPORT_FORMAT_OPTIONS: {
  description: string;
  label: string;
  value: SnippetExportFormat;
}[] = [
  { description: "Plain text file", label: "TXT", value: "txt" },
  { description: "JavaScript source file", label: "JS", value: "js" },
  { description: "Structured snippet data", label: "JSON", value: "json" },
];

type DetailUiState = {
  activeExportMenu: "export" | "share" | null;
  aiInsight: string;
  aiInsightKind: AiInsightKind | null;
  isAiMenuOpen: boolean;
  isAiWindowOpen: boolean;
  isGeneratingInsight: boolean;
  selectedAttachment: SnippetAttachment | null;
};

type DetailUiAction =
  | { kind: AiInsightKind; type: "startInsight" }
  | { text: string; type: "finishInsight" }
  | { type: "finishInsightWithError" }
  | { type: "closeAiWindow" }
  | { type: "toggleAiMenu" }
  | { attachment: SnippetAttachment | null; type: "selectAttachment" }
  | { menu: "export" | "share" | null; type: "setExportMenu" };

const initialDetailUiState: DetailUiState = {
  activeExportMenu: null,
  aiInsight: "",
  aiInsightKind: null,
  isAiMenuOpen: false,
  isAiWindowOpen: false,
  isGeneratingInsight: false,
  selectedAttachment: null,
};

function detailUiReducer(
  state: DetailUiState,
  action: DetailUiAction,
): DetailUiState {
  switch (action.type) {
    case "startInsight":
      return {
        ...state,
        aiInsightKind: action.kind,
        isAiMenuOpen: false,
        isAiWindowOpen: true,
        isGeneratingInsight: true,
      };
    case "finishInsight":
      return {
        ...state,
        aiInsight: action.text,
        isGeneratingInsight: false,
      };
    case "finishInsightWithError":
      return { ...state, isGeneratingInsight: false };
    case "closeAiWindow":
      return { ...state, isAiWindowOpen: false, isAiMenuOpen: false };
    case "toggleAiMenu":
      return { ...state, isAiMenuOpen: !state.isAiMenuOpen };
    case "selectAttachment":
      return { ...state, selectedAttachment: action.attachment };
    case "setExportMenu":
      return { ...state, activeExportMenu: action.menu };
    default:
      return state;
  }
}

export default function SnippetDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const snippetId = Number(id);
  const [snippet, setSnippet] = useState<Snippet | null>(() =>
    Number.isFinite(snippetId) ? getSnippetById(snippetId) : null,
  );
  const [attachments, setAttachments] = useState<SnippetAttachment[]>(() =>
    Number.isFinite(snippetId) ? getSnippetAttachments(snippetId) : [],
  );
  const [uiState, dispatchUi] = useReducer(
    detailUiReducer,
    initialDetailUiState,
  );
  const [isScrolledDown, setIsScrolledDown] = useState(false);
  const { colors } = useAppTheme();
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
      dispatchUi({ menu: null, type: "setExportMenu" });
    } catch {
      showAlert("Export failed", "Could not export this snippet.");
      dispatchUi({ menu: null, type: "setExportMenu" });
    }
  }

  async function handleShare(format: SnippetExportFormat) {
    if (!snippet) return;

    try {
      const filename = getExportFilename(snippet, format);
      const content = getExportContent(snippet, format);
      const uri = await saveSnippetExport(filename, content);

      await shareFile(uri);
      dispatchUi({ menu: null, type: "setExportMenu" });
    } catch {
      showAlert("Share failed", "Could not share this snippet.");
      dispatchUi({ menu: null, type: "setExportMenu" });
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

  function handleDeleteAttachment(attachment: SnippetAttachment) {
    showAlert(
      "Delete attachment",
      "This screenshot attachment will be permanently deleted.",
      [
        { label: "Cancel", variant: "cancel" },
        {
          label: "Delete",
          variant: "destructive",
          onPress: async () => {
            try {
              deleteSnippetAttachment(attachment.id);
              await deleteFile(attachment.uri);
              setAttachments(getSnippetAttachments(attachment.snippetId));
            } catch {
              showAlert("Delete failed", "Could not delete this attachment.");
            }
          },
        },
      ],
    );
  }

  async function handleShareAttachment(attachment: SnippetAttachment) {
    try {
      await shareFile(attachment.uri);
    } catch {
      showAlert("Share failed", "Could not share this attachment.");
    }
  }

  async function handleGenerateInsight(kind: AiInsightKind) {
    if (!snippet) return;

    const apiKey = await getAiApiKey();

    if (!apiKey?.trim()) {
      dispatchUi({ type: "closeAiWindow" });
      showAlert("AI setup needed", "Add your Gemini API key in Settings first.");
      return;
    }

    dispatchUi({ kind, type: "startInsight" });

    try {
      dispatchUi({
        text: await generateSnippetInsight(snippet, kind),
        type: "finishInsight",
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Could not generate an AI response.";

      showAlert("AI request failed", message);
      dispatchUi({ type: "finishInsightWithError" });
    }
  }

  function handleScroll(offsetY: number) {
    const shouldMoveToTop = offsetY > 60;

    setIsScrolledDown((currentValue) =>
      currentValue === shouldMoveToTop ? currentValue : shouldMoveToTop,
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.container}
        onScroll={(event) => handleScroll(event.nativeEvent.contentOffset.y)}
        scrollEventThrottle={16}
      >
        <SnippetDetailHeader
          snippet={snippet}
          onBack={() => router.back()}
          onToggleFavorite={handleToggleFavorite}
        />
        <SnippetTagList tags={snippet.tags} />
        <SnippetCodeSection snippet={snippet} />
        <SnippetAttachmentsSection
          attachments={attachments}
          onAttach={handleAttachScreenshot}
          onDeleteAttachment={handleDeleteAttachment}
          onPreviewAttachment={(attachment) =>
            dispatchUi({ attachment, type: "selectAttachment" })
          }
        />
        <SnippetDetailActions snippet={snippet} onDelete={handleDelete} />
        <SnippetExportControls
          onOpenExport={() =>
            dispatchUi({ menu: "export", type: "setExportMenu" })
          }
          onOpenShare={() =>
            dispatchUi({ menu: "share", type: "setExportMenu" })
          }
        />
        <SnippetMeta snippet={snippet} />
      </ScrollView>

      <FloatingAiAssistant
        isAtTop={isScrolledDown}
        uiState={uiState}
        onCloseWindow={() => dispatchUi({ type: "closeAiWindow" })}
        onGenerateInsight={handleGenerateInsight}
        onToggleMenu={() => dispatchUi({ type: "toggleAiMenu" })}
      />
      <AttachmentPreviewModal
        attachment={uiState.selectedAttachment}
        onClose={() =>
          dispatchUi({ attachment: null, type: "selectAttachment" })
        }
        onShare={handleShareAttachment}
      />
      <ExportFormatModal
        activeMenu={uiState.activeExportMenu}
        onClose={() => dispatchUi({ menu: null, type: "setExportMenu" })}
        onExport={handleExport}
        onShare={handleShare}
      />
    </View>
  );
}

function getInsightTitle(kind: AiInsightKind) {
  if (kind === "explain") {
    return "Explanation";
  }

  if (kind === "summarize") {
    return "Summary";
  }

  return "Improvement Suggestions";
}

function SnippetDetailHeader({
  onBack,
  onToggleFavorite,
  snippet,
}: {
  onBack: () => void;
  onToggleFavorite: () => void;
  snippet: Snippet;
}) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.header}>
      <View style={styles.titleArea}>
        <View style={styles.headerTitleRow}>
          <Pressable style={styles.backButton} onPress={onBack}>
            <Ionicons name="arrow-back" size={24} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.title, { color: colors.foreground }]}>
            {snippet.title}
          </Text>
        </View>
        <Text style={[styles.language, { color: colors.codeAccent }]}>
          {snippet.language}
        </Text>
      </View>

      <Pressable
        style={[
          styles.favoriteButton,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
        onPress={onToggleFavorite}
      >
        <Ionicons
          name={snippet.isFavorite ? "heart" : "heart-outline"}
          size={22}
          color={colors.codeAccent}
        />
      </Pressable>
    </View>
  );
}

function SnippetTagList({ tags }: { tags: string[] }) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.tags}>
      {tags.map((tag) => (
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
  );
}

function SnippetCodeSection({ snippet }: { snippet: Snippet }) {
  const { colors, editorFontSize, fonts } = useAppTheme();

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
        Code
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator
        style={[styles.codeBlock, { backgroundColor: colors.code }]}
      >
        <SyntaxHighlightedCode
          code={snippet.code}
          selectable
          style={[
            styles.codeText,
            {
              fontFamily: fonts.mono,
              fontSize: editorFontSize,
              lineHeight: Math.round(editorFontSize * 1.55),
            },
          ]}
        />
      </ScrollView>
    </View>
  );
}

function FloatingAiAssistant({
  isAtTop,
  onCloseWindow,
  onGenerateInsight,
  onToggleMenu,
  uiState,
}: {
  isAtTop: boolean;
  onCloseWindow: () => void;
  onGenerateInsight: (kind: AiInsightKind) => void;
  onToggleMenu: () => void;
  uiState: DetailUiState;
}) {
  const { colors, fonts } = useAppTheme();
  const pulseProgress = useSharedValue(0);
  const verticalOffset = useSharedValue(0);
  const shouldShowWindow = uiState.isAiWindowOpen;

  useEffect(() => {
    pulseProgress.set(withRepeat(
      withSequence(
        withTiming(1, {
          duration: 1500,
          easing: Easing.out(Easing.cubic),
        }),
        withTiming(0, { duration: 0 }),
      ),
      -1,
    ));

    return () => {
      pulseProgress.set(0);
    };
  }, [pulseProgress]);

  useEffect(() => {
    verticalOffset.set(
      withSpring(isAtTop ? -470 : 0, {
        damping: 20,
        stiffness: 160,
      }),
    );
  }, [isAtTop, verticalOffset]);

  const pulseAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulseProgress.get(), [0, 0.75, 1], [0.35, 0.12, 0]),
    transform: [
      {
        scale: interpolate(pulseProgress.get(), [0, 1], [1, 1.65]),
      },
    ],
  }));
  const layerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: verticalOffset.get() }],
  }));

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.floatingAiLayer,
        layerAnimatedStyle,
      ]}
    >
      {shouldShowWindow && (
        <View
          style={[
            styles.floatingAiPanel,
            isAtTop ? styles.floatingAiPanelBelow : styles.floatingAiPanelAbove,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.floatingAiPanelHeader}>
            <View style={styles.floatingAiPanelTitleBlock}>
              <Text
                style={[styles.aiPanelTitle, { color: colors.foreground }]}
              >
                {uiState.aiInsightKind
                  ? getInsightTitle(uiState.aiInsightKind)
                  : "AI response"}
              </Text>
            </View>
            <Pressable
              style={[
                styles.floatingAiClose,
                { backgroundColor: colors.secondary },
              ]}
              onPress={onCloseWindow}
            >
              <Ionicons name="close" size={18} color={colors.foreground} />
            </Pressable>
          </View>

          {uiState.isGeneratingInsight ? (
            <View style={styles.aiLoading}>
              <ActivityIndicator color={colors.primary} />
              <Text
                style={[
                  styles.aiLoadingText,
                  { color: colors.mutedForeground },
                ]}
              >
                Generating…
              </Text>
            </View>
          ) : (
            <ScrollView
              nestedScrollEnabled
              showsVerticalScrollIndicator
              style={styles.floatingAiResponse}
              contentContainerStyle={styles.floatingAiResponseContent}
            >
              <AiFormattedText
                text={uiState.aiInsight}
                colors={colors}
                monoFontFamily={fonts.mono}
              />
            </ScrollView>
          )}
        </View>
      )}

      {uiState.isAiMenuOpen && (
        <View
          style={[
            styles.floatingAiMenu,
            isAtTop ? styles.floatingAiMenuBelow : styles.floatingAiMenuAbove,
          ]}
        >
        {(["explain", "summarize", "improve"] as AiInsightKind[]).map(
          (kind) => (
            <Pressable
              key={kind}
              disabled={uiState.isGeneratingInsight}
              style={[
                styles.floatingAiMenuItem,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              onPress={() => onGenerateInsight(kind)}
            >
              <Text
                style={[
                  styles.floatingAiMenuText,
                  { color: colors.foreground },
                ]}
              >
                {getInsightActionLabel(kind)}
              </Text>
              <Ionicons
                name="sparkles-outline"
                size={16}
                color={colors.codeAccent}
              />
            </Pressable>
          ),
        )}
        </View>
      )}

      <View style={styles.floatingAiButtonWrap}>
        <Animated.View
          pointerEvents="none"
          style={[
            styles.floatingAiPulse,
            {
              backgroundColor: colors.primary,
            },
            pulseAnimatedStyle,
          ]}
        />
        <Pressable
          style={[styles.floatingAiButton, { backgroundColor: colors.primary }]}
          onPress={onToggleMenu}
        >
          <Text
            style={[
              styles.floatingAiButtonText,
              { color: colors.primaryForeground },
            ]}
          >
            AI
          </Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

function getInsightActionLabel(kind: AiInsightKind) {
  if (kind === "explain") return "Explain";
  if (kind === "summarize") return "Summarize";
  return "Improve";
}

function SnippetAttachmentsSection({
  attachments,
  onAttach,
  onDeleteAttachment,
  onPreviewAttachment,
}: {
  attachments: SnippetAttachment[];
  onAttach: () => void;
  onDeleteAttachment: (attachment: SnippetAttachment) => void;
  onPreviewAttachment: (attachment: SnippetAttachment) => void;
}) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Attachments
        </Text>
        <Pressable
          style={[styles.attachButton, { backgroundColor: colors.secondary }]}
          onPress={onAttach}
        >
          <Ionicons name="image-outline" size={18} color={colors.foreground} />
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
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <Pressable
                  style={styles.attachmentPreviewButton}
                  onPress={() => onPreviewAttachment(attachment)}
                >
                  <Image
                    source={{ uri: attachment.uri }}
                    style={styles.attachmentImage}
                  />
                </Pressable>
                <Pressable
                  style={[
                    styles.attachmentDeleteButton,
                    { backgroundColor: colors.destructive },
                  ]}
                  onPress={() => onDeleteAttachment(attachment)}
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
  );
}

function SnippetDetailActions({
  onDelete,
  snippet,
}: {
  onDelete: () => void;
  snippet: Snippet;
}) {
  const { colors } = useAppTheme();

  return (
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
        onPress={onDelete}
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
  );
}

function SnippetExportControls({
  onOpenExport,
  onOpenShare,
}: {
  onOpenExport: () => void;
  onOpenShare: () => void;
}) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.exportActions}>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
        Export
      </Text>
      <View style={styles.exportDropdownRow}>
        <Pressable
          style={[
            styles.exportDropdown,
            { backgroundColor: colors.secondary, borderColor: colors.border },
          ]}
          onPress={onOpenExport}
        >
          <Ionicons
            name="download-outline"
            size={18}
            color={colors.foreground}
          />
          <Text style={[styles.exportDropdownText, { color: colors.foreground }]}>
            Save as
          </Text>
          <Ionicons
            name="chevron-down"
            size={18}
            color={colors.mutedForeground}
          />
        </Pressable>

        <Pressable
          style={[
            styles.exportDropdown,
            { backgroundColor: colors.primary, borderColor: colors.primary },
          ]}
          onPress={onOpenShare}
        >
          <Ionicons
            name="share-social-outline"
            size={18}
            color={colors.primaryForeground}
          />
          <Text
            style={[
              styles.exportDropdownText,
              { color: colors.primaryForeground },
            ]}
          >
            Share as
          </Text>
          <Ionicons
            name="chevron-down"
            size={18}
            color={colors.primaryForeground}
          />
        </Pressable>
      </View>
    </View>
  );
}

function SnippetMeta({ snippet }: { snippet: Snippet }) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.meta}>
      <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
        Created: {formatDate(snippet.createdAt)}
      </Text>
      <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
        Updated: {formatDate(snippet.updatedAt)}
      </Text>
    </View>
  );
}

function AttachmentPreviewModal({
  attachment,
  onClose,
  onShare,
}: {
  attachment: SnippetAttachment | null;
  onClose: () => void;
  onShare: (attachment: SnippetAttachment) => void;
}) {
  const { colors } = useAppTheme();

  return (
    <Modal
      transparent
      animationType="fade"
      visible={Boolean(attachment)}
      onRequestClose={onClose}
    >
      <View style={styles.previewBackdrop}>
        <View
          style={[
            styles.previewPanel,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.previewHeader}>
            <View style={styles.previewHeaderText}>
              <Text style={[styles.previewTitle, { color: colors.foreground }]}>
                Attachment
              </Text>
              {attachment && (
                <Text
                  style={[
                    styles.previewMeta,
                    { color: colors.mutedForeground },
                  ]}
                >
                  Added {formatDate(attachment.createdAt)}
                </Text>
              )}
            </View>
            <Pressable
              style={[styles.previewClose, { backgroundColor: colors.secondary }]}
              onPress={onClose}
            >
              <Ionicons name="close" size={22} color={colors.foreground} />
            </Pressable>
          </View>

          {attachment && (
            <View style={styles.previewImageWrap}>
              <Image
                source={{ uri: attachment.uri }}
                style={styles.previewImage}
                contentFit="contain"
              />
              <Pressable
                style={[
                  styles.previewShareIcon,
                  { backgroundColor: colors.primary },
                ]}
                onPress={() => onShare(attachment)}
              >
                <Ionicons
                  name="share-social-outline"
                  size={20}
                  color={colors.primaryForeground}
                />
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

function ExportFormatModal({
  activeMenu,
  onClose,
  onExport,
  onShare,
}: {
  activeMenu: "export" | "share" | null;
  onClose: () => void;
  onExport: (format: SnippetExportFormat) => void;
  onShare: (format: SnippetExportFormat) => void;
}) {
  const { colors } = useAppTheme();

  return (
    <Modal
      transparent
      animationType="fade"
      visible={activeMenu !== null}
      onRequestClose={onClose}
    >
      <Pressable style={styles.menuBackdrop} onPress={onClose}>
        <Pressable
          style={[
            styles.exportMenu,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.exportMenuTitle, { color: colors.foreground }]}>
            {activeMenu === "share" ? "Share format" : "Export format"}
          </Text>

          {EXPORT_FORMAT_OPTIONS.map((option) => (
            <Pressable
              key={option.value}
              style={[styles.exportMenuItem, { borderColor: colors.border }]}
              onPress={() =>
                activeMenu === "share"
                  ? onShare(option.value)
                  : onExport(option.value)
              }
            >
              <View>
                <Text
                  style={[
                    styles.exportMenuItemTitle,
                    { color: colors.foreground },
                  ]}
                >
                  {option.label}
                </Text>
                <Text
                  style={[
                    styles.exportMenuItemMeta,
                    { color: colors.mutedForeground },
                  ]}
                >
                  {option.description}
                </Text>
              </View>
              <Ionicons
                name={
                  activeMenu === "share"
                    ? "share-social-outline"
                    : "download-outline"
                }
                size={18}
                color={colors.codeAccent}
              />
            </Pressable>
          ))}
        </Pressable>
      </Pressable>
    </Modal>
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
    flex: 1,
    fontSize: 28,
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
  aiActions: {
    flexDirection: "row",
    gap: 8,
  },
  aiButton: {
    flex: 1,
    height: 42,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  aiButtonText: {
    ...fontStyles.extraBold,
    fontSize: 12,
  },
  aiPanel: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    marginTop: 12,
  },
  aiPanelTitle: {
    ...fontStyles.extraBold,
    fontSize: 15,
    marginBottom: 10,
  },
  aiLoading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  aiLoadingText: {
    ...fontStyles.regular,
    fontSize: 13,
  },
  floatingAiLayer: {
    position: "absolute",
    left: 18,
    right: 18,
    bottom: 108,
    alignItems: "flex-end",
    gap: 10,
    zIndex: 10,
  },
  floatingAiButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0px 8px 18px rgba(0, 0, 0, 0.22)",
  },
  floatingAiButtonText: {
    ...fontStyles.extraBold,
    fontSize: 18,
    lineHeight: 24,
  },
  floatingAiButtonWrap: {
    width: 66,
    height: 66,
    alignItems: "center",
    justifyContent: "center",
  },
  floatingAiPulse: {
    position: "absolute",
    width: 58,
    height: 58,
    borderRadius: 29,
  },
  floatingAiMenu: {
    position: "absolute",
    right: 0,
    gap: 8,
  },
  floatingAiMenuAbove: {
    bottom: 74,
  },
  floatingAiMenuBelow: {
    top: 74,
  },
  floatingAiMenuItem: {
    minWidth: 150,
    minHeight: 42,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    boxShadow: "0px 5px 12px rgba(0, 0, 0, 0.16)",
  },
  floatingAiMenuText: {
    ...fontStyles.extraBold,
    fontSize: 12,
  },
  floatingAiPanel: {
    position: "absolute",
    right: 0,
    width: "100%",
    maxWidth: 370,
    maxHeight: 540,
    borderRadius: 8,
    borderWidth: 1,
    padding: 14,
    boxShadow: "0px 10px 24px rgba(0, 0, 0, 0.22)",
  },
  floatingAiPanelAbove: {
    bottom: 74,
  },
  floatingAiPanelBelow: {
    top: 74,
  },
  floatingAiPanelHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },
  floatingAiPanelTitleBlock: {
    flex: 1,
    minWidth: 0,
  },
  floatingAiClose: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  floatingAiResponse: {
    height: 452,
  },
  floatingAiResponseContent: {
    paddingBottom: 12,
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
  attachmentPreviewButton: {
    flex: 1,
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
  exportActions: {
    marginTop: 24,
  },
  exportDropdownRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  exportDropdown: {
    flex: 1,
    height: 50,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  exportDropdownText: {
    ...fontStyles.extraBold,
    flex: 1,
    fontSize: 14,
    textAlign: "center",
  },
  menuBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.48)",
    justifyContent: "flex-end",
    padding: 18,
  },
  exportMenu: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
  },
  exportMenuTitle: {
    ...fontStyles.extraBold,
    fontSize: 15,
    marginBottom: 8,
  },
  exportMenuItem: {
    minHeight: 58,
    borderTopWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 10,
  },
  exportMenuItemTitle: {
    ...fontStyles.extraBold,
    fontSize: 14,
  },
  exportMenuItemMeta: {
    ...fontStyles.regular,
    fontSize: 12,
    marginTop: 3,
  },
  previewBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.74)",
    justifyContent: "center",
    padding: 18,
  },
  previewPanel: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 14,
    maxHeight: "86%",
  },
  previewHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 12,
  },
  previewHeaderText: {
    flex: 1,
  },
  previewTitle: {
    ...fontStyles.extraBold,
    fontSize: 16,
  },
  previewMeta: {
    ...fontStyles.regular,
    fontSize: 12,
    marginTop: 4,
  },
  previewClose: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  previewImageWrap: {
    position: "relative",
    borderRadius: 8,
    overflow: "hidden",
  },
  previewImage: {
    width: "100%",
    height: 420,
    borderRadius: 8,
  },
  previewShareIcon: {
    position: "absolute",
    right: 8,
    bottom: 10,
    width: 38,
    height: 38,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
});
