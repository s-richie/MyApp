import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Alert, Pressable, View } from "react-native";
import { INCOME_SOURCES, useData, Wallet } from "../app-data";
import { useTheme } from "../app-theme";
import { useI18n } from "../i18n";
import { moneyIcon, moneyTitle } from "../money";
import {
  Button,
  Card,
  Chip,
  Chips,
  Field,
  IconCircle,
  iconOf,
  IconPicker,
  peso,
  Row,
  safeIcon,
  Screen,
  SectionHeader,
  Sheet,
  T,
  WALLET_ICONS,
} from "../ui";

export default function MyMoney() {
  const { colors } = useTheme();
  const { t, fdate, localizeMonth } = useI18n();
  const {
    entries,
    addEntry,
    wallets,
    addWallet,
    updateWallet,
    deleteWallet,
    walletBalance,
    setWalletBalance,
    monthLabel,
    monthSaved,
    monthSpent,
  } = useData();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [source, setSource] = useState("allowance");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  // wallet sheet
  const [sheet, setSheet] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [wName, setWName] = useState("");
  const [wIcon, setWIcon] = useState<string>(WALLET_ICONS[0]);
  const [wMoney, setWMoney] = useState("");

  const total = wallets.reduce((a, w) => a + walletBalance(w.id), 0);
  const selected = wallets.find((w) => w.id === selectedId) ?? wallets[0];
  const recent = entries.filter((e) => e.kind === "ipon").slice(0, 3);

  const handleAdd = () => {
    const value = Number(amount);
    if (!value || value <= 0 || !selected) return;
    addEntry("ipon", value, note, source, selected.id);
    setAmount("");
    setNote("");
  };

  const openNew = () => {
    setEditingId(null);
    setWName("");
    setWIcon(WALLET_ICONS[0]);
    setWMoney("");
    setSheet(true);
  };

  const openEdit = (w: Wallet) => {
    setEditingId(w.id);
    setWName(w.name);
    setWIcon(iconOf(w, "wallet"));
    setWMoney(String(Math.round(walletBalance(w.id) * 100) / 100));
    setSheet(true);
  };

  const saveWallet = () => {
    const money = Number(wMoney === "" ? "0" : wMoney);
    if (!wName.trim() || isNaN(money)) return;
    if (editingId) {
      updateWallet(editingId, { name: wName.trim(), icon: wIcon });
      setWalletBalance(editingId, money);
    } else {
      addWallet(wName.trim(), wIcon, money);
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
        {
          text: t("Delete"),
          style: "destructive",
          onPress: () => deleteWallet(w.id),
        },
      ],
    );
  };

  return (
    <Screen>
      {/* Total */}
      <Card>
        <T kind="label">{t("Total money")}</T>
        <T kind="big" color={total < 0 ? colors.red : undefined}>
          {peso(total)}
        </T>
        <T kind="muted" style={{ marginTop: 4 }}>
          {localizeMonth(monthLabel)}
        </T>
        <View style={{ flexDirection: "row", gap: 12, marginTop: 10 }}>
          <View style={{ flex: 1 }}>
            <T kind="label">{t("In")}</T>
            <T color={colors.green} style={{ fontSize: 20, fontWeight: "800" }}>
              {peso(monthSaved)}
            </T>
          </View>
          <View style={{ flex: 1 }}>
            <T kind="label">{t("Out")}</T>
            <T color={colors.red} style={{ fontSize: 20, fontWeight: "800" }}>
              {peso(monthSpent)}
            </T>
          </View>
        </View>
      </Card>

      {/* Wallets */}
      <SectionHeader
        title={t("Wallets")}
        actionLabel={t("New")}
        onAction={openNew}
      />
      {wallets.map((w) => {
        const bal = walletBalance(w.id);
        const isSel = selected.id === w.id;
        return (
          <Pressable key={w.id} onPress={() => setSelectedId(w.id)}>
            <Card
              style={{
                borderWidth: 2,
                borderColor: isSel ? colors.green : colors.border,
              }}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
              >
                <IconCircle name={iconOf(w, "wallet")} size={42} />
                <View style={{ flex: 1 }}>
                  <T kind="title" numberOfLines={1}>
                    {w.name}
                  </T>
                  <T
                    color={bal < 0 ? colors.red : undefined}
                    style={{ fontSize: 22, fontWeight: "800" }}
                  >
                    {peso(bal)}
                  </T>
                </View>
                {isSel ? (
                  <Ionicons
                    name="checkmark-circle"
                    size={22}
                    color={colors.green}
                  />
                ) : null}
                <Pressable onPress={() => openEdit(w)} hitSlop={10}>
                  <Ionicons
                    name="create-outline"
                    size={20}
                    color={colors.subtext}
                  />
                </Pressable>
                <Pressable onPress={() => confirmDelete(w)} hitSlop={10}>
                  <Ionicons
                    name="trash-outline"
                    size={20}
                    color={colors.subtext}
                  />
                </Pressable>
              </View>
            </Card>
          </Pressable>
        );
      })}

      {/* Add money */}
      <Card>
        <T kind="title">{t("Add money to {name}", { name: selected.name })}</T>
        <Chips>
          {INCOME_SOURCES.map((s) => (
            <Chip
              key={s.key}
              label={t(s.label)}
              icon={safeIcon(s.icon, "cash")}
              active={source === s.key}
              onPress={() => setSource(s.key)}
            />
          ))}
        </Chips>
        <Field
          placeholder={t("Amount")}
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
        />
        <Field
          placeholder={t("Note (optional)")}
          value={note}
          onChangeText={setNote}
        />
        <Button label={t("Add money")} icon="add-circle" onPress={handleAdd} />
      </Card>

      {/* Recent */}
      <Card>
        <T kind="label">{t("Recent")}</T>
        {recent.length === 0 ? (
          <T kind="muted" style={{ marginTop: 8 }}>
            {t("No money added yet.")}
          </T>
        ) : (
          recent.map((e) => (
            <Row
              key={e.id}
              icon={moneyIcon(e)}
              tone={colors.green}
              title={moneyTitle(e, t)}
              sub={fdate(e.date)}
              amount={`+${peso(e.amount)}`}
            />
          ))
        )}
      </Card>

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
          placeholder={t("Money now (₱)")}
          value={wMoney}
          onChangeText={setWMoney}
          keyboardType="numeric"
        />
        <IconPicker value={wIcon} options={WALLET_ICONS} onChange={setWIcon} />
      </Sheet>
    </Screen>
  );
}
