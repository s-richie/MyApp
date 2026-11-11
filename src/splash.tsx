import { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Coin, HeroBackdrop } from "./hero-decor";
import { useI18n } from "./i18n";

export function Splash({ onDone }: { onDone: () => void }) {
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  // everything scales with the screen
  const coin = Math.round(Math.min(120, width * 0.3, height * 0.17));
  const robot = Math.round(Math.min(150, width * 0.38, height * 0.21));
  const title = Math.round(Math.min(44, width * 0.11));
  const ring = Math.round((coin + robot) * 0.95);

  const coinY = useRef(new Animated.Value(-height * 0.5)).current;
  const coinOpacity = useRef(new Animated.Value(0)).current;
  const flip = useRef(new Animated.Value(0)).current;
  const robotX = useRef(new Animated.Value(width * 0.4)).current;
  const robotOpacity = useRef(new Animated.Value(0)).current;
  const robotScale = useRef(new Animated.Value(0.6)).current;
  const moneyX = useRef(new Animated.Value(-60)).current;
  const mateX = useRef(new Animated.Value(60)).current;
  const wordOpacity = useRef(new Animated.Value(0)).current;
  const tagOpacity = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const d1 = useRef(new Animated.Value(0.3)).current;
  const d2 = useRef(new Animated.Value(0.3)).current;
  const d3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    // 1. the coin drops in and spins ("Money")
    Animated.parallel([
      Animated.timing(coinOpacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.spring(coinY, {
        toValue: 0,
        friction: 5,
        tension: 70,
        useNativeDriver: true,
      }),
    ]).start(() => {
      Animated.timing(flip, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    });

    // 2. the robot joins ("Mate")
    Animated.sequence([
      Animated.delay(550),
      Animated.parallel([
        Animated.timing(robotOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(robotX, {
          toValue: 0,
          friction: 6,
          tension: 60,
          useNativeDriver: true,
        }),
        Animated.spring(robotScale, {
          toValue: 1,
          friction: 5,
          tension: 70,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // 3. the name comes together
    Animated.sequence([
      Animated.delay(1100),
      Animated.parallel([
        Animated.timing(wordOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(moneyX, {
          toValue: 0,
          friction: 7,
          tension: 60,
          useNativeDriver: true,
        }),
        Animated.spring(mateX, {
          toValue: 0,
          friction: 7,
          tension: 60,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // 4. the tagline
    Animated.sequence([
      Animated.delay(1700),
      Animated.timing(tagOpacity, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true,
      }),
    ]).start();

    // glow and loading dots keep going
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
      ]),
    );
    pulseLoop.start();

    const dotsLoop = Animated.loop(
      Animated.stagger(
        180,
        [d1, d2, d3].map((d) =>
          Animated.sequence([
            Animated.timing(d, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(d, {
              toValue: 0.3,
              duration: 300,
              useNativeDriver: true,
            }),
          ]),
        ),
      ),
    );
    dotsLoop.start();

    const timer = setTimeout(onDone, 3000);
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
        {/* coin + robot with a glow behind them */}
        <View style={{ alignItems: "center", justifyContent: "center" }}>
          <Animated.View
            style={{
              position: "absolute",
              width: ring,
              height: ring,
              borderRadius: ring / 2,
              backgroundColor: "#ffffff",
              opacity: pulse.interpolate({
                inputRange: [0, 1],
                outputRange: [0.08, 0.2],
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
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Animated.View
              style={{
                opacity: coinOpacity,
                transform: [
                  { translateY: coinY },
                  { perspective: 800 },
                  {
                    rotateY: flip.interpolate({
                      inputRange: [0, 1],
                      outputRange: ["0deg", "720deg"],
                    }),
                  },
                ],
              }}
            >
              <Coin size={coin} />
            </Animated.View>
            <Animated.Image
              source={require("../assets/images/splash-icon.png")}
              resizeMode="contain"
              style={{
                width: robot,
                height: robot,
                marginLeft: -Math.round(robot * 0.12),
                opacity: robotOpacity,
                transform: [{ translateX: robotX }, { scale: robotScale }],
              }}
            />
          </View>
        </View>

        {/* Money + Mate */}
        <View style={{ flexDirection: "row", marginTop: 18 }}>
          <Animated.View
            style={{
              opacity: wordOpacity,
              transform: [{ translateX: moneyX }],
            }}
          >
            <Text
              maxFontSizeMultiplier={1.1}
              style={{
                color: "#ffffff",
                fontSize: title,
                fontWeight: "800",
                letterSpacing: 0.5,
              }}
            >
              Money
            </Text>
          </Animated.View>
          <Animated.View
            style={{ opacity: wordOpacity, transform: [{ translateX: mateX }] }}
          >
            <Text
              maxFontSizeMultiplier={1.1}
              style={{
                color: "#facc15",
                fontSize: title,
                fontWeight: "800",
                letterSpacing: 0.5,
              }}
            >
              Mate
            </Text>
          </Animated.View>
        </View>

        <Animated.Text
          maxFontSizeMultiplier={1.1}
          style={{
            opacity: tagOpacity,
            color: "#dcfce7",
            fontSize: 16,
            marginTop: 6,
            textAlign: "center",
            paddingHorizontal: 24,
          }}
        >
          {t("Your money buddy")}
        </Animated.Text>
      </View>

      {/* loading dots */}
      <View
        style={{
          position: "absolute",
          bottom: insets.bottom + 40,
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
              backgroundColor: "#facc15",
              opacity: d,
            }}
          />
        ))}
      </View>
    </View>
  );
}
