import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type Kind = "ipon" | "gastos";

export type Entry = {
  id: string;
  kind: Kind;
  amount: number;
  note: string;
  date: string; // ISO date string
};

type DataContextType = {
  entries: Entry[];
  addEntry: (kind: Kind, amount: number, note: string) => void;
  deleteEntry: (id: string) => void;
  goal: string;
  setGoal: (value: string) => void;
  budget: string;
  setBudget: (value: string) => void;
  saved: number; // all-time ipon (for the goal)
  monthEntries: Entry[];
  monthSaved: number;
  monthSpent: number;
  monthLabel: string;
  isCurrentMonth: boolean;
  shiftMonth: (delta: number) => void;
};

const STORAGE_KEY = "iponbot:data:v1";

const monthKeyOf = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [goal, setGoal] = useState("10000");
  const [budget, setBudget] = useState("5000");
  const [loaded, setLoaded] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(monthKeyOf(new Date()));

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const d = JSON.parse(raw);
          if (Array.isArray(d.entries)) setEntries(d.entries);
          if (typeof d.goal === "string") setGoal(d.goal);
          if (typeof d.budget === "string") setBudget(d.budget);
        }
      } catch (e) {
        console.warn("Could not load saved data", e);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ entries, goal, budget })
    ).catch((e) => console.warn("Could not save data", e));
  }, [entries, goal, budget, loaded]);

  const currentMonth = monthKeyOf(new Date());

  const addEntry = (kind: Kind, amount: number, note: string) => {
    const entry: Entry = {
      id: Date.now().toString(),
      kind,
      amount,
      note,
      date: new Date().toISOString(),
    };
    setEntries((prev) => [entry, ...prev]);
    setSelectedMonth(currentMonth);
  };

  const deleteEntry = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const shiftMonth = (delta: number) => {
    const [y, m] = selectedMonth.split("-").map(Number);
    const key = monthKeyOf(new Date(y, m - 1 + delta, 1));
    if (key > currentMonth) return;
    setSelectedMonth(key);
  };

  const [year, month] = selectedMonth.split("-").map(Number);
  const monthLabel = new Date(year, month - 1, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const monthEntries = entries.filter(
    (e) => monthKeyOf(new Date(e.date)) === selectedMonth
  );
  const sum = (list: Entry[], kind: Kind) =>
    list.filter((e) => e.kind === kind).reduce((a, e) => a + e.amount, 0);

  const saved = sum(entries, "ipon");
  const monthSaved = sum(monthEntries, "ipon");
  const monthSpent = sum(monthEntries, "gastos");

  if (!loaded) return null;

  return (
    <DataContext.Provider
      value={{
        entries,
        addEntry,
        deleteEntry,
        goal,
        setGoal,
        budget,
        setBudget,
        saved,
        monthEntries,
        monthSaved,
        monthSpent,
        monthLabel,
        isCurrentMonth: selectedMonth === currentMonth,
        shiftMonth,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used inside DataProvider");
  return ctx;
}