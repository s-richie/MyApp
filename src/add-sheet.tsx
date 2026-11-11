import { useEffect, useState } from "react";
import { CATEGORIES, INCOME_SOURCES, useData } from "./app-data";
import { useTheme } from "./app-theme";
import { useI18n } from "./i18n";
import { Chip, Chips, Field, Sheet, T, safeIcon } from "./ui";
import { WalletPicker } from "./wallet-picker";

export type AddMode = "in" | "out";

// One pop-up for adding money or an expense, right from the Home screen
export function AddSheet({
  mode,
  onClose,
}: {
  mode: AddMode | null;
  onClose: () => void;
}) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const { addEntry, wallets } = useData();

  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [tag, setTag] = useState("");
  const [walletId, setWalletId] = useState("");

  const isIn = mode === "in";
  const options = isIn ? INCOME_SOURCES : CATEGORIES;
  const activeWallet =
    wallets.find((w) => w.id === walletId)?.id ?? wallets[0].id;

  // start fresh every time it opens
  useEffect(() => {
    if (mode) {
      setAmount("");
      setNote("");
      setTag(mode === "in" ? "allowance" : "food");
    }
  }, [mode]);

  const save = () => {
    const value = Number(amount);
    if (!value || value <= 0 || !mode) return;
    addEntry(isIn ? "ipon" : "gastos", value, note.trim(), tag, activeWallet);
    onClose();
  };

  const label = isIn ? t("Add money") : t("Add expense");

  return (
    <Sheet
      visible={mode !== null}
      title={label}
      saveLabel={label}
      onClose={onClose}
      onSave={save}
    >
      <Field
        placeholder="₱ 0"
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
        autoFocus
        style={{
          fontSize: 28,
          fontWeight: "800",
          textAlign: "center",
          paddingVertical: 16,
        }}
      />

      <T kind="label" style={{ marginTop: 6 }}>
        {isIn ? t("Where is it from?") : t("What is it for?")}
      </T>
      <Chips>
        {options.map((o) => (
          <Chip
            key={o.key}
            label={t(o.label)}
            icon={safeIcon(o.icon, "apps")}
            active={tag === o.key}
            color={isIn ? colors.green : colors.red}
            onPress={() => setTag(o.key)}
          />
        ))}
      </Chips>

      <WalletPicker value={activeWallet} onChange={setWalletId} />

      <Field
        placeholder={t("Note (optional)")}
        value={note}
        onChangeText={setNote}
      />
    </Sheet>
  );
}
