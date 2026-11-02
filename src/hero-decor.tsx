import { useEffect, useRef } from "react";
import { View, Text, Animated, Easing } from "react-native";

const COINS = [
  { left: "9%", top: "16%", size: 34, dy: -14 },
  { left: "80%", top: "9%", size: 26, dy: 12 },
  { left: "76%", top: "56%", size: 38, dy: -16 },
  { left: "5%", top: "60%", size: 28, dy: 14 },
  { left: "44%", top: "5%", size: 22, dy: 10 },
  { left: "91%", top: "80%", size: 22, dy: -10 },
] as const;

// Green circles and floating coins. Put it inside a View with overflow: "hidden".
export function HeroBackdrop() {
  const float = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(float, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(float, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <View
      pointerEvents="none"
      style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <View
        style={{
          position: "absolute",
          width: 380,
          height: 380,
          borderRadius: 190,
          backgroundColor: "#22c55e",
          opacity: 0.35,
          top: -140,
          right: -130,
        }}
      />
      <View
        style={{
          position: "absolute",
          width: 300,
          height: 300,
          borderRadius: 150,
          backgroundColor: "#052e16",
          opacity: 0.22,
          bottom: -110,
          left: -120,
        }}
      />
      <View
        style={{
          position: "absolute",
          width: 150,
          height: 150,
          borderRadius: 75,
          backgroundColor: "#86efac",
          opacity: 0.18,
          top: "30%",
          left: -60,
        }}
      />

      {COINS.map((c, i) => (
        <Animated.View
          key={i}
          style={{
            position: "absolute",
            left: c.left,
            top: c.top,
            width: c.size,
            height: c.size,
            borderRadius: c.size / 2,
            backgroundColor: "#facc15",
            borderWidth: 2,
            borderColor: "#ca8a04",
            alignItems: "center",
            justifyContent: "center",
            opacity: 0.92,
            transform: [
              {
                translateY: float.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, c.dy],
                }),
              },
            ],
          }}
        >
          <Text
            style={{ color: "#a16207", fontWeight: "800", fontSize: c.size * 0.5 }}
          >
            ₱
          </Text>
        </Animated.View>
      ))}
    </View>
  );
}