import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { BackHandler, Pressable, View } from "react-native";
import { CATEGORIES, categoryOf, useData } from "../app-data";
import { useTheme } from "../app-theme";
import { useI18n } from "../i18n";
import { BotTip } from "../ipon-bot";
import { moneyIcon, moneyTitle } from "../money";
import { MonthPicker } from "../month-picker";
import {
  Button,
  Card,
  IconCircle,
  iconOf,
  peso,
  Progress,
  Row,
  safeIcon,
  Screen,
  T,
} from "../ui";
import Utang from "./utang";

type View_ = "utang" | "ambagan" | null;

export default function Dashboard() {
  const { colors } = useTheme();
  const { t, fdate } = useI18n();
  const router = useRouter();
  const {
    entries,
    wallets,
    walletBalance,
    debts,
    budget,
    monthEntries,
    monthSaved,
    monthSpent,
    isCurrentMonth,
  } = useData();

  // Opens Utang or Ambagan right here on Home
  const [view, setView] = useState<View_>(null);

  useEffect(() => {
    if (!view) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      setView(null);
      return true;
    });
    return () => sub.remove();
  }, [view]);

  if (view) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <Pressable
          onPress={() => setView(null)}
          hitSlop={8}
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderBottomWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.card,
          }}
        >
          <Ionicons name="chevron-back" size={22} color={colors.green} />
          <T color={colors.green} style={{ fontSize: 16, marginLeft: 2 }}>
            Home
          </T>
          <T
            kind="title"
            style={{ flex: 1, textAlign: "center", marginRight: 60 }}
          >
            {t("Utang & Ambagan")}
          </T>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Utang initialTab={view} />
        </View>
      </View>
    );
  }

  const total = wallets.reduce((a, w) => a + walletBalance(w.id), 0);

  const budgetNum = Number(budget) || 0;
  const remaining = budgetNum - monthSpent;
  const over = remaining < 0;
  const used = budgetNum > 0 ? monthSpent / budgetNum : 0;

  const now = new Date();
  const daysInMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
  ).getDate();
  const daysLeft = daysInMonth - now.getDate() + 1;
  const perDay = daysLeft > 0 ? Math.floor(remaining / daysLeft) : 0;

  const owedTotal = debts
    .filter((d) => d.direction === "owed")
    .reduce((a, d) => a + Math.max(d.amount - d.paid, 0), 0);
  const oweTotal = debts
    .filter((d) => d.direction === "owe")
    .reduce((a, d) => a + Math.max(d.amount - d.paid, 0), 0);

  const byCategory = CATEGORIES.map((c) => ({
    ...c,
    total: monthEntries
      .filter(
        (e) => e.kind === "gastos" && categoryOf(e.category).key === c.key,
      )
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
                label={t("Add money")}
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

      {/* Total money */}
      <Card>
        <T kind="label">{t("Total money")}</T>
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

      {/* Utang & Ambagan */}
      <Card>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <IconCircle name="people" size={34} color={colors.blue} />
          <T kind="title" style={{ flex: 1 }} numberOfLines={1}>
            {t("Utang & Ambagan")}
          </T>
        </View>

        <View style={{ flexDirection: "row", gap: 12, marginTop: 14 }}>
          <View style={{ flex: 1 }}>
            <T kind="label">{t("They owe me")}</T>
            <T
              color={colors.green}
              style={{ fontSize: 20, fontWeight: "800", marginTop: 2 }}
            >
              {peso(owedTotal)}
            </T>
          </View>
          <View style={{ flex: 1 }}>
            <T kind="label">{t("I owe")}</T>
            <T
              color={colors.red}
              style={{ fontSize: 20, fontWeight: "800", marginTop: 2 }}
            >
              {peso(oweTotal)}
            </T>
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: 12, marginTop: 4 }}>
          <View style={{ flex: 1 }}>
            <Button
              label="Utang"
              icon="swap-horizontal"
              outline
              color={colors.blue}
              onPress={() => setView("utang")}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              label="Ambagan"
              icon="restaurant"
              outline
              color={colors.blue}
              onPress={() => setView("ambagan")}
            />
          </View>
        </View>
      </Card>

      {/* Income / Spent */}
      <View style={{ flexDirection: "row", gap: 12 }}>
        <Card style={{ flex: 1 }}>
          <IconCircle name="trending-up" size={34} />
          <T kind="label" style={{ marginTop: 8 }}>
            {t("Income")}
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
      {budgetNum > 0 ? (
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
            {isCurrentMonth && !over
              ? `  •  ${t("{a} per day", { a: peso(perDay) })}`
              : ""}
          </T>
        </Card>
      ) : (
        <Card>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <IconCircle name="pie-chart" size={42} color={colors.blue} />
            <T kind="title" style={{ flex: 1 }}>
              {t("No budget set")}
            </T>
          </View>
          <Button
            label={t("Set budget")}
            icon="create"
            outline
            color={colors.blue}
            onPress={() => router.navigate("/budget" as any)}
          />
        </Card>
      )}

      {/* Where it went */}
      {byCategory.length > 0 && (
        <Card>
          <T kind="label">{t("Where it went")}</T>
          {byCategory.map((c) => {
            const pct = monthSpent > 0 ? c.total / monthSpent : 0;
            return (
              <View key={c.key} style={{ marginTop: 14 }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
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
              const isIn = e.kind === "ipon";
              return (
                <Row
                  key={e.id}
                  icon={moneyIcon(e)}
                  tone={isIn ? colors.green : colors.red}
                  title={moneyTitle(e, t)}
                  sub={fdate(e.date)}
                  amount={`${isIn ? "+" : "-"}${peso(e.amount)}`}
                />
              );
            })
          )}
        </Card>
      )}
    </Screen>
  );
}
