import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Alert, FlatList, Pressable, View } from "react-native";
import {
  CATEGORIES,
  DEFAULT_WALLET_ID,
  Entry,
  INCOME_SOURCES,
  Kind,
  useData,
} from "../app-data";
import { useTheme } from "../app-theme";
import { useI18n } from "../i18n";
import { moneyIcon, moneyLabel, moneyTitle } from "../money";
import { MonthPicker } from "../month-picker";
import {
  Chip,
  Chips,
  EmptyState,
  Field,
  peso,
  Row,
  safeIcon,
  Sheet,
} from "../ui";
import { WalletPicker } from "../wallet-picker";

type Filter = "all" | Kind;

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "ipon", label: "Income" },
  { key: "gastos", label: "Gastos" },
];

export default function History() {
  const { colors } = useTheme();
  const { t, fdate } = useI18n();
  const { monthEntries, deleteEntry, updateEntry, wallets } = useData();

  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");

  // edit sheet
  const [editing, setEditing] = useState<Entry | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editNote, setEditNote] = useState("");
  const [editCategory, setEditCategory] = useState("other");
  const [editWallet, setEditWallet] = useState("");

  const walletOf = (e: Entry) =>
    wallets.find((w) => w.id === (e.walletId ?? DEFAULT_WALLET_ID)) ??
    wallets[0];

  const q = search.trim().toLowerCase();
  const shown = monthEntries.filter((e) => {
    if (filter !== "all" && e.kind !== filter) return false;
    if (!q) return true;
    return `${e.note} ${moneyLabel(e, t)} ${walletOf(e)?.name ?? ""} ${e.amount}`
      .toLowerCase()
      .includes(q);
  });

  const confirmDelete = (id: string) => {
    Alert.alert(t("Delete entry?"), t("This can't be undone."), [
      { text: t("Cancel"), style: "cancel" },
      {
        text: t("Delete"),
        style: "destructive",
        onPress: () => deleteEntry(id),
      },
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
      category: editCategory,
    });
    setEditing(null);
  };

  const isIncomeEdit = editing?.kind === "ipon";
  const options = isIncomeEdit ? INCOME_SOURCES : CATEGORIES;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, padding: 16 }}>
      <MonthPicker />

      <Field
        placeholder={t("Search")}
        value={search}
        onChangeText={setSearch}
      />

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
          const isIn = item.kind === "ipon";
          const w = walletOf(item);
          return (
            <Row
              icon={moneyIcon(item)}
              tone={isIn ? colors.green : colors.red}
              title={moneyTitle(item, t)}
              sub={`${moneyLabel(item, t)} • ${w?.name ?? ""} • ${fdate(item.date, true)}`}
              amount={`${isIn ? "+" : "-"}${peso(item.amount)}`}
              onPress={() => openEdit(item)}
              trailing={
                <Pressable onPress={() => confirmDelete(item.id)} hitSlop={10}>
                  <Ionicons
                    name="trash-outline"
                    size={20}
                    color={colors.subtext}
                  />
                </Pressable>
              }
            />
          );
        }}
      />

      {/* Edit sheet */}
      <Sheet
        visible={editing !== null}
        title={isIncomeEdit ? t("Edit income") : t("Edit expense")}
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

        <Chips>
          {options.map((c) => (
            <Chip
              key={c.key}
              label={t(c.label)}
              icon={safeIcon(c.icon, "apps")}
              active={editCategory === c.key}
              color={isIncomeEdit ? colors.green : colors.blue}
              onPress={() => setEditCategory(c.key)}
            />
          ))}
        </Chips>

        <WalletPicker value={editWallet} onChange={setEditWallet} />
      </Sheet>
    </View>
  );
}
