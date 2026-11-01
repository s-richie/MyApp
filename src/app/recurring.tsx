import { useState } from "react";
import { View, Pressable, Switch, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../app-theme";
import { useI18n } from "../i18n";
import {
  useData,
  Recurring,
  Frequency,
  Kind,
  CATEGORIES,
  categoryOf,
  DEFAULT_GOAL_ID,
} from "../app-data";
import { WalletPicker } from "../wallet-picker";
import {
  Screen,
  Card,
  T,
  IconCircle,
  Chip,
  Chips,
  Field,
  Sheet,
  SectionHeader,
  EmptyState,
  iconOf,
  safeIcon,
  peso,
} from "../ui";

const WEEKDAYS_LONG = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const FREQUENCIES: { key: Frequency; label: string }[] = [
  { key: "daily", label: "Every day" },
  { key: "weekly", label: "Every week" },
  { key: "monthly", label: "Every month" },
];

const ordinal = (n: number) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

export default function RecurringScreen() {
  const { colors } = useTheme();
  const { t, lang, fdate, dayShort } = useI18n();
  const { recurring, addRecurring, toggleRecurring, deleteRecurring, goals, wallets } =
    useData();

  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<Kind>("gastos");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [category, setCategory] = useState("food");
  const [goalId, setGoalId] = useState("");
  const [walletId, setWalletId] = useState("");
  const [frequency, setFrequency] = useState<Frequency>("weekly");
  const [weekday, setWeekday] = useState(1);
  const [monthDay, setMonthDay] = useState("1");

  const activeGoal = goals.find((g) => g.id === goalId)?.id ?? goals[0].id;
  const activeWallet = wallets.find((w) => w.id === walletId)?.id ?? wallets[0].id;

  const describe = (r: Recurring) => {
    if (r.frequency === "daily") return t("Every day");
    if (r.frequency === "weekly") {
      return t("Every {day}", { day: t(WEEKDAYS_LONG[r.day]) });
    }
    return lang === "fil"
      ? t("Every month on day {n}", { n: r.day })
      : `Every month on the ${ordinal(r.day)}`;
  };

  const openNew = () => {
    setKind("gastos");
    setAmount("");
    setNote("");
    setCategory("food");
    setFrequency("weekly");
    setWeekday(1);
    setMonthDay("1");
    setOpen(true);
  };

  const save = () => {
    const value = Number(amount);
    if (!value || value <= 0) return;
    const dom = Math.min(Math.max(Math.round(Number(monthDay)) || 1, 1), 31);
    addRecurring({
      kind,
      amount: value,
      note: note.trim(),
      tag: kind === "gastos" ? category : activeGoal,
      walletId: activeWallet,
      frequency,
      day: frequency === "weekly" ? weekday : dom,
    });
    setOpen(false);
  };

  const confirmDelete = (r: Recurring) => {
    Alert.alert(
      t("Delete this recurring entry?"),
      t("Entries it already added will stay in History."),
      [
        { text: t("Cancel"), style: "cancel" },
        { text: t("Delete"), style: "destructive", onPress: () => deleteRecurring(r.id) },
      ]
    );
  };

  return (
    <Screen>
      <SectionHeader title={t("Recurring")} actionLabel={t("New")} onAction={openNew} />
      <T kind="muted" style={{ marginBottom: 12 }}>
        {t("Added automatically when due.")}
      </T>

      {recurring.length === 0 ? (
        <EmptyState icon="repeat" text={t("No recurring entries yet.")} />
      ) : (
        recurring.map((r) => {
          const isIpon = r.kind === "ipon";
          const g = goals.find((x) => x.id === (r.tag ?? DEFAULT_GOAL_ID));
          const label = isIpon ? g?.name ?? "Ipon" : t(categoryOf(r.tag).label);
          const icon = isIpon
            ? g
              ? iconOf(g, "flag")
              : "flag"
            : safeIcon(categoryOf(r.tag).icon, "apps");
          const tone = isIpon ? colors.green : colors.red;
          return (
            <Card key={r.id} style={!r.active ? { opacity: 0.55 } : undefined}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <IconCircle name={icon} color={tone} size={42} />
                <View style={{ flex: 1 }}>
                  <T kind="title" numberOfLines={1}>
                    {r.note || label}
                  </T>
                  <T kind="muted">{describe(r)}</T>
                  <T kind="muted">
                    {r.active ? t("Next: {d}", { d: fdate(r.nextDate) }) : t("Paused")}
                  </T>
                </View>
                <T color={tone} style={{ fontWeight: "700" }}>
                  {isIpon ? "+" : "-"}
                  {peso(r.amount)}
                </T>
              </View>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: 8,
                }}
              >
                <Switch
                  value={r.active}
                  onValueChange={() => toggleRecurring(r.id)}
                  trackColor={{ false: "#d1d5db", true: colors.green }}
                />
                <Pressable onPress={() => confirmDelete(r)} hitSlop={10}>
                  <Ionicons name="trash-outline" size={20} color={colors.subtext} />
                </Pressable>
              </View>
            </Card>
          );
        })
      )}

      <Sheet
        visible={open}
        title={t("New recurring entry")}
        onClose={() => setOpen(false)}
        onSave={save}
      >
        <Chips>
          <Chip
            label="Gastos"
            icon="remove-circle"
            active={kind === "gastos"}
            color={colors.red}
            onPress={() => setKind("gastos")}
          />
          <Chip
            label="Ipon"
            icon="add-circle"
            active={kind === "ipon"}
            onPress={() => setKind("ipon")}
          />
        </Chips>

        <Field
          placeholder={t("Amount (₱)")}
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
        />
        <Field
          placeholder={t("Note (e.g. Baon, Netflix)")}
          value={note}
          onChangeText={setNote}
        />

        {kind === "gastos" ? (
          <Chips>
            {CATEGORIES.map((c) => (
              <Chip
                key={c.key}
                label={t(c.label)}
                icon={safeIcon(c.icon, "apps")}
                active={category === c.key}
                color={colors.blue}
                onPress={() => setCategory(c.key)}
              />
            ))}
          </Chips>
        ) : (
          <Chips>
            {goals.map((g) => (
              <Chip
                key={g.id}
                label={g.name}
                icon={iconOf(g, "flag")}
                active={activeGoal === g.id}
                onPress={() => setGoalId(g.id)}
              />
            ))}
          </Chips>
        )}

        <WalletPicker value={activeWallet} onChange={setWalletId} />

        <T kind="label">{t("How often?")}</T>
        <Chips>
          {FREQUENCIES.map((f) => (
            <Chip
              key={f.key}
              label={t(f.label)}
              active={frequency === f.key}
              onPress={() => setFrequency(f.key)}
            />
          ))}
        </Chips>

        {frequency === "weekly" && (
          <>
            <T kind="label">{t("On which day?")}</T>
            <Chips>
              {WEEKDAYS_LONG.map((_, i) => (
                <Chip
                  key={i}
                  label={dayShort(i)}
                  active={weekday === i}
                  onPress={() => setWeekday(i)}
                />
              ))}
            </Chips>
          </>
        )}

        {frequency === "monthly" && (
          <>
            <T kind="label">{t("Day of the month (1-31)")}</T>
            <Field
              value={monthDay}
              onChangeText={setMonthDay}
              keyboardType="numeric"
              maxLength={2}
            />
          </>
        )}
      </Sheet>
    </Screen>
  );
}