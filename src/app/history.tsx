import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  Alert,
  Modal,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme, Colors } from "../app-theme";
import { useI18n } from "../i18n";
import {
  useData,
  Kind,
  Entry,
  CATEGORIES,
  categoryOf,
  DEFAULT_GOAL_ID,
  DEFAULT_WALLET_ID,
} from "../app-data";
import { MonthPicker } from "../month-picker";
import { WalletPicker } from "../wallet-picker";

type Filter = "all" | Kind;

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "ipon", label: "Ipon" },
  { key: "gastos", label: "Gastos" },
];

export default function History() {
  const { colors } = useTheme();
  const { t, fdate } = useI18n();
  const { monthEntries, deleteEntry, updateEntry, goals, wallets } = useData();
  const s = makeStyles(colors);

  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");

  // edit modal state
  const [editing, setEditing] = useState<Entry | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editNote, setEditNote] = useState("");
  const [editCategory, setEditCategory] = useState("other");
  const [editWallet, setEditWallet] = useState("");

  const goalOf = (e: Entry) =>
    goals.find((g) => g.id === (e.goalId ?? DEFAULT_GOAL_ID));

  const walletOf = (e: Entry) =>
    wallets.find((w) => w.id === (e.walletId ?? DEFAULT_WALLET_ID)) ?? wallets[0];

  const labelOf = (e: Entry) =>
    e.kind === "gastos" ? t(categoryOf(e.category).label) : goalOf(e)?.name ?? "Ipon";

  const q = search.trim().toLowerCase();
  const shown = monthEntries.filter((e) => {
    if (filter !== "all" && e.kind !== filter) return false;
    if (!q) return true;
    return `${e.note} ${labelOf(e)} ${walletOf(e)?.name ?? ""} ${e.amount}`
      .toLowerCase()
      .includes(q);
  });

  const confirmDelete = (id: string) => {
    Alert.alert(t("Delete entry?"), t("This can't be undone."), [
      { text: t("Cancel"), style: "cancel" },
      { text: t("Delete"), style: "destructive", onPress: () => deleteEntry(id) },
    ]);
  };

  const openEdit = (item: Entry) => {
    setEditing(item);
    setEditAmount(String(item.amount));
    setEditNote(item.note);
    setEditCategory(item.category ?? "other");
    setEditWallet(walletOf(item)?.id ?? wallets[0].id);
  };

  const saveEdit = () => {
    if (!editing) return;
    const value = Number(editAmount);
    if (!value || value <= 0) return;
    updateEntry(editing.id, {
      amount: value,
      note: editNote,
      walletId: editWallet,
      ...(editing.kind === "gastos" ? { category: editCategory } : {}),
    });
    setEditing(null);
  };

  return (
    <View style={s.container}>
      <MonthPicker />

      <TextInput
        style={s.search}
        placeholder={t("Search note, category, wallet or amount")}
        placeholderTextColor={colors.subtext}
        value={search}
        onChangeText={setSearch}
      />

      <View style={s.filters}>
        {FILTERS.map((f) => (
          <Pressable
            key={f.key}
            onPress={() => setFilter(f.key)}
            style={[s.chip, filter === f.key && s.chipActive]}
          >
            <Text style={[s.chipText, filter === f.key && s.chipTextActive]}>
              {t(f.label)}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={s.hint}>{t("Tap an entry to edit it.")}</Text>

      <FlatList
        data={shown}
        keyExtractor={(e) => e.id}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <Text style={s.empty}>
            {q ? t("No matches found.") : t("Nothing here yet.")}
          </Text>
        }
        renderItem={({ item }) => {
          const isIpon = item.kind === "ipon";
          const cat = categoryOf(item.category);
          const g = goalOf(item);
          const w = walletOf(item);
          return (
            <View style={s.row}>
              <Pressable style={s.rowMain} onPress={() => openEdit(item)}>
                <Text style={s.emoji}>{isIpon ? g?.emoji ?? "💰" : cat.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={s.note}>{item.note || labelOf(item)}</Text>
                  <Text style={s.date}>
                    {labelOf(item)} • {w?.emoji} {w?.name} • {fdate(item.date, true)}
                  </Text>
                </View>
                <Text
                  style={[s.amount, { color: isIpon ? colors.green : colors.red }]}
                >
                  {isIpon ? "+" : "-"}₱{item.amount.toLocaleString()}
                </Text>
              </Pressable>
              <Pressable onPress={() => confirmDelete(item.id)} hitSlop={10}>
                <Ionicons name="trash-outline" size={20} color={colors.subtext} />
              </Pressable>
            </View>
          );
        }}
      />

      {/* Edit modal */}
      <Modal
        visible={editing !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setEditing(null)}
      >
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalTitle}>
              {editing?.kind === "ipon" ? t("Edit ipon") : t("Edit expense")}
            </Text>

            <TextInput
              style={s.input}
              placeholder={t("Amount")}
              placeholderTextColor={colors.subtext}
              value={editAmount}
              onChangeText={setEditAmount}
              keyboardType="numeric"
            />
            <TextInput
              style={s.input}
              placeholder={t("Note (optional)")}
              placeholderTextColor={colors.subtext}
              value={editNote}
              onChangeText={setEditNote}
            />

            {editing?.kind === "gastos" && (
              <View style={s.chips}>
                {CATEGORIES.map((c) => (
                  <Pressable
                    key={c.key}
                    onPress={() => setEditCategory(c.key)}
                    style={[s.chip, editCategory === c.key && s.chipActive]}
                  >
                    <Text
                      style={[
                        s.chipText,
                        editCategory === c.key && s.chipTextActive,
                      ]}
                    >
                      {c.emoji} {t(c.label)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}

            <WalletPicker value={editWallet} onChange={setEditWallet} />

            <View style={s.modalButtons}>
              <Pressable
                style={[s.modalBtn, { backgroundColor: colors.barBg }]}
                onPress={() => setEditing(null)}
              >
                <Text style={{ color: colors.text, fontWeight: "600" }}>
                  {t("Cancel")}
                </Text>
              </Pressable>
              <Pressable
                style={[s.modalBtn, { backgroundColor: colors.green }]}
                onPress={saveEdit}
              >
                <Text style={{ color: "#fff", fontWeight: "bold" }}>{t("Save")}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    container: { flex: 1, padding: 16, backgroundColor: c.background },
    search: {
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.inputBg,
      color: c.text,
      borderRadius: 10,
      padding: 10,
      marginBottom: 10,
    },
    filters: { flexDirection: "row", gap: 8, marginBottom: 8 },
    hint: { color: c.subtext, fontSize: 12, marginBottom: 4 },
    chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginVertical: 8 },
    chip: {
      paddingVertical: 6,
      paddingHorizontal: 14,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.card,
    },
    chipActive: { backgroundColor: c.green, borderColor: c.green },
    chipText: { color: c.text },
    chipTextActive: { color: "#fff", fontWeight: "bold" },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderColor: c.border,
    },
    rowMain: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12 },
    emoji: { fontSize: 22 },
    note: { color: c.text, fontSize: 16 },
    date: { color: c.subtext, fontSize: 12, marginTop: 2 },
    amount: { fontWeight: "bold", fontSize: 16 },
    empty: { color: c.subtext, textAlign: "center", marginTop: 32 },
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      padding: 24,
    },
    modal: {
      backgroundColor: c.card,
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: c.border,
    },
    modalTitle: { color: c.text, fontSize: 18, fontWeight: "bold", marginBottom: 8 },
    input: {
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.inputBg,
      color: c.text,
      borderRadius: 8,
      padding: 10,
      marginVertical: 6,
    },
    modalButtons: { flexDirection: "row", gap: 12, marginTop: 12 },
    modalBtn: {
      flex: 1,
      padding: 12,
      borderRadius: 8,
      alignItems: "center",
    },
  });