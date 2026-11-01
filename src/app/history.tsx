import { useState } from "react";
import { View, Pressable, FlatList, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../app-theme";
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
import {
  Row,
  Field,
  Chip,
  Chips,
  Sheet,
  EmptyState,
  entryIcon,
  entryTitle,
  safeIcon,
  peso,
} from "../ui";

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

  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");

  // edit sheet
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
    <View style={{ flex: 1, backgroundColor: colors.background, padding: 16 }}>
      <MonthPicker />

      <Field placeholder={t("Search")} value={search} onChangeText={setSearch} />

      <Chips>
        {FILTERS.map((f) => (
          <Chip
            key={f.key}
            label={t(f.label)}
            active={filter === f.key}
            onPress={() => setFilter(f.key)}
          />
        ))}
      </Chips>

      <FlatList
        data={shown}
        keyExtractor={(e) => e.id}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <EmptyState
            icon="document-text-outline"
            text={q ? t("No matches found.") : t("Nothing here yet.")}
          />
        }
        renderItem={({ item }) => {
          const isIpon = item.kind === "ipon";
          const w = walletOf(item);
          return (
            <Row
              icon={entryIcon(item, goals)}
              tone={isIpon ? colors.green : colors.red}
              title={entryTitle(item, goals, t)}
              sub={`${labelOf(item)} • ${w?.name ?? ""} • ${fdate(item.date, true)}`}
              amount={`${isIpon ? "+" : "-"}${peso(item.amount)}`}
              onPress={() => openEdit(item)}
              trailing={
                <Pressable onPress={() => confirmDelete(item.id)} hitSlop={10}>
                  <Ionicons name="trash-outline" size={20} color={colors.subtext} />
                </Pressable>
              }
            />
          );
        }}
      />

      {/* Edit sheet */}
      <Sheet
        visible={editing !== null}
        title={editing?.kind === "ipon" ? t("Edit ipon") : t("Edit expense")}
        onClose={() => setEditing(null)}
        onSave={saveEdit}
      >
        <Field
          placeholder={t("Amount")}
          value={editAmount}
          onChangeText={setEditAmount}
          keyboardType="numeric"
        />
        <Field
          placeholder={t("Note (optional)")}
          value={editNote}
          onChangeText={setEditNote}
        />

        {editing?.kind === "gastos" && (
          <Chips>
            {CATEGORIES.map((c) => (
              <Chip
                key={c.key}
                label={t(c.label)}
                icon={safeIcon(c.icon, "apps")}
                active={editCategory === c.key}
                color={colors.blue}
                onPress={() => setEditCategory(c.key)}
              />
            ))}
          </Chips>
        )}

        <WalletPicker value={editWallet} onChange={setEditWallet} />
      </Sheet>
    </View>
  );
}