import { useState } from "react";
import {
  View,
  Text,
  Switch,
  TextInput,
  Pressable,
  ScrollView,
  Modal,
  Alert,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme, Colors } from "../app-theme";
import { useData, WALLET_EMOJIS, Wallet } from "../app-data";

export default function Settings() {
  const { isDark, setDark, colors } = useTheme();
  const { wallets, addWallet, updateWallet, deleteWallet, walletBalance } = useData();
  const s = makeStyles(colors);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [wName, setWName] = useState("");
  const [wEmoji, setWEmoji] = useState(WALLET_EMOJIS[0]);
  const [wStart, setWStart] = useState("");

  const openNew = () => {
    setEditingId(null);
    setWName("");
    setWEmoji(WALLET_EMOJIS[0]);
    setWStart("0");
    setModalOpen(true);
  };

  const openEdit = (w: Wallet) => {
    setEditingId(w.id);
    setWName(w.name);
    setWEmoji(w.emoji);
    setWStart(String(w.start));
    setModalOpen(true);
  };

  const saveWallet = () => {
    const start = Number(wStart);
    if (!wName.trim() || isNaN(start)) return;
    if (editingId) {
      updateWallet(editingId, { name: wName.trim(), emoji: wEmoji, start });
    } else {
      addWallet(wName.trim(), wEmoji, start);
    }
    setModalOpen(false);
  };

  const confirmDelete = (w: Wallet) => {
    if (wallets.length <= 1) {
      Alert.alert("Can't delete", "You need at least one wallet.");
      return;
    }
    Alert.alert(
      `Delete "${w.name}"?`,
      "Its entries will be moved to another wallet.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deleteWallet(w.id) },
      ]
    );
  };

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={s.container}
      keyboardShouldPersistTaps="handled"
    >
      {/* Dark mode */}
      <View style={s.card}>
        <View style={s.rowBetween}>
          <View>
            <Text style={s.title}>Dark mode</Text>
            <Text style={s.small}>
              {isDark ? "Dark theme is on" : "Light theme is on"}
            </Text>
          </View>
          <Switch
            value={isDark}
            onValueChange={setDark}
            trackColor={{ false: "#d1d5db", true: colors.green }}
          />
        </View>
      </View>

      {/* Wallets */}
      <View style={s.sectionRow}>
        <Text style={s.section}>Wallets</Text>
        <Pressable onPress={openNew} style={s.newBtn}>
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={s.newBtnText}>New wallet</Text>
        </Pressable>
      </View>
      <Text style={s.small}>
        Balance = starting balance + ipon − gastos. Edit the starting balance
        anytime to match the money you really have.
      </Text>

      {wallets.map((w) => {
        const bal = walletBalance(w.id);
        return (
          <View key={w.id} style={[s.card, { marginTop: 10 }]}>
            <View style={s.rowBetween}>
              <Text style={s.title}>
                {w.emoji} {w.name}
              </Text>
              <View style={s.actions}>
                <Pressable onPress={() => openEdit(w)} hitSlop={10}>
                  <Ionicons name="create-outline" size={20} color={colors.subtext} />
                </Pressable>
                <Pressable onPress={() => confirmDelete(w)} hitSlop={10}>
                  <Ionicons name="trash-outline" size={20} color={colors.subtext} />
                </Pressable>
              </View>
            </View>
            <Text style={[s.balance, bal < 0 && { color: colors.red }]}>
              ₱{bal.toLocaleString()}
            </Text>
            <Text style={s.small}>Starting balance: ₱{w.start.toLocaleString()}</Text>
          </View>
        );
      })}

      {/* Wallet modal */}
      <Modal
        visible={modalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setModalOpen(false)}
      >
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalTitle}>
              {editingId ? "Edit wallet" : "New wallet"}
            </Text>

            <TextInput
              style={s.input}
              placeholder="Name (e.g. Maya, Bank)"
              placeholderTextColor={colors.subtext}
              value={wName}
              onChangeText={setWName}
            />
            <TextInput
              style={s.input}
              placeholder="Starting balance (₱)"
              placeholderTextColor={colors.subtext}
              value={wStart}
              onChangeText={setWStart}
              keyboardType="numeric"
            />

            <View style={s.emojis}>
              {WALLET_EMOJIS.map((e) => (
                <Pressable
                  key={e}
                  onPress={() => setWEmoji(e)}
                  style={[s.emojiBtn, wEmoji === e && s.emojiBtnActive]}
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
                <Text style={{ color: colors.text, fontWeight: "600" }}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[s.modalBtn, { backgroundColor: colors.green }]}
                onPress={saveWallet}
              >
                <Text style={{ color: "#fff", fontWeight: "bold" }}>Save</Text>
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
    card: {
      backgroundColor: c.card,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: c.border,
    },
    rowBetween: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    title: { color: c.text, fontSize: 16, fontWeight: "bold" },
    small: { color: c.subtext, fontSize: 13, marginTop: 4 },
    section: { fontSize: 16, fontWeight: "bold", color: c.text },
    sectionRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 20,
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
    actions: { flexDirection: "row", gap: 14 },
    balance: { color: c.text, fontSize: 26, fontWeight: "bold", marginTop: 6 },
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