import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Switch,
  Alert,
  StyleSheet,
} from "react-native";
import { useTheme, Colors } from "./app-theme";
import { useData, CATEGORIES, NewDebt } from "./app-data";
import { WalletPicker } from "./wallet-picker";

type Mode = "me" | "friend";

const round2 = (n: number) => Math.round(n * 100) / 100;
const money = (n: number) => `₱${round2(n).toLocaleString()}`;

export function Ambagan() {
  const { colors } = useTheme();
  const { addDebts, addEntry, wallets } = useData();
  const s = makeStyles(colors);

  const [mode, setMode] = useState<Mode>("me");
  const [total, setTotal] = useState("");
  const [note, setNote] = useState("");
  const [people, setPeople] = useState(3);
  const [names, setNames] = useState<string[]>([]);
  const [payer, setPayer] = useState("");
  const [recordMine, setRecordMine] = useState(true);
  const [category, setCategory] = useState("food");
  const [walletId, setWalletId] = useState("");

  const activeWallet = wallets.find((w) => w.id === walletId)?.id ?? wallets[0].id;

  const totalNum = Number(total) || 0;
  // each friend pays this (rounded up to the centavo so the bill is covered)
  const each = totalNum > 0 ? Math.ceil((totalNum / people) * 100) / 100 : 0;
  // what's left for you
  const myShare = Math.max(round2(totalNum - each * (people - 1)), 0);

  const setName = (i: number, v: string) => {
    const next = [...names];
    next[i] = v;
    setNames(next);
  };
  const friendName = (i: number) => names[i]?.trim() || `Friend ${i + 1}`;

  const reset = () => {
    setTotal("");
    setNote("");
    setNames([]);
    setPayer("");
  };

  const handleSave = () => {
    if (totalNum <= 0) {
      Alert.alert("Enter the total bill first.");
      return;
    }
    const label = note.trim() || "Ambagan";

    if (mode === "me") {
      const items: NewDebt[] = Array.from({ length: people - 1 }, (_, i) => ({
        person: friendName(i),
        amount: each,
        direction: "owed",
        note: `Ambagan: ${label}`,
      }));
      addDebts(items);
      if (recordMine && myShare > 0) {
        addEntry("gastos", myShare, label, category, activeWallet);
      }
      Alert.alert(
        "Saved!",
        `Added ${people - 1} utang entries of ${money(each)} each${
          recordMine ? ` and your share of ${money(myShare)} as an expense` : ""
        }.`
      );
    } else {
      const who = payer.trim();
      if (!who) {
        Alert.alert("Who paid?", "Enter the name of the person who paid.");
        return;
      }
      addDebts([
        { person: who, amount: each, direction: "owe", note: `Ambagan: ${label}` },
      ]);
      Alert.alert("Saved!", `Added ${money(each)} to what you owe ${who}.`);
    }
    reset();
  };

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={s.container}
      keyboardShouldPersistTaps="handled"
    >
      {/* Who paid */}
      <View style={s.modeRow}>
        {(["me", "friend"] as Mode[]).map((m) => (
          <Pressable
            key={m}
            onPress={() => setMode(m)}
            style={[s.chip, mode === m && s.chipActive]}
          >
            <Text style={[s.chipText, mode === m && s.chipTextActive]}>
              {m === "me" ? "I paid" : "A friend paid"}
            </Text>
          </Pressable>
        ))}
      </View>

      <TextInput
        style={s.input}
        placeholder="Total bill (₱)"
        placeholderTextColor={colors.subtext}
        value={total}
        onChangeText={setTotal}
        keyboardType="numeric"
      />
      <TextInput
        style={s.input}
        placeholder="What was it for? (e.g. Samgyup)"
        placeholderTextColor={colors.subtext}
        value={note}
        onChangeText={setNote}
      />

      {/* People stepper */}
      <Text style={s.label}>How many people (including you)?</Text>
      <View style={s.stepper}>
        <Pressable
          style={s.stepBtn}
          onPress={() => setPeople(Math.max(2, people - 1))}
        >
          <Text style={s.stepText}>−</Text>
        </Pressable>
        <Text style={s.people}>{people}</Text>
        <Pressable
          style={s.stepBtn}
          onPress={() => setPeople(Math.min(20, people + 1))}
        >
          <Text style={s.stepText}>+</Text>
        </Pressable>
      </View>

      {/* Result */}
      <View style={s.card}>
        {mode === "me" ? (
          <>
            <Text style={s.label}>Each friend pays</Text>
            <Text style={s.big}>{money(each)}</Text>
            <Text style={s.small}>Your share: {money(myShare)}</Text>
          </>
        ) : (
          <>
            <Text style={s.label}>Your share</Text>
            <Text style={s.big}>{money(each)}</Text>
            <Text style={s.small}>
              This is added to what you owe the friend who paid.
            </Text>
          </>
        )}
      </View>

      {mode === "me" ? (
        <>
          <Text style={s.label}>Friends (names are optional)</Text>
          {Array.from({ length: people - 1 }, (_, i) => (
            <TextInput
              key={i}
              style={s.input}
              placeholder={`Friend ${i + 1} name`}
              placeholderTextColor={colors.subtext}
              value={names[i] ?? ""}
              onChangeText={(v) => setName(i, v)}
            />
          ))}

          <View style={s.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.title}>Record my share as an expense</Text>
              <Text style={s.small}>Counts in your budget and wallet.</Text>
            </View>
            <Switch
              value={recordMine}
              onValueChange={setRecordMine}
              trackColor={{ false: "#d1d5db", true: colors.green }}
            />
          </View>

          {recordMine && (
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
              <WalletPicker value={activeWallet} onChange={setWalletId} />
            </>
          )}
        </>
      ) : (
        <TextInput
          style={s.input}
          placeholder="Who paid? (name)"
          placeholderTextColor={colors.subtext}
          value={payer}
          onChangeText={setPayer}
        />
      )}

      <Pressable style={s.button} onPress={handleSave}>
        <Text style={s.buttonText}>
          {mode === "me" ? "Save and add to utang" : "Add to what I owe"}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    container: { padding: 16, paddingBottom: 32 },
    modeRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
    label: { fontSize: 14, color: c.subtext, marginTop: 6 },
    title: { color: c.text, fontSize: 15, fontWeight: "bold" },
    small: { color: c.subtext, fontSize: 13, marginTop: 4 },
    big: { fontSize: 32, fontWeight: "bold", color: c.text, marginTop: 4 },
    input: {
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.inputBg,
      color: c.text,
      borderRadius: 8,
      padding: 10,
      marginVertical: 6,
    },
    stepper: { flexDirection: "row", alignItems: "center", gap: 20, marginVertical: 8 },
    stepBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: "center",
      justifyContent: "center",
    },
    stepText: { color: c.text, fontSize: 24, fontWeight: "bold" },
    people: { color: c.text, fontSize: 28, fontWeight: "bold", minWidth: 40, textAlign: "center" },
    card: {
      backgroundColor: c.card,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: c.border,
      marginVertical: 8,
    },
    switchRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginVertical: 12,
    },
    chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginVertical: 8 },
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
    button: {
      backgroundColor: c.green,
      padding: 14,
      borderRadius: 8,
      alignItems: "center",
      marginTop: 12,
    },
    buttonText: { color: "#fff", fontWeight: "bold" },
  });