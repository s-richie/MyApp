import { Alert, View } from "react-native";
import { useTheme } from "./app-theme";
import { useAuth } from "./auth";
import { useI18n } from "./i18n";
import { useSync } from "./sync";
import { Button, Card, IconCircle, T } from "./ui";

export function AccountCard() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const { user, signOut, openAuth } = useAuth();
  const { status, lastSynced, syncNow } = useSync();

  const confirmSignOut = () => {
    Alert.alert(t("Sign out?"), t("Your data stays on this phone."), [
      { text: t("Cancel"), style: "cancel" },
      { text: t("Sign out"), style: "destructive", onPress: () => signOut() },
    ]);
  };

  const time = lastSynced
    ? new Date(lastSynced).toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      })
    : "";

  const statusText = !user
    ? t("Your data stays on this phone.")
    : status === "syncing"
      ? t("Syncing...")
      : status === "synced"
        ? t("Synced at {time}", { time })
        : status === "offline"
          ? t("Waiting for internet")
          : status === "error"
            ? t("Sync failed. Tap Sync now.")
            : status === "paused"
              ? t("Sync paused")
              : t("Signed in");

  const statusColor =
    status === "error"
      ? colors.red
      : status === "synced"
        ? colors.green
        : colors.subtext;

  return (
    <Card>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <IconCircle
          name={user ? "person-circle" : "person-circle-outline"}
          size={44}
          color={colors.blue}
        />
        <View style={{ flex: 1 }}>
          <T kind="title" numberOfLines={1}>
            {user ? (user.email ?? t("Account")) : t("Account")}
          </T>
          <T kind="muted" color={user ? statusColor : undefined}>
            {statusText}
          </T>
        </View>
      </View>

      {user ? (
        <>
          <Button
            label={t("Sync now")}
            icon="sync"
            outline
            color={colors.blue}
            onPress={syncNow}
          />
          <Button
            label={t("Sign out")}
            icon="log-out"
            outline
            color={colors.red}
            onPress={confirmSignOut}
          />
        </>
      ) : (
        <Button label={t("Sign in")} icon="log-in" onPress={openAuth} />
      )}
    </Card>
  );
}
