import { View } from "react-native";
import { useData } from "./app-data";
import { useI18n } from "./i18n";
import { T, Chip, Chips, iconOf } from "./ui";

export function WalletPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  const { wallets } = useData();
  const { t } = useI18n();

  return (
    <View>
      <T kind="label">{t("Wallet")}</T>
      <Chips>
        {wallets.map((w) => (
          <Chip
            key={w.id}
            label={w.name}
            icon={iconOf(w, "wallet")}
            active={value === w.id}
            onPress={() => onChange(w.id)}
          />
        ))}
      </Chips>
    </View>
  );
}