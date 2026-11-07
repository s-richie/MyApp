import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { useEffect, useRef, useState } from "react";
import { Alert, Platform, Pressable, Switch, View } from "react-native";
import { useTheme } from "./app-theme";
import { useI18n } from "./i18n";
import { Button, Card, Chip, IconCircle, Screen, T } from "./ui";

// Show notifications (with sound and vibration) even while the app is open
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const STORAGE_KEY = "iponbot:reminder:v2";
const OLD_KEY = "iponbot:reminders:v1"; // the old two-reminder settings
// Android cannot change a channel after it is created, so we keep this id
const CHANNEL_ID = "reminders-v2";
const VIBRATION = [0, 400, 200, 400];

type Reminder = { on: boolean; hour: number; minute: number; id?: string };
const DEFAULT: Reminder = { on: false, hour: 19, minute: 0 };

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
      importance: Notifications.AndroidImportance.HIGH,
      enableVibrate: true,
      vibrationPattern: VIBRATION,
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
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          marginTop: 6,
        }}
      >
        <Pressable style={btn} onPress={onMinus}>
          <Ionicons name="remove" size={18} color={colors.text} />
        </Pressable>
        <T
          style={{
            minWidth: 26,
            textAlign: "center",
            fontSize: 18,
            fontWeight: "700",
          }}
        >
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

  const [rem, setRem] = useState<Reminder>(DEFAULT);
  const remRef = useRef<Reminder>(DEFAULT);
  const busy = useRef(false);

  const schedule = (hour: number, minute: number) =>
    Notifications.scheduleNotificationAsync({
      content: {
        title: "MoneyMate",
        body: t("Did you log your money today? Add your income and gastos."),
        vibrate: VIBRATION,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
        ...channelPart(),
      },
    });

  const apply = async (patch: Partial<Reminder>) => {
    if (busy.current) return; // ignore taps while scheduling
    busy.current = true;
    try {
      const cur = remRef.current;
      const next: Reminder = { ...cur, ...patch };

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
            t(
              "Allow notifications for Expo Go in your phone's settings, then try again.",
            ),
          );
        } else {
          next.id = await schedule(next.hour, next.minute);
        }
      }

      remRef.current = next;
      setRem(next);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (e) {
      console.warn("Reminder error", e);
      Alert.alert(t("Could not set the reminder"), String(e));
    } finally {
      busy.current = false;
    }
  };

  // load the saved reminder, and merge the old two reminders into one
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const d = JSON.parse(raw);
          const loaded: Reminder = { ...DEFAULT, ...d };
          remRef.current = loaded;
          setRem(loaded);
          return;
        }

        const old = await AsyncStorage.getItem(OLD_KEY);
        if (old) {
          const d = JSON.parse(old);
          const wasOn = !!(d?.ipon?.on || d?.gastos?.on);

          // cancel the old separate reminders
          await Notifications.cancelAllScheduledNotificationsAsync().catch(
            () => {},
          );
          await AsyncStorage.removeItem(OLD_KEY).catch(() => {});

          const base: Reminder = {
            on: false,
            hour: d?.ipon?.hour ?? DEFAULT.hour,
            minute: d?.ipon?.minute ?? DEFAULT.minute,
          };
          remRef.current = base;
          setRem(base);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(base));
          if (wasOn) await apply({ on: true });
        }
      } catch (e) {
        console.warn("Could not load the reminder", e);
      }
    })();
  }, []);

  const stepHour = (delta: number) =>
    apply({ hour: (remRef.current.hour + delta + 24) % 24 });

  const stepMinute = (delta: number) =>
    apply({ minute: (remRef.current.minute + delta + 60) % 60 });

  const sendTest = async () => {
    try {
      const ok = await ensurePermission();
      if (!ok) {
        Alert.alert(
          t("Notifications are off"),
          t(
            "Allow notifications for Expo Go in your phone's settings, then try again.",
          ),
        );
        return;
      }
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "MoneyMate",
          body: "It works! Reminders are ready.",
          vibrate: VIBRATION,
        },
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
      <Card>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <IconCircle name="notifications" size={46} />
          <View style={{ flex: 1 }}>
            <T kind="title">{t("Daily reminder")}</T>
            <T kind="muted">
              {rem.on
                ? t("Every day at {time}", { time: fmt(rem.hour, rem.minute) })
                : t("Off")}
            </T>
          </View>
          <Switch
            value={rem.on}
            onValueChange={(v) => apply({ on: v })}
            trackColor={{ false: "#d1d5db", true: colors.green }}
          />
        </View>

        {rem.on ? (
          <>
            <T
              style={{
                fontSize: 34,
                fontWeight: "800",
                textAlign: "center",
                marginVertical: 12,
              }}
            >
              {fmt(rem.hour, rem.minute)}
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
                value={String(((rem.hour + 11) % 12) + 1)}
                onMinus={() => stepHour(-1)}
                onPlus={() => stepHour(1)}
              />
              <Stepper
                label={t("Minute")}
                value={String(rem.minute).padStart(2, "0")}
                onMinus={() => stepMinute(-5)}
                onPlus={() => stepMinute(5)}
              />
              <Chip
                label={rem.hour >= 12 ? "PM" : "AM"}
                active
                onPress={() => stepHour(12)}
              />
            </View>
          </>
        ) : null}
      </Card>

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
