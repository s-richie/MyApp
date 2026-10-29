import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from "react";
import { AppState, View, Text, Image, Pressable, StyleSheet } from "react-native";
import * as SecureStore from "expo-secure-store";
import * as LocalAuthentication from "expo-local-authentication";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "./app-theme";
import { PinDots, PinPad, PIN_LENGTH } from "./pin-pad";

const PIN_KEY = "iponbot_pin";
const BIO_KEY = "iponbot_bio";
const RELOCK_MS = 30000; // lock again after 30s in the background
const MAX_ATTEMPTS = 5;
const COOLDOWN_MS = 30000;

type LockContextType = {
  hasPin: boolean;
  biometricAvailable: boolean;
  biometricEnabled: boolean;
  setPin: (pin: string) => Promise<void>;
  removePin: () => Promise<void>;
  checkPin: (pin: string) => boolean;
  setBiometric: (value: boolean) => Promise<void>;
};

const LockContext = createContext<LockContextType | null>(null);

export function useLock() {
  const ctx = useContext(LockContext);
  if (!ctx) throw new Error("useLock must be used inside LockProvider");
  return ctx;
}

export function LockProvider({ children }: { children: ReactNode }) {
  const [loaded, setLoaded] = useState(false);
  const [pin, setPinState] = useState<string | null>(null);
  const [biometricEnabled, setBioEnabled] = useState(false);
  const [biometricAvailable, setBioAvailable] = useState(false);
  const [locked, setLocked] = useState(false);

  const backgroundAt = useRef<number | null>(null);
  const authenticating = useRef(false);

  // Load the saved PIN and fingerprint setting
  useEffect(() => {
    (async () => {
      try {
        const p = await SecureStore.getItemAsync(PIN_KEY);
        const b = await SecureStore.getItemAsync(BIO_KEY);
        if (p) {
          setPinState(p);
          setLocked(true);
        }
        setBioEnabled(b === "1");

        const hardware = await LocalAuthentication.hasHardwareAsync();
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        setBioAvailable(hardware && enrolled);
      } catch (e) {
        console.warn("Could not load lock settings", e);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  // Lock again when coming back after a while
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (authenticating.current) return;
      if (state === "background") {
        backgroundAt.current = Date.now();
      } else if (state === "active") {
        const at = backgroundAt.current;
        backgroundAt.current = null;
        if (pin && at && Date.now() - at > RELOCK_MS) setLocked(true);
      }
    });
    return () => sub.remove();
  }, [pin]);

  const setPin = async (newPin: string) => {
    await SecureStore.setItemAsync(PIN_KEY, newPin);
    setPinState(newPin);
  };

  const removePin = async () => {
    await SecureStore.deleteItemAsync(PIN_KEY);
    await SecureStore.deleteItemAsync(BIO_KEY);
    setPinState(null);
    setBioEnabled(false);
    setLocked(false);
  };

  const checkPin = (code: string) => pin !== null && code === pin;

  const setBiometric = async (value: boolean) => {
    if (value) await SecureStore.setItemAsync(BIO_KEY, "1");
    else await SecureStore.deleteItemAsync(BIO_KEY);
    setBioEnabled(value);
  };

  const tryBiometric = async () => {
    if (!biometricEnabled || !biometricAvailable || authenticating.current) return;
    authenticating.current = true;
    try {
      const res = await LocalAuthentication.authenticateAsync({
        promptMessage: "Unlock Ipon Bot",
        cancelLabel: "Use PIN",
        disableDeviceFallback: true,
      });
      if (res.success) setLocked(false);
    } catch (e) {
      console.warn("Biometric failed", e);
    } finally {
      authenticating.current = false;
      backgroundAt.current = null;
    }
  };

  if (!loaded) return null;

  return (
    <LockContext.Provider
      value={{
        hasPin: pin !== null,
        biometricAvailable,
        biometricEnabled,
        setPin,
        removePin,
        checkPin,
        setBiometric,
      }}
    >
      <View style={{ flex: 1 }}>
        {children}
        {locked && pin && (
          <LockScreen
            pin={pin}
            showBiometric={biometricEnabled && biometricAvailable}
            onBiometric={tryBiometric}
            onUnlock={() => setLocked(false)}
          />
        )}
      </View>
    </LockContext.Provider>
  );
}

function LockScreen({
  pin,
  showBiometric,
  onBiometric,
  onUnlock,
}: {
  pin: string;
  showBiometric: boolean;
  onBiometric: () => void;
  onUnlock: () => void;
}) {
  const { colors } = useTheme();
  const [entered, setEntered] = useState("");
  const [error, setError] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [until, setUntil] = useState(0);
  const [now, setNow] = useState(Date.now());

  // ask for fingerprint right away
  useEffect(() => {
    if (showBiometric) onBiometric();
  }, []);

  // countdown after too many wrong tries
  useEffect(() => {
    if (!until) return;
    const timer = setInterval(() => {
      const n = Date.now();
      setNow(n);
      if (n >= until) {
        setUntil(0);
        setAttempts(0);
      }
    }, 500);
    return () => clearInterval(timer);
  }, [until]);

  const waiting = until > now;
  const secondsLeft = Math.max(Math.ceil((until - now) / 1000), 0);

  const onDigit = (d: string) => {
    if (waiting || entered.length >= PIN_LENGTH) return;
    const next = entered + d;
    setError(false);
    setEntered(next);

    if (next.length === PIN_LENGTH) {
      if (next === pin) {
        onUnlock();
        return;
      }
      setError(true);
      const a = attempts + 1;
      setAttempts(a);
      if (a >= MAX_ATTEMPTS) {
        const n = Date.now();
        setNow(n);
        setUntil(n + COOLDOWN_MS);
      }
      setTimeout(() => setEntered(""), 350);
    }
  };

  const onDelete = () => {
    setError(false);
    setEntered((e) => e.slice(0, -1));
  };

  return (
    <View style={[s.overlay, { backgroundColor: colors.background }]}>
      <Image
        source={require("../assets/images/splash-icon.png")}
        style={s.robot}
        resizeMode="contain"
      />
      <Text style={[s.title, { color: colors.text }]}>Ipon Bot</Text>
      <Text style={{ color: error || waiting ? colors.red : colors.subtext }}>
        {waiting
          ? `Too many tries. Wait ${secondsLeft}s`
          : error
          ? "Wrong PIN. Try again."
          : "Enter your PIN"}
      </Text>

      <PinDots count={entered.length} error={error} />

      <PinPad
        onDigit={onDigit}
        onDelete={onDelete}
        disabled={waiting}
        bottomLeft={
          showBiometric ? (
            <Pressable onPress={onBiometric} hitSlop={10}>
              <Ionicons name="finger-print" size={32} color={colors.green} />
            </Pressable>
          ) : undefined
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
    elevation: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  robot: { width: 110, height: 110 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 4 },
});