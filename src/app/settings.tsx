import { View, Text, Switch, StyleSheet } from "react-native";
import { useTheme } from "../app-theme";

export default function Settings() {
  const { isDark, setDark, colors } = useTheme();

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          s.row,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <View>
          <Text style={[s.title, { color: colors.text }]}>Dark mode</Text>
          <Text style={{ color: colors.subtext }}>
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
  );
}

const s = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  title: { fontSize: 16, fontWeight: "bold" },
});