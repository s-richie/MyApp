import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Switch,
  Pressable,
  ScrollView,
  Alert,
  Platform,
  StyleSheet,
} from "react-native";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme, Colors } from "./app-theme";
import { useI18n } from "./i18n";

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

const INFO: Record<Key, { title: string; emoji: string; body: string }> = {
  ipon: {
    title: "Ipon reminder",
    emoji: "💰",
    body: "Naka-ipon ka na ba today? Kahit ₱10, counted! 💰",
  },
  gastos: {
    title: "Gastos reminder",
    emoji: "🧾",
    body: "Nailista mo na ba ang gastos mo today? 🧾",
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

export default function RemindersScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const s = makeStyles(colors);

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
            content: { title: "Ipon Bot 🤖", body: INFO[key].body },
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
        content: { title: "Ipon Bot 🤖", body: "It works! Reminders are ready. 🎉" },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 5,
          ...channelPart(),
        },
      });
      Alert.alert(
        t("Test sent"),
        t(
          "A notification will show up in 5 seconds. You can also leave the app to see it in the notification bar."
        )
      );
    } catch (e) {
      console.warn("Test notification error", e);
      Alert.alert(t("Could not send the test"), String(e));
    }
  };

  const Stepper = ({
    label,
    value,
    onMinus,
    onPlus,
  }: {
    label: string;
    value: string;
    onMinus: () => void;
    onPlus: () => void;
  }) => (
    <View style={s.stepper}>
      <Text style={s.small}>{label}</Text>
      <View style={s.stepRow}>
        <Pressable style={s.stepBtn} onPress={onMinus}>
          <Text style={s.stepText}>−</Text>
        </Pressable>
        <Text style={s.stepValue}>{value}</Text>
        <Pressable style={s.stepBtn} onPress={onPlus}>
          <Text style={s.stepText}>+</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={s.container}
    >
      <Text style={s.small}>
        {t(
          "Reminders are scheduled on your phone, so they work without internet. Android may delay them if battery saver is on."
        )}
      </Text>

      {(["ipon", "gastos"] as Key[]).map((key) => {
        const r = settings[key];
        const info = INFO[key];
        return (
          <View key={key} style={s.card}>
            <View style={s.rowBetween}>
              <View style={{ flex: 1 }}>
                <Text style={s.title}>
                  {info.emoji} {t(info.title)}
                </Text>
                <Text style={s.small}>
                  {r.on
                    ? t("Every day at {time}", { time: fmt(r.hour, r.minute) })
                    : t("Off")}
                </Text>
              </View>
              <Switch
                value={r.on}
                onValueChange={(v) => update(key, { on: v })}
                trackColor={{ false: "#d1d5db", true: colors.green }}
              />
            </View>

            <Text style={s.time}>{fmt(r.hour, r.minute)}</Text>

            <View style={s.steppers}>
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
              <Pressable style={s.ampm} onPress={() => stepHour(key, 12)}>
                <Text style={s.ampmText}>{r.hour >= 12 ? "PM" : "AM"}</Text>
                <Text style={s.small}>{t("tap to switch")}</Text>
              </Pressable>
            </View>
          </View>
        );
      })}

      <View style={s.card}>
        <Text style={s.title}>{t("Test")}</Text>
        <Text style={s.small}>
          {t("Send a notification in 5 seconds to check that it works on your phone.")}
        </Text>
        <Pressable style={s.button} onPress={sendTest}>
          <Text style={s.buttonText}>{t("Send test notification")}</Text>
        </Pressable>
      </View>
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
      marginTop: 12,
    },
    rowBetween: { flexDirection: "row", alignItems: "center", gap: 12 },
    title: { color: c.text, fontSize: 16, fontWeight: "bold" },
    small: { color: c.subtext, fontSize: 13, marginTop: 4 },
    time: {
      color: c.text,
      fontSize: 34,
      fontWeight: "bold",
      textAlign: "center",
      marginVertical: 10,
    },
    steppers: { flexDirection: "row", justifyContent: "space-around", alignItems: "center" },
    stepper: { alignItems: "center" },
    stepRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 6 },
    stepBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: c.background,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: "center",
      justifyContent: "center",
    },
    stepText: { color: c.text, fontSize: 20, fontWeight: "bold" },
    stepValue: { color: c.text, fontSize: 18, fontWeight: "600", minWidth: 28, textAlign: "center" },
    ampm: {
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.background,
      alignItems: "center",
    },
    ampmText: { color: c.green, fontSize: 18, fontWeight: "bold" },
    button: {
      backgroundColor: c.green,
      padding: 12,
      borderRadius: 8,
      alignItems: "center",
      marginTop: 12,
    },
    buttonText: { color: "#fff", fontWeight: "bold" },
  });