import { useState } from "react";
import { Share, Alert } from "react-native";
import { useI18n } from "../i18n";
import {
  useData,
  categoryOf,
  DEFAULT_GOAL_ID,
  DEFAULT_WALLET_ID,
} from "../app-data";
import { MonthPicker } from "../month-picker";
import { Screen, Card, T, Button, Chip, Chips } from "../ui";

type Range = "month" | "all";

const pad = (n: number) => String(n).padStart(2, "0");
const ymd = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const csvCell = (v: string | number) =>
  typeof v === "number" ? String(v) : `"${v.replace(/"/g, '""')}"`;

export default function ExportScreen() {
  const { t, localizeMonth } = useI18n();
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
  const [range, setRange] = useState<Range>("month");

  const list = (range === "all" ? entries : monthEntries)
    .slice()
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // CSV keeps English column names so it works the same in any spreadsheet
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
      t("Ipon Bot — {month}", { month: localizeMonth(monthLabel) }),
      "",
      t("Saved: ₱{n}", { n: monthSaved.toLocaleString() }),
      t("Spent: ₱{n}", { n: monthSpent.toLocaleString() }),
    ];
    if (budgetNum > 0) {
      lines.push(
        t("Budget left: ₱{a} of ₱{b}", {
          a: (budgetNum - monthSpent).toLocaleString(),
          b: budgetNum.toLocaleString(),
        })
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
      lines.push("", t("Where the money went:"));
      cats.forEach(([key, value]) => {
        lines.push(`- ${t(categoryOf(key).label)}: ₱${value.toLocaleString()}`);
      });
    }
    return lines.join("\n");
  };

  const share = async (message: string, title: string) => {
    try {
      await Share.share({ message, title });
    } catch (e) {
      Alert.alert(t("Could not share"), t("Please try again."));
    }
  };

  const shareCsv = () => {
    if (list.length === 0) {
      Alert.alert(t("Nothing to export"), t("There are no entries in this range."));
      return;
    }
    share(buildCsv(), "Ipon Bot entries (CSV)");
  };

  return (
    <Screen>
      {/* Monthly summary */}
      <Card>
        <T kind="title">{t("Monthly summary")}</T>
        <T> </T>
        <MonthPicker />
        <Button
          label={t("Share summary")}
          icon="share-social"
          onPress={() => share(buildSummary(), "Ipon Bot summary")}
        />
      </Card>

      {/* CSV */}
      <Card>
        <T kind="title">{t("Export entries (CSV)")}</T>
        <Chips>
          {(["month", "all"] as Range[]).map((r) => (
            <Chip
              key={r}
              label={r === "month" ? localizeMonth(monthLabel) : t("All time")}
              active={range === r}
              onPress={() => setRange(r)}
            />
          ))}
        </Chips>
        <T kind="muted">
          {t(
            list.length === 1
              ? "{n} entry will be exported."
              : "{n} entries will be exported.",
            { n: list.length }
          )}
        </T>
        <Button label={t("Share CSV")} icon="document-text" onPress={shareCsv} />
      </Card>
    </Screen>
  );
}