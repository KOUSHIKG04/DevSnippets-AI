import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs, usePathname, useRouter } from "expo-router";
import { View, Pressable, StyleSheet } from "react-native";
import { useAppTheme } from "../../theme";

const tabs = [
  { name: "index", icon: "home-outline", route: "/" },
  { name: "favorite", icon: "heart-outline", route: "/favorite" },
  { name: "files", icon: "document-outline", route: "/files" },
  { name: "settings", icon: "settings-outline", route: "/settings" },
] as const;

function FloatingTabBar() {
  const { push } = useRouter();
  const pathname = usePathname();
  const { colors, colorScheme } = useAppTheme();

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.sidebar,
            borderColor: colors.sidebarBorder,
            boxShadow:
              colorScheme === "dark"
                ? "0px 0px 14px rgba(255, 255, 255, 0.08)"
                : "0px 6px 16px rgba(0, 0, 0, 0.1)",
          },
        ]}
      >
        {tabs.map((tab) => {
          const isActive =
            pathname === tab.route ||
            (tab.route === "/" && pathname === "/index");

          return (
            <Pressable
              key={tab.name}
              style={[
                styles.item,
                isActive && { backgroundColor: colors.primary },
              ]}
              onPress={() => push(tab.route)}
            >
              <Ionicons
                name={tab.icon as any}
                size={22}
                color={
                  isActive
                    ? colors.primaryForeground
                    : colors.mutedForeground
                }
              />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: "none" },
        }}
      >
        <Tabs.Screen name="index" />
        <Tabs.Screen name="favorite" />
        <Tabs.Screen name="files" />
        <Tabs.Screen name="settings" />
      </Tabs>

      <FloatingTabBar />
    </>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: "center",
    pointerEvents: "box-none",
  },
  container: {
    flexDirection: "row",
    borderRadius: 999,
    height: 64,
    paddingHorizontal: 8,
    alignItems: "center",
    width: "72%",
    borderWidth: 1,
  },
  item: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
    borderRadius: 999,
    paddingHorizontal: 4,
  },
});
