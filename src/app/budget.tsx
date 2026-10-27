import { useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from "react-native";
import { useTheme, Colors } from "../app-theme";
import { useData } from "../app-data";
import { MonthPicker } from "../month-picker";

export default function Budget() {
  const { colors } = useTheme();
  const { monthEntries, addEntry, budget, setBudget, monthSpent } = useData();
  const spent = monthSpent;
  const s = makeStyles(colors);

  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const remaining = (Number(budget) || 0) - spent;
  const recent = monthEntries.filter((e) => e.kind === "gastos").slice(0, 3);

  const handleAdd = () => {
    const value = Number(amount);
    if (!value || value <= 0) return;
    addEntry("gastos", value, note);
    setAmount("");
    setNote("");
  };

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={s.container}
      keyboardShouldPersistTaps="handled"
    >
      <MonthPicker />

      <Text style={s.label}>Monthly budget (₱)</Text>
      <TextInput style={s.input} value={budget} onChangeText={setBudget} keyboardType="numeric" />

      <Text style={s.label}>Remaining</Text>
      <Text style={[s.big, remaining < 0 && { color: colors.red }]}>
        ₱{remaining.toLocaleString()}
      </Text>
      <Text style={s.small}>Spent: ₱{spent.toLocaleString()}</Text>

      <TextInput
        style={s.input}
        placeholder="Amount"
        placeholderTextColor={colors.subtext}
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
      />
      <TextInput
        style={s.input}
        placeholder="What was it for? (food, fare...)"
        placeholderTextColor={colors.subtext}
        value={note}
        onChangeText={setNote}
      />
      <Pressable style={s.button} onPress={handleAdd}>
        <Text style={s.buttonText}>Add gastos</Text>
      </Pressable>

      <Text style={s.section}>Recent</Text>
      {recent.length === 0 ? (
        <Text style={s.small}>No expenses this month yet.</Text>
      ) : (
        recent.map((item) => (
          <View key={item.id} style={s.row}>
            <Text style={s.rowText}>{item.note || "Expense"}</Text>
            <Text style={s.amount}>-₱{item.amount.toLocaleString()}</Text>
          </View>
        ))
      )}
      <Text style={s.small}>See everything in the History tab.</Text>
    </ScrollView>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    container: { padding: 16 },
    label: { fontSize: 14, color: c.subtext },
    section: { fontSize: 16, fontWeight: "bold", color: c.text, marginTop: 8 },
    input: {
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.inputBg,
      color: c.text,
      borderRadius: 8,
      padding: 10,
      marginVertical: 6,
    },
    big: { fontSize: 36, fontWeight: "bold", color: c.text },
    small: { color: c.subtext, marginBottom: 12, marginTop: 4 },
    button: { backgroundColor: c.blue, padding: 12, borderRadius: 8, alignItems: "center", marginVertical: 8 },
    buttonText: { color: "#fff", fontWeight: "bold" },
    row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: 1, borderColor: c.border },
    rowText: { color: c.text },
    amount: { color: c.red, fontWeight: "bold" },
  });