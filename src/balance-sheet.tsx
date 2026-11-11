import { useEffect, useState } from "react";
import { useData } from "./app-data";
import { useTheme } from "./app-theme";
import { useI18n } from "./i18n";
import { Field, Sheet, T, peso } from "./ui";

// Type the balance you see in your real app (GCash, Maya, bank...)
export function BalanceSheet({
  walletId,
  onClose,
}: {
  walletId: string | null;
  onClose: () => void;
}) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const { wallets, walletBalance, setWalletBalance } = useData();

  const wallet = wallets.find((w) => w.id === walletId) ?? null;
  const current = wallet ? walletBalance(wallet.id) : 0;

  const [value, setValue] = useState("");

  // start with the balance the app has now
  useEffect(() => {
    if (wallet) setValue(String(Math.round(current * 100) / 100));
  }, [walletId]);

  const typed = Number(value === "" ? "0" : value);
  const diff = isNaN(typed) ? 0 : typed - current;

  const save = () => {
    if (!wallet || isNaN(typed)) return;
    setWalletBalance(wallet.id, typed);
    onClose();
  };

  return (
    <Sheet
      visible={wallet !== null}
      title={wallet ? t("Update {name} balance", { name: wallet.name }) : ""}
      saveLabel={t("Save balance")}
      onClose={onClose}
      onSave={save}
    >
      <T kind="muted">
        {t("Open your {name} app and type the balance you see.", {
          name: wallet?.name ?? "",
        })}
      </T>
      <Field
        value={value}
        onChangeText={setValue}
        keyboardType="numeric"
        autoFocus
        selectTextOnFocus
        style={{
          fontSize: 28,
          fontWeight: "800",
          textAlign: "center",
          paddingVertical: 16,
        }}
      />
      {wallet && Math.abs(diff) >= 0.005 ? (
        <T kind="muted" color={diff > 0 ? colors.green : colors.red}>
          {t("Difference: {n}", {
            n: `${diff > 0 ? "+" : "-"}${peso(Math.abs(diff))}`,
          })}
        </T>
      ) : null}
    </Sheet>
  );
}
