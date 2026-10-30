import { useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from "react-native";
import { useTheme, Colors } from "../app-theme";
import { useI18n } from "../i18n";
import { useData, CATEGORIES, categoryOf } from "../app-data";
import { MonthPicker } from "../month-picker";
import { WalletPicker } from "../wallet-picker";

export default function Budget() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const { monthEntries, addEntry, budget, setBudget, monthSpent, wallets } = useData();
  const spent = monthSpent;
  const s = makeStyles(colors);

  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [category, setCategory] = useState("food");
  const [walletId, setWalletId] = useState("");

  const activeWallet = wallets.find((w) => w.id === walletId)?.id ?? wallets[0].id;
  const remaining = (Number(budget) || 0) - spent;
  const recent = monthEntries.filter((e) => e.kind === "gastos").slice(0, 3);

  const handleAdd = () => {
    const value = Number(amount);
    if (!value || value <= 0) return;
    addEntry("gastos", value, note, category, activeWallet);
    setAmount("");
    setNote("");
  };

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={s.container}
      keyboardShouldPersistTaps="handled"
    >
      <MonthPicker />

      <Text style={s.label}>{t("Monthly budget (₱)")}</Text>
      <TextInput style={s.input} value={budget} onChangeText={setBudget} keyboardType="numeric" />

      <Text style={s.label}>{t("Remaining")}</Text>
      <Text style={[s.big, remaining < 0 && { color: colors.red }]}>
        ₱{remaining.toLocaleString()}
      </Text>
      <Text style={s.small}>{t("Spent: ₱{n}", { n: spent.toLocaleString() })}</Text>

      <Text style={s.label}>{t("Category")}</Text>
      <View style={s.chips}>
        {CATEGORIES.map((c) => (
          <Pressable
            key={c.key}
            onPress={() => setCategory(c.key)}
            style={[s.chip, category === c.key && s.chipActive]}
          >
            <Text style={[s.chipText, category === c.key && s.chipTextActive]}>
              {c.emoji} {t(c.label)}
            </Text>
          </Pressable>
        ))}
      </View>

      <WalletPicker value={activeWallet} onChange={setWalletId} />

      <TextInput
        style={s.input}
        placeholder={t("Amount")}
        placeholderTextColor={colors.subtext}
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
      />
      <TextInput
        style={s.input}
        placeholder={t("Note (optional)")}
        placeholderTextColor={colors.subtext}
        value={note}
        onChangeText={setNote}
      />
      <Pressable style={s.button} onPress={handleAdd}>
        <Text style={s.buttonText}>{t("Add gastos")}</Text>
      </Pressable>

      <Text style={s.section}>{t("Recent")}</Text>
      {recent.length === 0 ? (
        <Text style={s.small}>{t("No expenses this month yet.")}</Text>
      ) : (
        recent.map((item) => {
          const cat = categoryOf(item.category);
          return (
            <View key={item.id} style={s.row}>
              <Text style={s.rowText}>
                {cat.emoji} {item.note || t(cat.label)}
              </Text>
              <Text style={s.amount}>-₱{item.amount.toLocaleString()}</Text>
            </View>
          );
        })
      )}
      <Text style={s.small}>{t("See everything in the History tab.")}</Text>
    </ScrollView>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    container: { padding: 16 },
    label: { fontSize: 14, color: c.subtext },
    section: { fontSize: 16, fontWeight: "bold", color: c.text, marginTop: 8 },
    input: {
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.inputBg,
      color: c.text,
      borderRadius: 8,
      padding: 10,
      marginVertical: 6,
    },
    big: { fontSize: 36, fontWeight: "bold", color: c.text },
    small: { color: c.subtext, marginBottom: 12, marginTop: 4 },
    chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginVertical: 8 },
    chip: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.card,
    },
    chipActive: { backgroundColor: c.blue, borderColor: c.blue },
    chipText: { color: c.text },
    chipTextActive: { color: "#fff", fontWeight: "bold" },
    button: { backgroundColor: c.blue, padding: 12, borderRadius: 8, alignItems: "center", marginVertical: 8 },
    buttonText: { color: "#fff", fontWeight: "bold" },
    row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: 1, borderColor: c.border },
    rowText: { color: c.text },
    amount: { color: c.red, fontWeight: "bold" },
  });