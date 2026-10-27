import { useEffect, useRef, useState } from "react";
import { View, Image, Text, Animated, StyleSheet } from "react-native";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ThemeProvider, useTheme } from "../app-theme";
import { DataProvider } from "../app-data";

function Splash({ onDone }: { onDone: () => void }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(onDone, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={s.splash}>
      <Animated.View style={{ opacity, transform: [{ scale }], alignItems: "center" }}>
        <Image
          source={require("../../assets/images/splash-icon.png")}
          style={s.logo}
          resizeMode="contain"
        />
        <Text style={s.title}>Ipon Bot</Text>
        <Text style={s.tagline}>Save smart. Spend wise.</Text>
      </Animated.View>
    </View>
  );
}

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

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.green,
        tabBarInactiveTintColor: colors.subtext,
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
          title: "Dashboard",
          headerTitle: () => <HeaderTitle title="Dashboard" />,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid" size={size} color={color} />
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
          title: "History",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

export default function Layout() {
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return <Splash onDone={() => setShowSplash(false)} />;
  }

  return (
    <ThemeProvider>
      <DataProvider>
        <TabsLayout />
      </DataProvider>
    </ThemeProvider>
  );
}

const s = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: "#16a34a",
    alignItems: "center",
    justifyContent: "center",
  },
  logo: { width: 220, height: 220 },
  title: { color: "#fff", fontSize: 32, fontWeight: "bold", marginTop: 8 },
  tagline: { color: "#dcfce7", fontSize: 16, marginTop: 4 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  headerLogo: { width: 40, height: 40 },
  headerText: { fontSize: 17, fontWeight: "600" },
});