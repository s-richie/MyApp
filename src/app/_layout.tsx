import { useState } from "react";
import { View, Image, Text, StyleSheet } from "react-native";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ThemeProvider, useTheme } from "../app-theme";
import { DataProvider } from "../app-data";
import { LockProvider } from "../app-lock";
import { LanguageProvider, useI18n } from "../i18n";
import { Welcome } from "../welcome";
import { Splash } from "../splash";

function HeaderTitle({ title }: { title: string }) {
  const { colors } = useTheme();

  return (
    <View style={s.headerRow}>
      <Image
        source={require("../../assets/images/splash-icon.png")}
        style={s.headerLogo}
        resizeMode="contain"
      />
      <Text style={[s.headerText, { color: colors.text }]}>{title}</Text>
    </View>
  );
}

function TabsLayout() {
  const { colors } = useTheme();
  const { t } = useI18n();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.green,
        tabBarInactiveTintColor: colors.subtext,
        tabBarLabelStyle: { fontSize: 11 },
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
        },
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.text,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          headerTitle: () => <HeaderTitle title="Ipon Bot" />,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="ipon"
        options={{
          title: "Ipon",
          headerTitle: () => <HeaderTitle title="Ipon" />,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="wallet" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="budget"
        options={{
          title: "Budget",
          headerTitle: () => <HeaderTitle title="Budget" />,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="receipt" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: t("History"),
          headerTitle: () => <HeaderTitle title={t("History")} />,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: t("More"),
          headerTitle: () => <HeaderTitle title={t("More")} />,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="ellipsis-horizontal-circle" size={size} color={color} />
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
            <DataProvider>
              <View style={{ flex: 1 }}>
                <TabsLayout />
                <Welcome />
              </View>
            </DataProvider>
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