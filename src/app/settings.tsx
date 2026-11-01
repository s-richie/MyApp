import { useState } from "react";
import { View, Switch, Pressable, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../app-theme";
import { useI18n } from "../i18n";
import { useData, Wallet } from "../app-data";
import { SecurityCard } from "../security-card";
import {
  Screen,
  Card,
  T,
  IconCircle,
  Chip,
  Chips,
  Field,
  Sheet,
  IconPicker,
  SectionHeader,
  iconOf,
  peso,
  WALLET_ICONS,
} from "../ui";

export default function Settings() {
  const { isDark, setDark, colors } = useTheme();
  const { t, lang, setLang } = useI18n();
  const { wallets, addWallet, updateWallet, deleteWallet, walletBalance } = useData();

  const [sheet, setSheet] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [wName, setWName] = useState("");
  const [wIcon, setWIcon] = useState<string>(WALLET_ICONS[0]);
  const [wStart, setWStart] = useState("");

  const openNew = () => {
    setEditingId(null);
    setWName("");
    setWIcon(WALLET_ICONS[0]);
    setWStart("0");
    setSheet(true);
  };

  const openEdit = (w: Wallet) => {
    setEditingId(w.id);
    setWName(w.name);
    setWIcon(iconOf(w, "wallet"));
    setWStart(String(w.start));
    setSheet(true);
  };

  const saveWallet = () => {
    const start = Number(wStart);
    if (!wName.trim() || isNaN(start)) return;
    if (editingId) {
      updateWallet(editingId, { name: wName.trim(), icon: wIcon, start });
    } else {
      addWallet(wName.trim(), wIcon, start);
    }
    setSheet(false);
  };

  const confirmDelete = (w: Wallet) => {
    if (wallets.length <= 1) {
      Alert.alert(t("Can't delete"), t("You need at least one wallet."));
      return;
    }
    Alert.alert(
      t('Delete "{name}"?', { name: w.name }),
      t("Its entries will be moved to another wallet."),
      [
        { text: t("Cancel"), style: "cancel" },
        { text: t("Delete"), style: "destructive", onPress: () => deleteWallet(w.id) },
      ]
    );
  };

  return (
    <Screen>
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
          <Chip label="English" active={lang === "en"} onPress={() => setLang("en")} />
          <Chip label="Filipino" active={lang === "fil"} onPress={() => setLang("fil")} />
        </Chips>
      </Card>

      {/* Security (redesigned in Part 3) */}
      <SecurityCard />
      <View style={{ height: 16 }} />

      {/* Wallets */}
      <SectionHeader title={t("Wallets")} actionLabel={t("New")} onAction={openNew} />

      {wallets.map((w) => {
        const bal = walletBalance(w.id);
        return (
          <Card key={w.id}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <IconCircle name={iconOf(w, "wallet")} size={42} />
              <View style={{ flex: 1 }}>
                <T kind="title" numberOfLines={1}>
                  {w.name}
                </T>
                <T kind="muted">
                  {t("Start: {n}", { n: peso(w.start) })}
                </T>
              </View>
              <Pressable onPress={() => openEdit(w)} hitSlop={10}>
                <Ionicons name="create-outline" size={20} color={colors.subtext} />
              </Pressable>
              <Pressable onPress={() => confirmDelete(w)} hitSlop={10}>
                <Ionicons name="trash-outline" size={20} color={colors.subtext} />
              </Pressable>
            </View>
            <T
              color={bal < 0 ? colors.red : undefined}
              style={{ fontSize: 24, fontWeight: "800", marginTop: 10 }}
            >
              {peso(bal)}
            </T>
          </Card>
        );
      })}

      {/* Wallet sheet */}
      <Sheet
        visible={sheet}
        title={editingId ? t("Edit wallet") : t("New wallet")}
        onClose={() => setSheet(false)}
        onSave={saveWallet}
      >
        <Field
          placeholder={t("Name (e.g. Maya, Bank)")}
          value={wName}
          onChangeText={setWName}
        />
        <Field
          placeholder={t("Starting balance (₱)")}
          value={wStart}
          onChangeText={setWStart}
          keyboardType="numeric"
        />
        <IconPicker value={wIcon} options={WALLET_ICONS} onChange={setWIcon} />
      </Sheet>
    </Screen>
  );
}