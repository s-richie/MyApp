import AsyncStorage from "@react-native-async-storage/async-storage";
import {
    createContext,
    ReactNode,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { Alert, AppState } from "react-native";
import { Snapshot, useData } from "./app-data";
import { useAuth } from "./auth";
import { useI18n } from "./i18n";
import { supabase } from "./supabase";

const META_KEY = "iponbot:sync-meta:v1";

type Meta = { userId: string; serverUpdatedAt: string; hash: string };
type Status =
  | "off"
  | "idle"
  | "syncing"
  | "synced"
  | "offline"
  | "error"
  | "paused";
type Row = { data: any; updated_at: string };

type SyncContextType = {
  status: Status;
  lastSynced: number | null;
  syncNow: () => void;
};

const SyncContext = createContext<SyncContextType>({
  status: "off",
  lastSynced: null,
  syncNow: () => {},
});

export const useSync = () => useContext(SyncContext);

// ---------- helpers ----------

// Same text no matter the key order (the database does not keep key order)
function stable(v: any): string {
  if (v === null || typeof v !== "object") return JSON.stringify(v) ?? "null";
  if (Array.isArray(v)) return "[" + v.map(stable).join(",") + "]";
  const keys = Object.keys(v)
    .filter((k) => v[k] !== undefined)
    .sort();
  return (
    "{" +
    keys.map((k) => JSON.stringify(k) + ":" + stable(v[k])).join(",") +
    "}"
  );
}

function hashOf(v: any): string {
  const s = stable(v);
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  }
  return `${s.length}:${h}`;
}

function normalize(d: any, fallback: Snapshot): Snapshot {
  const nonEmpty = (v: any, fb: any[]) =>
    Array.isArray(v) && v.length > 0 ? v : fb;
  return {
    entries: Array.isArray(d?.entries) ? d.entries : [],
    goals: nonEmpty(d?.goals, fallback.goals),
    wallets: nonEmpty(d?.wallets, fallback.wallets),
    debts: Array.isArray(d?.debts) ? d.debts : [],
    recurring: Array.isArray(d?.recurring) ? d.recurring : [],
    budget: typeof d?.budget === "string" ? d.budget : "0",
  };
}

// A fresh install with nothing added yet
const isPristine = (s: Snapshot) =>
  s.entries.length === 0 &&
  s.debts.length === 0 &&
  s.recurring.length === 0 &&
  s.budget === "0";

const isNetworkError = (e: any) =>
  /network|fetch|time(d)? ?out|offline|internet/i.test(String(e?.message ?? e));

// ---------- provider ----------

export function SyncProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { t } = useI18n();
  const { entries, goals, wallets, debts, recurring, budget, replaceAll } =
    useData();

  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState<Status>("off");
  const [lastSynced, setLastSynced] = useState<number | null>(null);

  const metaRef = useRef<Meta | null>(null);
  const busy = useRef(false);
  const paused = useRef(false);
  const conflictOpen = useRef(false);
  const runSyncRef = useRef<() => void>(() => {});

  const snapshot = useMemo<Snapshot>(
    () => ({ entries, goals, wallets, debts, recurring, budget }),
    [entries, goals, wallets, debts, recurring, budget],
  );
  const hashNow = useMemo(() => hashOf(snapshot), [snapshot]);
  const snapshotRef = useRef(snapshot);
  snapshotRef.current = snapshot;

  // load what we remember about the last sync
  useEffect(() => {
    AsyncStorage.getItem(META_KEY)
      .then((raw) => {
        if (raw) {
          try {
            metaRef.current = JSON.parse(raw);
          } catch {}
        }
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const saveMeta = async (m: Meta) => {
    metaRef.current = m;
    setLastSynced(Date.now());
    await AsyncStorage.setItem(META_KEY, JSON.stringify(m)).catch(() => {});
  };

  const fail = (e: unknown) => {
    console.warn("Sync problem", e);
    setStatus(isNetworkError(e) ? "offline" : "error");
  };

  const guarded = async (fn: () => Promise<void>) => {
    busy.current = true;
    setStatus("syncing");
    try {
      await fn();
    } catch (e) {
      fail(e);
    } finally {
      busy.current = false;
    }
  };

  const fetchRow = async (uid: string): Promise<Row | null> => {
    const { data: row, error } = await supabase
      .from("user_data")
      .select("data, updated_at")
      .eq("user_id", uid)
      .maybeSingle();
    if (error) throw error;
    return (row as Row) ?? null;
  };

  // cloud -> phone
  const download = async (uid: string, row: Row) => {
    const normalized = normalize(row.data, snapshotRef.current);
    replaceAll(normalized);
    await saveMeta({
      userId: uid,
      serverUpdatedAt: row.updated_at,
      hash: hashOf(normalized),
    });
    setStatus("synced");
  };

  // phone -> cloud, replacing whatever is there
  const forceUpload = async (uid: string, snap: Snapshot) => {
    const { data: res, error } = await supabase
      .from("user_data")
      .upsert(
        { user_id: uid, data: snap, updated_at: new Date().toISOString() },
        { onConflict: "user_id" },
      )
      .select("updated_at")
      .single();
    if (error) throw error;
    await saveMeta({
      userId: uid,
      serverUpdatedAt: res.updated_at,
      hash: hashOf(snap),
    });
    setStatus("synced");
  };

  // phone -> cloud, only if the cloud did not change meanwhile. false = it changed.
  const upload = async (
    uid: string,
    snap: Snapshot,
    expected: string | null,
  ) => {
    const payload = { data: snap, updated_at: new Date().toISOString() };

    if (expected === null) {
      const { data: res, error } = await supabase
        .from("user_data")
        .insert({ user_id: uid, ...payload })
        .select("updated_at")
        .single();
      if (error) {
        if ((error as any).code === "23505") return false; // row appeared meanwhile
        throw error;
      }
      await saveMeta({
        userId: uid,
        serverUpdatedAt: res.updated_at,
        hash: hashOf(snap),
      });
      setStatus("synced");
      return true;
    }

    const { data: res, error } = await supabase
      .from("user_data")
      .update(payload)
      .eq("user_id", uid)
      .eq("updated_at", expected)
      .select("updated_at");
    if (error) throw error;
    if (!res || res.length === 0) return false;
    await saveMeta({
      userId: uid,
      serverUpdatedAt: res[0].updated_at,
      hash: hashOf(snap),
    });
    setStatus("synced");
    return true;
  };

  const askConflict = (uid: string, row: Row) => {
    conflictOpen.current = true;
    setStatus("paused");

    const cloudCount = Array.isArray(row.data?.entries)
      ? row.data.entries.length
      : 0;
    const localCount = snapshotRef.current.entries.length;

    Alert.alert(
      t("Which data do you want to keep?"),
      `${t("Cloud: {c} entries. This phone: {l} entries.", {
        c: cloudCount,
        l: localCount,
      })}\n${t("The other one will be replaced.")}`,
      [
        {
          text: t("Use cloud data"),
          onPress: () => {
            conflictOpen.current = false;
            guarded(() => download(uid, row));
          },
        },
        {
          text: t("Use this phone"),
          onPress: () => {
            conflictOpen.current = false;
            const snap = snapshotRef.current;
            guarded(() => forceUpload(uid, snap));
          },
        },
        {
          text: t("Not now"),
          style: "cancel",
          onPress: () => {
            conflictOpen.current = false;
            paused.current = true;
          },
        },
      ],
      { cancelable: false },
    );
  };

  const runSync = async () => {
    if (
      !ready ||
      !user ||
      busy.current ||
      conflictOpen.current ||
      paused.current
    )
      return;
    const uid = user.id;
    busy.current = true;
    setStatus("syncing");

    try {
      const snap = snapshotRef.current;
      const localHash = hashOf(snap);
      const meta =
        metaRef.current && metaRef.current.userId === uid
          ? metaRef.current
          : null;

      const row = await fetchRow(uid);

      if (!row) {
        // nothing in the cloud yet
        const ok = await upload(uid, snap, null);
        if (!ok) {
          const fresh = await fetchRow(uid);
          if (fresh) askConflict(uid, fresh);
        }
      } else if (!meta) {
        // first time this account is used on this phone
        if (isPristine(snap)) await download(uid, row);
        else askConflict(uid, row);
      } else if (row.updated_at === meta.serverUpdatedAt) {
        // cloud has not changed since our last sync
        if (localHash !== meta.hash) {
          const ok = await upload(uid, snap, row.updated_at);
          if (!ok) {
            const fresh = await fetchRow(uid);
            if (fresh) askConflict(uid, fresh);
          }
        } else {
          setStatus("synced");
          setLastSynced(Date.now());
        }
      } else if (localHash === meta.hash) {
        // changed on another phone, nothing new here
        await download(uid, row);
      } else {
        // changed in both places
        askConflict(uid, row);
      }
    } catch (e) {
      fail(e);
    } finally {
      busy.current = false;
    }
  };
  runSyncRef.current = runSync;

  const syncNow = () => {
    paused.current = false;
    runSyncRef.current();
  };

  // sync when signing in (and once the saved info is loaded)
  useEffect(() => {
    if (!user) {
      setStatus("off");
      return;
    }
    if (!ready) {
      setStatus("idle");
      return;
    }
    paused.current = false;
    runSyncRef.current();
  }, [ready, user?.id]);

  // upload a few seconds after the data changes
  useEffect(() => {
    if (!ready || !user) return;
    const m = metaRef.current;
    if (m && m.userId === user.id && m.hash === hashNow) return;
    const timer = setTimeout(() => runSyncRef.current(), 3000);
    return () => clearTimeout(timer);
  }, [hashNow, ready, user?.id]);

  // check again whenever the app is opened
  useEffect(() => {
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active") runSyncRef.current();
    });
    return () => sub.remove();
  }, []);

  // retry every minute while offline or after an error
  useEffect(() => {
    if (!user || (status !== "offline" && status !== "error")) return;
    const id = setInterval(() => runSyncRef.current(), 60000);
    return () => clearInterval(id);
  }, [status, user?.id]);

  return (
    <SyncContext.Provider value={{ status, lastSynced, syncNow }}>
      {children}
    </SyncContext.Provider>
  );
}
