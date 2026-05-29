import { ImageBackground } from "expo-image";
import { router, useFocusEffect } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { useAppAlert } from "../../components/AppAlert";
import EmptyState from "../../components/EmptyState";
import { HomeHeader } from "../../components/HomeHeader";
import { HomeHero } from "../../components/HomeHero";
import { HomeRecentHeader } from "../../components/HomeRecentHeader";
import { HomeSearchField } from "../../components/HomeSearchField";
import { HomeSnippetRow } from "../../components/HomeSnippetRow";
import { getSnippets, toggleFavorite } from "../../db/snippet";
import { useAppTheme } from "../../theme";
import { Snippet } from "../../types/snippet";

const homeTexture = require("../../../assets/images/—Pngtree—grunge overlay texture_9025510.png");

export default function HomeScreen() {
  const [search, setSearch] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { width } = useWindowDimensions();
  const { colors, colorScheme } = useAppTheme();
  const { showAlert } = useAppAlert();

  const isWide = width >= 768;

  function loadSnippets() {
    try {
      setSnippets(getSnippets(search));
    } catch {
      showAlert("Storage error", "Could not load snippets.");
    }
    setIsLoading(false);
  }

  useFocusEffect(() => {
    loadSnippets();
  });

  useEffect(() => {
    const showSubscription = Keyboard.addListener("keyboardDidShow", () => {
      setIsSearchFocused(true);
    });
    const hideSubscription = Keyboard.addListener("keyboardDidHide", () => {
      setIsSearchFocused(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  function handleSearch(value: string) {
    setSearch(value);
    setSnippets(getSnippets(value));
  }

  function handleToggleFavorite(snippet: Snippet) {
    toggleFavorite(snippet.id, !snippet.isFavorite);
    loadSnippets();
  }

  function renderSnippet({ item }: { item: Snippet }) {
    return (
      <HomeSnippetRow
        snippet={item}
        onPress={() => router.push(`/snippet/${item.id}`)}
        onToggleFavorite={() => handleToggleFavorite(item)}
      />
    );
  }

  return (
    <ImageBackground
      source={homeTexture}
      contentFit="cover"
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      <View
        style={[
          styles.backdrop,
          {
            backgroundColor:
              colorScheme === "dark"
                ? "rgba(10, 10, 10, 0.88)"
                : "rgba(255, 255, 255, 0.9)",
          },
        ]}
      />
      {isLoading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={snippets}
          keyExtractor={(item) => String(item.id)}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.listContent,
            {
              maxWidth: isWide ? 820 : undefined,
              alignSelf: "center",
              paddingHorizontal: isWide ? 32 : 18,
              width: "100%",
            },
          ]}
          ListHeaderComponent={
            <>
              <HomeHeader />
              {!isSearchFocused && (
                <HomeHero onCreatePress={() => router.push("/snippet/new")} />
              )}
              <HomeSearchField
                value={search}
                onBlur={() => setIsSearchFocused(false)}
                onChangeText={handleSearch}
                onFocus={() => setIsSearchFocused(true)}
              />
              <HomeRecentHeader count={snippets.length} />
            </>
          }
          ListEmptyComponent={
            <EmptyState
              title="No snippets yet"
              message="Create your first reusable code snippet."
            />
          }
          renderItem={renderSnippet}
        />
      )}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  listContent: {
    paddingTop: 56,
    paddingBottom: 220,
    gap: 12,
  },
  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
