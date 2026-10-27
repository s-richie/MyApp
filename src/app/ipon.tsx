import { useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from "react-native";
import { useTheme, Colors } from "../app-theme";
import { useData } from "../app-data";

export default function Ipon() {
  const { colors } = useTheme();
  const { entries, addEntry, goal, setGoal, saved } = useData();
  const s = makeStyles(colors);

  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const goalNum = Number(goal) || 0;
  const progress = goalNum > 0 ? Math.min(saved / goalNum, 1) : 0;
  const recent = entries.filter((e) => e.kind === "ipon").slice(0, 3);

  const handleAdd = () => {
    const value = Number(amount);
    if (!value || value <= 0) return;
    addEntry("ipon", value, note);
    setAmount("");
    setNote("");
  };

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={s.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={s.label}>Goal (₱)</Text>
      <TextInput style={s.input} value={goal} onChangeText={setGoal} keyboardType="numeric" />

      <Text style={s.big}>₱{saved.toLocaleString()}</Text>
      <View style={s.barBg}>
        <View style={[s.barFill, { width: `${progress * 100}%` }]} />
      </View>
      <Text style={s.small}>{Math.round(progress * 100)}% of your goal</Text>

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
        placeholder="Note (optional)"
        placeholderTextColor={colors.subtext}
        value={note}
        onChangeText={setNote}
      />
      <Pressable style={s.button} onPress={handleAdd}>
        <Text style={s.buttonText}>Add ipon</Text>
      </Pressable>

      <Text style={s.section}>Recent</Text>
      {recent.length === 0 ? (
        <Text style={s.small}>No ipon yet. Add your first one!</Text>
      ) : (
        recent.map((item) => (
          <View key={item.id} style={s.row}>
            <Text style={s.rowText}>{item.note || "Ipon"}</Text>
            <Text style={s.amount}>+₱{item.amount.toLocaleString()}</Text>
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
    big: { fontSize: 36, fontWeight: "bold", marginTop: 12, color: c.text },
    barBg: { height: 12, backgroundColor: c.barBg, borderRadius: 6, marginTop: 8, overflow: "hidden" },
    barFill: { height: 12, backgroundColor: c.green },
    small: { color: c.subtext, marginBottom: 12, marginTop: 4 },
    button: { backgroundColor: c.green, padding: 12, borderRadius: 8, alignItems: "center", marginVertical: 8 },
    buttonText: { color: "#fff", fontWeight: "bold" },
    row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: 1, borderColor: c.border },
    rowText: { color: c.text },
    amount: { color: c.green, fontWeight: "bold" },
  });