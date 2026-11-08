import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "./app-theme";
import { Coin, HeroBackdrop, Wordmark } from "./hero-decor";
import { useI18n } from "./i18n";
import { Button, Chip, IconCircle, IconName, T } from "./ui";

const KEY = "iponbot:welcome:v1";

const FEATURES: { icon: IconName; tone: string; title: string; sub: string }[] =
  [
    {
      icon: "wallet",
      tone: "#16a34a",
      title: "Track your money",
      sub: "Add the money you have",
    },
    {
      icon: "receipt",
      tone: "#2563eb",
      title: "Track spending",
      sub: "Log your gastos",
    },
    {
      icon: "people",
      tone: "#f59e0b",
      title: "Utang & Ambagan",
      sub: "Who owes who",
    },
  ];

export function Welcome() {
  const { colors } = useTheme();
  const { t, lang, setLang } = useI18n();
  const insets = useSafeAreaInsets();
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
      ]),
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

  // the hero, coin and robot scale with the screen height
  const heroH =
    Math.max(210, Math.min(Math.round(height * 0.37), 350)) + insets.top;
  const robot = Math.min(120, Math.round((heroH - insets.top) * 0.4));

  return (
    <View style={overlay}>
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
        <Animated.View
          style={{
            flexDirection: "row",
            alignItems: "center",
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
        </Animated.View>
        <View style={{ marginTop: 4 }}>
          <Wordmark size={34} />
        </View>
        <Text
          maxFontSizeMultiplier={1.2}
          style={{
            color: "#dcfce7",
            fontSize: 15,
            marginTop: 2,
            textAlign: "center",
            paddingHorizontal: 24,
          }}
        >
          {t("Your money buddy")}
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
          contentContainerStyle={{
            padding: 24,
            paddingTop: 26,
            paddingBottom: 24 + insets.bottom,
            alignItems: "center",
          }}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ width: "100%", maxWidth: 520 }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
                gap: 8,
                marginBottom: 18,
              }}
            >
              <Chip
                label="English"
                active={lang === "en"}
                onPress={() => setLang("en")}
              />
              <Chip
                label="Filipino"
                active={lang === "fil"}
                onPress={() => setLang("fil")}
              />
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
              <Button
                label={t("Get started")}
                icon="arrow-forward"
                onPress={done}
              />
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}
