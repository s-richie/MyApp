import { useState } from "react";
import { View, Pressable, Switch, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "./app-theme";
import { useI18n } from "./i18n";
import { useData, CATEGORIES, NewDebt } from "./app-data";
import { WalletPicker } from "./wallet-picker";
import { Screen, Card, T, Button, Field, Chip, Chips, safeIcon, peso } from "./ui";

type Mode = "me" | "friend";

const round2 = (n: number) => Math.round(n * 100) / 100;

export function Ambagan() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const { addDebts, addEntry, wallets } = useData();

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
  const friendName = (i: number) =>
    names[i]?.trim() || t("Friend {n}", { n: i + 1 });

  const reset = () => {
    setTotal("");
    setNote("");
    setNames([]);
    setPayer("");
  };

  const handleSave = () => {
    if (totalNum <= 0) {
      Alert.alert(t("Enter the total bill first."));
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
        t("Saved!"),
        recordMine
          ? t(
              "Added {n} utang entries of {amt} each and your share of {share} as an expense.",
              { n: people - 1, amt: peso(each), share: peso(myShare) }
            )
          : t("Added {n} utang entries of {amt} each.", {
              n: people - 1,
              amt: peso(each),
            })
      );
    } else {
      const who = payer.trim();
      if (!who) {
        Alert.alert(t("Who paid?"), t("Enter the name of the person who paid."));
        return;
      }
      addDebts([
        { person: who, amount: each, direction: "owe", note: `Ambagan: ${label}` },
      ]);
      Alert.alert(
        t("Saved!"),
        t("Added {amt} to what you owe {name}.", { amt: peso(each), name: who })
      );
    }
    reset();
  };

  const stepBtn = {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  };

  return (
    <Screen>
      <Chips>
        <Chip
          label={t("I paid")}
          icon="wallet"
          active={mode === "me"}
          onPress={() => setMode("me")}
        />
        <Chip
          label={t("A friend paid")}
          icon="person"
          active={mode === "friend"}
          onPress={() => setMode("friend")}
        />
      </Chips>

      <Card>
        <Field
          placeholder={t("Total bill (₱)")}
          value={total}
          onChangeText={setTotal}
          keyboardType="numeric"
        />
        <Field
          placeholder={t("What was it for? (e.g. Samgyup)")}
          value={note}
          onChangeText={setNote}
        />
        <T kind="label" style={{ marginTop: 6 }}>
          {t("How many people (including you)?")}
        </T>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 20,
            marginTop: 8,
          }}
        >
          <Pressable style={stepBtn} onPress={() => setPeople(Math.max(2, people - 1))}>
            <Ionicons name="remove" size={22} color={colors.text} />
          </Pressable>
          <T style={{ fontSize: 28, fontWeight: "800", minWidth: 40, textAlign: "center" }}>
            {people}
          </T>
          <Pressable style={stepBtn} onPress={() => setPeople(Math.min(20, people + 1))}>
            <Ionicons name="add" size={22} color={colors.text} />
          </Pressable>
        </View>
      </Card>

      {/* Result */}
      <Card>
        {mode === "me" ? (
          <>
            <T kind="label">{t("Each friend pays")}</T>
            <T kind="big">{peso(each)}</T>
            <T kind="muted">{t("Your share: {n}", { n: peso(myShare) })}</T>
          </>
        ) : (
          <>
            <T kind="label">{t("Your share")}</T>
            <T kind="big">{peso(each)}</T>
          </>
        )}
      </Card>

      {mode === "me" ? (
        <>
          <Card>
            <T kind="label">{t("Friends (names are optional)")}</T>
            {Array.from({ length: people - 1 }, (_, i) => (
              <Field
                key={i}
                placeholder={t("Friend {n} name", { n: i + 1 })}
                value={names[i] ?? ""}
                onChangeText={(v) => setName(i, v)}
              />
            ))}
          </Card>

          <Card>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <T kind="title" style={{ flex: 1 }}>
                {t("Record my share as an expense")}
              </T>
              <Switch
                value={recordMine}
                onValueChange={setRecordMine}
                trackColor={{ false: "#d1d5db", true: colors.green }}
              />
            </View>
            {recordMine && (
              <>
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
                <WalletPicker value={activeWallet} onChange={setWalletId} />
              </>
            )}
          </Card>
        </>
      ) : (
        <Card>
          <Field
            placeholder={t("Who paid? (name)")}
            value={payer}
            onChangeText={setPayer}
          />
        </Card>
      )}

      <Button
        label={mode === "me" ? t("Save and add to utang") : t("Add to what I owe")}
        icon="checkmark-circle"
        onPress={handleSave}
      />
    </Screen>
  );
}