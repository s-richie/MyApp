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
import { useData, GOAL_EMOJIS, DEFAULT_GOAL_ID, Goal } from "../app-data";
import { WalletPicker } from "../wallet-picker";

export default function Ipon() {
  const { colors } = useTheme();
  const { t } = useI18n();
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
  const s = makeStyles(colors);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [walletId, setWalletId] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  // goal modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [gName, setGName] = useState("");
  const [gEmoji, setGEmoji] = useState(GOAL_EMOJIS[0]);
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
    setGEmoji(GOAL_EMOJIS[0]);
    setGTarget("");
    setModalOpen(true);
  };

  const openEdit = (g: Goal) => {
    setEditingId(g.id);
    setGName(g.name);
    setGEmoji(g.emoji);
    setGTarget(String(g.target));
    setModalOpen(true);
  };

  const saveGoal = () => {
    const target = Number(gTarget);
    if (!gName.trim() || !target || target <= 0) return;
    if (editingId) {
      updateGoal(editingId, { name: gName.trim(), emoji: gEmoji, target });
    } else {
      const id = addGoal(gName.trim(), gEmoji, target);
      setSelectedId(id);
    }
    setModalOpen(false);
  };

  const confirmDeleteGoal = (g: Goal) => {
    if (goals.length <= 1) {
      Alert.alert(t("Can't delete"), t("You need at least one goal."));
      return;
    }
    Alert.alert(
      t('Delete "{name}"?', { name: g.name }),
      t("Your ipon entries stay in History, but they won't count toward any goal."),
      [
        { text: t("Cancel"), style: "cancel" },
        { text: t("Delete"), style: "destructive", onPress: () => deleteGoal(g.id) },
      ]
    );
  };

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={s.container}
      keyboardShouldPersistTaps="handled"
    >
      <View style={s.sectionRow}>
        <Text style={s.section}>{t("My goals")}</Text>
        <Pressable onPress={openNew} style={s.newBtn}>
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={s.newBtnText}>{t("New goal")}</Text>
        </Pressable>
      </View>
      <Text style={s.small}>
        {t("Tap a goal to choose where your next ipon goes.")}
      </Text>

      {goals.map((g) => {
        const done = goalSaved(g.id);
        const pct = g.target > 0 ? Math.min(done / g.target, 1) : 0;
        const reached = g.target > 0 && done >= g.target;
        const isSel = selected?.id === g.id;
        return (
          <Pressable
            key={g.id}
            onPress={() => setSelectedId(g.id)}
            style={[s.goalCard, isSel && s.goalCardActive]}
          >
            <View style={s.goalHead}>
              <Text style={s.goalName}>
                {g.emoji} {g.name}
              </Text>
              <View style={s.goalActions}>
                <Pressable onPress={() => openEdit(g)} hitSlop={10}>
                  <Ionicons name="create-outline" size={20} color={colors.subtext} />
                </Pressable>
                <Pressable onPress={() => confirmDeleteGoal(g)} hitSlop={10}>
                  <Ionicons name="trash-outline" size={20} color={colors.subtext} />
                </Pressable>
              </View>
            </View>
            <Text style={s.goalAmount}>
              ₱{done.toLocaleString()}{" "}
              <Text style={s.small}>/ ₱{g.target.toLocaleString()}</Text>
            </Text>
            <View style={s.barBg}>
              <View style={[s.barFill, { width: `${pct * 100}%` }]} />
            </View>
            <Text style={s.small}>
              {reached
                ? `${Math.round(pct * 100)}% · ${t("Goal reached! 🎉")}`
                : t("{p}% · ₱{n} to go", {
                    p: Math.round(pct * 100),
                    n: Math.max(g.target - done, 0).toLocaleString(),
                  })}
            </Text>
          </Pressable>
        );
      })}

      <Text style={[s.section, { marginTop: 16 }]}>{t("Add ipon")}</Text>
      {selected && (
        <Text style={s.small}>
          {t("Adding to:")} {selected.emoji} {selected.name}
        </Text>
      )}
      <WalletPicker value={activeWallet} onChange={setWalletId} />
      <TextInput
        style={s.input}
        placeholder={t("Amount")}
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
      <Pressable style={s.button} onPress={handleAdd}>
        <Text style={s.buttonText}>{t("Add ipon")}</Text>
      </Pressable>

      <Text style={s.section}>{t("Recent")}</Text>
      {recent.length === 0 ? (
        <Text style={s.small}>{t("No ipon yet. Add your first one!")}</Text>
      ) : (
        recent.map((item) => {
          const g = goals.find((x) => x.id === (item.goalId ?? DEFAULT_GOAL_ID));
          return (
            <View key={item.id} style={s.row}>
              <Text style={s.rowText}>
                {g?.emoji ?? "💰"} {item.note || g?.name || "Ipon"}
              </Text>
              <Text style={s.amount}>+₱{item.amount.toLocaleString()}</Text>
            </View>
          );
        })
      )}
      <Text style={s.small}>{t("See everything in the History tab.")}</Text>

      {/* Goal modal */}
      <Modal
        visible={modalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setModalOpen(false)}
      >
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalTitle}>
              {editingId ? t("Edit goal") : t("New goal")}
            </Text>

            <TextInput
              style={s.input}
              placeholder={t("Goal name (e.g. Laptop)")}
              placeholderTextColor={colors.subtext}
              value={gName}
              onChangeText={setGName}
            />
            <TextInput
              style={s.input}
              placeholder={t("Target amount (₱)")}
              placeholderTextColor={colors.subtext}
              value={gTarget}
              onChangeText={setGTarget}
              keyboardType="numeric"
            />

            <View style={s.emojis}>
              {GOAL_EMOJIS.map((e) => (
                <Pressable
                  key={e}
                  onPress={() => setGEmoji(e)}
                  style={[s.emojiBtn, gEmoji === e && s.emojiBtnActive]}
                >
                  <Text style={{ fontSize: 22 }}>{e}</Text>
                </Pressable>
              ))}
            </View>

            <View style={s.modalButtons}>
              <Pressable
                style={[s.modalBtn, { backgroundColor: colors.barBg }]}
                onPress={() => setModalOpen(false)}
              >
                <Text style={{ color: colors.text, fontWeight: "600" }}>
                  {t("Cancel")}
                </Text>
              </Pressable>
              <Pressable
                style={[s.modalBtn, { backgroundColor: colors.green }]}
                onPress={saveGoal}
              >
                <Text style={{ color: "#fff", fontWeight: "bold" }}>{t("Save")}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    container: { padding: 16, paddingBottom: 32 },
    section: { fontSize: 16, fontWeight: "bold", color: c.text, marginTop: 8 },
    sectionRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
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
    small: { color: c.subtext, marginBottom: 8, marginTop: 4, fontSize: 13 },
    goalCard: {
      backgroundColor: c.card,
      borderRadius: 16,
      padding: 16,
      borderWidth: 2,
      borderColor: c.border,
      marginBottom: 12,
    },
    goalCardActive: { borderColor: c.green },
    goalHead: { flexDirection: "row", justifyContent: "space-between" },
    goalName: { color: c.text, fontSize: 16, fontWeight: "bold" },
    goalActions: { flexDirection: "row", gap: 14 },
    goalAmount: { color: c.text, fontSize: 26, fontWeight: "bold", marginTop: 6 },
    barBg: {
      height: 12,
      backgroundColor: c.barBg,
      borderRadius: 6,
      marginTop: 8,
      overflow: "hidden",
    },
    barFill: { height: 12, backgroundColor: c.green, borderRadius: 6 },
    input: {
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.inputBg,
      color: c.text,
      borderRadius: 8,
      padding: 10,
      marginVertical: 6,
    },
    button: {
      backgroundColor: c.green,
      padding: 12,
      borderRadius: 8,
      alignItems: "center",
      marginVertical: 8,
    },
    buttonText: { color: "#fff", fontWeight: "bold" },
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderColor: c.border,
    },
    rowText: { color: c.text },
    amount: { color: c.green, fontWeight: "bold" },
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
    emojis: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginVertical: 8 },
    emojiBtn: {
      padding: 8,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: c.border,
    },
    emojiBtnActive: { borderColor: c.green, backgroundColor: c.barBg },
    modalButtons: { flexDirection: "row", gap: 12, marginTop: 12 },
    modalBtn: { flex: 1, padding: 12, borderRadius: 8, alignItems: "center" },
  });