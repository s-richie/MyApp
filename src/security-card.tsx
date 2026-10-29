import { useState } from "react";
import { View, Text, Switch, Pressable, Modal, Alert, StyleSheet } from "react-native";
import { useTheme, Colors } from "./app-theme";
import { useLock } from "./app-lock";
import { PinDots, PinPad, PIN_LENGTH } from "./pin-pad";

type Flow = "set" | "change" | "remove";
type Step = "current" | "new" | "confirm";

export function SecurityCard() {
  const { colors } = useTheme();
  const {
    hasPin,
    biometricAvailable,
    biometricEnabled,
    setPin,
    removePin,
    checkPin,
    setBiometric,
  } = useLock();
  const s = makeStyles(colors);

  const [flow, setFlow] = useState<Flow | null>(null);
  const [step, setStep] = useState<Step>("new");
  const [entered, setEntered] = useState("");
  const [firstPin, setFirstPin] = useState("");
  const [error, setError] = useState("");

  const start = (f: Flow) => {
    setFlow(f);
    setStep(f === "set" ? "new" : "current");
    setEntered("");
    setFirstPin("");
    setError("");
  };

  const close = () => {
    setFlow(null);
    setEntered("");
    setFirstPin("");
    setError("");
  };

  const process = async (code: string) => {
    if (step === "current") {
      if (!checkPin(code)) {
        setError("Wrong PIN. Try again.");
        setEntered("");
        return;
      }
      setError("");
      if (flow === "remove") {
        await removePin();
        close();
        Alert.alert("PIN lock is off");
      } else {
        setStep("new");
        setEntered("");
      }
      return;
    }

    if (step === "new") {
      setFirstPin(code);
      setStep("confirm");
      setEntered("");
      setError("");
      return;
    }

    // confirm
    if (code !== firstPin) {
      setError("PINs don't match. Start again.");
      setStep("new");
      setFirstPin("");
      setEntered("");
      return;
    }
    await setPin(code);
    close();
    Alert.alert("PIN saved", "The app will ask for it next time you open it.");
  };

  const onDigit = (d: string) => {
    if (entered.length >= PIN_LENGTH) return;
    const next = entered + d;
    setError("");
    setEntered(next);
    if (next.length === PIN_LENGTH) process(next);
  };

  const onDelete = () => setEntered((e) => e.slice(0, -1));

  const heading =
    step === "current"
      ? "Enter your current PIN"
      : step === "new"
      ? "Enter a new 4-digit PIN"
      : "Enter the PIN again to confirm";

  return (
    <View style={s.card}>
      <Text style={s.title}>Security</Text>

      <View style={s.row}>
        <View style={{ flex: 1 }}>
          <Text style={s.label}>PIN lock</Text>
          <Text style={s.small}>
            Asks for your PIN when you open the app and after 30 seconds away.
          </Text>
        </View>
        <Switch
          value={hasPin}
          onValueChange={(v) => start(v ? "set" : "remove")}
          trackColor={{ false: "#d1d5db", true: colors.green }}
        />
      </View>

      {hasPin && (
        <Pressable style={s.linkBtn} onPress={() => start("change")}>
          <Text style={s.linkText}>Change PIN</Text>
        </Pressable>
      )}

      {hasPin && biometricAvailable && (
        <View style={[s.row, { marginTop: 12 }]}>
          <View style={{ flex: 1 }}>
            <Text style={s.label}>Unlock with fingerprint</Text>
            <Text style={s.small}>You can always use your PIN instead.</Text>
          </View>
          <Switch
            value={biometricEnabled}
            onValueChange={setBiometric}
            trackColor={{ false: "#d1d5db", true: colors.green }}
          />
        </View>
      )}

      <Text style={[s.small, { marginTop: 12 }]}>
        ⚠️ If you forget your PIN, the only way back in is to clear the app's data,
        which also erases your entries. Make a CSV backup in Export & share first.
      </Text>

      <Modal visible={flow !== null} animationType="slide" onRequestClose={close}>
        <View style={s.modal}>
          <Text style={s.modalTitle}>
            {flow === "set"
              ? "Set a PIN"
              : flow === "change"
              ? "Change PIN"
              : "Turn off PIN lock"}
          </Text>
          <Text style={{ color: error ? colors.red : colors.subtext }}>
            {error || heading}
          </Text>

          <PinDots count={entered.length} error={!!error} />
          <PinPad onDigit={onDigit} onDelete={onDelete} />

          <Pressable onPress={close} style={{ marginTop: 12, padding: 10 }}>
            <Text style={{ color: colors.subtext, fontSize: 16 }}>Cancel</Text>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    card: {
      backgroundColor: c.card,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: c.border,
      marginTop: 12,
    },
    title: { color: c.text, fontSize: 16, fontWeight: "bold", marginBottom: 8 },
    row: { flexDirection: "row", alignItems: "center", gap: 12 },
    label: { color: c.text, fontSize: 15, fontWeight: "600" },
    small: { color: c.subtext, fontSize: 13, marginTop: 4 },
    linkBtn: { marginTop: 10, paddingVertical: 6 },
    linkText: { color: c.green, fontWeight: "bold" },
    modal: {
      flex: 1,
      backgroundColor: c.background,
      alignItems: "center",
      justifyContent: "center",
    },
    modalTitle: { color: c.text, fontSize: 22, fontWeight: "bold", marginBottom: 6 },
  });