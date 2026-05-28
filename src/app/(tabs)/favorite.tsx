import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import EmptyState from "../../components/EmptyState";
import SnippetCard from "../../components/SnippetCard";
import { getFavoriteSnippets, toggleFavorite } from "../../db/snippet";
import { fontStyles } from "../../fontDefaults";
import { useAppTheme } from "../../theme";
import { Snippet } from "../../types/snippet";

export default function FavoritesScreen() {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const { colors } = useAppTheme();

  const loadFavorites = useCallback(() => {
    setSnippets(getFavoriteSnippets());
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadFavorites();
    }, [loadFavorites]),
  );

  function handleRemoveFavorite(snippet: Snippet) {
    toggleFavorite(snippet.id, false);
    loadFavorites();
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.foreground }]}>
            Favorites
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Quick access to important snippets
          </Text>
        </View>
      </View>

      <FlatList
        data={snippets}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <EmptyState
            title="No favorites yet"
            message="Mark snippets as favorites to see them here."
          />
        }
        renderItem={({ item }) => (
          <SnippetCard
            snippet={item}
            onPress={() => router.push(`/snippet/${item.id}`)}
            onToggleFavorite={() => handleRemoveFavorite(item)}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 56,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
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
  listContent: {
    paddingVertical: 18,
    gap: 12,
  },
  searchInput: {
    ...fontStyles.regular,
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 14,
    fontSize: 15,
    marginTop: 22,
    borderWidth: 1,
  },
});
