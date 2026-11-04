import { Ionicons } from "@expo/vector-icons";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavThemeProvider,
  Tabs,
} from "expo-router";
import { useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { DataProvider } from "../app-data";
import { LockProvider } from "../app-lock";
import { ThemeProvider, useTheme } from "../app-theme";
import { AuthGate, AuthProvider } from "../auth";
import { LanguageProvider, useI18n } from "../i18n";
import { Splash } from "../splash";
import { SyncProvider } from "../sync";
import { Welcome } from "../welcome";

function HeaderTitle({ title }: { title: string }) {
  const { colors } = useTheme();

  return (
    <View style={s.headerRow}>
      <Image
        source={require("../../assets/images/splash-icon.png")}
        style={s.headerLogo}
        resizeMode="contain"
      />
      <Text
        maxFontSizeMultiplier={1.2}
        numberOfLines={1}
        style={[s.headerText, { color: colors.text }]}
      >
        {title}
      </Text>
    </View>
  );
}

function TabsLayout() {
  const { colors, isDark } = useTheme();
  const { t } = useI18n();

  // Make the navigation colors match the app theme (no white flashes in dark mode)
  const baseTheme = isDark ? DarkTheme : DefaultTheme;
  const navTheme = {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      primary: colors.green,
      background: colors.background,
      card: colors.card,
      text: colors.text,
      border: colors.border,
    },
  };

  return (
    <NavThemeProvider value={navTheme}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colors.green,
          tabBarInactiveTintColor: colors.subtext,
          tabBarLabelStyle: { fontSize: 11 },
          tabBarAllowFontScaling: false,
          tabBarHideOnKeyboard: true,
          tabBarStyle: {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
          },
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
          headerTitleAllowFontScaling: false,
          // On tablets and wide screens the content stays centered and not stretched
          sceneStyle: {
            backgroundColor: colors.background,
            width: "100%",
            maxWidth: 640,
            alignSelf: "center",
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            headerTitle: () => <HeaderTitle title="Ipon Bot" />,
            tabBarIcon: ({ focused, size }) => (
              <Ionicons
                name="home"
                size={size}
                color={focused ? colors.green : colors.subtext}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="ipon"
          options={{
            title: "Ipon",
            headerTitle: () => <HeaderTitle title="Ipon" />,
            tabBarIcon: ({ focused, size }) => (
              <Ionicons
                name="wallet"
                size={size}
                color={focused ? colors.green : colors.subtext}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="budget"
          options={{
            title: "Budget",
            headerTitle: () => <HeaderTitle title="Budget" />,
            tabBarIcon: ({ focused, size }) => (
              <Ionicons
                name="receipt"
                size={size}
                color={focused ? colors.green : colors.subtext}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            title: t("History"),
            headerTitle: () => <HeaderTitle title={t("History")} />,
            tabBarIcon: ({ focused, size }) => (
              <Ionicons
                name="time"
                size={size}
                color={focused ? colors.green : colors.subtext}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="more"
          options={{
            title: t("More"),
            headerTitle: () => <HeaderTitle title={t("More")} />,
            tabBarIcon: ({ focused, size }) => (
              <Ionicons
                name="ellipsis-horizontal-circle"
                size={size}
                color={focused ? colors.green : colors.subtext}
              />
            ),
          }}
        />

        {/* These open from inside the More tab, so they stay out of the tab bar */}
        <Tabs.Screen name="utang" options={{ href: null }} />
        <Tabs.Screen name="bot" options={{ href: null }} />
        <Tabs.Screen name="recurring" options={{ href: null }} />
        <Tabs.Screen name="export" options={{ href: null }} />
        <Tabs.Screen name="settings" options={{ href: null }} />
      </Tabs>
    </NavThemeProvider>
  );
}

export default function Layout() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <LanguageProvider>
      {showSplash ? (
        <Splash onDone={() => setShowSplash(false)} />
      ) : (
        <ThemeProvider>
          <LockProvider>
            <AuthProvider>
              <DataProvider>
                <SyncProvider>
                  <View style={{ flex: 1 }}>
                    <TabsLayout />
                    <AuthGate />
                    <Welcome />
                  </View>
                </SyncProvider>
              </DataProvider>
            </AuthProvider>
          </LockProvider>
        </ThemeProvider>
      )}
    </LanguageProvider>
  );
}

const s = StyleSheet.create({
  headerRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  headerLogo: { width: 40, height: 40 },
  headerText: { fontSize: 17, fontWeight: "600" },
});
