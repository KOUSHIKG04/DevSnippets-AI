import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { fontStyles } from "../fontDefaults";
import { useAppTheme } from "../theme";
import { Snippet } from "../types/snippet";
import { SyntaxHighlightedCode } from "./SyntaxHighlightedCode";

type SnippetCardProps = {
  snippet: Snippet;
  onPress: () => void;
  onToggleFavorite: () => void;
};

export default function SnippetCard({
  snippet,
  onPress,
  onToggleFavorite,
}: SnippetCardProps) {
  const { colors, editorFontSize, fonts } = useAppTheme();

  return (
    <Pressable
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
      onPress={onPress}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleArea}>
          <Text style={[styles.cardTitle, { color: colors.cardForeground }]}>
            {snippet.title}
          </Text>
          <Text style={[styles.language, { color: colors.codeAccent }]}>
            {snippet.language}
          </Text>
        </View>

        <Pressable
          style={[
            styles.favoriteButton,
            { backgroundColor: colors.secondary },
          ]}
          onPress={onToggleFavorite}
        >
          <Ionicons
            name={snippet.isFavorite ? "star" : "star-outline"}
            size={20}
            color={colors.codeAccent}
          />
        </Pressable>
      </View>

      <SyntaxHighlightedCode
        code={snippet.code}
        numberOfLines={3}
        style={[
          styles.codePreview,
          {
            backgroundColor: colors.code,
            fontSize: editorFontSize,
            fontFamily: fonts.mono,
          },
        ]}
      />

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
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  cardTitleArea: {
    flex: 1,
  },
  cardTitle: {
    ...fontStyles.bold,
    fontSize: 17,
  },
  language: {
    ...fontStyles.bold,
    fontSize: 13,
    marginTop: 4,
  },
  favoriteButton: {
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  codePreview: {
    borderRadius: 8,
    padding: 12,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 12,
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  tagChip: {
    height: 28,
    paddingHorizontal: 10,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  tagText: {
    ...fontStyles.semiBold,
    fontSize: 12,
    lineHeight: 16,
  },
});
