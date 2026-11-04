import { Ionicons } from "@expo/vector-icons";
import { ReactNode } from "react";
import { Pressable, Text, useWindowDimensions, View } from "react-native";
import { useTheme } from "./app-theme";

export const PIN_LENGTH = 4;

// Keys get smaller on short screens so the whole pad always fits
function useKeySize() {
  const { height } = useWindowDimensions();
  if (height < 620) return { size: 54, gap: 10 };
  if (height < 740) return { size: 62, gap: 12 };
  return { size: 72, gap: 16 };
}

export function PinDots({ count, error }: { count: number; error?: boolean }) {
  const { colors } = useTheme();
  const tone = error ? colors.red : colors.green;
  const { height } = useWindowDimensions();

  return (
    <View
      style={{
        flexDirection: "row",
        gap: 16,
        justifyContent: "center",
        marginVertical: height < 620 ? 12 : 20,
      }}
    >
      {Array.from({ length: PIN_LENGTH }, (_, i) => (
        <View
          key={i}
          style={{
            width: 18,
            height: 18,
            borderRadius: 9,
            borderWidth: 2,
            borderColor: tone,
            backgroundColor: i < count ? tone : "transparent",
          }}
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
  const { size, gap } = useKeySize();
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
      style={({ pressed }) => ({
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: pressed ? colors.barBg : colors.card,
        borderColor: colors.border,
        opacity: disabled ? 0.4 : 1,
      })}
    >
      <Text
        allowFontScaling={false}
        style={{
          fontSize: Math.round(size * 0.39),
          fontWeight: "600",
          color: colors.text,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );

  const slot = {
    width: size,
    height: size,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  };
  const row = {
    flexDirection: "row" as const,
    justifyContent: "center" as const,
    gap: gap + 4,
    marginBottom: gap,
  };

  return (
    <View>
      {rows.map((r, i) => (
        <View key={i} style={row}>
          {r.map(key)}
        </View>
      ))}
      <View style={row}>
        <View style={slot}>{bottomLeft}</View>
        {key("0")}
        <Pressable style={slot} onPress={onDelete} disabled={disabled}>
          <Ionicons name="backspace-outline" size={28} color={colors.text} />
        </Pressable>
      </View>
    </View>
  );
}
