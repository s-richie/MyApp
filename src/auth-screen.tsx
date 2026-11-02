import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
    Image,
    Pressable,
    ScrollView,
    StatusBar,
    Text,
    useWindowDimensions,
    View,
} from "react-native";
import { useTheme } from "./app-theme";
import { HeroBackdrop } from "./hero-decor";
import { useI18n } from "./i18n";
import { Button, Field, T } from "./ui";

type Result = { error?: string; needsConfirm?: boolean };

type Props = {
  onSignIn: (email: string, password: string) => Promise<Result>;
  onSignUp: (email: string, password: string) => Promise<Result>;
  onSkip: () => void;
  canCancel: boolean;
};

export function AuthScreen({ onSignIn, onSignUp, onSkip, canCancel }: Props) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const { height } = useWindowDimensions();

  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const friendly = (msg: string) => {
    const m = msg.toLowerCase();
    if (m.includes("invalid login")) return t("Wrong email or password.");
    if (m.includes("already") && m.includes("registered")) {
      return t("This email already has an account. Try signing in.");
    }
    if (m.includes("at least"))
      return t("Password must be at least 8 characters.");
    if (m.includes("valid email") || m.includes("invalid format")) {
      return t("Enter a valid email.");
    }
    if (m.includes("network") || m.includes("fetch"))
      return t("No internet. Try again.");
    if (m.includes("rate limit") || m.includes("too many")) {
      return t("Too many tries. Please wait a bit.");
    }
    return msg;
  };

  const submit = async () => {
    if (busy) return;
    const mail = email.trim().toLowerCase();
    setError("");
    setInfo("");

    if (!/^\S+@\S+\.\S+$/.test(mail)) {
      setError(t("Enter a valid email."));
      return;
    }
    if (mode === "up" && password.length < 8) {
      setError(t("Password must be at least 8 characters."));
      return;
    }
    if (mode === "in" && password.length === 0) {
      setError(t("Wrong email or password."));
      return;
    }

    setBusy(true);
    try {
      if (mode === "in") {
        const r = await onSignIn(mail, password);
        if (r.error) setError(friendly(r.error));
      } else {
        const r = await onSignUp(mail, password);
        if (r.error) setError(friendly(r.error));
        else if (r.needsConfirm)
          setInfo(t("Check your email to confirm your account."));
      }
    } catch (e) {
      setError(friendly(String(e)));
    } finally {
      setBusy(false);
    }
  };

  const heroH = Math.max(190, Math.round(height * 0.27));
  const topPad = StatusBar.currentHeight ?? 24;

  return (
    <View
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 800,
        elevation: 800,
        backgroundColor: "#16a34a",
      }}
    >
      {/* Hero */}
      <View
        style={{
          height: heroH,
          paddingTop: topPad,
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        <HeroBackdrop />
        <Image
          source={require("../assets/images/splash-icon.png")}
          style={{ width: 96, height: 96 }}
          resizeMode="contain"
        />
        <Text style={{ color: "#fff", fontSize: 26, fontWeight: "800" }}>
          Ipon Bot
        </Text>
      </View>

      {/* Form card */}
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          borderTopLeftRadius: 32,
          borderTopRightRadius: 32,
          marginTop: -28,
        }}
      >
        <ScrollView
          contentContainerStyle={{ padding: 24, paddingTop: 26 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <T kind="muted" style={{ textAlign: "center", marginBottom: 16 }}>
            {t("Back up your data across phones.")}
          </T>

          {/* Sign in / Create account */}
          <View
            style={{
              flexDirection: "row",
              backgroundColor: colors.card,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.border,
              padding: 4,
              marginBottom: 12,
            }}
          >
            {(["in", "up"] as const).map((m) => {
              const active = mode === m;
              return (
                <Pressable
                  key={m}
                  onPress={() => {
                    setMode(m);
                    setError("");
                    setInfo("");
                  }}
                  style={{
                    flex: 1,
                    padding: 10,
                    borderRadius: 9,
                    alignItems: "center",
                    backgroundColor: active ? colors.green : "transparent",
                  }}
                >
                  <T
                    color={active ? "#fff" : colors.text}
                    style={{ fontWeight: "700" }}
                  >
                    {m === "in" ? t("Sign in") : t("Create account")}
                  </T>
                </Pressable>
              );
            })}
          </View>

          <Field
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <View>
            <Field
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPw}
              autoCapitalize="none"
              autoCorrect={false}
              style={{ paddingRight: 46 }}
            />
            <Pressable
              onPress={() => setShowPw(!showPw)}
              hitSlop={10}
              style={{
                position: "absolute",
                right: 14,
                top: 0,
                bottom: 0,
                justifyContent: "center",
              }}
            >
              <Ionicons
                name={showPw ? "eye-off" : "eye"}
                size={22}
                color={colors.subtext}
              />
            </Pressable>
          </View>

          {error ? (
            <T color={colors.red} style={{ marginTop: 4 }}>
              {error}
            </T>
          ) : null}
          {info ? (
            <T color={colors.green} style={{ marginTop: 4 }}>
              {info}
            </T>
          ) : null}

          <View style={{ marginTop: 8 }}>
            <Button
              label={
                busy
                  ? "..."
                  : mode === "in"
                    ? t("Sign in")
                    : t("Create account")
              }
              icon={busy ? undefined : "arrow-forward"}
              onPress={submit}
            />
          </View>

          <Pressable
            onPress={onSkip}
            style={{ padding: 14, alignItems: "center" }}
          >
            <T color={colors.subtext} style={{ fontWeight: "600" }}>
              {canCancel ? t("Cancel") : t("Continue without account")}
            </T>
          </Pressable>
        </ScrollView>
      </View>
    </View>
  );
}
