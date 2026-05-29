import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { fontStyles } from "../fontDefaults";
import { useAppTheme } from "../theme";

export function HomeHeader() {
  const { colors, colorScheme, setColorScheme } = useAppTheme();
  const nextTheme = colorScheme === "dark" ? "light" : "dark";

  return (
    <View style={styles.topBar}>
      <View>
        <Text style={[styles.title, { color: colors.foreground }]}>
          Home
        </Text>
      </View>

      <Pressable
        style={[
          styles.themeToggle,
          {
            backgroundColor: colors.primary,
            borderColor: colors.border,
          },
        ]}
        onPress={() => setColorScheme(nextTheme)}
      >
        <Ionicons
          name={colorScheme === "dark" ? "sunny-outline" : "moon-outline"}
          size={20}
          color={colors.primaryForeground}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 22,
  },
  title: {
    ...fontStyles.extraBold,
    fontSize: 28,
  },
  themeToggle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
