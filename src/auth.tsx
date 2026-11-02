import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Session, User } from "@supabase/supabase-js";
import {
    createContext,
    ReactNode,
    useContext,
    useEffect,
    useState,
} from "react";
import { AppState } from "react-native";
import { AuthScreen } from "./auth-screen";
import { supabase } from "./supabase";

const SKIP_KEY = "iponbot:auth-skip:v1";

type Result = { error?: string; needsConfirm?: boolean };

type AuthContextType = {
  user: User | null;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<Result>;
  signUp: (email: string, password: string) => Promise<Result>;
  signOut: () => Promise<void>;
  openAuth: () => void;
  // used by <AuthGate />
  showGate: boolean;
  canCancel: boolean;
  skip: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loaded, setLoaded] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [skipped, setSkipped] = useState(false);
  const [open, setOpen] = useState(false);

  // Load the saved session and the "continue without account" choice
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const [{ data }, skip] = await Promise.all([
          supabase.auth.getSession(),
          AsyncStorage.getItem(SKIP_KEY),
        ]);
        if (!mounted) return;
        setSession(data.session ?? null);
        setSkipped(skip === "1");
      } catch (e) {
        console.warn("Could not load the session", e);
      } finally {
        if (mounted) setLoaded(true);
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s) setOpen(false);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // Refresh the login only while the app is open
  useEffect(() => {
    supabase.auth.startAutoRefresh();
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") supabase.auth.startAutoRefresh();
      else supabase.auth.stopAutoRefresh();
    });
    return () => {
      sub.remove();
      supabase.auth.stopAutoRefresh();
    };
  }, []);

  const signIn = async (email: string, password: string): Promise<Result> => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return error ? { error: error.message } : {};
  };

  const signUp = async (email: string, password: string): Promise<Result> => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message };
    return { needsConfirm: !data.session };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const skip = () => {
    setSkipped(true);
    setOpen(false);
    AsyncStorage.setItem(SKIP_KEY, "1").catch(() => {});
  };

  if (!loaded) return null;

  return (
    <AuthContext.Provider
      value={{
        user: session?.user ?? null,
        session,
        signIn,
        signUp,
        signOut,
        openAuth: () => setOpen(true),
        showGate: !session && (!skipped || open),
        canCancel: open,
        skip,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// The full-screen sign in / sign up page
export function AuthGate() {
  const { showGate, canCancel, skip, signIn, signUp } = useAuth();
  if (!showGate) return null;
  return (
    <AuthScreen
      onSignIn={signIn}
      onSignUp={signUp}
      onSkip={skip}
      canCancel={canCancel}
    />
  );
}
