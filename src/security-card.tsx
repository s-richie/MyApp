import { useState } from "react";
import { View, Switch, Pressable, Modal, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "./app-theme";
import { useI18n } from "./i18n";
import { useLock } from "./app-lock";
import { PinDots, PinPad, PIN_LENGTH } from "./pin-pad";
import { Card, T, IconCircle } from "./ui";

type Flow = "set" | "change" | "remove";
type Step = "current" | "new" | "confirm";

export function SecurityCard() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const {
    hasPin,
    biometricAvailable,
    biometricEnabled,
    setPin,
    removePin,
    checkPin,
    setBiometric,
  } = useLock();

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
        setError(t("Wrong PIN. Try again."));
        setEntered("");
        return;
      }
      setError("");
      if (flow === "remove") {
        await removePin();
        close();
        Alert.alert(t("PIN lock is off"));
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
      setError(t("PINs don't match. Start again."));
      setStep("new");
      setFirstPin("");
      setEntered("");
      return;
    }
    await setPin(code);
    close();
    Alert.alert(t("PIN saved"), t("The app will ask for it next time you open it."));
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
      ? t("Enter your current PIN")
      : step === "new"
      ? t("Enter a new 4-digit PIN")
      : t("Enter the PIN again to confirm");

  return (
    <Card>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <IconCircle name="lock-closed" size={40} color={colors.blue} />
        <T kind="title" style={{ flex: 1 }}>
          {t("PIN lock")}
        </T>
        <Switch
          value={hasPin}
          onValueChange={(v) => start(v ? "set" : "remove")}
          trackColor={{ false: "#d1d5db", true: colors.green }}
        />
      </View>

      {hasPin && (
        <Pressable
          onPress={() => start("change")}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            marginTop: 14,
          }}
        >
          <IconCircle name="key" size={40} color={colors.blue} />
          <T style={{ flex: 1 }}>{t("Change PIN")}</T>
          <Ionicons name="chevron-forward" size={20} color={colors.subtext} />
        </Pressable>
      )}

      {hasPin && biometricAvailable && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            marginTop: 14,
          }}
        >
          <IconCircle name="finger-print" size={40} color={colors.blue} />
          <T style={{ flex: 1 }}>{t("Unlock with fingerprint")}</T>
          <Switch
            value={biometricEnabled}
            onValueChange={setBiometric}
            trackColor={{ false: "#d1d5db", true: colors.green }}
          />
        </View>
      )}

      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-start",
          gap: 8,
          marginTop: 14,
        }}
      >
        <Ionicons name="information-circle" size={18} color={colors.subtext} />
        <T kind="muted" style={{ flex: 1 }}>
          {t("If you forget your PIN, app data must be cleared. Export a CSV first.")}
        </T>
      </View>

      <Modal visible={flow !== null} animationType="slide" onRequestClose={close}>
        <View
          style={{
            flex: 1,
            backgroundColor: colors.background,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <T kind="big" style={{ fontSize: 22, marginBottom: 6 }}>
            {flow === "set"
              ? t("Set a PIN")
              : flow === "change"
              ? t("Change PIN")
              : t("Turn off PIN lock")}
          </T>
          <T color={error ? colors.red : colors.subtext}>{error || heading}</T>

          <PinDots count={entered.length} error={!!error} />
          <PinPad onDigit={onDigit} onDelete={onDelete} />

          <Pressable onPress={close} style={{ marginTop: 12, padding: 10 }}>
            <T color={colors.subtext} style={{ fontSize: 16 }}>
              {t("Cancel")}
            </T>
          </Pressable>
        </View>
      </Modal>
    </Card>
  );
}