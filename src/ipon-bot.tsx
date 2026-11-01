import { useState } from "react";
import { View, Image, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "./app-theme";
import { useI18n } from "./i18n";
import { useData, Entry, categoryOf } from "./app-data";
import { T } from "./ui";

export const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;

export const BADGES = [
  { days: 3, icon: "medal" as const, color: "#cd7f32", label: "3 days" },
  { days: 7, icon: "medal" as const, color: "#9ca3af", label: "7 days" },
  { days: 14, icon: "medal" as const, color: "#eab308", label: "14 days" },
  { days: 30, icon: "trophy" as const, color: "#f59e0b", label: "30 days" },
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
  const { t } = useI18n();
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
        t("Over budget by ₱{n}. Slow down on spending.", {
          n: Math.abs(remaining).toLocaleString(),
        })
      );
    } else if (used >= 0.8) {
      tips.push(
        t("{p}% of your budget is used. Careful!", { p: Math.round(used * 100) })
      );
    } else if (monthSpent > 0) {
      tips.push(
        t("{p}% of your budget used. Nice pace!", { p: Math.round(used * 100) })
      );
    }
  }

  // Goal tips
  goals.forEach((g) => {
    if (g.target <= 0) return;
    const done = goalSaved(g.id);
    const left = g.target - done;
    if (left <= 0) {
      tips.push(t("{name} goal reached. Congrats!", { name: g.name }));
    } else if (done / g.target >= 0.8) {
      tips.push(
        t("₱{n} to go for {name}!", { n: left.toLocaleString(), name: g.name })
      );
    }
  });

  // Streak tips
  const streak = computeStreak(entries);
  if (streak.current >= 3) {
    tips.push(t("{n}-day ipon streak. Keep going!", { n: streak.current }));
  }
  if (!streak.today) {
    tips.push(
      streak.current > 0
        ? t("Save today to keep your {n}-day streak.", { n: streak.current })
        : t("No ipon yet today. Even ₱10 counts.")
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
        t("{p}% of spending goes to {cat}.", {
          p: pct,
          cat: t(categoryOf(topKey).label),
        })
      );
    }
  }

  if (entries.length === 0) {
    tips.push(t("Hi, I'm Ipon Bot! Add an ipon to start."));
  }
  tips.push(t("Tip: save first, spend what's left."));

  return tips;
}

export function BotTip() {
  const { colors } = useTheme();
  const tips = useTips();
  const [i, setI] = useState(0);
  const idx = i % tips.length;

  return (
    <Pressable
      onPress={() => setI(i + 1)}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 12,
      }}
    >
      <Image
        source={require("../assets/images/splash-icon.png")}
        style={{ width: 64, height: 64 }}
        resizeMode="contain"
      />
      <View
        style={{
          flex: 1,
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderWidth: 1,
          borderRadius: 16,
          padding: 12,
        }}
      >
        <T style={{ flex: 1, fontSize: 14 }}>{tips[idx]}</T>
        <Ionicons name="refresh" size={16} color={colors.subtext} />
      </View>
    </Pressable>
  );
}