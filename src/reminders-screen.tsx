import { useEffect, useRef, useState } from "react";
import { View, Switch, Pressable, Alert, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "./app-theme";
import { useI18n } from "./i18n";
import { Screen, Card, T, IconCircle, Chip, Button, IconName } from "./ui";

// Show notifications even while the app is open
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const STORAGE_KEY = "iponbot:reminders:v1";
const CHANNEL_ID = "reminders";

type Key = "ipon" | "gastos";
type Rem = { on: boolean; hour: number; minute: number; id?: string };
type Settings = Record<Key, Rem>;

const DEFAULTS: Settings = {
  ipon: { on: false, hour: 19, minute: 0 },
  gastos: { on: false, hour: 21, minute: 0 },
};

const INFO: Record<Key, { title: string; icon: IconName; body: string }> = {
  ipon: {
    title: "Ipon reminder",
    icon: "wallet",
    body: "Naka-ipon ka na ba today? Kahit ₱10, counted!",
  },
  gastos: {
    title: "Gastos reminder",
    icon: "receipt",
    body: "Nailista mo na ba ang gastos mo today?",
  },
};

const fmt = (h: number, m: number) =>
  `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;

// If creating our own channel fails on this phone, we fall back to
// Android's default channel instead of crashing.
let channelReady = false;
let channelTried = false;

async function ensureChannel() {
  if (Platform.OS !== "android" || channelTried) return;
  channelTried = true;
  try {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: "Reminders",
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#16a34a",
      sound: "default",
    });
    channelReady = true;
  } catch (e) {
    console.warn("Could not create notification channel, using default", e);
    channelReady = false;
  }
}

const channelPart = () => (channelReady ? { channelId: CHANNEL_ID } : {});

async function ensurePermission() {
  await ensureChannel();
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const asked = await Notifications.requestPermissionsAsync();
  return asked.granted;
}

function Stepper({
  label,
  value,
  onMinus,
  onPlus,
}: {
  label: string;
  value: string;
  onMinus: () => void;
  onPlus: () => void;
}) {
  const { colors } = useTheme();
  const btn = {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  };
  return (
    <View style={{ alignItems: "center" }}>
      <T kind="muted">{label}</T>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 }}>
        <Pressable style={btn} onPress={onMinus}>
          <Ionicons name="remove" size={18} color={colors.text} />
        </Pressable>
        <T style={{ minWidth: 26, textAlign: "center", fontSize: 18, fontWeight: "700" }}>
          {value}
        </T>
        <Pressable style={btn} onPress={onPlus}>
          <Ionicons name="add" size={18} color={colors.text} />
        </Pressable>
      </View>
    </View>
  );
}

export default function RemindersScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();

  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const settingsRef = useRef<Settings>(DEFAULTS);
  const busy = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const d = JSON.parse(raw);
          const merged: Settings = {
            ipon: { ...DEFAULTS.ipon, ...(d.ipon ?? {}) },
            gastos: { ...DEFAULTS.gastos, ...(d.gastos ?? {}) },
          };
          settingsRef.current = merged;
          setSettings(merged);
        }
      } catch (e) {
        console.warn("Could not load reminders", e);
      }
    })();
  }, []);

  const update = async (key: Key, patch: Partial<Rem>) => {
    if (busy.current) return; // ignore taps while scheduling
    busy.current = true;
    try {
      const cur = settingsRef.current[key];
      const next: Rem = { ...cur, ...patch };

      // remove the old schedule first
      if (cur.id) {
        try {
          await Notifications.cancelScheduledNotificationAsync(cur.id);
        } catch {}
      }
      next.id = undefined;

      if (next.on) {
        const ok = await ensurePermission();
        if (!ok) {
          next.on = false;
          Alert.alert(
            t("Notifications are off"),
            t("Allow notifications for Expo Go in your phone's settings, then try again.")
          );
        } else {
          next.id = await Notifications.scheduleNotificationAsync({
            content: { title: "Ipon Bot", body: INFO[key].body },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.DAILY,
              hour: next.hour,
              minute: next.minute,
              ...channelPart(),
            },
          });
        }
      }

      const all: Settings = { ...settingsRef.current, [key]: next };
      settingsRef.current = all;
      setSettings(all);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    } catch (e) {
      console.warn("Reminder error", e);
      Alert.alert(t("Could not set the reminder"), String(e));
    } finally {
      busy.current = false;
    }
  };

  const stepHour = (key: Key, delta: number) =>
    update(key, { hour: (settingsRef.current[key].hour + delta + 24) % 24 });

  const stepMinute = (key: Key, delta: number) =>
    update(key, { minute: (settingsRef.current[key].minute + delta + 60) % 60 });

  const sendTest = async () => {
    try {
      const ok = await ensurePermission();
      if (!ok) {
        Alert.alert(
          t("Notifications are off"),
          t("Allow notifications for Expo Go in your phone's settings, then try again.")
        );
        return;
      }
      await Notifications.scheduleNotificationAsync({
        content: { title: "Ipon Bot", body: "It works! Reminders are ready." },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 5,
          ...channelPart(),
        },
      });
      Alert.alert(t("Test sent"), t("Notification in 5 seconds."));
    } catch (e) {
      console.warn("Test notification error", e);
      Alert.alert(t("Could not send the test"), String(e));
    }
  };

  return (
    <Screen>
      {(["ipon", "gastos"] as Key[]).map((key) => {
        const r = settings[key];
        const info = INFO[key];
        const tone = key === "ipon" ? colors.green : colors.red;
        return (
          <Card key={key}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <IconCircle name={info.icon} color={tone} size={42} />
              <View style={{ flex: 1 }}>
                <T kind="title">{t(info.title)}</T>
                <T kind="muted">
                  {r.on
                    ? t("Every day at {time}", { time: fmt(r.hour, r.minute) })
                    : t("Off")}
                </T>
              </View>
              <Switch
                value={r.on}
                onValueChange={(v) => update(key, { on: v })}
                trackColor={{ false: "#d1d5db", true: colors.green }}
              />
            </View>

            <T
              style={{
                fontSize: 34,
                fontWeight: "800",
                textAlign: "center",
                marginVertical: 12,
              }}
            >
              {fmt(r.hour, r.minute)}
            </T>

            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-around",
                alignItems: "center",
              }}
            >
              <Stepper
                label={t("Hour")}
                value={String(((r.hour + 11) % 12) + 1)}
                onMinus={() => stepHour(key, -1)}
                onPlus={() => stepHour(key, 1)}
              />
              <Stepper
                label={t("Minute")}
                value={String(r.minute).padStart(2, "0")}
                onMinus={() => stepMinute(key, -5)}
                onPlus={() => stepMinute(key, 5)}
              />
              <Chip
                label={r.hour >= 12 ? "PM" : "AM"}
                active
                color={tone}
                onPress={() => stepHour(key, 12)}
              />
            </View>
          </Card>
        );
      })}

      <Card>
        <T kind="title">{t("Test")}</T>
        <Button
          label={t("Send test notification")}
          icon="notifications"
          onPress={sendTest}
        />
      </Card>
    </Screen>
  );
}