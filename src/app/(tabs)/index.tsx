import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { useAppAlert } from "../../components/AppAlert";
import EmptyState from "../../components/EmptyState";
import SnippetCard from "../../components/SnippetCard";
import { getSnippets, toggleFavorite } from "../../db/snippet";
import { fontStyles } from "../../fontDefaults";
import { useAppTheme } from "../../theme";
import { Snippet } from "../../types/snippet";

export default function HomeScreen() {
  const [search, setSearch] = useState("");
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const { width } = useWindowDimensions();
  const { colors } = useAppTheme();
  const { showAlert } = useAppAlert();

  const isWide = width >= 768;

  const loadSnippets = useCallback(() => {
    try {
      setSnippets(getSnippets(search));
    } catch {
      showAlert("Storage error", "Could not load snippets.");
    }
  }, [search, showAlert]);

  useFocusEffect(
    useCallback(() => {
      loadSnippets();
    }, [loadSnippets]),
  );

  function handleSearch(value: string) {
    setSearch(value);
    setSnippets(getSnippets(value));
  }

  function handleToggleFavorite(snippet: Snippet) {
    toggleFavorite(snippet.id, !snippet.isFavorite);
    loadSnippets();
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingHorizontal: isWide ? 32 : 18,
        },
      ]}
    >
      <View style={styles.header}>
        <View>
          <Text
            style={[
              styles.title,
              { color: colors.foreground, fontSize: isWide ? 34 : 30 },
            ]}
          >
            DevShelf
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Your offline code library
          </Text>
        </View>
      </View>

      <TextInput
        value={search}
        onChangeText={handleSearch}
        placeholder="Search snippets, code, or language"
        placeholderTextColor={colors.mutedForeground}
        style={[
          styles.searchInput,
          {
            backgroundColor: colors.card,
            borderColor: colors.input,
            color: colors.foreground,
          },
        ]}
      />

      <FlatList
        data={snippets}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={[
          styles.listContent,
          {
            maxWidth: isWide ? 760 : undefined,
            alignSelf: "stretch",
            width: "100%",
          },
        ]}
        ListEmptyComponent={
          <EmptyState
            title="No snippets yet"
            message="Create your first reusable code snippet."
          />
        }
        renderItem={({ item }) => (
          <SnippetCard
            snippet={item}
            onPress={() => router.push(`/snippet/${item.id}`)}
            onToggleFavorite={() => handleToggleFavorite(item)}
          />
        )}
      />

      <Pressable
        style={[styles.createButton, { backgroundColor: colors.primary }]}
        onPress={() => router.push("/snippet/new")}
      >
        <Ionicons name="add" size={30} color={colors.primaryForeground} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 56,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    ...fontStyles.extraBold,
  },
  subtitle: {
    ...fontStyles.regular,
    fontSize: 14,
    marginTop: 4,
  },
  createButton: {
    position: "absolute",
    right: 22,
    bottom: 118,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
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
  listContent: {
    paddingVertical: 18,
    gap: 12,
  },
});
