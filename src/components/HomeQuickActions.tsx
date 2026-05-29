import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { fontStyles } from "../fontDefaults";
import { useAppTheme } from "../theme";

type HomeQuickActionsProps = {
  onCreatePress: () => void;
  onFavoritesPress: () => void;
  onFilesPress: () => void;
};

export function HomeQuickActions({
  onCreatePress,
  onFavoritesPress,
  onFilesPress,
}: HomeQuickActionsProps) {
  const { colors } = useAppTheme();

  return (
    <>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
        Quick Actions
      </Text>

      <View style={styles.quickGrid}>
        <QuickAction
          icon="sparkles-outline"
          title="Create"
          description="Start a reusable snippet"
          onPress={onCreatePress}
        />
        <QuickAction
          icon="star-outline"
          title="Favorites"
          description="Open saved picks"
          onPress={onFavoritesPress}
        />
        <QuickAction
          icon="folder-outline"
          title="Files"
          description="View local exports"
          onPress={onFilesPress}
        />
      </View>
    </>
  );
}

function QuickAction({
  icon,
  title,
  description,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();

  return (
    <Pressable
      style={[
        styles.quickCard,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
      onPress={onPress}
    >
      <Ionicons name={icon} size={24} color={colors.codeAccent} />
      <Text style={[styles.quickTitle, { color: colors.foreground }]}>
        {title}
      </Text>
      <Text
        numberOfLines={2}
        style={[styles.quickText, { color: colors.mutedForeground }]}
      >
        {description}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    ...fontStyles.extraBold,
    fontSize: 22,
    marginTop: 26,
  },
  quickGrid: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  quickCard: {
    flex: 1,
    minHeight: 132,
    borderRadius: 8,
    borderWidth: 1,
    padding: 14,
    justifyContent: "space-between",
  },
  quickTitle: {
    ...fontStyles.extraBold,
    fontSize: 15,
  },
  quickText: {
    ...fontStyles.regular,
    fontSize: 12,
    lineHeight: 17,
  },
});
