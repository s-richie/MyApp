import { useState } from "react";
import { View, Text, Pressable, FlatList, Alert, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme, Colors } from "../app-theme";
import { useData, Kind } from "../app-data";
import { MonthPicker } from "../month-picker";

type Filter = "all" | Kind;

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "ipon", label: "Ipon" },
  { key: "gastos", label: "Gastos" },
];

export default function History() {
  const { colors } = useTheme();
  const { monthEntries, deleteEntry } = useData();
  const s = makeStyles(colors);
  const [filter, setFilter] = useState<Filter>("all");

  const shown = monthEntries.filter((e) => filter === "all" || e.kind === filter);

  const confirmDelete = (id: string) => {
    Alert.alert("Delete entry?", "This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteEntry(id) },
    ]);
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  return (
    <View style={s.container}>
      <MonthPicker />

      <View style={s.filters}>
        {FILTERS.map((f) => (
          <Pressable
            key={f.key}
            onPress={() => setFilter(f.key)}
            style={[s.chip, filter === f.key && s.chipActive]}
          >
            <Text style={[s.chipText, filter === f.key && s.chipTextActive]}>
              {f.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={shown}
        keyExtractor={(e) => e.id}
        ListEmptyComponent={<Text style={s.empty}>Nothing here yet.</Text>}
        renderItem={({ item }) => {
          const isIpon = item.kind === "ipon";
          return (
            <View style={s.row}>
              <View style={{ flex: 1 }}>
                <Text style={s.note}>
                  {item.note || (isIpon ? "Ipon" : "Expense")}
                </Text>
                <Text style={s.date}>{formatDate(item.date)}</Text>
              </View>
              <Text style={[s.amount, { color: isIpon ? colors.green : colors.red }]}>
                {isIpon ? "+" : "-"}₱{item.amount.toLocaleString()}
              </Text>
              <Pressable onPress={() => confirmDelete(item.id)} hitSlop={10}>
                <Ionicons name="trash-outline" size={20} color={colors.subtext} />
              </Pressable>
            </View>
          );
        }}
      />
    </View>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    container: { flex: 1, padding: 16, backgroundColor: c.background },
    filters: { flexDirection: "row", gap: 8, marginBottom: 12 },
    chip: {
      paddingVertical: 6,
      paddingHorizontal: 16,
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
    note: { color: c.text, fontSize: 16 },
    date: { color: c.subtext, fontSize: 12, marginTop: 2 },
    amount: { fontWeight: "bold", fontSize: 16 },
    empty: { color: c.subtext, textAlign: "center", marginTop: 32 },
  });