import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useTheme, Colors } from "../app-theme";
import { useData } from "../app-data";
import { BotTip, computeStreak, dayKey, BADGES } from "../ipon-bot";

type Challenge = {
  title: string;
  desc: string;
  value: number;
  target: number;
  money?: boolean;
};

export default function Bot() {
  const { colors } = useTheme();
  const { entries } = useData();
  const s = makeStyles(colors);

  const streak = computeStreak(entries);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const iponByDay = new Map<string, number>();
  const gastosDays = new Set<string>();
  entries.forEach((e) => {
    const k = dayKey(new Date(e.date));
    if (e.kind === "ipon") iponByDay.set(k, (iponByDay.get(k) ?? 0) + e.amount);
    else gastosDays.add(k);
  });

  // Challenge 1: ₱20 a day (last 30 days)
  let daily20 = 0;
  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    if ((iponByDay.get(dayKey(d)) ?? 0) >= 20) daily20++;
  }

  // Challenge 2: no-spend days this month (counted from your first entry)
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const firstTime = entries.reduce(
    (min, e) => Math.min(min, new Date(e.date).getTime()),
    Infinity
  );
  let noSpend = 0;
  if (isFinite(firstTime)) {
    const first = new Date(firstTime);
    first.setHours(0, 0, 0, 0);
    const start = first > monthStart ? first : monthStart;
    for (const d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
      if (!gastosDays.has(dayKey(d))) noSpend++;
    }
  }

  // Challenge 3: ₱500 saved this month
  const monthIpon = entries
    .filter((e) => {
      const d = new Date(e.date);
      return (
        e.kind === "ipon" &&
        d.getFullYear() === today.getFullYear() &&
        d.getMonth() === today.getMonth()
      );
    })
    .reduce((a, e) => a + e.amount, 0);

  const challenges: Challenge[] = [
    {
      title: "₱20 a day",
      desc: "Save at least ₱20 on 30 different days (last 30 days).",
      value: daily20,
      target: 30,
    },
    {
      title: "No-spend days",
      desc: "Get 5 days this month with no expenses.",
      value: noSpend,
      target: 5,
    },
    {
      title: "₱500 this month",
      desc: "Save a total of ₱500 this month.",
      value: monthIpon,
      target: 500,
      money: true,
    },
  ];

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={s.container}
    >
      <BotTip />

      {/* Streak */}
      <View style={s.card}>
        <Text style={s.label}>Ipon streak</Text>
        <Text style={s.big}>
          🔥 {streak.current} {streak.current === 1 ? "day" : "days"}
        </Text>
        <Text style={s.small}>
          Best streak: {streak.best} {streak.best === 1 ? "day" : "days"}
          {streak.today ? " · You saved today! ✅" : " · Save today to keep it going"}
        </Text>
      </View>

      {/* Badges */}
      <View style={s.card}>
        <Text style={s.label}>Badges</Text>
        <View style={s.badges}>
          {BADGES.map((b) => {
            const earned = streak.best >= b.days;
            return (
              <View key={b.days} style={[s.badge, { opacity: earned ? 1 : 0.3 }]}>
                <Text style={{ fontSize: 34 }}>{b.emoji}</Text>
                <Text style={s.badgeLabel}>{b.label}</Text>
              </View>
            );
          })}
        </View>
        <Text style={s.small}>Badges unlock from your best ipon streak.</Text>
      </View>

      {/* Challenges */}
      <Text style={s.section}>Challenges</Text>
      {challenges.map((c) => {
        const pct = Math.min(c.value / c.target, 1);
        const done = c.value >= c.target;
        const fmt = (n: number) => (c.money ? `₱${n.toLocaleString()}` : `${n}`);
        return (
          <View key={c.title} style={s.card}>
            <View style={s.head}>
              <Text style={s.title}>{c.title}</Text>
              <Text style={s.title}>
                {fmt(Math.min(c.value, c.target))} / {fmt(c.target)}
              </Text>
            </View>
            <Text style={s.small}>{c.desc}</Text>
            <View style={s.barBg}>
              <View
                style={[
                  s.barFill,
                  { width: `${pct * 100}%`, backgroundColor: done ? colors.green : colors.blue },
                ]}
              />
            </View>
            {done && <Text style={[s.small, { color: colors.green }]}>Challenge complete! 🎉</Text>}
          </View>
        );
      })}
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
    label: { fontSize: 14, color: c.subtext },
    big: { fontSize: 32, fontWeight: "bold", color: c.text, marginTop: 4 },
    small: { color: c.subtext, marginTop: 6, fontSize: 13 },
    section: { fontSize: 16, fontWeight: "bold", color: c.text, marginBottom: 8 },
    badges: { flexDirection: "row", justifyContent: "space-between", marginTop: 12 },
    badge: { alignItems: "center", flex: 1 },
    badgeLabel: { color: c.text, fontSize: 12, marginTop: 4 },
    head: { flexDirection: "row", justifyContent: "space-between" },
    title: { color: c.text, fontSize: 15, fontWeight: "bold" },
    barBg: {
      height: 12,
      backgroundColor: c.barBg,
      borderRadius: 6,
      marginTop: 10,
      overflow: "hidden",
    },
    barFill: { height: 12, borderRadius: 6 },
  });