import { useState } from "react";
import { View, Text, Pressable, ScrollView, Share, Alert, StyleSheet } from "react-native";
import { useTheme, Colors } from "../app-theme";
import {
  useData,
  categoryOf,
  DEFAULT_GOAL_ID,
  DEFAULT_WALLET_ID,
} from "../app-data";
import { MonthPicker } from "../month-picker";

type Range = "month" | "all";

const pad = (n: number) => String(n).padStart(2, "0");
const ymd = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const csvCell = (v: string | number) =>
  typeof v === "number" ? String(v) : `"${v.replace(/"/g, '""')}"`;

export default function ExportScreen() {
  const { colors } = useTheme();
  const {
    entries,
    monthEntries,
    monthLabel,
    monthSaved,
    monthSpent,
    budget,
    goals,
    wallets,
  } = useData();
  const s = makeStyles(colors);
  const [range, setRange] = useState<Range>("month");

  const list = (range === "all" ? entries : monthEntries)
    .slice()
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const buildCsv = () => {
    const header = ["Date", "Type", "Amount", "Category / Goal", "Wallet", "Note"];
    const rows = list.map((e) => [
      ymd(e.date),
      e.kind === "ipon" ? "Ipon" : "Gastos",
      e.amount,
      e.kind === "gastos"
        ? categoryOf(e.category).label
        : goals.find((g) => g.id === (e.goalId ?? DEFAULT_GOAL_ID))?.name ?? "Ipon",
      wallets.find((w) => w.id === (e.walletId ?? DEFAULT_WALLET_ID))?.name ?? "",
      e.note,
    ]);
    return [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\n");
  };

  const buildSummary = () => {
    const budgetNum = Number(budget) || 0;
    const lines = [
      `💰 Ipon Bot — ${monthLabel}`,
      "",
      `Saved: ₱${monthSaved.toLocaleString()}`,
      `Spent: ₱${monthSpent.toLocaleString()}`,
    ];
    if (budgetNum > 0) {
      lines.push(
        `Budget left: ₱${(budgetNum - monthSpent).toLocaleString()} of ₱${budgetNum.toLocaleString()}`
      );
    }

    const totals = new Map<string, number>();
    monthEntries
      .filter((e) => e.kind === "gastos")
      .forEach((e) => {
        const c = categoryOf(e.category);
        totals.set(c.key, (totals.get(c.key) ?? 0) + e.amount);
      });
    const cats = Array.from(totals.entries()).sort((a, b) => b[1] - a[1]);
    if (cats.length > 0) {
      lines.push("", "Where the money went:");
      cats.forEach(([key, value]) => {
        const c = categoryOf(key);
        lines.push(`${c.emoji} ${c.label}: ₱${value.toLocaleString()}`);
      });
    }
    return lines.join("\n");
  };

  const share = async (message: string, title: string) => {
    try {
      await Share.share({ message, title });
    } catch (e) {
      Alert.alert("Could not share", "Please try again.");
    }
  };

  const shareCsv = () => {
    if (list.length === 0) {
      Alert.alert("Nothing to export", "There are no entries in this range.");
      return;
    }
    share(buildCsv(), "Ipon Bot entries (CSV)");
  };

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={s.container}
    >
      {/* Monthly summary */}
      <View style={s.card}>
        <Text style={s.title}>Monthly summary</Text>
        <Text style={s.small}>
          A short text of the month you pick below: saved, spent, budget left and
          where the money went.
        </Text>
        <MonthPicker />
        <Pressable style={s.button} onPress={() => share(buildSummary(), "Ipon Bot summary")}>
          <Text style={s.buttonText}>Share summary</Text>
        </Pressable>
      </View>

      {/* CSV */}
      <View style={s.card}>
        <Text style={s.title}>Export entries (CSV)</Text>
        <Text style={s.small}>
          Columns: Date, Type, Amount, Category / Goal, Wallet, Note. Paste it into
          a spreadsheet after sharing.
        </Text>

        <View style={s.chips}>
          {(["month", "all"] as Range[]).map((r) => (
            <Pressable
              key={r}
              onPress={() => setRange(r)}
              style={[s.chip, range === r && s.chipActive]}
            >
              <Text style={[s.chipText, range === r && s.chipTextActive]}>
                {r === "month" ? monthLabel : "All time"}
              </Text>
            </Pressable>
          ))}
        </View>
        <Text style={s.small}>
          {list.length} {list.length === 1 ? "entry" : "entries"} will be exported.
        </Text>

        <Pressable style={s.button} onPress={shareCsv}>
          <Text style={s.buttonText}>Share CSV</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    container: { padding: 16, paddingBottom: 32 },
    card: {
      backgroundColor: c.card,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: c.border,
      marginBottom: 12,
    },
    title: { color: c.text, fontSize: 16, fontWeight: "bold" },
    small: { color: c.subtext, fontSize: 13, marginTop: 4, marginBottom: 8 },
    chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginVertical: 8 },
    chip: {
      paddingVertical: 6,
      paddingHorizontal: 14,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.background,
    },
    chipActive: { backgroundColor: c.green, borderColor: c.green },
    chipText: { color: c.text },
    chipTextActive: { color: "#fff", fontWeight: "bold" },
    button: {
      backgroundColor: c.green,
      padding: 12,
      borderRadius: 8,
      alignItems: "center",
      marginTop: 4,
    },
    buttonText: { color: "#fff", fontWeight: "bold" },
  });