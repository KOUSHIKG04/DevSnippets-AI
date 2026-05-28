import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs, usePathname, useRouter } from "expo-router";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { useAppTheme } from "../../theme";

const tabs = [
  { name: "index", icon: "home-outline", route: "/" },
  { name: "favorite", icon: "star-outline", route: "/favorite" },
  { name: "files", icon: "folder-outline", route: "/files" },
  { name: "settings", icon: "settings-outline", route: "/settings" },
] as const;

function FloatingTabBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { colors } = useAppTheme();

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.sidebar,
            borderColor: colors.sidebarBorder,
          },
        ]}
      >
        {tabs.map((tab) => {
          const isActive =
            pathname === tab.route ||
            (tab.route === "/" && pathname === "/index");

          return (
            <TouchableOpacity
              key={tab.name}
              style={[
                styles.item,
                isActive && { backgroundColor: colors.primary },
              ]}
              onPress={() => router.push(tab.route)}
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
            </TouchableOpacity>
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
    bottom: 28,
    left: 0,
    right: 0,
    alignItems: "center",
    pointerEvents: "box-none",
  },
  container: {
    flexDirection: "row",
    borderRadius: 999,
    height: 64,
    paddingHorizontal: 12,
    alignItems: "center",
    width: "70%",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.16,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  item: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: 48,
    borderRadius: 999,
  },
});
