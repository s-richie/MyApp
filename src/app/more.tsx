import { useEffect, useState } from "react";
import { View, Text, Pressable, ScrollView, BackHandler, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme, Colors } from "../app-theme";
import { useI18n } from "../i18n";
import Bot from "./bot";
import RecurringScreen from "./recurring";
import ExportScreen from "./export";
import Settings from "./settings";
import RemindersScreen from "../reminders-screen";

type Section = "bot" | "recurring" | "reminders" | "export" | "settings";
type IconName = keyof typeof Ionicons.glyphMap;

const ITEMS: {
  key: Section;
  icon: IconName;
  title: string;
  desc: string;
  file: string;
}[] = [
  {
    key: "bot",
    icon: "happy",
    title: "Ipon Bot",
    desc: "Tips, streaks, badges and challenges",
    file: "src/app/bot.tsx",
  },
  {
    key: "recurring",
    icon: "repeat",
    title: "Recurring",
    desc: "Baon, subscriptions and other repeating entries",
    file: "src/app/recurring.tsx",
  },
  {
    key: "reminders",
    icon: "notifications",
    title: "Reminders",
    desc: "Daily reminders to save and log your spending",
    file: "src/reminders-screen.tsx",
  },
  {
    key: "export",
    icon: "share-social",
    title: "Export & share",
    desc: "Monthly summary and CSV of your entries",
    file: "src/app/export.tsx",
  },
  {
    key: "settings",
    icon: "settings",
    title: "Settings",
    desc: "Dark mode, language, PIN lock and wallets",
    file: "src/app/settings.tsx",
  },
];

const SCREENS: Record<Section, any> = {
  bot: Bot,
  recurring: RecurringScreen,
  reminders: RemindersScreen,
  export: ExportScreen,
  settings: Settings,
};

// Accept either a component function or a { default: component } object
function pick(mod: any): React.ComponentType | null {
  if (typeof mod === "function") return mod;
  if (mod && typeof mod.default === "function") return mod.default;
  return null;
}

export default function More() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const s = makeStyles(colors);
  const [section, setSection] = useState<Section | null>(null);

  // Android back button goes back to the menu first
  useEffect(() => {
    if (!section) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      setSection(null);
      return true;
    });
    return () => sub.remove();
  }, [section]);

  if (section) {
    const Screen = pick(SCREENS[section]);
    const item = ITEMS.find((i) => i.key === section)!;
    return (
      <View style={s.container}>
        <Pressable style={s.backRow} onPress={() => setSection(null)} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={colors.green} />
          <Text style={s.backText}>{t("More")}</Text>
          <Text style={s.backTitle}>{t(item.title)}</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          {Screen ? (
            <Screen />
          ) : (
            <View style={{ padding: 20 }}>
              <Text style={{ color: colors.red, fontWeight: "bold", fontSize: 16 }}>
                This screen could not be loaded.
              </Text>
              <Text style={{ color: colors.text, marginTop: 8 }}>
                Check the file {item.file}. It should have a line like
                "export default function ..." near the top, and the file name
                must match exactly.
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={{ padding: 16 }}>
      {ITEMS.map((item) => (
        <Pressable key={item.key} style={s.card} onPress={() => setSection(item.key)}>
          <View style={s.iconWrap}>
            <Ionicons name={item.icon} size={26} color={colors.green} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.title}>{t(item.title)}</Text>
            <Text style={s.desc}>{t(item.desc)}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.subtext} />
        </Pressable>
      ))}
    </ScrollView>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    backRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderColor: c.border,
      backgroundColor: c.card,
    },
    backText: { color: c.green, fontSize: 16, marginLeft: 2 },
    backTitle: {
      flex: 1,
      textAlign: "center",
      color: c.text,
      fontSize: 16,
      fontWeight: "bold",
      marginRight: 60,
    },
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