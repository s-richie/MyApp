import { useEffect, useRef, useState } from "react";
import {
  View,
  Image,
  Text,
  Animated,
  Easing,
  ScrollView,
  StatusBar,
  useWindowDimensions,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "./app-theme";
import { useI18n } from "./i18n";
import { T, Chip, Button, IconCircle, IconName } from "./ui";
import { HeroBackdrop } from "./hero-decor";

const KEY = "iponbot:welcome:v1";

const FEATURES: { icon: IconName; tone: string; title: string; sub: string }[] = [
  { icon: "wallet", tone: "#16a34a", title: "Save money", sub: "Add ipon to your goals" },
  { icon: "receipt", tone: "#2563eb", title: "Track spending", sub: "Log your gastos" },
  { icon: "trophy", tone: "#f59e0b", title: "Reach goals", sub: "See your progress" },
];

export function Welcome() {
  const { colors } = useTheme();
  const { t, lang, setLang } = useI18n();
  const { height } = useWindowDimensions();
  const [show, setShow] = useState<boolean | null>(null);

  const bounce = useRef(new Animated.Value(0)).current;
  const enter = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((v) => setShow(v !== "1"))
      .catch(() => setShow(false));
  }, []);

  useEffect(() => {
    if (!show) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(bounce, {
          toValue: 0,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    Animated.timing(enter, {
      toValue: 1,
      duration: 900,
      delay: 150,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
    return () => loop.stop();
  }, [show]);

  if (show === false) return null;

  const overlay = {
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 900,
    elevation: 900,
    backgroundColor: "#16a34a",
  };

  // still loading: cover the screen so nothing flashes
  if (show === null) return <View style={overlay} />;

  const done = () => {
    setShow(false);
    AsyncStorage.setItem(KEY, "1").catch(() => {});
  };

  const heroH = Math.max(260, Math.round(height * 0.38));
  const topPad = StatusBar.currentHeight ?? 24;

  return (
    <View style={overlay}>
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
        <Animated.View
          style={{
            transform: [
              {
                translateY: bounce.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -8],
                }),
              },
            ],
          }}
        >
          <Image
            source={require("../assets/images/splash-icon.png")}
            style={{ width: 130, height: 130 }}
            resizeMode="contain"
          />
        </Animated.View>
        <Text style={{ color: "#fff", fontSize: 32, fontWeight: "800", marginTop: 2 }}>
          Ipon Bot
        </Text>
        <Text style={{ color: "#dcfce7", fontSize: 15, marginTop: 2 }}>
          {t("Save smart. Spend wise.")}
        </Text>
      </View>

      {/* Card */}
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
          showsVerticalScrollIndicator={false}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              gap: 8,
              marginBottom: 18,
            }}
          >
            <Chip label="English" active={lang === "en"} onPress={() => setLang("en")} />
            <Chip label="Filipino" active={lang === "fil"} onPress={() => setLang("fil")} />
          </View>

          {FEATURES.map((f, i) => {
            const range = [i * 0.18, i * 0.18 + 0.5];
            return (
              <Animated.View
                key={f.icon}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 14,
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 18,
                  padding: 14,
                  marginBottom: 12,
                  opacity: enter.interpolate({
                    inputRange: range,
                    outputRange: [0, 1],
                    extrapolate: "clamp",
                  }),
                  transform: [
                    {
                      translateY: enter.interpolate({
                        inputRange: range,
                        outputRange: [24, 0],
                        extrapolate: "clamp",
                      }),
                    },
                  ],
                }}
              >
                <IconCircle name={f.icon} color={f.tone} size={50} />
                <View style={{ flex: 1 }}>
                  <T kind="title">{t(f.title)}</T>
                  <T kind="muted">{t(f.sub)}</T>
                </View>
              </Animated.View>
            );
          })}

          <View style={{ marginTop: 10 }}>
            <Button label={t("Get started")} icon="arrow-forward" onPress={done} />
          </View>
        </ScrollView>
      </View>
    </View>
  );
}