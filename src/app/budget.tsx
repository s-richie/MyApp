import { useState } from "react";
import { useTheme } from "../app-theme";
import { useI18n } from "../i18n";
import { useData, CATEGORIES } from "../app-data";
import { MonthPicker } from "../month-picker";
import { WalletPicker } from "../wallet-picker";
import {
  Screen,
  Card,
  T,
  Row,
  Button,
  Field,
  Chip,
  Chips,
  entryIcon,
  entryTitle,
  safeIcon,
  peso,
} from "../ui";

export default function Budget() {
  const { colors } = useTheme();
  const { t, fdate } = useI18n();
  const { monthEntries, addEntry, budget, setBudget, monthSpent, wallets, goals } =
    useData();

  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [category, setCategory] = useState("food");
  const [walletId, setWalletId] = useState("");

  const activeWallet = wallets.find((w) => w.id === walletId)?.id ?? wallets[0].id;
  const remaining = (Number(budget) || 0) - monthSpent;
  const recent = monthEntries.filter((e) => e.kind === "gastos").slice(0, 3);

  const handleAdd = () => {
    const value = Number(amount);
    if (!value || value <= 0) return;
    addEntry("gastos", value, note, category, activeWallet);
    setAmount("");
    setNote("");
  };

  return (
    <Screen>
      <MonthPicker />

      {/* Budget */}
      <Card>
        <T kind="label">{t("Monthly budget (₱)")}</T>
        <Field value={budget} onChangeText={setBudget} keyboardType="numeric" />
        <T kind="label" style={{ marginTop: 8 }}>
          {t("Remaining")}
        </T>
        <T kind="big" color={remaining < 0 ? colors.red : undefined}>
          {peso(remaining)}
        </T>
        <T kind="muted">
          {t("Spent: ₱{n}", { n: monthSpent.toLocaleString() })}
        </T>
      </Card>

      {/* Add gastos */}
      <Card>
        <T kind="title">{t("Add gastos")}</T>
        <Chips>
          {CATEGORIES.map((c) => (
            <Chip
              key={c.key}
              label={t(c.label)}
              icon={safeIcon(c.icon, "apps")}
              active={category === c.key}
              color={colors.blue}
              onPress={() => setCategory(c.key)}
            />
          ))}
        </Chips>
        <WalletPicker value={activeWallet} onChange={setWalletId} />
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
        <Button
          label={t("Add gastos")}
          icon="remove-circle"
          color={colors.blue}
          onPress={handleAdd}
        />
      </Card>

      {/* Recent */}
      <Card>
        <T kind="label">{t("Recent")}</T>
        {recent.length === 0 ? (
          <T kind="muted" style={{ marginTop: 8 }}>
            {t("No expenses this month yet.")}
          </T>
        ) : (
          recent.map((e) => (
            <Row
              key={e.id}
              icon={entryIcon(e, goals)}
              tone={colors.red}
              title={entryTitle(e, goals, t)}
              sub={fdate(e.date)}
              amount={`-${peso(e.amount)}`}
            />
          ))
        )}
      </Card>
    </Screen>
  );
}