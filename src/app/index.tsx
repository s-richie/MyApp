import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useTheme, Colors } from "../app-theme";
import { useData, CATEGORIES, categoryOf, DEFAULT_GOAL_ID } from "../app-data";
import { MonthPicker } from "../month-picker";
import { BotTip } from "../ipon-bot";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const CHART_H = 110;

export default function Dashboard() {
  const { colors } = useTheme();
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
  const spent = monthSpent;
  const s = makeStyles(colors);

  const totalBalance = wallets.reduce((a, w) => a + walletBalance(w.id), 0);

  const budgetNum = Number(budget) || 0;
  const budgetUsed = budgetNum > 0 ? Math.min(spent / budgetNum, 1) : 0;
  const remaining = budgetNum - spent;
  const overBudget = remaining < 0;

  // Daily allowance (current month only, counting today)
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysLeft = daysInMonth - now.getDate() + 1;
  const allowance = daysLeft > 0 ? Math.floor(remaining / daysLeft) : 0;

  // Spending by category (selected month)
  const byCategory = CATEGORIES.map((cat) => ({
    ...cat,
    total: monthEntries
      .filter((e) => e.kind === "gastos" && categoryOf(e.category).key === cat.key)
      .reduce((a, e) => a + e.amount, 0),
  }))
    .filter((c) => c.total > 0)
    .sort((a, b) => b.total - a.total);

  // Last 7 days (oldest -> today)
  const week = Array.from({ length: 7 }, (_, i) => {
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - (6 - i));
    const next = new Date(day);
    next.setDate(day.getDate() + 1);

    const inDay = entries.filter((e) => {
      const t = new Date(e.date).getTime();
      return t >= day.getTime() && t < next.getTime();
    });

    return {
      label: DAYS[day.getDay()],
      ipon: inDay.filter((e) => e.kind === "ipon").reduce((a, e) => a + e.amount, 0),
      gastos: inDay.filter((e) => e.kind === "gastos").reduce((a, e) => a + e.amount, 0),
    };
  });

  const maxVal = Math.max(1, ...week.flatMap((w) => [w.ipon, w.gastos]));
  const barH = (v: number) => (v > 0 ? Math.max((v / maxVal) * CHART_H, 4) : 0);

  const recent = monthEntries.slice(0, 5);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={s.container}
    >
      <BotTip />

      <MonthPicker />

      {/* Wallets */}
      <View style={s.card}>
        <Text style={s.label}>Total balance (all wallets)</Text>
        <Text style={[s.big, totalBalance < 0 && { color: colors.red }]}>
          ₱{totalBalance.toLocaleString()}
        </Text>
        {wallets.map((w) => {
          const bal = walletBalance(w.id);
          return (
            <View key={w.id} style={[s.catHead, { marginTop: 10 }]}>
              <Text style={s.rowText}>
                {w.emoji} {w.name}
              </Text>
              <Text style={[s.rowText, bal < 0 && { color: colors.red }]}>
                ₱{bal.toLocaleString()}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Saved / Spent */}
      <View style={s.statsRow}>
        <View style={[s.card, s.stat]}>
          <Text style={s.label}>Saved this month</Text>
          <Text style={[s.statValue, { color: colors.green }]}>
            ₱{monthSaved.toLocaleString()}
          </Text>
        </View>
        <View style={[s.card, s.stat]}>
          <Text style={s.label}>Spent this month</Text>
          <Text style={[s.statValue, { color: colors.red }]}>
            ₱{spent.toLocaleString()}
          </Text>
        </View>
      </View>

      {/* Budget */}
      <View style={s.card}>
        <Text style={s.label}>Budget left</Text>
        <Text style={[s.big, overBudget && { color: colors.red }]}>
          ₱{remaining.toLocaleString()}
        </Text>
        <View style={s.barBg}>
          <View
            style={[
              s.barFill,
              {
                width: `${budgetUsed * 100}%`,
                backgroundColor: overBudget ? colors.red : colors.blue,
              },
            ]}
          />
        </View>
        <Text style={s.small}>
          {overBudget
            ? `Over budget by ₱${Math.abs(remaining).toLocaleString()}`
            : `${Math.round(budgetUsed * 100)}% of ₱${budgetNum.toLocaleString()} used`}
        </Text>
        {isCurrentMonth && !overBudget && (
          <Text style={[s.small, { color: colors.text, fontWeight: "600" }]}>
            💡 You can spend about ₱{allowance.toLocaleString()} per day
            ({daysLeft} {daysLeft === 1 ? "day" : "days"} left)
          </Text>
        )}
      </View>

      {/* Where your money went */}
      <View style={s.card}>
        <Text style={s.label}>Where your money went</Text>
        {byCategory.length === 0 ? (
          <Text style={s.small}>No expenses this month yet.</Text>
        ) : (
          byCategory.map((c) => {
            const pct = spent > 0 ? c.total / spent : 0;
            return (
              <View key={c.key} style={{ marginTop: 12 }}>
                <View style={s.catHead}>
                  <Text style={s.rowText}>
                    {c.emoji} {c.label}
                  </Text>
                  <Text style={s.rowText}>
                    ₱{c.total.toLocaleString()} · {Math.round(pct * 100)}%
                  </Text>
                </View>
                <View style={s.catBarBg}>
                  <View
                    style={[
                      s.catBarFill,
                      { width: `${pct * 100}%`, backgroundColor: colors.blue },
                    ]}
                  />
                </View>
              </View>
            );
          })
        )}
      </View>

      {/* Goals */}
      <View style={s.card}>
        <Text style={s.label}>Ipon goals (all time)</Text>
        {goals.map((g) => {
          const done = goalSaved(g.id);
          const pct = g.target > 0 ? Math.min(done / g.target, 1) : 0;
          const reached = g.target > 0 && done >= g.target;
          return (
            <View key={g.id} style={{ marginTop: 14 }}>
              <View style={s.catHead}>
                <Text style={s.rowText}>
                  {g.emoji} {g.name}
                </Text>
                <Text style={s.rowText}>
                  ₱{done.toLocaleString()} / ₱{g.target.toLocaleString()}
                </Text>
              </View>
              <View style={s.barBg}>
                <View
                  style={[s.barFill, { width: `${pct * 100}%`, backgroundColor: colors.green }]}
                />
              </View>
              <Text style={s.small}>
                {reached
                  ? "Goal reached! 🎉"
                  : `${Math.round(pct * 100)}% · ₱${Math.max(g.target - done, 0).toLocaleString()} to go`}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Last 7 days chart */}
      <View style={s.card}>
        <Text style={s.label}>Last 7 days</Text>
        <View style={s.chart}>
          {week.map((w, i) => (
            <View key={i} style={s.dayCol}>
              <View style={s.bars}>
                <View style={[s.bar, { height: barH(w.ipon), backgroundColor: colors.green }]} />
                <View style={[s.bar, { height: barH(w.gastos), backgroundColor: colors.red }]} />
              </View>
              <Text style={s.dayLabel}>{w.label}</Text>
            </View>
          ))}
        </View>
        <View style={s.legend}>
          <View style={s.legendItem}>
            <View style={[s.dot, { backgroundColor: colors.green }]} />
            <Text style={s.small}>Ipon</Text>
          </View>
          <View style={s.legendItem}>
            <View style={[s.dot, { backgroundColor: colors.red }]} />
            <Text style={s.small}>Gastos</Text>
          </View>
        </View>
      </View>

      {/* Recent activity */}
      <View style={s.card}>
        <Text style={s.label}>Recent activity</Text>
        {recent.length === 0 ? (
          <Text style={s.small}>No entries this month yet.</Text>
        ) : (
          recent.map((item) => {
            const isIpon = item.kind === "ipon";
            const cat = categoryOf(item.category);
            const g = goals.find((x) => x.id === (item.goalId ?? DEFAULT_GOAL_ID));
            return (
              <View key={item.id} style={s.row}>
                <View style={{ flex: 1 }}>
                  <Text style={s.rowText}>
                    {isIpon ? g?.emoji ?? "💰" : cat.emoji}{" "}
                    {item.note || (isIpon ? g?.name ?? "Ipon" : cat.label)}
                  </Text>
                  <Text style={s.date}>{formatDate(item.date)}</Text>
                </View>
                <Text
                  style={{
                    color: isIpon ? colors.green : colors.red,
                    fontWeight: "bold",
                  }}
                >
                  {isIpon ? "+" : "-"}₱{item.amount.toLocaleString()}
                </Text>
              </View>
            );
          })
        )}
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
    statsRow: { flexDirection: "row", gap: 12 },
    stat: { flex: 1 },
    statValue: { fontSize: 24, fontWeight: "bold", marginTop: 4 },
    label: { fontSize: 14, color: c.subtext },
    big: { fontSize: 32, fontWeight: "bold", color: c.text, marginTop: 4 },
    small: { color: c.subtext, marginTop: 6, fontSize: 13 },
    barBg: {
      height: 12,
      backgroundColor: c.barBg,
      borderRadius: 6,
      marginTop: 10,
      overflow: "hidden",
    },
    barFill: { height: 12, borderRadius: 6 },
    catHead: { flexDirection: "row", justifyContent: "space-between" },
    catBarBg: {
      height: 8,
      backgroundColor: c.barBg,
      borderRadius: 4,
      marginTop: 6,
      overflow: "hidden",
    },
    catBarFill: { height: 8, borderRadius: 4 },
    chart: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-end",
      marginTop: 16,
      height: CHART_H + 24,
    },
    dayCol: { flex: 1, alignItems: "center", justifyContent: "flex-end" },
    bars: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: 3,
      height: CHART_H,
    },
    bar: { width: 10, borderRadius: 4 },
    dayLabel: { color: c.subtext, fontSize: 11, marginTop: 6 },
    legend: { flexDirection: "row", gap: 16, marginTop: 8 },
    legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
    dot: { width: 10, height: 10, borderRadius: 5 },
    row: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderColor: c.border,
    },
    rowText: { color: c.text },
    date: { color: c.subtext, fontSize: 12, marginTop: 2 },
  });