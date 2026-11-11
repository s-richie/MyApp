import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { BackHandler, Pressable, Text, View } from "react-native";
import { AddMode, AddSheet } from "../add-sheet";
import { CATEGORIES, categoryOf, useData } from "../app-data";
import { useTheme } from "../app-theme";
import { BalanceSheet } from "../balance-sheet";
import { useI18n } from "../i18n";
import { BotTip } from "../ipon-bot";
import { moneyIcon, moneyTitle } from "../money";
import { MonthPicker } from "../month-picker";
import {
  Button,
  Card,
  IconCircle,
  IconName,
  iconOf,
  peso,
  Progress,
  Row,
  safeIcon,
  Screen,
  T,
} from "../ui";
import Utang from "./utang";

type Inline = "utang" | "ambagan" | null;

// A big tile that says what it does
function Tile({
  icon,
  tone,
  title,
  hint,
  onPress,
}: {
  icon: IconName;
  tone: string;
  title: string;
  hint: string;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        backgroundColor: colors.card,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 14,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <IconCircle name={icon} color={tone} size={46} />
      <T kind="title" numberOfLines={1} style={{ marginTop: 10 }}>
        {title}
      </T>
      <T kind="muted" numberOfLines={2}>
        {hint}
      </T>
    </Pressable>
  );
}

export default function Home() {
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

  const [view, setView] = useState<Inline>(null); // Utang or Ambagan, shown right here
  const [sheet, setSheet] = useState<AddMode | null>(null); // add money / add expense
  const [balanceFor, setBalanceFor] = useState<string | null>(null); // update a wallet balance

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
    <>
      <Screen>
        {/* Total money */}
        <View
          style={{
            backgroundColor: "#16a34a",
            borderRadius: 24,
            padding: 20,
            overflow: "hidden",
            marginBottom: 16,
          }}
        >
          <View
            style={{
              position: "absolute",
              width: 220,
              height: 220,
              borderRadius: 110,
              backgroundColor: "#22c55e",
              opacity: 0.35,
              top: -90,
              right: -70,
            }}
          />
          <View
            style={{
              position: "absolute",
              width: 160,
              height: 160,
              borderRadius: 80,
              backgroundColor: "#052e16",
              opacity: 0.2,
              bottom: -70,
              left: -50,
            }}
          />
          <Text
            maxFontSizeMultiplier={1.2}
            style={{ color: "#dcfce7", fontWeight: "600" }}
          >
            {t("Total money")}
          </Text>
          <T color="#ffffff" style={{ fontSize: 38, fontWeight: "800" }}>
            {peso(total)}
          </T>

          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 8,
              marginTop: 14,
            }}
          >
            {wallets.map((w) => (
              <Pressable
                key={w.id}
                onPress={() => setBalanceFor(w.id)}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  backgroundColor: "rgba(255,255,255,0.18)",
                  borderRadius: 14,
                  paddingVertical: 7,
                  paddingHorizontal: 12,
                  opacity: pressed ? 0.8 : 1,
                })}
              >
                <Ionicons
                  name={iconOf(w, "wallet")}
                  size={16}
                  color="#ffffff"
                />
                <Text
                  maxFontSizeMultiplier={1.2}
                  style={{ color: "#ffffff", fontWeight: "600" }}
                >
                  {w.name}
                </Text>
                <Text maxFontSizeMultiplier={1.2} style={{ color: "#ffffff" }}>
                  {peso(walletBalance(w.id))}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text
            maxFontSizeMultiplier={1.2}
            style={{ color: "#dcfce7", fontSize: 12, marginTop: 10 }}
          >
            {t("Tap a wallet to update its balance")}
          </Text>
        </View>

        {/* What do you want to do? */}
        <T kind="title" style={{ marginBottom: 10 }}>
          {t("What do you want to do?")}
        </T>
        <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
          <Tile
            icon="add-circle"
            tone={colors.green}
            title={t("Add money")}
            hint={t("Allowance, salary, gifts")}
            onPress={() => setSheet("in")}
          />
          <Tile
            icon="remove-circle"
            tone={colors.red}
            title={t("Add expense")}
            hint={t("Food, fare, bills")}
            onPress={() => setSheet("out")}
          />
        </View>
        <View style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}>
          <Tile
            icon="swap-horizontal"
            tone={colors.blue}
            title="Utang"
            hint={t("Who owes who")}
            onPress={() => setView("utang")}
          />
          <Tile
            icon="restaurant"
            tone="#f59e0b"
            title="Ambagan"
            hint={t("Split a bill")}
            onPress={() => setView("ambagan")}
          />
        </View>

        {/* Utang summary (only when there is something) */}
        {owedTotal > 0 || oweTotal > 0 ? (
          <Pressable onPress={() => setView("utang")}>
            <Card>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
              >
                <IconCircle name="people" size={34} color={colors.blue} />
                <T kind="title" style={{ flex: 1 }} numberOfLines={1}>
                  {t("Utang & Ambagan")}
                </T>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.subtext}
                />
              </View>
              <View style={{ flexDirection: "row", gap: 12, marginTop: 12 }}>
                <View style={{ flex: 1 }}>
                  <T kind="label">{t("They owe me")}</T>
                  <T
                    color={colors.green}
                    style={{ fontSize: 20, fontWeight: "800" }}
                  >
                    {peso(owedTotal)}
                  </T>
                </View>
                <View style={{ flex: 1 }}>
                  <T kind="label">{t("I owe")}</T>
                  <T
                    color={colors.red}
                    style={{ fontSize: 20, fontWeight: "800" }}
                  >
                    {peso(oweTotal)}
                  </T>
                </View>
              </View>
            </Card>
          </Pressable>
        ) : null}

        <BotTip />
        <MonthPicker />

        {/* This month */}
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
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
            >
              <IconCircle name="pie-chart" size={42} color={colors.blue} />
              <T kind="title" style={{ flex: 1 }}>
                {t("Set a monthly budget")}
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
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <T kind="label">{t("Recent")}</T>
              <Pressable
                onPress={() => router.navigate("/history" as any)}
                hitSlop={8}
              >
                <T color={colors.blue} style={{ fontWeight: "600" }}>
                  {t("See all")}
                </T>
              </Pressable>
            </View>
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

      <AddSheet mode={sheet} onClose={() => setSheet(null)} />
      <BalanceSheet walletId={balanceFor} onClose={() => setBalanceFor(null)} />
    </>
  );
}
