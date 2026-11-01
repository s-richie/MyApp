import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "../app-theme";
import { useI18n } from "../i18n";
import { useData, CATEGORIES, categoryOf } from "../app-data";
import { MonthPicker } from "../month-picker";
import { BotTip } from "../ipon-bot";
import {
  Screen,
  Card,
  T,
  Progress,
  IconCircle,
  Row,
  Button,
  iconOf,
  entryIcon,
  entryTitle,
  safeIcon,
  peso,
} from "../ui";

export default function Dashboard() {
  const { colors } = useTheme();
  const { t, fdate } = useI18n();
  const router = useRouter();
  const {
    entries,
    goals,
    goalSaved,
    wallets,
    walletBalance,
    budget,
    monthEntries,
    monthSaved,
    monthSpent,
    isCurrentMonth,
  } = useData();

  const total = wallets.reduce((a, w) => a + walletBalance(w.id), 0);

  const budgetNum = Number(budget) || 0;
  const remaining = budgetNum - monthSpent;
  const over = remaining < 0;
  const used = budgetNum > 0 ? monthSpent / budgetNum : 0;

  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysLeft = daysInMonth - now.getDate() + 1;
  const perDay = daysLeft > 0 ? Math.floor(remaining / daysLeft) : 0;

  const byCategory = CATEGORIES.map((c) => ({
    ...c,
    total: monthEntries
      .filter((e) => e.kind === "gastos" && categoryOf(e.category).key === c.key)
      .reduce((a, e) => a + e.amount, 0),
  }))
    .filter((c) => c.total > 0)
    .sort((a, b) => b.total - a.total);

  const recent = monthEntries.slice(0, 3);

  return (
    <Screen>
      <BotTip />
      <MonthPicker />

      {entries.length === 0 && (
        <Card>
          <T kind="title">{t("Start here")}</T>
          <View style={{ flexDirection: "row", gap: 12, marginTop: 6 }}>
            <View style={{ flex: 1 }}>
              <Button
                label={t("Add ipon")}
                icon="add-circle"
                onPress={() => router.navigate("/ipon" as any)}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Button
                label={t("Add gastos")}
                icon="remove-circle"
                color={colors.red}
                onPress={() => router.navigate("/budget" as any)}
              />
            </View>
          </View>
        </Card>
      )}

      {/* Balance */}
      <Card>
        <T kind="label">{t("Balance")}</T>
        <T kind="big" color={total < 0 ? colors.red : undefined}>
          {peso(total)}
        </T>
        {wallets.length > 1 &&
          wallets.map((w) => {
            const bal = walletBalance(w.id);
            return (
              <View
                key={w.id}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                  marginTop: 10,
                }}
              >
                <IconCircle name={iconOf(w, "wallet")} size={30} />
                <T style={{ flex: 1 }}>{w.name}</T>
                <T color={bal < 0 ? colors.red : undefined}>{peso(bal)}</T>
              </View>
            );
          })}
      </Card>

      {/* Saved / Spent */}
      <View style={{ flexDirection: "row", gap: 12 }}>
        <Card style={{ flex: 1 }}>
          <IconCircle name="trending-up" size={34} />
          <T kind="label" style={{ marginTop: 8 }}>
            {t("Saved")}
          </T>
          <T color={colors.green} style={{ fontSize: 22, fontWeight: "800" }}>
            {peso(monthSaved)}
          </T>
        </Card>
        <Card style={{ flex: 1 }}>
          <IconCircle name="trending-down" size={34} color={colors.red} />
          <T kind="label" style={{ marginTop: 8 }}>
            {t("Spent")}
          </T>
          <T color={colors.red} style={{ fontSize: 22, fontWeight: "800" }}>
            {peso(monthSpent)}
          </T>
        </Card>
      </View>

      {/* Budget */}
      <Card>
        <T kind="label">{t("Budget left")}</T>
        <T kind="big" color={over ? colors.red : undefined}>
          {peso(remaining)}
        </T>
        <Progress value={used} color={over ? colors.red : colors.blue} />
        <T kind="muted" style={{ marginTop: 8 }}>
          {over
            ? t("Over by {n}", { n: peso(Math.abs(remaining)) })
            : t("{p}% used", { p: Math.round(used * 100) })}
          {isCurrentMonth && !over && budgetNum > 0
            ? `  •  ${t("{a} per day", { a: peso(perDay) })}`
            : ""}
        </T>
      </Card>

      {/* Goals */}
      <Card>
        <T kind="label">{t("Goals")}</T>
        {goals.map((g) => {
          const done = goalSaved(g.id);
          const pct = g.target > 0 ? Math.min(done / g.target, 1) : 0;
          return (
            <View key={g.id} style={{ marginTop: 14 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <IconCircle name={iconOf(g, "flag")} size={34} />
                <View style={{ flex: 1 }}>
                  <T numberOfLines={1}>{g.name}</T>
                  <T kind="muted">
                    {peso(done)} / {peso(g.target)}
                  </T>
                </View>
                {pct >= 1 ? (
                  <Ionicons name="checkmark-circle" size={24} color={colors.green} />
                ) : (
                  <T kind="label">{Math.round(pct * 100)}%</T>
                )}
              </View>
              <Progress value={pct} color={colors.green} />
            </View>
          );
        })}
      </Card>

      {/* Where it went */}
      {byCategory.length > 0 && (
        <Card>
          <T kind="label">{t("Where it went")}</T>
          {byCategory.map((c) => {
            const pct = monthSpent > 0 ? c.total / monthSpent : 0;
            return (
              <View key={c.key} style={{ marginTop: 14 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <IconCircle
                    name={safeIcon(c.icon, "apps")}
                    size={30}
                    color={colors.blue}
                  />
                  <T style={{ flex: 1 }}>{t(c.label)}</T>
                  <T kind="muted">
                    {peso(c.total)} · {Math.round(pct * 100)}%
                  </T>
                </View>
                <Progress value={pct} color={colors.blue} height={6} />
              </View>
            );
          })}
        </Card>
      )}

      {/* Recent */}
      {entries.length > 0 && (
        <Card>
          <T kind="label">{t("Recent")}</T>
          {recent.length === 0 ? (
            <T kind="muted" style={{ marginTop: 8 }}>
              {t("No entries this month yet.")}
            </T>
          ) : (
            recent.map((e) => {
              const isIpon = e.kind === "ipon";
              return (
                <Row
                  key={e.id}
                  icon={entryIcon(e, goals)}
                  tone={isIpon ? colors.green : colors.red}
                  title={entryTitle(e, goals, t)}
                  sub={fdate(e.date)}
                  amount={`${isIpon ? "+" : "-"}${peso(e.amount)}`}
                />
              );
            })
          )}
        </Card>
      )}
    </Screen>
  );
}