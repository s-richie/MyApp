import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type Kind = "ipon" | "gastos";

export type Entry = {
  id: string;
  kind: Kind;
  amount: number;
  note: string;
  date: string; // ISO date string
  category?: string; // only for gastos
  goalId?: string; // only for ipon
  walletId?: string;
};

// "icon" is an Ionicons name. "emoji" is only read from old saved data.
export type Goal = {
  id: string;
  name: string;
  icon?: string;
  emoji?: string;
  target: number;
};

export type Wallet = {
  id: string;
  name: string;
  icon?: string;
  emoji?: string;
  start: number; // starting balance
};

// "owed" = they owe me, "owe" = I owe them
export type Direction = "owed" | "owe";

export type Debt = {
  id: string;
  person: string;
  amount: number;
  paid: number;
  direction: Direction;
  note: string;
  date: string;
};

export type NewDebt = {
  person: string;
  amount: number;
  direction: Direction;
  note: string;
};

export type Frequency = "daily" | "weekly" | "monthly";

export type Recurring = {
  id: string;
  kind: Kind;
  amount: number;
  note: string;
  tag?: string; // category key (gastos) or goal id (ipon)
  walletId: string;
  frequency: Frequency;
  day: number; // weekly: 0-6 (Sun-Sat), monthly: 1-31
  nextDate: string; // ISO, next due date
  active: boolean;
};

export type NewRecurring = {
  kind: Kind;
  amount: number;
  note: string;
  tag?: string;
  walletId: string;
  frequency: Frequency;
  day: number;
};

export const DEFAULT_GOAL_ID = "default";
export const DEFAULT_WALLET_ID = "cash";

// Kept so older code paths still work
export const GOAL_EMOJIS = ["🎯", "💻", "📱", "✈️", "🏠", "🚲", "🎓", "🎁"];
export const WALLET_EMOJIS = ["💵", "📱", "💜", "🏦", "💳", "👛", "🐷", "🎒"];

export const CATEGORIES = [
  { key: "food", label: "Food", icon: "restaurant", emoji: "🍔" },
  { key: "fare", label: "Fare", icon: "bus", emoji: "🚌" },
  { key: "load", label: "Load", icon: "call", emoji: "📱" },
  { key: "school", label: "School", icon: "book", emoji: "📚" },
  { key: "bills", label: "Bills", icon: "receipt", emoji: "🧾" },
  { key: "shopping", label: "Shopping", icon: "bag-handle", emoji: "🛍️" },
  { key: "other", label: "Other", icon: "apps", emoji: "📦" },
];

export const categoryOf = (key?: string) =>
  CATEGORIES.find((c) => c.key === key) ?? CATEGORIES[CATEGORIES.length - 1];

type EntryPatch = Partial<
  Pick<Entry, "amount" | "note" | "category" | "walletId">
>;
type GoalPatch = Partial<Pick<Goal, "name" | "icon" | "emoji" | "target">>;
type WalletPatch = Partial<Pick<Wallet, "name" | "icon" | "emoji" | "start">>;

type DataContextType = {
  entries: Entry[];
  // 4th param "tag": category key for gastos, goal id for ipon
  addEntry: (
    kind: Kind,
    amount: number,
    note: string,
    tag?: string,
    walletId?: string
  ) => void;
  updateEntry: (id: string, patch: EntryPatch) => void;
  deleteEntry: (id: string) => void;
  goals: Goal[];
  addGoal: (name: string, icon: string, target: number) => string;
  updateGoal: (id: string, patch: GoalPatch) => void;
  deleteGoal: (id: string) => void;
  goalSaved: (goalId: string) => number;
  wallets: Wallet[];
  addWallet: (name: string, icon: string, start: number) => void;
  updateWallet: (id: string, patch: WalletPatch) => void;
  deleteWallet: (id: string) => void;
  walletBalance: (walletId: string) => number;
  debts: Debt[];
  addDebt: (item: NewDebt) => void;
  addDebts: (items: NewDebt[]) => void;
  recordPayment: (id: string, amount: number) => void;
  deleteDebt: (id: string) => void;
  recurring: Recurring[];
  addRecurring: (item: NewRecurring) => void;
  toggleRecurring: (id: string) => void;
  deleteRecurring: (id: string) => void;
  budget: string;
  setBudget: (value: string) => void;
  saved: number; // all-time ipon
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

const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

// ---------- Recurring helpers ----------

const daysIn = (year: number, monthIndex: number) =>
  new Date(year, monthIndex + 1, 0).getDate();

// First due date: today or later, matching the chosen weekday / day of month
function firstOccurrence(frequency: Frequency, day: number, now: Date): Date {
  const y = now.getFullYear();
  const m = now.getMonth();
  const d = now.getDate();

  if (frequency === "daily") return new Date(y, m, d, 12);

  if (frequency === "weekly") {
    const diff = (day - now.getDay() + 7) % 7;
    return new Date(y, m, d + diff, 12);
  }

  const startOfToday = new Date(y, m, d, 0, 0, 0).getTime();
  const thisMonth = new Date(y, m, Math.min(day, daysIn(y, m)), 12);
  if (thisMonth.getTime() >= startOfToday) return thisMonth;
  return new Date(y, m + 1, Math.min(day, daysIn(y, m + 1)), 12);
}

function advance(date: Date, r: Recurring): Date {
  if (r.frequency === "daily") {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1, 12);
  }
  if (r.frequency === "weekly") {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 7, 12);
  }
  const y = date.getFullYear();
  const nm = date.getMonth() + 1;
  return new Date(y, nm, Math.min(r.day, daysIn(y, nm)), 12);
}

function entryFrom(r: Recurring, when: Date): Entry {
  return {
    id: makeId(),
    kind: r.kind,
    amount: r.amount,
    note: r.note,
    date: when.toISOString(),
    walletId: r.walletId,
    ...(r.kind === "gastos"
      ? { category: r.tag ?? "other" }
      : r.tag
      ? { goalId: r.tag }
      : {}),
  };
}

// Creates every entry that is due up to the end of today
function runRecurring(list: Recurring[], now: Date) {
  const endOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
    999
  ).getTime();

  const created: Entry[] = [];
  const updated = list.map((r) => {
    if (!r.active) return r;
    let next = new Date(r.nextDate);
    let guard = 0;
    while (next.getTime() <= endOfToday && guard < 400) {
      created.push(entryFrom(r, next));
      next = advance(next, r);
      guard++;
    }
    return { ...r, nextDate: next.toISOString() };
  });

  // newest first, like the rest of the entries list
  return { created: created.slice().reverse(), updated };
}

// ---------- Provider ----------

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [goals, setGoals] = useState<Goal[]>([
    { id: DEFAULT_GOAL_ID, name: "My Ipon", icon: "flag", target: 10000 },
  ]);
  const [wallets, setWallets] = useState<Wallet[]>([
    { id: DEFAULT_WALLET_ID, name: "Cash", icon: "cash", start: 0 },
    { id: "gcash", name: "GCash", icon: "phone-portrait", start: 0 },
  ]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [recurring, setRecurring] = useState<Recurring[]>([]);
  const [budget, setBudget] = useState("0");
  const [loaded, setLoaded] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(monthKeyOf(new Date()));

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const d = JSON.parse(raw);
          const savedEntries: Entry[] = Array.isArray(d.entries) ? d.entries : [];
          const savedRecurring: Recurring[] = Array.isArray(d.recurring)
            ? d.recurring
            : [];

          // add anything that came due while the app was closed
          const { created, updated } = runRecurring(savedRecurring, new Date());
          setEntries([...created, ...savedEntries]);
          setRecurring(updated);

          if (typeof d.budget === "string") setBudget(d.budget);
          if (Array.isArray(d.debts)) setDebts(d.debts);
          if (Array.isArray(d.wallets) && d.wallets.length > 0) {
            setWallets(d.wallets);
          }
          if (Array.isArray(d.goals) && d.goals.length > 0) {
            setGoals(d.goals);
          } else if (typeof d.goal === "string") {
            setGoals([
              {
                id: DEFAULT_GOAL_ID,
                name: "My Ipon",
                icon: "flag",
                target: Number(d.goal) || 10000,
              },
            ]);
          }
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
      JSON.stringify({ entries, goals, budget, wallets, debts, recurring })
    ).catch((e) => console.warn("Could not save data", e));
  }, [entries, goals, budget, wallets, debts, recurring, loaded]);

  const currentMonth = monthKeyOf(new Date());

  const addEntry = (
    kind: Kind,
    amount: number,
    note: string,
    tag?: string,
    walletId?: string
  ) => {
    const entry: Entry = {
      id: makeId(),
      kind,
      amount,
      note,
      date: new Date().toISOString(),
      walletId: walletId ?? wallets[0]?.id ?? DEFAULT_WALLET_ID,
      ...(kind === "gastos"
        ? { category: tag ?? "other" }
        : tag
        ? { goalId: tag }
        : {}),
    };
    setEntries((prev) => [entry, ...prev]);
    setSelectedMonth(currentMonth);
  };

  const updateEntry = (id: string, patch: EntryPatch) => {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  };

  const deleteEntry = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const addGoal = (name: string, icon: string, target: number) => {
    const id = makeId();
    setGoals((prev) => [...prev, { id, name, icon, target }]);
    return id;
  };

  const updateGoal = (id: string, patch: GoalPatch) => {
    setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, ...patch } : g)));
  };

  const deleteGoal = (id: string) => {
    setGoals((prev) => (prev.length <= 1 ? prev : prev.filter((g) => g.id !== id)));
  };

  const goalSaved = (goalId: string) =>
    entries
      .filter((e) => e.kind === "ipon" && (e.goalId ?? DEFAULT_GOAL_ID) === goalId)
      .reduce((a, e) => a + e.amount, 0);

  const addWallet = (name: string, icon: string, start: number) => {
    const id = makeId();
    setWallets((prev) => [...prev, { id, name, icon, start }]);
  };

  const updateWallet = (id: string, patch: WalletPatch) => {
    setWallets((prev) => prev.map((w) => (w.id === id ? { ...w, ...patch } : w)));
  };

  const deleteWallet = (id: string) => {
    if (wallets.length <= 1) return;
    const fallback = wallets.find((w) => w.id !== id)!.id;
    setEntries((prev) =>
      prev.map((e) =>
        (e.walletId ?? DEFAULT_WALLET_ID) === id ? { ...e, walletId: fallback } : e
      )
    );
    setWallets((prev) => prev.filter((w) => w.id !== id));
  };

  const walletBalance = (walletId: string) => {
    const w = wallets.find((x) => x.id === walletId);
    const start = w?.start ?? 0;
    return entries
      .filter((e) => (e.walletId ?? DEFAULT_WALLET_ID) === walletId)
      .reduce((a, e) => a + (e.kind === "ipon" ? e.amount : -e.amount), start);
  };

  // ---- Utang ----
  const toDebt = (item: NewDebt): Debt => ({
    id: makeId(),
    person: item.person,
    amount: item.amount,
    paid: 0,
    direction: item.direction,
    note: item.note,
    date: new Date().toISOString(),
  });

  const addDebt = (item: NewDebt) => {
    setDebts((prev) => [toDebt(item), ...prev]);
  };

  const addDebts = (items: NewDebt[]) => {
    setDebts((prev) => [...items.map(toDebt), ...prev]);
  };

  const recordPayment = (id: string, amount: number) => {
    setDebts((prev) =>
      prev.map((d) =>
        d.id === id ? { ...d, paid: Math.min(d.amount, d.paid + amount) } : d
      )
    );
  };

  const deleteDebt = (id: string) => {
    setDebts((prev) => prev.filter((d) => d.id !== id));
  };

  // ---- Recurring ----
  const addRecurring = (item: NewRecurring) => {
    const now = new Date();
    const r: Recurring = {
      id: makeId(),
      ...item,
      nextDate: firstOccurrence(item.frequency, item.day, now).toISOString(),
      active: true,
    };
    const { created, updated } = runRecurring([r], now);
    setRecurring((prev) => [updated[0], ...prev]);
    if (created.length) setEntries((prev) => [...created, ...prev]);
  };

  const toggleRecurring = (id: string) => {
    const target = recurring.find((r) => r.id === id);
    if (!target) return;

    if (target.active) {
      setRecurring((prev) =>
        prev.map((r) => (r.id === id ? { ...r, active: false } : r))
      );
      return;
    }

    // resuming: skip everything missed while paused
    const now = new Date();
    const resumed: Recurring = {
      ...target,
      active: true,
      nextDate: firstOccurrence(target.frequency, target.day, now).toISOString(),
    };
    const { created, updated } = runRecurring([resumed], now);
    setRecurring((prev) => prev.map((r) => (r.id === id ? updated[0] : r)));
    if (created.length) setEntries((prev) => [...created, ...prev]);
  };

  const deleteRecurring = (id: string) => {
    setRecurring((prev) => prev.filter((r) => r.id !== id));
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
        updateEntry,
        deleteEntry,
        goals,
        addGoal,
        updateGoal,
        deleteGoal,
        goalSaved,
        wallets,
        addWallet,
        updateWallet,
        deleteWallet,
        walletBalance,
        debts,
        addDebt,
        addDebts,
        recordPayment,
        deleteDebt,
        recurring,
        addRecurring,
        toggleRecurring,
        deleteRecurring,
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