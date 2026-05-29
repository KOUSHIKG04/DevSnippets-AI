import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useFocusEffect } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import EmptyState from "../../components/EmptyState";
import SnippetCard from "../../components/SnippetCard";
import { getFavoriteSnippets, toggleFavorite } from "../../db/snippet";
import { fontStyles } from "../../fontDefaults";
import { useAppTheme } from "../../theme";
import { Snippet } from "../../types/snippet";

export default function FavoritesScreen() {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { colors } = useAppTheme();

  function loadFavorites() {
    setSnippets(getFavoriteSnippets());
    setIsLoading(false);
  }

  useFocusEffect(() => {
    loadFavorites();
  });

  function handleRemoveFavorite(snippet: Snippet) {
    toggleFavorite(snippet.id, false);
    loadFavorites();
  }

  function handleRefresh() {
    setIsRefreshing(true);
    setSnippets(getFavoriteSnippets());
    setIsRefreshing(false);
  }

  function handleOpenSnippet(snippet: Snippet) {
    router.push(`/snippet/${snippet.id}`);
  }

  function renderSnippet({ item }: { item: Snippet }) {
    return (
      <FavoriteSnippetRow
        snippet={item}
        onOpen={handleOpenSnippet}
        onRemove={handleRemoveFavorite}
      />
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <View>
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
              Favorites
            </Text>
          </View>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={snippets}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
              progressBackgroundColor={colors.card}
            />
          }
          ListEmptyComponent={
            <EmptyState
              title="No favorites yet"
              message="Mark snippets as favorites to see them here."
            />
          }
          renderItem={renderSnippet}
        />
      )}
    </View>
  );
}

function FavoriteSnippetRow({
  onOpen,
  onRemove,
  snippet,
}: {
  onOpen: (snippet: Snippet) => void;
  onRemove: (snippet: Snippet) => void;
  snippet: Snippet;
}) {
  function handlePress() {
    onOpen(snippet);
  }

  function handleToggleFavorite() {
    onRemove(snippet);
  }

  return (
    <SnippetCard
      snippet={snippet}
      onPress={handlePress}
      onToggleFavorite={handleToggleFavorite}
    />
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
  listContent: {
    paddingVertical: 18,
    gap: 12,
  },
  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
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
