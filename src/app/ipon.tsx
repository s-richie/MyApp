import { useState } from "react";
import { View, Pressable, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../app-theme";
import { useI18n } from "../i18n";
import { useData, Goal } from "../app-data";
import { WalletPicker } from "../wallet-picker";
import {
  Screen,
  Card,
  T,
  Progress,
  IconCircle,
  Row,
  Button,
  Field,
  Sheet,
  IconPicker,
  SectionHeader,
  iconOf,
  entryIcon,
  entryTitle,
  peso,
  GOAL_ICONS,
} from "../ui";

export default function Ipon() {
  const { colors } = useTheme();
  const { t, fdate } = useI18n();
  const {
    entries,
    addEntry,
    goals,
    addGoal,
    updateGoal,
    deleteGoal,
    goalSaved,
    wallets,
  } = useData();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [walletId, setWalletId] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  // goal sheet
  const [sheet, setSheet] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [gName, setGName] = useState("");
  const [gIcon, setGIcon] = useState<string>(GOAL_ICONS[0]);
  const [gTarget, setGTarget] = useState("");

  const selected = goals.find((g) => g.id === selectedId) ?? goals[0];
  const activeWallet = wallets.find((w) => w.id === walletId)?.id ?? wallets[0].id;
  const recent = entries.filter((e) => e.kind === "ipon").slice(0, 3);

  const handleAdd = () => {
    const value = Number(amount);
    if (!value || value <= 0 || !selected) return;
    addEntry("ipon", value, note, selected.id, activeWallet);
    setAmount("");
    setNote("");
  };

  const openNew = () => {
    setEditingId(null);
    setGName("");
    setGIcon(GOAL_ICONS[0]);
    setGTarget("");
    setSheet(true);
  };

  const openEdit = (g: Goal) => {
    setEditingId(g.id);
    setGName(g.name);
    setGIcon(iconOf(g, "flag"));
    setGTarget(String(g.target));
    setSheet(true);
  };

  const saveGoal = () => {
    const target = Number(gTarget);
    if (!gName.trim() || !target || target <= 0) return;
    if (editingId) {
      updateGoal(editingId, { name: gName.trim(), icon: gIcon, target });
    } else {
      const id = addGoal(gName.trim(), gIcon, target);
      setSelectedId(id);
    }
    setSheet(false);
  };

  const confirmDelete = (g: Goal) => {
    if (goals.length <= 1) {
      Alert.alert(t("Can't delete"), t("You need at least one goal."));
      return;
    }
    Alert.alert(
      t('Delete "{name}"?', { name: g.name }),
      t("Entries stay in History."),
      [
        { text: t("Cancel"), style: "cancel" },
        { text: t("Delete"), style: "destructive", onPress: () => deleteGoal(g.id) },
      ]
    );
  };

  return (
    <Screen>
      <SectionHeader title={t("Goals")} actionLabel={t("New")} onAction={openNew} />

      {goals.map((g) => {
        const done = goalSaved(g.id);
        const pct = g.target > 0 ? Math.min(done / g.target, 1) : 0;
        const isSel = selected.id === g.id;
        return (
          <Pressable key={g.id} onPress={() => setSelectedId(g.id)}>
            <Card
              style={{
                borderWidth: 2,
                borderColor: isSel ? colors.green : colors.border,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <IconCircle name={iconOf(g, "flag")} size={42} />
                <View style={{ flex: 1 }}>
                  <T kind="title" numberOfLines={1}>
                    {g.name}
                  </T>
                  <T kind="muted">
                    {peso(done)} / {peso(g.target)}
                  </T>
                </View>
                {isSel ? (
                  <Ionicons name="checkmark-circle" size={22} color={colors.green} />
                ) : null}
                <Pressable onPress={() => openEdit(g)} hitSlop={10}>
                  <Ionicons name="create-outline" size={20} color={colors.subtext} />
                </Pressable>
                <Pressable onPress={() => confirmDelete(g)} hitSlop={10}>
                  <Ionicons name="trash-outline" size={20} color={colors.subtext} />
                </Pressable>
              </View>
              <Progress value={pct} color={colors.green} />
            </Card>
          </Pressable>
        );
      })}

      {/* Add ipon */}
      <Card>
        <T kind="title">{t("Add to {name}", { name: selected.name })}</T>
        <WalletPicker value={activeWallet} onChange={setWalletId} />
        <Field
          placeholder={t("Amount")}
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
        />
        <Field
          placeholder={t("Note (optional)")}
          value={note}
          onChangeText={setNote}
        />
        <Button label={t("Add ipon")} icon="add-circle" onPress={handleAdd} />
      </Card>

      {/* Recent */}
      <Card>
        <T kind="label">{t("Recent")}</T>
        {recent.length === 0 ? (
          <T kind="muted" style={{ marginTop: 8 }}>
            {t("No ipon yet. Add your first one!")}
          </T>
        ) : (
          recent.map((e) => (
            <Row
              key={e.id}
              icon={entryIcon(e, goals)}
              tone={colors.green}
              title={entryTitle(e, goals, t)}
              sub={fdate(e.date)}
              amount={`+${peso(e.amount)}`}
            />
          ))
        )}
      </Card>

      {/* Goal sheet */}
      <Sheet
        visible={sheet}
        title={editingId ? t("Edit goal") : t("New goal")}
        onClose={() => setSheet(false)}
        onSave={saveGoal}
      >
        <Field
          placeholder={t("Goal name (e.g. Laptop)")}
          value={gName}
          onChangeText={setGName}
        />
        <Field
          placeholder={t("Target amount (₱)")}
          value={gTarget}
          onChangeText={setGTarget}
          keyboardType="numeric"
        />
        <IconPicker value={gIcon} options={GOAL_ICONS} onChange={setGIcon} />
      </Sheet>
    </Screen>
  );
}