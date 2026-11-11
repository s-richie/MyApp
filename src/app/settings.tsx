import { Switch, View } from "react-native";
import { AccountCard } from "../account-card";
import { useTheme } from "../app-theme";
import { useI18n } from "../i18n";
import { SecurityCard } from "../security-card";
import { Card, Chip, Chips, IconCircle, Screen, T } from "../ui";

export default function Settings() {
  const { isDark, setDark, colors } = useTheme();
  const { t, lang, setLang } = useI18n();

  return (
    <Screen>
      {/* Account */}
      <AccountCard />

      {/* Dark mode */}
      <Card>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <IconCircle name="moon" size={40} color={colors.blue} />
          <T kind="title" style={{ flex: 1 }}>
            {t("Dark mode")}
          </T>
          <Switch
            value={isDark}
            onValueChange={setDark}
            trackColor={{ false: "#d1d5db", true: colors.green }}
          />
        </View>
      </Card>

      {/* Language */}
      <Card>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <IconCircle name="globe" size={40} color={colors.blue} />
          <T kind="title">{t("Language")}</T>
        </View>
        <Chips>
          <Chip
            label="English"
            active={lang === "en"}
            onPress={() => setLang("en")}
          />
          <Chip
            label="Filipino"
            active={lang === "fil"}
            onPress={() => setLang("fil")}
          />
        </Chips>
      </Card>

      {/* Security */}
      <SecurityCard />
    </Screen>
  );
}
