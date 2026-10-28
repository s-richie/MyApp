import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme, Colors } from "../app-theme";

type IconName = keyof typeof Ionicons.glyphMap;

const ITEMS: { path: string; icon: IconName; title: string; desc: string }[] = [
  {
    path: "/bot",
    icon: "happy",
    title: "Ipon Bot",
    desc: "Tips, streaks, badges and challenges",
  },
  {
    path: "/recurring",
    icon: "repeat",
    title: "Recurring",
    desc: "Baon, subscriptions and other repeating entries",
  },
  {
    path: "/export",
    icon: "share-social",
    title: "Export & share",
    desc: "Monthly summary and CSV of your entries",
  },
  {
    path: "/settings",
    icon: "settings",
    title: "Settings",
    desc: "Dark mode and wallets",
  },
];

export default function More() {
  const { colors } = useTheme();
  const router = useRouter();
  const s = makeStyles(colors);

  return (
    <View style={s.container}>
      {ITEMS.map((item) => (
        <Pressable
          key={item.path}
          style={s.card}
          onPress={() => router.navigate(item.path as any)}
        >
          <View style={s.iconWrap}>
            <Ionicons name={item.icon} size={26} color={colors.green} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.title}>{item.title}</Text>
            <Text style={s.desc}>{item.desc}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.subtext} />
        </Pressable>
      ))}
    </View>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    container: { flex: 1, padding: 16, backgroundColor: c.background },
    card: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      backgroundColor: c.card,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: c.border,
      marginBottom: 12,
    },
    iconWrap: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: c.barBg,
      alignItems: "center",
      justifyContent: "center",
    },
    title: { color: c.text, fontSize: 16, fontWeight: "bold" },
    desc: { color: c.subtext, fontSize: 13, marginTop: 2 },
  });