import Ionicons from "@expo/vector-icons/Ionicons";
import { ImageBackground } from "expo-image";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { fontStyles } from "../fontDefaults";
import { useAppTheme } from "../theme";

const heroTexture = require("../../assets/images/—Pngtree—grunge overlay texture_9025510.png");

type HomeHeroProps = {
  onCreatePress: () => void;
};

export function HomeHero({ onCreatePress }: HomeHeroProps) {
  const { colors, colorScheme } = useAppTheme();

  return (
    <ImageBackground
      source={heroTexture}
      contentFit="cover"
      style={[
        styles.hero,
        {
          backgroundColor: colorScheme === "dark" ? "#111111" : "#fff8d7",
          borderColor: colors.border,
        },
      ]}
    >
      <View
        style={[
          styles.heroOverlay,
          {
            backgroundColor:
              colorScheme === "dark"
                ? "rgba(0, 0, 0, 0.62)"
                : "rgba(255, 255, 255, 0.72)",
          },
        ]}
      />
      <View style={styles.heroCopy}>
        <Text style={[styles.heroTitle, { color: colors.foreground }]}>
          Build your code library
        </Text>
        <Text style={[styles.heroSubtitle, { color: colors.mutedForeground }]}>
          Save, search, favorite, and export snippets from one offline
          workspace.
        </Text>

        <Pressable
          style={[styles.heroButton, { backgroundColor: colors.primary }]}
          onPress={onCreatePress}
        >
          <Text
            style={[styles.heroButtonText, { color: colors.primaryForeground }]}
          >
            New Snippet
          </Text>
          <Ionicons name="add" size={22} color={colors.primaryForeground} />
        </Pressable>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  hero: {
    minHeight: 230,
    borderRadius: 8,
    borderWidth: 1,
    padding: 22,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  heroCopy: {
    flex: 1,
    zIndex: 1,
  },
  heroTitle: {
    ...fontStyles.extraBold,
    fontSize: 28,
    lineHeight: 36,
  },
  heroSubtitle: {
    ...fontStyles.regular,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 12,
  },
  heroButton: {
    height: 50,
    borderRadius: 8,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
    gap: 10,
    marginTop: 24,
  },
  heroButtonText: {
    ...fontStyles.extraBold,
    fontSize: 15,
  },
  textureLine: {
    position: "absolute",
    height: 2,
    borderRadius: 999,
    opacity: 0.24,
  },
  textureLineOne: {
    right: 22,
    bottom: 54,
    width: 132,
  },
  textureLineTwo: {
    right: 64,
    bottom: 34,
    width: 86,
  },
});
