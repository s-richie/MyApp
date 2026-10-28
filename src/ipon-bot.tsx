import { useState } from "react";
import { View, Text, Image, Pressable, StyleSheet } from "react-native";
import { useTheme } from "./app-theme";
import { useData, Entry, categoryOf } from "./app-data";

export const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;

export const BADGES = [
  { days: 3, emoji: "🥉", label: "3 days" },
  { days: 7, emoji: "🥈", label: "7 days" },
  { days: 14, emoji: "🥇", label: "14 days" },
  { days: 30, emoji: "🏆", label: "30 days" },
];

export function computeStreak(entries: Entry[]) {
  const days = new Set<string>();
  entries.forEach((e) => {
    if (e.kind === "ipon") days.add(dayKey(new Date(e.date)));
  });

  // Current streak: count back from today (or from yesterday if no ipon yet today)
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  const today = days.has(dayKey(cursor));
  if (!today) cursor.setDate(cursor.getDate() - 1);
  let current = 0;
  while (days.has(dayKey(cursor))) {
    current++;
    cursor.setDate(cursor.getDate() - 1);
  }

  // Best streak ever
  const sorted = Array.from(days).sort();
  let best = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const k of sorted) {
    const [y, m, d] = k.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    if (prev) {
      const diff = Math.round((date.getTime() - prev.getTime()) / 86400000);
      run = diff === 1 ? run + 1 : 1;
    } else {
      run = 1;
    }
    best = Math.max(best, run);
    prev = date;
  }

  return { current, best, today };
}

function useTips(): string[] {
  const { entries, goals, goalSaved, budget, monthSpent, monthEntries, isCurrentMonth } =
    useData();
  const tips: string[] = [];

  // Budget tips (current month only)
  const budgetNum = Number(budget) || 0;
  if (isCurrentMonth && budgetNum > 0) {
    const remaining = budgetNum - monthSpent;
    const used = monthSpent / budgetNum;
    if (remaining < 0) {
      tips.push(
        `Naku! You're over budget by ₱${Math.abs(remaining).toLocaleString()} this month. Try holding off on non-essentials. 😅`
      );
    } else if (used >= 0.8) {
      tips.push(
        `Heads up! You've used ${Math.round(used * 100)}% of your budget. Slow down on gastos! 🐢`
      );
    } else if (monthSpent > 0) {
      tips.push(
        `You've used ${Math.round(used * 100)}% of your budget so far. Keep it up! 💪`
      );
    }
  }

  // Goal tips
  goals.forEach((g) => {
    if (g.target <= 0) return;
    const done = goalSaved(g.id);
    const left = g.target - done;
    if (left <= 0) {
      tips.push(`Congrats! You reached your ${g.name} goal! 🎉`);
    } else if (done / g.target >= 0.8) {
      tips.push(
        `Only ₱${left.toLocaleString()} to go for your ${g.name}! Almost there! 🚀`
      );
    }
  });

  // Streak tips
  const streak = computeStreak(entries);
  if (streak.current >= 3) {
    tips.push(`🔥 ${streak.current}-day ipon streak! Don't break it!`);
  }
  if (!streak.today) {
    tips.push(
      streak.current > 0
        ? `Wala ka pang ipon today. Save even ₱10 to keep your ${streak.current}-day streak!`
        : "Wala pang ipon today. Even ₱10 counts! 💰"
    );
  }

  // Top category tip
  const gastos = monthEntries.filter((e) => e.kind === "gastos");
  if (gastos.length >= 3 && monthSpent > 0) {
    const totals = new Map<string, number>();
    gastos.forEach((e) => {
      const key = categoryOf(e.category).key;
      totals.set(key, (totals.get(key) ?? 0) + e.amount);
    });
    let topKey = "";
    let topVal = 0;
    totals.forEach((v, k) => {
      if (v > topVal) {
        topVal = v;
        topKey = k;
      }
    });
    const pct = Math.round((topVal / monthSpent) * 100);
    if (pct >= 50) {
      tips.push(
        `Most of your gastos (${pct}%) goes to ${categoryOf(topKey).label}. Maybe set a limit?`
      );
    }
  }

  // Always-available tips
  if (entries.length === 0) {
    tips.push("Hi! I'm Ipon Bot 🤖 Add your ipon and gastos and I'll give you tips.");
  }
  tips.push("Tip: Save first, then spend what's left. 😉");

  return tips;
}

export function BotTip() {
  const { colors } = useTheme();
  const tips = useTips();
  const [i, setI] = useState(0);
  const idx = i % tips.length;

  return (
    <Pressable onPress={() => setI(i + 1)} style={s.row}>
      <Image
        source={require("../assets/images/splash-icon.png")}
        style={s.robot}
        resizeMode="contain"
      />
      <View
        style={[
          s.bubble,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Text style={{ color: colors.text, fontSize: 14 }}>{tips[idx]}</Text>
        <Text style={{ color: colors.subtext, fontSize: 11, marginTop: 6 }}>
          Tap for another tip ({idx + 1}/{tips.length})
        </Text>
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  robot: { width: 70, height: 70 },
  bubble: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
  },
});