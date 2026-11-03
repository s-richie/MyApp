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
  sendResetCode: (email: string) => Promise<Result>;
  resetPassword: (
    email: string,
    code: string,
    password: string,
  ) => Promise<Result>;
  changePassword: (password: string) => Promise<Result>;
  deleteAccount: () => Promise<Result>;
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
  // keeps the sign in page on screen while a password reset finishes
  const [resetting, setResetting] = useState(false);

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

  // "local" = sign out of this phone only, not your other phones
  const signOut = async () => {
    await supabase.auth.signOut({ scope: "local" });
  };

  // Sends the code from the "Reset Password" email template
  const sendResetCode = async (email: string): Promise<Result> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    return error ? { error: error.message } : {};
  };

  const resetPassword = async (
    email: string,
    code: string,
    password: string,
  ): Promise<Result> => {
    setResetting(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: "recovery",
      });
      if (error) return { error: error.message };

      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });
      if (updateError) {
        // the code is used up, so go back to the sign in page
        await supabase.auth.signOut({ scope: "local" });
        return { error: "SET_PASSWORD_FAILED" };
      }
      return {};
    } finally {
      setResetting(false);
    }
  };

  const changePassword = async (password: string): Promise<Result> => {
    const { error } = await supabase.auth.updateUser({ password });
    return error ? { error: error.message } : {};
  };

  const deleteAccount = async (): Promise<Result> => {
    const { error } = await supabase.rpc("delete_my_account");
    if (error) return { error: error.message };
    await supabase.auth.signOut({ scope: "local" });
    return {};
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
        sendResetCode,
        resetPassword,
        changePassword,
        deleteAccount,
        openAuth: () => setOpen(true),
        showGate: resetting || (!session && (!skipped || open)),
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
  const {
    showGate,
    canCancel,
    skip,
    signIn,
    signUp,
    sendResetCode,
    resetPassword,
  } = useAuth();
  if (!showGate) return null;
  return (
    <AuthScreen
      onSignIn={signIn}
      onSignUp={signUp}
      onSendCode={sendResetCode}
      onReset={resetPassword}
      onSkip={skip}
      canCancel={canCancel}
    />
  );
}
