import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  GeistMono_400Regular,
  GeistMono_600SemiBold,
  GeistMono_700Bold,
  GeistMono_800ExtraBold,
  useFonts,
} from "@expo-google-fonts/geist-mono";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
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

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    initializeDatabase();
  }, []);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  if (fontsLoaded) {
    configureDefaultFonts();
  }

  return (
    <AppThemeProvider>
      <AppAlertProvider>
        <RootNavigator />
      </AppAlertProvider>
    </AppThemeProvider>
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
