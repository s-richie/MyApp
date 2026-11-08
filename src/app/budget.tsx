import { useState } from "react";
import { CATEGORIES, useData } from "../app-data";
import { useTheme } from "../app-theme";
import { useI18n } from "../i18n";
import { moneyIcon, moneyTitle } from "../money";
import { MonthPicker } from "../month-picker";
import {
  Button,
  Card,
  Chip,
  Chips,
  Field,
  peso,
  Row,
  safeIcon,
  Screen,
  T,
} from "../ui";
import { WalletPicker } from "../wallet-picker";

export default function Budget() {
  const { colors } = useTheme();
  const { t, fdate } = useI18n();
  const { monthEntries, addEntry, budget, setBudget, monthSpent, wallets } =
    useData();

  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [category, setCategory] = useState("food");
  const [walletId, setWalletId] = useState("");

  const activeWallet =
    wallets.find((w) => w.id === walletId)?.id ?? wallets[0].id;
  const budgetNum = Number(budget) || 0;
  const remaining = budgetNum - monthSpent;
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
        <Field
          placeholder="0"
          value={budget === "0" ? "" : budget}
          onChangeText={setBudget}
          keyboardType="numeric"
        />

        {budgetNum > 0 ? (
          <>
            <T kind="label" style={{ marginTop: 8 }}>
              {t("Remaining")}
            </T>
            <T kind="big" color={remaining < 0 ? colors.red : undefined}>
              {peso(remaining)}
            </T>
          </>
        ) : (
          <T kind="muted" style={{ marginTop: 8 }}>
            {t("Set how much you plan to spend this month.")}
          </T>
        )}
        <T kind="muted">
          {t("Spent: ₱{n}", { n: monthSpent.toLocaleString() })}
        </T>
      </Card>

      {/* Add expense */}
      <Card>
        <T kind="title">{t("Add expense")}</T>
        <Chips>
          {CATEGORIES.map((c) => (
            <Chip
              key={c.key}
              label={t(c.label)}
              icon={safeIcon(c.icon, "apps")}
              active={category === c.key}
              color={colors.red}
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
          label={t("Add expense")}
          icon="remove-circle"
          color={colors.red}
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
              icon={moneyIcon(e)}
              tone={colors.red}
              title={moneyTitle(e, t)}
              sub={fdate(e.date)}
              amount={`-${peso(e.amount)}`}
            />
          ))
        )}
      </Card>
    </Screen>
  );
}
