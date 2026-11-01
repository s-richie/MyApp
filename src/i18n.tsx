import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import fil1 from "./fil-1";
import fil2 from "./fil-2";
import fil3 from "./fil-3";
import fil4 from "./fil-4";
import fil5 from "./fil-5";
import fil6 from "./fil-6";

export type Lang = "en" | "fil";

const KEY = "iponbot:lang";
const FIL: Record<string, string> = {
  ...fil1,
  ...fil2,
  ...fil3,
  ...fil4,
  ...fil5,
  ...fil6,
};

const MONTHS_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const MONTHS_FIL = [
  "Enero", "Pebrero", "Marso", "Abril", "Mayo", "Hunyo",
  "Hulyo", "Agosto", "Setyembre", "Oktubre", "Nobyembre", "Disyembre",
];
const SHORT_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const SHORT_FIL = ["Ene", "Peb", "Mar", "Abr", "May", "Hun", "Hul", "Ago", "Set", "Okt", "Nob", "Dis"];
const DAYS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAYS_FIL = ["Lin", "Lun", "Mar", "Miy", "Huw", "Biy", "Sab"];

type Vars = Record<string, string | number>;

const fill = (text: string, vars?: Vars) =>
  vars
    ? text.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m))
    : text;

type I18nContextType = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (text: string, vars?: Vars) => string;
  fdate: (iso: string, withYear?: boolean) => string;
  dayShort: (index: number) => string;
  localizeMonth: (label: string) => string;
};

const I18nContext = createContext<I18nContextType>({
  lang: "en",
  setLang: () => {},
  t: (text, vars) => fill(text, vars),
  fdate: (iso) => iso,
  dayShort: (i) => DAYS_EN[i],
  localizeMonth: (label) => label,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((v) => {
        if (v === "fil" || v === "en") setLangState(v);
      })
      .catch(() => {});
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    AsyncStorage.setItem(KEY, l).catch(() => {});
  };

  const t = (text: string, vars?: Vars) =>
    fill(lang === "fil" ? FIL[text] ?? text : text, vars);

  const fdate = (iso: string, withYear = false) => {
    const d = new Date(iso);
    const names = lang === "fil" ? SHORT_FIL : SHORT_EN;
    return `${names[d.getMonth()]} ${d.getDate()}${
      withYear ? `, ${d.getFullYear()}` : ""
    }`;
  };

  const dayShort = (index: number) =>
    (lang === "fil" ? DAYS_FIL : DAYS_EN)[index];

  // "October 2026" -> "Oktubre 2026"
  const localizeMonth = (label: string) => {
    if (lang === "en") return label;
    const [name, ...rest] = label.split(" ");
    const i = MONTHS_EN.indexOf(name);
    return i < 0 ? label : `${MONTHS_FIL[i]} ${rest.join(" ")}`;
  };

  return (
    <I18nContext.Provider value={{ lang, setLang, t, fdate, dayShort, localizeMonth }}>
      {children}
    </I18nContext.Provider>
  );
}

export const useI18n = () => useContext(I18nContext);