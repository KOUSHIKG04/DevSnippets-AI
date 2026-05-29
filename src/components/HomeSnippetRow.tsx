import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { fontStyles } from "../fontDefaults";
import { useAppTheme } from "../theme";
import { Snippet } from "../types/snippet";

type HomeSnippetRowProps = {
  snippet: Snippet;
  onPress: () => void;
  onToggleFavorite: () => void;
};

export function HomeSnippetRow({
  snippet,
  onPress,
  onToggleFavorite,
}: HomeSnippetRowProps) {
  const { colors } = useAppTheme();

  return (
    <Pressable
      style={[
        styles.snippetRow,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
      onPress={onPress}
    >
      <View
        style={[
          styles.languageBadge,
          {
            backgroundColor: colors.code,
            borderColor: colors.border,
          },
        ]}
      >
        <Text style={[styles.languageBadgeText, { color: colors.codeAccent }]}>
          {getLanguageInitials(snippet.language)}
        </Text>
      </View>

      <View style={styles.snippetInfo}>
        <Text
          numberOfLines={1}
          style={[styles.snippetTitle, { color: colors.foreground }]}
        >
          {snippet.title}
        </Text>
        <Text
          numberOfLines={1}
          style={[styles.snippetMeta, { color: colors.mutedForeground }]}
        >
          {snippet.language}
        </Text>
      </View>

      <Pressable style={styles.favoriteButton} onPress={onToggleFavorite}>
        <Ionicons
          name={snippet.isFavorite ? "heart" : "heart-outline"}
          size={22}
          color={snippet.isFavorite ? colors.codeAccent : colors.mutedForeground}
        />
      </Pressable>
    </Pressable>
  );
}

function getLanguageInitials(language: string) {
  const cleanLanguage = language.trim();

  if (!cleanLanguage) {
    return "</>";
  }

  return cleanLanguage.slice(0, 2).toUpperCase();
}

const styles = StyleSheet.create({
  snippetRow: {
    minHeight: 84,
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  languageBadge: {
    width: 56,
    height: 56,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  languageBadgeText: {
    ...fontStyles.extraBold,
    fontSize: 18,
  },
  snippetInfo: {
    flex: 1,
    minWidth: 0,
  },
  snippetTitle: {
    ...fontStyles.extraBold,
    fontSize: 16,
  },
  snippetMeta: {
    ...fontStyles.regular,
    fontSize: 13,
    marginTop: 5,
    textTransform: "lowercase",
  },
  favoriteButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
});
