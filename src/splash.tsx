import { useEffect, useRef } from "react";
import { View, Image, Text, Animated, Easing } from "react-native";
import { useI18n } from "./i18n";
import { HeroBackdrop } from "./hero-decor";

export function Splash({ onDone }: { onDone: () => void }) {
  const { t } = useI18n();

  const logoScale = useRef(new Animated.Value(0.3)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const wiggle = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleY = useRef(new Animated.Value(24)).current;
  const tagOpacity = useRef(new Animated.Value(0)).current;
  const d1 = useRef(new Animated.Value(0.3)).current;
  const d2 = useRef(new Animated.Value(0.3)).current;
  const d3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    // robot pops in, then wiggles
    Animated.parallel([
      Animated.timing(logoOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 4,
        tension: 55,
        useNativeDriver: true,
      }),
    ]).start(() => {
      Animated.timing(wiggle, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    });

    // title, then tagline
    Animated.sequence([
      Animated.delay(450),
      Animated.parallel([
        Animated.timing(titleOpacity, { toValue: 1, duration: 450, useNativeDriver: true }),
        Animated.timing(titleY, {
          toValue: 0,
          duration: 450,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]).start();
    Animated.sequence([
      Animated.delay(900),
      Animated.timing(tagOpacity, { toValue: 1, duration: 450, useNativeDriver: true }),
    ]).start();

    // glow ring and loading dots keep going
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1100,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1100,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    const dotsLoop = Animated.loop(
      Animated.stagger(
        180,
        [d1, d2, d3].map((d) =>
          Animated.sequence([
            Animated.timing(d, { toValue: 1, duration: 300, useNativeDriver: true }),
            Animated.timing(d, { toValue: 0.3, duration: 300, useNativeDriver: true }),
          ])
        )
      )
    );
    dotsLoop.start();

    const timer = setTimeout(onDone, 2800);
    return () => {
      clearTimeout(timer);
      pulseLoop.stop();
      dotsLoop.stop();
    };
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: "#16a34a", overflow: "hidden" }}>
      <HeroBackdrop />

      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        {/* robot with glow */}
        <View
          style={{
            width: 240,
            height: 240,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Animated.View
            style={{
              position: "absolute",
              width: 230,
              height: 230,
              borderRadius: 115,
              backgroundColor: "#ffffff",
              opacity: pulse.interpolate({
                inputRange: [0, 1],
                outputRange: [0.1, 0.22],
              }),
              transform: [
                {
                  scale: pulse.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.12],
                  }),
                },
              ],
            }}
          />
          <Animated.Image
            source={require("../assets/images/splash-icon.png")}
            resizeMode="contain"
            style={{
              width: 170,
              height: 170,
              opacity: logoOpacity,
              transform: [
                { scale: logoScale },
                {
                  rotate: wiggle.interpolate({
                    inputRange: [0, 0.25, 0.5, 0.75, 1],
                    outputRange: ["0deg", "-8deg", "8deg", "-4deg", "0deg"],
                  }),
                },
              ],
            }}
          />
        </View>

        <Animated.View
          style={{ opacity: titleOpacity, transform: [{ translateY: titleY }] }}
        >
          <Text
            style={{
              color: "#fff",
              fontSize: 40,
              fontWeight: "800",
              letterSpacing: 0.5,
            }}
          >
            Ipon Bot
          </Text>
        </Animated.View>

        <Animated.Text
          style={{
            opacity: tagOpacity,
            color: "#dcfce7",
            fontSize: 16,
            marginTop: 6,
          }}
        >
          {t("Save smart. Spend wise.")}
        </Animated.Text>
      </View>

      {/* loading dots */}
      <View
        style={{
          position: "absolute",
          bottom: 56,
          left: 0,
          right: 0,
          flexDirection: "row",
          justifyContent: "center",
          gap: 10,
        }}
      >
        {[d1, d2, d3].map((d, i) => (
          <Animated.View
            key={i}
            style={{
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: "#fff",
              opacity: d,
            }}
          />
        ))}
      </View>
    </View>
  );
}