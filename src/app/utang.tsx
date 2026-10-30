import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Modal,
  Alert,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme, Colors } from "../app-theme";
import { useI18n } from "../i18n";
import { useData, Debt, Direction } from "../app-data";
import { Ambagan } from "../ambagan";

type Tab = "utang" | "ambagan";

const round2 = (n: number) => Math.round(n * 100) / 100;
const money = (n: number) => `₱${round2(n).toLocaleString()}`;
const remainingOf = (d: Debt) => Math.max(round2(d.amount - d.paid), 0);

export default function Utang() {
  const { colors } = useTheme();
  const { t, fdate } = useI18n();
  const { debts, addDebt, recordPayment, deleteDebt } = useData();
  const s = makeStyles(colors);

  const [tab, setTab] = useState<Tab>("utang");
  const [filter, setFilter] = useState<Direction>("owed");

  // new utang modal
  const [newOpen, setNewOpen] = useState(false);
  const [person, setPerson] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [direction, setDirection] = useState<Direction>("owed");

  // payment modal
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
    .sort(
      (a, b) =>
        (remainingOf(a) === 0 ? 1 : 0) - (remainingOf(b) === 0 ? 1 : 0)
    );

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
    Alert.alert(t("Delete utang with {name}?", { name: d.person }), t("This can't be undone."), [
      { text: t("Cancel"), style: "cancel" },
      { text: t("Delete"), style: "destructive", onPress: () => deleteDebt(d.id) },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Segmented control */}
      <View style={s.segment}>
        {(["utang", "ambagan"] as Tab[]).map((k) => (
          <Pressable
            key={k}
            onPress={() => setTab(k)}
            style={[s.segBtn, tab === k && s.segBtnActive]}
          >
            <Text style={[s.segText, tab === k && s.segTextActive]}>
              {k === "utang" ? "💸 Utang" : "🍕 Ambagan"}
            </Text>
          </Pressable>
        ))}
      </View>

      {tab === "ambagan" ? (
        <Ambagan />
      ) : (
        <ScrollView contentContainerStyle={s.container}>
          {/* Totals */}
          <View style={s.statsRow}>
            <View style={[s.card, { flex: 1 }]}>
              <Text style={s.label}>{t("They owe me")}</Text>
              <Text style={[s.stat, { color: colors.green }]}>{money(owedTotal)}</Text>
            </View>
            <View style={[s.card, { flex: 1 }]}>
              <Text style={s.label}>{t("I owe")}</Text>
              <Text style={[s.stat, { color: colors.red }]}>{money(oweTotal)}</Text>
            </View>
          </View>

          {/* Filter + new */}
          <View style={s.filterRow}>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {(["owed", "owe"] as Direction[]).map((d) => (
                <Pressable
                  key={d}
                  onPress={() => setFilter(d)}
                  style={[s.chip, filter === d && s.chipActive]}
                >
                  <Text style={[s.chipText, filter === d && s.chipTextActive]}>
                    {d === "owed" ? t("Owed to me") : t("I owe")}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Pressable onPress={openNew} style={s.newBtn}>
              <Ionicons name="add" size={18} color="#fff" />
              <Text style={s.newBtnText}>{t("New")}</Text>
            </Pressable>
          </View>

          {list.length === 0 ? (
            <Text style={s.empty}>
              {filter === "owed"
                ? t("Nobody owes you anything. 🎉")
                : t("You don't owe anyone. 🙌")}
            </Text>
          ) : (
            list.map((d) => {
              const rem = remainingOf(d);
              const done = rem <= 0;
              const pct = d.amount > 0 ? Math.min(d.paid / d.amount, 1) : 0;
              const isOwed = d.direction === "owed";
              const tone = isOwed ? colors.green : colors.red;
              return (
                <View key={d.id} style={[s.card, done && { opacity: 0.55 }]}>
                  <View style={s.head}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.person}>
                        {isOwed ? "👤" : "🧾"} {d.person}
                      </Text>
                      <Text style={s.small}>
                        {d.note ? `${d.note} • ` : ""}
                        {fdate(d.date)}
                      </Text>
                    </View>
                    <Pressable onPress={() => confirmDelete(d)} hitSlop={10}>
                      <Ionicons name="trash-outline" size={20} color={colors.subtext} />
                    </Pressable>
                  </View>

                  <Text style={[s.amount, { color: tone }]}>
                    {done ? t("Paid ✅") : money(rem)}{" "}
                    <Text style={s.small}>
                      {t("of ₱{n}", { n: round2(d.amount).toLocaleString() })}
                    </Text>
                  </Text>

                  <View style={s.barBg}>
                    <View
                      style={[s.barFill, { width: `${pct * 100}%`, backgroundColor: tone }]}
                    />
                  </View>

                  {!done && (
                    <Pressable style={s.payBtn} onPress={() => openPay(d)}>
                      <Text style={s.payBtnText}>
                        {isOwed
                          ? t("Record payment received")
                          : t("Record payment I made")}
                      </Text>
                    </Pressable>
                  )}
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {/* New utang modal */}
      <Modal
        visible={newOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setNewOpen(false)}
      >
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalTitle}>{t("New utang")}</Text>

            <View style={{ flexDirection: "row", gap: 8, marginBottom: 6 }}>
              {(["owed", "owe"] as Direction[]).map((d) => (
                <Pressable
                  key={d}
                  onPress={() => setDirection(d)}
                  style={[s.chip, direction === d && s.chipActive]}
                >
                  <Text style={[s.chipText, direction === d && s.chipTextActive]}>
                    {d === "owed" ? t("They owe me") : t("I owe them")}
                  </Text>
                </Pressable>
              ))}
            </View>

            <TextInput
              style={s.input}
              placeholder={t("Person's name")}
              placeholderTextColor={colors.subtext}
              value={person}
              onChangeText={setPerson}
            />
            <TextInput
              style={s.input}
              placeholder={t("Amount (₱)")}
              placeholderTextColor={colors.subtext}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
            />
            <TextInput
              style={s.input}
              placeholder={t("Note (optional)")}
              placeholderTextColor={colors.subtext}
              value={note}
              onChangeText={setNote}
            />

            <View style={s.modalButtons}>
              <Pressable
                style={[s.modalBtn, { backgroundColor: colors.barBg }]}
                onPress={() => setNewOpen(false)}
              >
                <Text style={{ color: colors.text, fontWeight: "600" }}>
                  {t("Cancel")}
                </Text>
              </Pressable>
              <Pressable
                style={[s.modalBtn, { backgroundColor: colors.green }]}
                onPress={saveNew}
              >
                <Text style={{ color: "#fff", fontWeight: "bold" }}>{t("Save")}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Payment modal */}
      <Modal
        visible={paying !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setPaying(null)}
      >
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalTitle}>
              {paying?.direction === "owed" ? t("Payment received") : t("Payment made")}
            </Text>
            <Text style={s.small}>
              {paying
                ? t("{name} • remaining {n}", {
                    name: paying.person,
                    n: money(remainingOf(paying)),
                  })
                : ""}
            </Text>

            <TextInput
              style={s.input}
              placeholder={t("Amount (₱)")}
              placeholderTextColor={colors.subtext}
              value={payAmount}
              onChangeText={setPayAmount}
              keyboardType="numeric"
            />

            <Pressable
              style={[s.modalBtn, { backgroundColor: colors.blue, marginTop: 8 }]}
              onPress={markPaid}
            >
              <Text style={{ color: "#fff", fontWeight: "bold" }}>
                {t("Mark fully paid")}
              </Text>
            </Pressable>

            <View style={s.modalButtons}>
              <Pressable
                style={[s.modalBtn, { backgroundColor: colors.barBg }]}
                onPress={() => setPaying(null)}
              >
                <Text style={{ color: colors.text, fontWeight: "600" }}>
                  {t("Cancel")}
                </Text>
              </Pressable>
              <Pressable
                style={[s.modalBtn, { backgroundColor: colors.green }]}
                onPress={savePay}
              >
                <Text style={{ color: "#fff", fontWeight: "bold" }}>{t("Save")}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    container: { padding: 16, paddingBottom: 32 },
    segment: {
      flexDirection: "row",
      margin: 16,
      marginBottom: 0,
      backgroundColor: c.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      padding: 4,
    },
    segBtn: { flex: 1, padding: 10, borderRadius: 9, alignItems: "center" },
    segBtnActive: { backgroundColor: c.green },
    segText: { color: c.text, fontWeight: "600" },
    segTextActive: { color: "#fff" },
    statsRow: { flexDirection: "row", gap: 12 },
    card: {
      backgroundColor: c.card,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: c.border,
      marginBottom: 12,
    },
    label: { fontSize: 14, color: c.subtext },
    stat: { fontSize: 22, fontWeight: "bold", marginTop: 4 },
    small: { color: c.subtext, fontSize: 13, marginTop: 4 },
    filterRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },
    chip: {
      paddingVertical: 6,
      paddingHorizontal: 14,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.card,
    },
    chipActive: { backgroundColor: c.green, borderColor: c.green },
    chipText: { color: c.text },
    chipTextActive: { color: "#fff", fontWeight: "bold" },
    newBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: c.green,
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 20,
    },
    newBtnText: { color: "#fff", fontWeight: "bold" },
    empty: { color: c.subtext, textAlign: "center", marginTop: 32 },
    head: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
    person: { color: c.text, fontSize: 16, fontWeight: "bold" },
    amount: { fontSize: 24, fontWeight: "bold", marginTop: 8 },
    barBg: {
      height: 10,
      backgroundColor: c.barBg,
      borderRadius: 5,
      marginTop: 10,
      overflow: "hidden",
    },
    barFill: { height: 10, borderRadius: 5 },
    payBtn: {
      marginTop: 12,
      padding: 10,
      borderRadius: 8,
      alignItems: "center",
      borderWidth: 1,
      borderColor: c.green,
    },
    payBtnText: { color: c.green, fontWeight: "bold" },
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      padding: 24,
    },
    modal: {
      backgroundColor: c.card,
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: c.border,
    },
    modalTitle: { color: c.text, fontSize: 18, fontWeight: "bold", marginBottom: 8 },
    input: {
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.inputBg,
      color: c.text,
      borderRadius: 8,
      padding: 10,
      marginVertical: 6,
    },
    modalButtons: { flexDirection: "row", gap: 12, marginTop: 12 },
    modalBtn: { flex: 1, padding: 12, borderRadius: 8, alignItems: "center" },
  });