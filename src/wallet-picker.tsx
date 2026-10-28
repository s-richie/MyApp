import { View, Text, Pressable, StyleSheet } from "react-native";
import { useTheme } from "./app-theme";
import { useData } from "./app-data";

export function WalletPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  const { colors } = useTheme();
  const { wallets } = useData();

  return (
    <View>
      <Text style={{ color: colors.subtext, fontSize: 14 }}>Wallet</Text>
      <View style={s.chips}>
        {wallets.map((w) => {
          const active = value === w.id;
          return (
            <Pressable
              key={w.id}
              onPress={() => onChange(w.id)}
              style={[
                s.chip,
                {
                  borderColor: active ? colors.green : colors.border,
                  backgroundColor: active ? colors.green : colors.card,
                },
              ]}
            >
              <Text
                style={{
                  color: active ? "#fff" : colors.text,
                  fontWeight: active ? "bold" : "normal",
                }}
              >
                {w.emoji} {w.name}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginVertical: 8 },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
  },
});