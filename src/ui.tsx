import { ReactNode, ComponentProps } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Modal,
  ScrollView,
  StyleProp,
  TextStyle,
  ViewStyle,
  TextInputProps,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "./app-theme";
import { useI18n } from "./i18n";
import { Entry, Goal, categoryOf, DEFAULT_GOAL_ID } from "./app-data";

export type IconName = ComponentProps<typeof Ionicons>["name"];

// Old data saved emoji. These map them to icons.
const LEGACY: Record<string, IconName> = {
  "🎯": "flag",
  "💻": "laptop",
  "📱": "phone-portrait",
  "✈️": "airplane",
  "🏠": "home",
  "🚲": "bicycle",
  "🎓": "school",
  "🎁": "gift",
  "💵": "cash",
  "💜": "wallet",
  "🏦": "business",
  "💳": "card",
  "👛": "wallet",
  "🐷": "save",
  "🎒": "briefcase",
};

export const GOAL_ICONS: IconName[] = [
  "flag",
  "laptop",
  "phone-portrait",
  "airplane",
  "home",
  "bicycle",
  "school",
  "gift",
];

export const WALLET_ICONS: IconName[] = [
  "cash",
  "phone-portrait",
  "wallet",
  "business",
  "card",
  "briefcase",
  "diamond",
  "bag-handle",
];

export const peso = (n: number) =>
  `₱${(Math.round(n * 100) / 100).toLocaleString()}`;

export function iconOf(
  item: { icon?: string; emoji?: string },
  fallback: IconName
): IconName {
  const raw = item.icon ?? item.emoji;
  if (raw && raw in Ionicons.glyphMap) return raw as IconName;
  if (raw && LEGACY[raw]) return LEGACY[raw];
  return fallback;
}

export const safeIcon = (name: string | undefined, fallback: IconName): IconName =>
  name && name in Ionicons.glyphMap ? (name as IconName) : fallback;

export function entryIcon(e: Entry, goals: Goal[]): IconName {
  if (e.kind === "gastos") return safeIcon(categoryOf(e.category).icon, "apps");
  const g = goals.find((x) => x.id === (e.goalId ?? DEFAULT_GOAL_ID));
  return g ? iconOf(g, "flag") : "flag";
}

export function entryTitle(
  e: Entry,
  goals: Goal[],
  t: (s: string) => string
): string {
  if (e.note) return e.note;
  if (e.kind === "gastos") return t(categoryOf(e.category).label);
  return goals.find((g) => g.id === (e.goalId ?? DEFAULT_GOAL_ID))?.name ?? "Ipon";
}

// ---------- Text ----------

type Kind = "title" | "big" | "muted" | "label" | "body";

export function T({
  children,
  kind = "body",
  color,
  style,
  numberOfLines,
}: {
  children?: ReactNode;
  kind?: Kind;
  color?: string;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
}) {
  const { colors } = useTheme();
  const base: Record<Kind, TextStyle> = {
    title: { fontSize: 16, fontWeight: "700", color: colors.text },
    big: { fontSize: 30, fontWeight: "800", color: colors.text },
    muted: { fontSize: 13, color: colors.subtext },
    label: { fontSize: 13, fontWeight: "600", color: colors.subtext },
    body: { fontSize: 15, color: colors.text },
  };
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[base[kind], color ? { color } : null, style]}
    >
      {children}
    </Text>
  );
}

// ---------- Layout ----------

export function Screen({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  );
}

export function Card({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: colors.card,
          borderRadius: 16,
          padding: 16,
          borderWidth: 1,
          borderColor: colors.border,
          marginBottom: 12,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function Chips({ children }: { children: ReactNode }) {
  return (
    <View
      style={{
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginVertical: 8,
      }}
    >
      {children}
    </View>
  );
}

export function SectionHeader({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 10,
      }}
    >
      <T kind="title">{title}</T>
      {actionLabel && onAction ? (
        <Pressable
          onPress={onAction}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
            backgroundColor: colors.green,
            paddingVertical: 6,
            paddingHorizontal: 12,
            borderRadius: 20,
          }}
        >
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={{ color: "#fff", fontWeight: "700" }}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function EmptyState({ icon, text }: { icon: IconName; text: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ alignItems: "center", paddingVertical: 28, gap: 8 }}>
      <Ionicons name={icon} size={36} color={colors.subtext} />
      <T kind="muted">{text}</T>
    </View>
  );
}

// ---------- Icons, progress, rows ----------

export function IconCircle({
  name,
  color,
  size = 40,
}: {
  name: IconName;
  color?: string;
  size?: number;
}) {
  const { colors } = useTheme();
  const tone = color ?? colors.green;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: tone + "22",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Ionicons name={name} size={Math.round(size * 0.5)} color={tone} />
    </View>
  );
}

export function Progress({
  value,
  color,
  height = 8,
}: {
  value: number;
  color: string;
  height?: number;
}) {
  const { colors } = useTheme();
  const pct = Math.max(0, Math.min(value, 1)) * 100;
  return (
    <View
      style={{
        height,
        borderRadius: height / 2,
        backgroundColor: colors.barBg,
        overflow: "hidden",
        marginTop: 8,
      }}
    >
      <View
        style={{
          width: `${pct}%`,
          height,
          backgroundColor: color,
          borderRadius: height / 2,
        }}
      />
    </View>
  );
}

export function Row({
  icon,
  tone,
  title,
  sub,
  amount,
  onPress,
  trailing,
}: {
  icon: IconName;
  tone: string;
  title: string;
  sub?: string;
  amount?: string;
  onPress?: () => void;
  trailing?: ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderColor: colors.border,
      }}
    >
      <Pressable
        onPress={onPress}
        disabled={!onPress}
        style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 12 }}
      >
        <IconCircle name={icon} color={tone} size={40} />
        <View style={{ flex: 1 }}>
          <T numberOfLines={1}>{title}</T>
          {sub ? (
            <T kind="muted" numberOfLines={1}>
              {sub}
            </T>
          ) : null}
        </View>
        {amount ? (
          <T color={tone} style={{ fontWeight: "700" }}>
            {amount}
          </T>
        ) : null}
      </Pressable>
      {trailing}
    </View>
  );
}

// ---------- Inputs ----------

export function Chip({
  label,
  icon,
  active,
  onPress,
  color,
}: {
  label: string;
  icon?: IconName;
  active?: boolean;
  onPress: () => void;
  color?: string;
}) {
  const { colors } = useTheme();
  const tone = color ?? colors.green;
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingVertical: 7,
        paddingHorizontal: 12,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: active ? tone : colors.border,
        backgroundColor: active ? tone : colors.card,
      }}
    >
      {icon ? (
        <Ionicons
          name={icon}
          size={16}
          color={active ? "#fff" : colors.subtext}
        />
      ) : null}
      <Text
        style={{
          color: active ? "#fff" : colors.text,
          fontWeight: active ? "700" : "400",
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function Button({
  label,
  onPress,
  icon,
  color,
  outline,
}: {
  label: string;
  onPress: () => void;
  icon?: IconName;
  color?: string;
  outline?: boolean;
}) {
  const { colors } = useTheme();
  const tone = color ?? colors.green;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        padding: 14,
        borderRadius: 12,
        marginVertical: 6,
        backgroundColor: outline ? "transparent" : tone,
        borderWidth: outline ? 1.5 : 0,
        borderColor: tone,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      {icon ? (
        <Ionicons name={icon} size={20} color={outline ? tone : "#fff"} />
      ) : null}
      <Text
        style={{
          color: outline ? tone : "#fff",
          fontWeight: "700",
          fontSize: 15,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function Field(props: TextInputProps) {
  const { colors } = useTheme();
  return (
    <TextInput
      placeholderTextColor={colors.subtext}
      {...props}
      style={[
        {
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.inputBg,
          color: colors.text,
          borderRadius: 10,
          padding: 12,
          marginVertical: 6,
          fontSize: 16,
        },
        props.style,
      ]}
    />
  );
}

export function IconPicker({
  value,
  options,
  onChange,
}: {
  value: string;
  options: IconName[];
  onChange: (name: IconName) => void;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
        marginVertical: 8,
      }}
    >
      {options.map((n) => {
        const active = value === n;
        return (
          <Pressable
            key={n}
            onPress={() => onChange(n)}
            style={{
              width: 46,
              height: 46,
              borderRadius: 23,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: active ? 2 : 1,
              borderColor: active ? colors.green : colors.border,
              backgroundColor: active ? colors.green + "22" : colors.card,
            }}
          >
            <Ionicons
              name={n}
              size={22}
              color={active ? colors.green : colors.subtext}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

export function Sheet({
  visible,
  title,
  onClose,
  onSave,
  saveLabel,
  children,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  onSave: () => void;
  saveLabel?: string;
  children: ReactNode;
}) {
  const { colors } = useTheme();
  const { t } = useI18n();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.5)",
          justifyContent: "center",
          padding: 20,
        }}
      >
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 20,
            padding: 20,
            borderWidth: 1,
            borderColor: colors.border,
            maxHeight: "90%",
          }}
        >
          <ScrollView keyboardShouldPersistTaps="handled">
            <T kind="title" style={{ fontSize: 18, marginBottom: 6 }}>
              {title}
            </T>
            {children}
            <View style={{ flexDirection: "row", gap: 12, marginTop: 12 }}>
              <View style={{ flex: 1 }}>
                <Button
                  label={t("Cancel")}
                  onPress={onClose}
                  outline
                  color={colors.subtext}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Button label={saveLabel ?? t("Save")} onPress={onSave} />
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}