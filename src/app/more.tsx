import { useEffect, useState } from "react";
import { View, Pressable, ScrollView, BackHandler } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../app-theme";
import { useI18n } from "../i18n";
import { T, IconCircle, IconName } from "../ui";
import Utang from "./utang";
import Bot from "./bot";
import RecurringScreen from "./recurring";
import ExportScreen from "./export";
import Settings from "./settings";
import RemindersScreen from "../reminders-screen";

type Section = "utang" | "bot" | "recurring" | "reminders" | "export" | "settings";

const ITEMS: {
  key: Section;
  icon: IconName;
  title: string;
  desc: string;
  file: string;
}[] = [
  {
    key: "utang",
    icon: "people",
    title: "Utang & Ambagan",
    desc: "Who owes who",
    file: "src/app/utang.tsx",
  },
  {
    key: "bot",
    icon: "happy",
    title: "Ipon Bot",
    desc: "Streaks and challenges",
    file: "src/app/bot.tsx",
  },
  {
    key: "recurring",
    icon: "repeat",
    title: "Recurring",
    desc: "Auto-add entries",
    file: "src/app/recurring.tsx",
  },
  {
    key: "reminders",
    icon: "notifications",
    title: "Reminders",
    desc: "Daily notifications",
    file: "src/reminders-screen.tsx",
  },
  {
    key: "export",
    icon: "share-social",
    title: "Export & share",
    desc: "Summary and CSV",
    file: "src/app/export.tsx",
  },
  {
    key: "settings",
    icon: "settings",
    title: "Settings",
    desc: "Theme, language, security",
    file: "src/app/settings.tsx",
  },
];

const SCREENS: Record<Section, any> = {
  utang: Utang,
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
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <Pressable
          onPress={() => setSection(null)}
          hitSlop={8}
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderBottomWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.card,
          }}
        >
          <Ionicons name="chevron-back" size={22} color={colors.green} />
          <T color={colors.green} style={{ fontSize: 16, marginLeft: 2 }}>
            {t("More")}
          </T>
          <T
            kind="title"
            style={{ flex: 1, textAlign: "center", marginRight: 60 }}
          >
            {t(item.title)}
          </T>
        </Pressable>
        <View style={{ flex: 1 }}>
          {Screen ? (
            <Screen />
          ) : (
            <View style={{ padding: 20 }}>
              <T kind="title" color={colors.red}>
                This screen could not be loaded.
              </T>
              <T style={{ marginTop: 8 }}>
                Check the file {item.file}. It should have "export default
                function ..." near the top.
              </T>
            </View>
          )}
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 16 }}
    >
      {ITEMS.map((item) => (
        <Pressable
          key={item.key}
          onPress={() => setSection(item.key)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 14,
            backgroundColor: colors.card,
            borderRadius: 16,
            padding: 14,
            borderWidth: 1,
            borderColor: colors.border,
            marginBottom: 10,
          }}
        >
          <IconCircle name={item.icon} size={46} />
          <View style={{ flex: 1 }}>
            <T kind="title">{t(item.title)}</T>
            <T kind="muted">{t(item.desc)}</T>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.subtext} />
        </Pressable>
      ))}
    </ScrollView>
  );
}