import { Ionicons } from "@expo/vector-icons";
import { View } from "react-native";
import { useData } from "../app-data";
import { useTheme } from "../app-theme";
import { useI18n } from "../i18n";
import { BADGES, BotTip, computeStreak, dayKey } from "../ipon-bot";
import { Card, IconCircle, Progress, Screen, T } from "../ui";

type Challenge = {
  title: string;
  desc: string;
  value: number;
  target: number;
};

export default function Bot() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const { entries } = useData();

  const streak = computeStreak(entries);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const loggedDays = new Set<string>();
  const gastosDays = new Set<string>();
  entries.forEach((e) => {
    const k = dayKey(new Date(e.date));
    loggedDays.add(k);
    if (e.kind === "gastos") gastosDays.add(k);
  });

  // Challenge 1: log something on each of the last 7 days
  let logged7 = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    if (loggedDays.has(dayKey(d))) logged7++;
  }

  // Challenge 2: no-spend days this month (counted from your first entry)
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const firstTime = entries.reduce(
    (min, e) => Math.min(min, new Date(e.date).getTime()),
    Infinity,
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

  // Challenge 3: entries logged this month
  const monthCount = entries.filter((e) => {
    const d = new Date(e.date);
    return (
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth()
    );
  }).length;

  const challenges: Challenge[] = [
    {
      title: "Log every day",
      desc: "Log something every day for 7 days.",
      value: logged7,
      target: 7,
    },
    {
      title: "No-spend days",
      desc: "5 days this month with no gastos.",
      value: noSpend,
      target: 5,
    },
    {
      title: "20 entries this month",
      desc: "Log 20 entries this month.",
      value: monthCount,
      target: 20,
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
            <T kind="muted">{t("Streak")}</T>
            <T kind="big">
              {streak.current} {dayWord(streak.current)}
            </T>
          </View>
        </View>
        <T kind="muted" style={{ marginTop: 10 }}>
          {t("Best streak: {n} {d}", {
            n: streak.best,
            d: dayWord(streak.best),
          })}
          {"  •  "}
          {streak.today ? t("Logged today") : t("Log today to keep it going")}
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
                style={{
                  alignItems: "center",
                  flex: 1,
                  opacity: earned ? 1 : 0.3,
                }}
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
        return (
          <Card key={c.title}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              <T kind="title" style={{ flex: 1 }}>
                {t(c.title)}
              </T>
              {done ? (
                <Ionicons
                  name="checkmark-circle"
                  size={22}
                  color={colors.green}
                />
              ) : null}
              <T kind="label">
                {Math.min(c.value, c.target)} / {c.target}
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
