import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const light = {
  background: "#ffffff",
  card: "#f3f4f6",
  text: "#111827",
  subtext: "#6b7280",
  border: "#e5e7eb",
  inputBg: "#ffffff",
  barBg: "#e5e7eb",
  green: "#16a34a",
  blue: "#2563eb",
  red: "#dc2626",
};

const dark: typeof light = {
  background: "#111827",
  card: "#1f2937",
  text: "#f9fafb",
  subtext: "#9ca3af",
  border: "#374151",
  inputBg: "#1f2937",
  barBg: "#374151",
  green: "#22c55e",
  blue: "#3b82f6",
  red: "#f87171",
};

export type Colors = typeof light;

type ThemeContextType = {
  isDark: boolean;
  setDark: (value: boolean) => void;
  colors: Colors;
};

const THEME_KEY = "iponbot:dark";

const ThemeContext = createContext<ThemeContextType>({
  isDark: false,
  setDark: () => {},
  colors: light,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [isDark, setIsDark] = useState(system === "dark");
  const [loaded, setLoaded] = useState(false);

  // Load the saved choice (if the user never picked, follow the phone)
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(THEME_KEY);
        if (saved === "1") setIsDark(true);
        if (saved === "0") setIsDark(false);
      } catch (e) {
        console.warn("Could not load theme", e);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const setDark = (value: boolean) => {
    setIsDark(value);
    AsyncStorage.setItem(THEME_KEY, value ? "1" : "0").catch(() => {});
  };

  if (!loaded) return null;

  return (
    <ThemeContext.Provider
      value={{ isDark, setDark, colors: isDark ? dark : light }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);