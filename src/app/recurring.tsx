import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Switch,
  Modal,
  Alert,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme, Colors } from "../app-theme";
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

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
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

const describe = (r: Recurring) => {
  if (r.frequency === "daily") return "Every day";
  if (r.frequency === "weekly") return `Every ${WEEKDAYS_LONG[r.day]}`;
  return `Every month on the ${ordinal(r.day)}`;
};

export default function RecurringScreen() {
  const { colors } = useTheme();
  const { recurring, addRecurring, toggleRecurring, deleteRecurring, goals, wallets } =
    useData();
  const s = makeStyles(colors);

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
      "Delete this recurring entry?",
      "Entries it already added will stay in History.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deleteRecurring(r.id) },
      ]
    );
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={s.container}>
        <View style={s.headRow}>
          <Text style={s.section}>Recurring</Text>
          <Pressable onPress={openNew} style={s.newBtn}>
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={s.newBtnText}>New</Text>
          </Pressable>
        </View>
        <Text style={s.small}>
          These are added automatically when you open the app on or after the due
          date. Examples: weekly baon, monthly subscription, daily fare.
        </Text>

        {recurring.length === 0 ? (
          <Text style={s.empty}>No recurring entries yet.</Text>
        ) : (
          recurring.map((r) => {
            const isIpon = r.kind === "ipon";
            const cat = categoryOf(r.tag);
            const g = goals.find((x) => x.id === (r.tag ?? DEFAULT_GOAL_ID));
            const label = isIpon ? g?.name ?? "Ipon" : cat.label;
            const emoji = isIpon ? g?.emoji ?? "💰" : cat.emoji;
            return (
              <View key={r.id} style={[s.card, !r.active && { opacity: 0.55 }]}>
                <View style={s.rowBetween}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.title}>
                      {emoji} {r.note || label}
                    </Text>
                    <Text style={s.small}>{describe(r)}</Text>
                    <Text style={s.small}>
                      {r.active ? `Next: ${formatDate(r.nextDate)}` : "Paused"}
                    </Text>
                  </View>
                  <Text
                    style={[s.amount, { color: isIpon ? colors.green : colors.red }]}
                  >
                    {isIpon ? "+" : "-"}₱{r.amount.toLocaleString()}
                  </Text>
                </View>
                <View style={[s.rowBetween, { marginTop: 10 }]}>
                  <View style={s.rowCenter}>
                    <Switch
                      value={r.active}
                      onValueChange={() => toggleRecurring(r.id)}
                      trackColor={{ false: "#d1d5db", true: colors.green }}
                    />
                    <Text style={s.small}>{r.active ? "  Active" : "  Paused"}</Text>
                  </View>
                  <Pressable onPress={() => confirmDelete(r)} hitSlop={10}>
                    <Ionicons name="trash-outline" size={20} color={colors.subtext} />
                  </Pressable>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* New recurring modal */}
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <View style={s.overlay}>
          <View style={s.modal}>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={s.modalTitle}>New recurring entry</Text>

              <View style={s.chips}>
                {(["gastos", "ipon"] as Kind[]).map((k) => (
                  <Pressable
                    key={k}
                    onPress={() => setKind(k)}
                    style={[s.chip, kind === k && s.chipActive]}
                  >
                    <Text style={[s.chipText, kind === k && s.chipTextActive]}>
                      {k === "gastos" ? "Gastos" : "Ipon"}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <TextInput
                style={s.input}
                placeholder="Amount (₱)"
                placeholderTextColor={colors.subtext}
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
              />
              <TextInput
                style={s.input}
                placeholder="Note (e.g. Baon, Netflix)"
                placeholderTextColor={colors.subtext}
                value={note}
                onChangeText={setNote}
              />

              {kind === "gastos" ? (
                <>
                  <Text style={s.label}>Category</Text>
                  <View style={s.chips}>
                    {CATEGORIES.map((c) => (
                      <Pressable
                        key={c.key}
                        onPress={() => setCategory(c.key)}
                        style={[s.chip, category === c.key && s.chipActive]}
                      >
                        <Text
                          style={[s.chipText, category === c.key && s.chipTextActive]}
                        >
                          {c.emoji} {c.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </>
              ) : (
                <>
                  <Text style={s.label}>Goal</Text>
                  <View style={s.chips}>
                    {goals.map((g) => (
                      <Pressable
                        key={g.id}
                        onPress={() => setGoalId(g.id)}
                        style={[s.chip, activeGoal === g.id && s.chipActive]}
                      >
                        <Text
                          style={[s.chipText, activeGoal === g.id && s.chipTextActive]}
                        >
                          {g.emoji} {g.name}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </>
              )}

              <WalletPicker value={activeWallet} onChange={setWalletId} />

              <Text style={s.label}>How often?</Text>
              <View style={s.chips}>
                {FREQUENCIES.map((f) => (
                  <Pressable
                    key={f.key}
                    onPress={() => setFrequency(f.key)}
                    style={[s.chip, frequency === f.key && s.chipActive]}
                  >
                    <Text
                      style={[s.chipText, frequency === f.key && s.chipTextActive]}
                    >
                      {f.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {frequency === "weekly" && (
                <>
                  <Text style={s.label}>On which day?</Text>
                  <View style={s.chips}>
                    {WEEKDAYS.map((w, i) => (
                      <Pressable
                        key={w}
                        onPress={() => setWeekday(i)}
                        style={[s.chip, weekday === i && s.chipActive]}
                      >
                        <Text style={[s.chipText, weekday === i && s.chipTextActive]}>
                          {w}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </>
              )}

              {frequency === "monthly" && (
                <>
                  <Text style={s.label}>Day of the month (1-31)</Text>
                  <TextInput
                    style={s.input}
                    value={monthDay}
                    onChangeText={setMonthDay}
                    keyboardType="numeric"
                    maxLength={2}
                  />
                </>
              )}

              <View style={s.modalButtons}>
                <Pressable
                  style={[s.modalBtn, { backgroundColor: colors.barBg }]}
                  onPress={() => setOpen(false)}
                >
                  <Text style={{ color: colors.text, fontWeight: "600" }}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[s.modalBtn, { backgroundColor: colors.green }]}
                  onPress={save}
                >
                  <Text style={{ color: "#fff", fontWeight: "bold" }}>Save</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    container: { padding: 16, paddingBottom: 32 },
    headRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    section: { fontSize: 16, fontWeight: "bold", color: c.text },
    small: { color: c.subtext, fontSize: 13, marginTop: 4 },
    label: { color: c.subtext, fontSize: 14, marginTop: 6 },
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
    card: {
      backgroundColor: c.card,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: c.border,
      marginTop: 12,
    },
    rowBetween: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    rowCenter: { flexDirection: "row", alignItems: "center" },
    title: { color: c.text, fontSize: 16, fontWeight: "bold" },
    amount: { fontSize: 18, fontWeight: "bold" },
    chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginVertical: 8 },
    chip: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.card,
    },
    chipActive: { backgroundColor: c.green, borderColor: c.green },
    chipText: { color: c.text },
    chipTextActive: { color: "#fff", fontWeight: "bold" },
    input: {
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.inputBg,
      color: c.text,
      borderRadius: 8,
      padding: 10,
      marginVertical: 6,
    },
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      padding: 20,
    },
    modal: {
      backgroundColor: c.card,
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: c.border,
      maxHeight: "90%",
    },
    modalTitle: { color: c.text, fontSize: 18, fontWeight: "bold", marginBottom: 8 },
    modalButtons: { flexDirection: "row", gap: 12, marginTop: 12 },
    modalBtn: { flex: 1, padding: 12, borderRadius: 8, alignItems: "center" },
  });