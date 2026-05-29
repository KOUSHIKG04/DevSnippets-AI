import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  GeistMono_400Regular,
  GeistMono_600SemiBold,
  GeistMono_700Bold,
  GeistMono_800ExtraBold,
  useFonts,
} from "@expo-google-fonts/geist-mono";
import { Image } from "expo-image";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { AppAlertProvider } from "../components/AppAlert";
import { initializeDatabase } from "../db/database";
import { configureDefaultFonts } from "../fontDefaults";
import { AppThemeProvider, useAppTheme } from "../theme";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    GeistMono_400Regular,
    GeistMono_600SemiBold,
    GeistMono_700Bold,
    GeistMono_800ExtraBold,
  });
  const isReady = fontsLoaded || Boolean(fontError);

  useEffect(() => {
    if (isReady) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [isReady]);

  useEffect(() => {
    if (fontsLoaded) {
      configureDefaultFonts();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    initializeDatabase();
  }, []);

  return (
    <AppThemeProvider>
      <AppAlertProvider>
        <RootNavigator />
        {!isReady && <BootSplash />}
      </AppAlertProvider>
    </AppThemeProvider>
  );
}

function BootSplash() {
  return (
    <View style={styles.bootSplash}>
      <Image
        source={require("../../assets/images/splash-icon.png")}
        style={styles.bootLogo}
        contentFit="contain"
      />
      <Text style={styles.bootTitle}>DevShelf</Text>
    </View>
  );
}

function RootNavigator() {
  const { colorScheme } = useAppTheme();

  return (
    <>
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="snippet/new" />
        <Stack.Screen name="snippet/[id]" />
        <Stack.Screen name="snippet/edit" />
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({
  bootSplash: {
    ...StyleSheet.absoluteFillObject,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0A0A0A",
  },
  bootLogo: {
    width: 180,
    height: 180,
  },
  bootTitle: {
    color: "#F8FAFC",
    fontSize: 28,
    fontWeight: "800",
    marginTop: 28,
  },
});
