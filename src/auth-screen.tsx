import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "./app-theme";
import { Coin, HeroBackdrop, Wordmark } from "./hero-decor";
import { useI18n } from "./i18n";
import { Button, Field, T } from "./ui";

type Result = { error?: string; needsConfirm?: boolean };
type Mode = "in" | "up" | "reset";

type Props = {
  onSignIn: (email: string, password: string) => Promise<Result>;
  onSignUp: (email: string, password: string) => Promise<Result>;
  onSendCode: (email: string) => Promise<Result>;
  onReset: (email: string, code: string, password: string) => Promise<Result>;
  onSkip: () => void;
  canCancel: boolean;
};

export function AuthScreen({
  onSignIn,
  onSignUp,
  onSendCode,
  onReset,
  onSkip,
  canCancel,
}: Props) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();

  const [mode, setMode] = useState<Mode>("in");
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const friendly = (msg: string) => {
    if (msg === "SET_PASSWORD_FAILED") {
      return t("Could not set the new password. Request a new code.");
    }
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
    if (
      m.includes("rate limit") ||
      m.includes("too many") ||
      m.includes("seconds")
    ) {
      return t("Too many tries. Please wait a bit.");
    }
    if (m.includes("expired") || m.includes("token") || m.includes("otp")) {
      return t("Wrong or expired code.");
    }
    return msg;
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setStep("email");
    setError("");
    setInfo("");
    setCode("");
    setPassword("");
  };

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      setError(friendly(String(e)));
    } finally {
      setBusy(false);
    }
  };

  const sendCode = (mail: string) =>
    run(async () => {
      const r = await onSendCode(mail);
      if (r.error) {
        setError(friendly(r.error));
      } else {
        setStep("code");
        setInfo(t("Check your email for the code."));
      }
    });

  const submit = async () => {
    if (busy) return;
    const mail = email.trim().toLowerCase();
    setError("");
    setInfo("");

    if (!/^\S+@\S+\.\S+$/.test(mail)) {
      setError(t("Enter a valid email."));
      return;
    }

    if (mode === "reset") {
      if (step === "email") {
        await sendCode(mail);
        return;
      }
      const digits = code.replace(/\s/g, "");
      if (digits.length < 6) {
        setError(t("Wrong or expired code."));
        return;
      }
      if (password.length < 8) {
        setError(t("Password must be at least 8 characters."));
        return;
      }
      await run(async () => {
        const r = await onReset(mail, digits, password);
        if (r.error) setError(friendly(r.error));
      });
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

    await run(async () => {
      if (mode === "in") {
        const r = await onSignIn(mail, password);
        if (r.error) setError(friendly(r.error));
      } else {
        const r = await onSignUp(mail, password);
        if (r.error) setError(friendly(r.error));
        else if (r.needsConfirm)
          setInfo(t("Check your email to confirm your account."));
      }
    });
  };

  // hero and robot scale with the screen height
  const heroBody = Math.max(150, Math.min(Math.round(height * 0.24), 240));
  const heroH = heroBody + insets.top;
  const robot = Math.min(96, Math.round(heroBody * 0.45));

  const mainLabel =
    mode === "in"
      ? t("Sign in")
      : mode === "up"
        ? t("Create account")
        : step === "email"
          ? t("Send code")
          : t("Reset password");

  const passwordField = (placeholder: string) => (
    <View>
      <Field
        placeholder={placeholder}
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
  );

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
          paddingTop: insets.top,
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        <HeroBackdrop />
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Coin size={Math.round(robot * 0.7)} />
          <Image
            source={require("../assets/images/splash-icon.png")}
            style={{
              width: robot,
              height: robot,
              marginLeft: -Math.round(robot * 0.1),
            }}
            resizeMode="contain"
          />
        </View>
        <View style={{ marginTop: 4 }}>
          <Wordmark size={28} />
        </View>
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
        <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
          <ScrollView
            contentContainerStyle={{
              padding: 24,
              paddingTop: 26,
              paddingBottom: 24 + insets.bottom,
              alignItems: "center",
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={{ width: "100%", maxWidth: 480 }}>
              {mode === "reset" ? (
                <>
                  <T kind="title" style={{ textAlign: "center", fontSize: 18 }}>
                    {t("Reset password")}
                  </T>
                  {step === "email" ? (
                    <T
                      kind="muted"
                      style={{
                        textAlign: "center",
                        marginTop: 4,
                        marginBottom: 12,
                      }}
                    >
                      {t("We'll email you a code.")}
                    </T>
                  ) : (
                    <View style={{ height: 12 }} />
                  )}
                </>
              ) : (
                <>
                  <T
                    kind="muted"
                    style={{ textAlign: "center", marginBottom: 16 }}
                  >
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
                          onPress={() => switchMode(m)}
                          style={{
                            flex: 1,
                            padding: 10,
                            borderRadius: 9,
                            alignItems: "center",
                            backgroundColor: active
                              ? colors.green
                              : "transparent",
                          }}
                        >
                          <T
                            color={active ? "#fff" : colors.text}
                            numberOfLines={1}
                            style={{ fontWeight: "700" }}
                          >
                            {m === "in" ? t("Sign in") : t("Create account")}
                          </T>
                        </Pressable>
                      );
                    })}
                  </View>
                </>
              )}

              <Field
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!(mode === "reset" && step === "code")}
              />

              {mode === "reset" ? (
                step === "code" ? (
                  <>
                    <Field
                      placeholder={t("Code")}
                      value={code}
                      onChangeText={setCode}
                      keyboardType="number-pad"
                      maxLength={10}
                    />
                    {passwordField(t("New password"))}
                  </>
                ) : null
              ) : (
                passwordField("Password")
              )}

              {mode === "in" ? (
                <Pressable
                  onPress={() => switchMode("reset")}
                  style={{ alignSelf: "flex-end", paddingVertical: 6 }}
                >
                  <T color={colors.blue} style={{ fontWeight: "600" }}>
                    {t("Forgot password?")}
                  </T>
                </Pressable>
              ) : null}

              {mode === "up" ? (
                <T kind="muted" style={{ marginTop: 2 }}>
                  {t("Your entries are saved to the cloud.")}
                </T>
              ) : null}

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
                  label={busy ? "..." : mainLabel}
                  icon={busy ? undefined : "arrow-forward"}
                  onPress={submit}
                />
              </View>

              {mode === "reset" && step === "code" ? (
                <Pressable
                  onPress={() => sendCode(email.trim().toLowerCase())}
                  style={{ padding: 10, alignItems: "center" }}
                >
                  <T color={colors.blue} style={{ fontWeight: "600" }}>
                    {t("Send a new code")}
                  </T>
                </Pressable>
              ) : null}

              {mode === "reset" ? (
                <Pressable
                  onPress={() => switchMode("in")}
                  style={{ padding: 10, alignItems: "center" }}
                >
                  <T color={colors.subtext} style={{ fontWeight: "600" }}>
                    {t("Back to sign in")}
                  </T>
                </Pressable>
              ) : (
                <Pressable
                  onPress={onSkip}
                  style={{ padding: 14, alignItems: "center" }}
                >
                  <T color={colors.subtext} style={{ fontWeight: "600" }}>
                    {canCancel ? t("Cancel") : t("Skip for now")}
                  </T>
                </Pressable>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </View>
  );
}
