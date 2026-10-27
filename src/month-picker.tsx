import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "./app-theme";
import { useData } from "./app-data";

export function MonthPicker() {
  const { colors } = useTheme();
  const { monthLabel, shiftMonth, isCurrentMonth } = useData();

  return (
    <View
      style={[
        s.row,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <Pressable onPress={() => shiftMonth(-1)} hitSlop={12}>
        <Ionicons name="chevron-back" size={22} color={colors.text} />
      </Pressable>
      <Text style={[s.label, { color: colors.text }]}>{monthLabel}</Text>
      <Pressable
        onPress={() => shiftMonth(1)}
        disabled={isCurrentMonth}
        hitSlop={12}
      >
        <Ionicons
          name="chevron-forward"
          size={22}
          color={isCurrentMonth ? colors.border : colors.text}
        />
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  label: { fontSize: 16, fontWeight: "600" },
});