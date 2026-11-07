import { categoryOf, Entry, incomeSourceOf } from "./app-data";
import { IconName, safeIcon } from "./ui";

// Icon and text for an entry: money in (income) or gastos
export function moneyIcon(e: Entry): IconName {
  return e.kind === "gastos"
    ? safeIcon(categoryOf(e.category).icon, "apps")
    : safeIcon(incomeSourceOf(e.category).icon, "cash");
}

export function moneyLabel(e: Entry, t: (s: string) => string): string {
  return e.kind === "gastos"
    ? t(categoryOf(e.category).label)
    : t(incomeSourceOf(e.category).label);
}

export function moneyTitle(e: Entry, t: (s: string) => string): string {
  return e.note || moneyLabel(e, t);
}
