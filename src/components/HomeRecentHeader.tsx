import { StyleSheet, Text, View } from "react-native";
import { fontStyles } from "../fontDefaults";
import { useAppTheme } from "../theme";

type HomeRecentHeaderProps = {
  count: number;
};

export function HomeRecentHeader({ count }: HomeRecentHeaderProps) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.recentHeader}>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
        Recent Snippets
      </Text>
      <Text style={[styles.snippetCount, { color: colors.mutedForeground }]}>
        {count} total
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  recentHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  sectionTitle: {
    ...fontStyles.extraBold,
    fontSize: 22,
    marginTop: 26,
  },
  snippetCount: {
    ...fontStyles.bold,
    fontSize: 13,
    marginTop: 26,
  },
});
