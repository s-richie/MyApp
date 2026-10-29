import { ReactNode } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "./app-theme";

export const PIN_LENGTH = 4;

export function PinDots({ count, error }: { count: number; error?: boolean }) {
  const { colors } = useTheme();
  const tone = error ? colors.red : colors.green;

  return (
    <View style={s.dots}>
      {Array.from({ length: PIN_LENGTH }, (_, i) => (
        <View
          key={i}
          style={[
            s.dot,
            {
              borderColor: tone,
              backgroundColor: i < count ? tone : "transparent",
            },
          ]}
        />
      ))}
    </View>
  );
}

type PadProps = {
  onDigit: (digit: string) => void;
  onDelete: () => void;
  disabled?: boolean;
  bottomLeft?: ReactNode;
};

export function PinPad({ onDigit, onDelete, disabled, bottomLeft }: PadProps) {
  const { colors } = useTheme();
  const rows = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
  ];

  const key = (label: string) => (
    <Pressable
      key={label}
      disabled={disabled}
      onPress={() => onDigit(label)}
      style={({ pressed }) => [
        s.key,
        {
          backgroundColor: pressed ? colors.barBg : colors.card,
          borderColor: colors.border,
          opacity: disabled ? 0.4 : 1,
        },
      ]}
    >
      <Text style={[s.keyText, { color: colors.text }]}>{label}</Text>
    </Pressable>
  );

  return (
    <View>
      {rows.map((r, i) => (
        <View key={i} style={s.row}>
          {r.map(key)}
        </View>
      ))}
      <View style={s.row}>
        <View style={s.slot}>{bottomLeft}</View>
        {key("0")}
        <Pressable style={s.slot} onPress={onDelete} disabled={disabled}>
          <Ionicons name="backspace-outline" size={28} color={colors.text} />
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  dots: { flexDirection: "row", gap: 16, justifyContent: "center", marginVertical: 20 },
  dot: { width: 18, height: 18, borderRadius: 9, borderWidth: 2 },
  row: { flexDirection: "row", justifyContent: "center", gap: 20, marginBottom: 16 },
  key: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  keyText: { fontSize: 28, fontWeight: "600" },
  slot: { width: 72, height: 72, alignItems: "center", justifyContent: "center" },
});