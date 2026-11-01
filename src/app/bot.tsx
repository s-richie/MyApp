import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../app-theme";
import { useI18n } from "../i18n";
import { useData } from "../app-data";
import { BotTip, computeStreak, dayKey, BADGES } from "../ipon-bot";
import { Screen, Card, T, Progress, IconCircle } from "../ui";

type Challenge = {
  title: string;
  desc: string;
  value: number;
  target: number;
  money?: boolean;
};

export default function Bot() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const { entries } = useData();

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
      desc: "Save ₱20 or more on 30 days.",
      value: daily20,
      target: 30,
    },
    {
      title: "No-spend days",
      desc: "5 days this month with no gastos.",
      value: noSpend,
      target: 5,
    },
    {
      title: "₱500 this month",
      desc: "Save ₱500 this month.",
      value: monthIpon,
      target: 500,
      money: true,
    },
  ];

  const dayWord = (n: number) => t(n === 1 ? "day" : "days");

  return (
    <Screen>
      <BotTip />

      {/* Streak */}
      <Card>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
          <IconCircle name="flame" size={52} color="#f97316" />
          <View>
            <T kind="muted">{t("Ipon streak")}</T>
            <T kind="big">
              {streak.current} {dayWord(streak.current)}
            </T>
          </View>
        </View>
        <T kind="muted" style={{ marginTop: 10 }}>
          {t("Best streak: {n} {d}", { n: streak.best, d: dayWord(streak.best) })}
          {"  •  "}
          {streak.today ? t("Saved today") : t("Save today to keep it going")}
        </T>
      </Card>

      {/* Badges */}
      <Card>
        <T kind="label">{t("Badges")}</T>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginTop: 12,
          }}
        >
          {BADGES.map((b) => {
            const earned = streak.best >= b.days;
            return (
              <View
                key={b.days}
                style={{ alignItems: "center", flex: 1, opacity: earned ? 1 : 0.3 }}
              >
                <IconCircle name={b.icon} color={b.color} size={52} />
                <T kind="muted" style={{ marginTop: 6 }}>
                  {t(b.label)}
                </T>
              </View>
            );
          })}
        </View>
      </Card>

      {/* Challenges */}
      <T kind="title" style={{ marginBottom: 10 }}>
        {t("Challenges")}
      </T>
      {challenges.map((c) => {
        const pct = Math.min(c.value / c.target, 1);
        const done = c.value >= c.target;
        const fmt = (n: number) => (c.money ? `₱${n.toLocaleString()}` : `${n}`);
        return (
          <Card key={c.title}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <T kind="title" style={{ flex: 1 }}>
                {t(c.title)}
              </T>
              {done ? (
                <Ionicons name="checkmark-circle" size={22} color={colors.green} />
              ) : null}
              <T kind="label">
                {fmt(Math.min(c.value, c.target))} / {fmt(c.target)}
              </T>
            </View>
            <T kind="muted" style={{ marginTop: 4 }}>
              {done ? t("Done") : t(c.desc)}
            </T>
            <Progress value={pct} color={done ? colors.green : colors.blue} />
          </Card>
        );
      })}
    </Screen>
  );
}