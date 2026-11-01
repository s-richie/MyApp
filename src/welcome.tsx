import { useEffect, useState } from "react";
import { View, Image } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "./app-theme";
import { useI18n } from "./i18n";
import { T, Chip, Button, IconCircle, IconName } from "./ui";

const KEY = "iponbot:welcome:v1";

const STEPS: { icon: IconName; text: string }[] = [
  { icon: "wallet", text: "Add ipon to your goals" },
  { icon: "receipt", text: "Log your gastos" },
  { icon: "stats-chart", text: "See your progress" },
];

export function Welcome() {
  const { colors } = useTheme();
  const { t, lang, setLang } = useI18n();
  const [show, setShow] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((v) => setShow(v !== "1"))
      .catch(() => setShow(false));
  }, []);

  if (show === false) return null;

  const overlay = {
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 900,
    elevation: 900,
    backgroundColor: colors.background,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    padding: 28,
  };

  // still loading: cover the screen so nothing flashes
  if (show === null) return <View style={overlay} />;

  const done = () => {
    setShow(false);
    AsyncStorage.setItem(KEY, "1").catch(() => {});
  };

  return (
    <View style={overlay}>
      <Image
        source={require("../assets/images/splash-icon.png")}
        style={{ width: 120, height: 120 }}
        resizeMode="contain"
      />
      <T kind="big" style={{ fontSize: 26, textAlign: "center", marginTop: 4 }}>
        {t("Welcome to Ipon Bot")}
      </T>

      <View style={{ flexDirection: "row", gap: 8, marginVertical: 16 }}>
        <Chip label="English" active={lang === "en"} onPress={() => setLang("en")} />
        <Chip label="Filipino" active={lang === "fil"} onPress={() => setLang("fil")} />
      </View>

      <View style={{ alignSelf: "stretch", gap: 14, marginBottom: 24 }}>
        {STEPS.map((s) => (
          <View
            key={s.icon}
            style={{ flexDirection: "row", alignItems: "center", gap: 14 }}
          >
            <IconCircle name={s.icon} size={44} />
            <T style={{ flex: 1, fontSize: 16 }}>{t(s.text)}</T>
          </View>
        ))}
      </View>

      <View style={{ alignSelf: "stretch" }}>
        <Button label={t("Get started")} icon="arrow-forward" onPress={done} />
      </View>
    </View>
  );
}