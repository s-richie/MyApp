import { useState } from "react";
import { View, Pressable, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../app-theme";
import { useI18n } from "../i18n";
import { useData, Debt, Direction } from "../app-data";
import { Ambagan } from "../ambagan";
import {
  Screen,
  Card,
  T,
  Progress,
  IconCircle,
  Button,
  Field,
  Chip,
  Chips,
  Sheet,
  SectionHeader,
  EmptyState,
  IconName,
  peso,
} from "../ui";

type Tab = "utang" | "ambagan";

const round2 = (n: number) => Math.round(n * 100) / 100;
const remainingOf = (d: Debt) => Math.max(round2(d.amount - d.paid), 0);

const TABS: { key: Tab; icon: IconName; label: string }[] = [
  { key: "utang", icon: "swap-horizontal", label: "Utang" },
  { key: "ambagan", icon: "restaurant", label: "Ambagan" },
];

export default function Utang() {
  const { colors } = useTheme();
  const { t, fdate } = useI18n();
  const { debts, addDebt, recordPayment, deleteDebt } = useData();

  const [tab, setTab] = useState<Tab>("utang");
  const [filter, setFilter] = useState<Direction>("owed");

  // new utang sheet
  const [newOpen, setNewOpen] = useState(false);
  const [person, setPerson] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [direction, setDirection] = useState<Direction>("owed");

  // payment sheet
  const [paying, setPaying] = useState<Debt | null>(null);
  const [payAmount, setPayAmount] = useState("");

  const owedTotal = debts
    .filter((d) => d.direction === "owed")
    .reduce((a, d) => a + remainingOf(d), 0);
  const oweTotal = debts
    .filter((d) => d.direction === "owe")
    .reduce((a, d) => a + remainingOf(d), 0);

  const list = debts
    .filter((d) => d.direction === filter)
    .sort((a, b) => (remainingOf(a) === 0 ? 1 : 0) - (remainingOf(b) === 0 ? 1 : 0));

  const openNew = () => {
    setPerson("");
    setAmount("");
    setNote("");
    setDirection(filter);
    setNewOpen(true);
  };

  const saveNew = () => {
    const value = Number(amount);
    if (!person.trim() || !value || value <= 0) return;
    addDebt({ person: person.trim(), amount: value, direction, note: note.trim() });
    setFilter(direction);
    setNewOpen(false);
  };

  const openPay = (d: Debt) => {
    setPaying(d);
    setPayAmount(String(remainingOf(d)));
  };

  const savePay = () => {
    if (!paying) return;
    const value = Number(payAmount);
    if (!value || value <= 0) return;
    recordPayment(paying.id, value);
    setPaying(null);
  };

  const markPaid = () => {
    if (!paying) return;
    recordPayment(paying.id, remainingOf(paying));
    setPaying(null);
  };

  const confirmDelete = (d: Debt) => {
    Alert.alert(
      t("Delete utang with {name}?", { name: d.person }),
      t("This can't be undone."),
      [
        { text: t("Cancel"), style: "cancel" },
        { text: t("Delete"), style: "destructive", onPress: () => deleteDebt(d.id) },
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Utang / Ambagan switch */}
      <View
        style={{
          flexDirection: "row",
          margin: 16,
          marginBottom: 0,
          backgroundColor: colors.card,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: colors.border,
          padding: 4,
        }}
      >
        {TABS.map((tb) => {
          const active = tab === tb.key;
          return (
            <Pressable
              key={tb.key}
              onPress={() => setTab(tb.key)}
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                padding: 10,
                borderRadius: 9,
                backgroundColor: active ? colors.green : "transparent",
              }}
            >
              <Ionicons
                name={tb.icon}
                size={18}
                color={active ? "#fff" : colors.subtext}
              />
              <T color={active ? "#fff" : colors.text} style={{ fontWeight: "700" }}>
                {tb.label}
              </T>
            </Pressable>
          );
        })}
      </View>

      {tab === "ambagan" ? (
        <Ambagan />
      ) : (
        <Screen>
          {/* Totals (tap to switch the list) */}
          <View style={{ flexDirection: "row", gap: 12 }}>
            {(
              [
                { dir: "owed", label: "They owe me", total: owedTotal, tone: colors.green },
                { dir: "owe", label: "I owe", total: oweTotal, tone: colors.red },
              ] as const
            ).map((c) => (
              <Pressable key={c.dir} style={{ flex: 1 }} onPress={() => setFilter(c.dir)}>
                <Card
                  style={{
                    borderWidth: 2,
                    borderColor: filter === c.dir ? c.tone : colors.border,
                  }}
                >
                  <T kind="label">{t(c.label)}</T>
                  <T color={c.tone} style={{ fontSize: 22, fontWeight: "800", marginTop: 4 }}>
                    {peso(c.total)}
                  </T>
                </Card>
              </Pressable>
            ))}
          </View>

          <SectionHeader
            title={filter === "owed" ? t("Owed to me") : t("I owe")}
            actionLabel={t("New")}
            onAction={openNew}
          />

          {list.length === 0 ? (
            <EmptyState icon="checkmark-circle-outline" text={t("Nothing here yet.")} />
          ) : (
            list.map((d) => {
              const rem = remainingOf(d);
              const done = rem <= 0;
              const pct = d.amount > 0 ? Math.min(d.paid / d.amount, 1) : 0;
              const isOwed = d.direction === "owed";
              const tone = isOwed ? colors.green : colors.red;
              return (
                <Card key={d.id} style={done ? { opacity: 0.55 } : undefined}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                    <IconCircle name={isOwed ? "person" : "receipt"} color={tone} size={42} />
                    <View style={{ flex: 1 }}>
                      <T kind="title" numberOfLines={1}>
                        {d.person}
                      </T>
                      <T kind="muted" numberOfLines={1}>
                        {d.note ? `${d.note} • ` : ""}
                        {fdate(d.date)}
                      </T>
                    </View>
                    <Pressable onPress={() => confirmDelete(d)} hitSlop={10}>
                      <Ionicons name="trash-outline" size={20} color={colors.subtext} />
                    </Pressable>
                  </View>

                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                      marginTop: 10,
                    }}
                  >
                    {done ? (
                      <Ionicons name="checkmark-circle" size={24} color={colors.green} />
                    ) : null}
                    <T
                      color={done ? colors.green : tone}
                      style={{ fontSize: 24, fontWeight: "800" }}
                    >
                      {done ? t("Paid") : peso(rem)}
                    </T>
                    <T kind="muted">
                      {t("of ₱{n}", { n: round2(d.amount).toLocaleString() })}
                    </T>
                  </View>

                  <Progress value={pct} color={tone} />

                  {!done && (
                    <Button
                      label={t("Record payment")}
                      outline
                      color={tone}
                      onPress={() => openPay(d)}
                    />
                  )}
                </Card>
              );
            })
          )}
        </Screen>
      )}

      {/* New utang */}
      <Sheet
        visible={newOpen}
        title={t("New utang")}
        onClose={() => setNewOpen(false)}
        onSave={saveNew}
      >
        <Chips>
          {(["owed", "owe"] as Direction[]).map((d) => (
            <Chip
              key={d}
              label={d === "owed" ? t("They owe me") : t("I owe them")}
              active={direction === d}
              color={d === "owed" ? colors.green : colors.red}
              onPress={() => setDirection(d)}
            />
          ))}
        </Chips>
        <Field placeholder={t("Person's name")} value={person} onChangeText={setPerson} />
        <Field
          placeholder={t("Amount (₱)")}
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
        />
        <Field
          placeholder={t("Note (optional)")}
          value={note}
          onChangeText={setNote}
        />
      </Sheet>

      {/* Payment */}
      <Sheet
        visible={paying !== null}
        title={paying?.direction === "owed" ? t("Payment received") : t("Payment made")}
        onClose={() => setPaying(null)}
        onSave={savePay}
      >
        <T kind="muted">
          {paying
            ? t("{name} • remaining {n}", {
                name: paying.person,
                n: peso(remainingOf(paying)),
              })
            : ""}
        </T>
        <Field
          placeholder={t("Amount (₱)")}
          value={payAmount}
          onChangeText={setPayAmount}
          keyboardType="numeric"
        />
        <Button
          label={t("Mark fully paid")}
          outline
          color={colors.blue}
          onPress={markPaid}
        />
      </Sheet>
    </View>
  );
}