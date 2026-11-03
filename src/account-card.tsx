import { useState } from "react";
import { Alert, Pressable, View } from "react-native";
import { useTheme } from "./app-theme";
import { useAuth } from "./auth";
import { useI18n } from "./i18n";
import { useSync } from "./sync";
import { Button, Card, Field, IconCircle, Sheet, T } from "./ui";

export function AccountCard() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const { user, signOut, openAuth, changePassword, deleteAccount } = useAuth();
  const { status, lastSynced, syncNow } = useSync();

  const [pwOpen, setPwOpen] = useState(false);
  const [pw, setPw] = useState("");

  const confirmSignOut = () => {
    Alert.alert(t("Sign out?"), t("Your data stays on this phone."), [
      { text: t("Cancel"), style: "cancel" },
      { text: t("Sign out"), style: "destructive", onPress: () => signOut() },
    ]);
  };

  const savePassword = async () => {
    if (pw.length < 8) {
      Alert.alert(t("Password must be at least 8 characters."));
      return;
    }
    const r = await changePassword(pw);
    if (r.error) {
      Alert.alert(t("Could not change the password"), r.error);
    } else {
      setPwOpen(false);
      setPw("");
      Alert.alert(t("Password changed"));
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      t("Delete account?"),
      t(
        "This deletes your account and cloud backup. Data on this phone stays.",
      ),
      [
        { text: t("Cancel"), style: "cancel" },
        {
          text: t("Delete account"),
          style: "destructive",
          onPress: async () => {
            const r = await deleteAccount();
            if (r.error)
              Alert.alert(t("Could not delete the account"), r.error);
            else Alert.alert(t("Account deleted"));
          },
        },
      ],
    );
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
            label={t("Change password")}
            icon="key"
            outline
            color={colors.blue}
            onPress={() => setPwOpen(true)}
          />
          <Button
            label={t("Sign out")}
            icon="log-out"
            outline
            color={colors.red}
            onPress={confirmSignOut}
          />
          <Pressable
            onPress={confirmDelete}
            style={{ padding: 10, alignItems: "center" }}
          >
            <T color={colors.red} style={{ fontWeight: "600" }}>
              {t("Delete account")}
            </T>
          </Pressable>
        </>
      ) : (
        <Button label={t("Sign in")} icon="log-in" onPress={openAuth} />
      )}

      <Sheet
        visible={pwOpen}
        title={t("Change password")}
        onClose={() => {
          setPwOpen(false);
          setPw("");
        }}
        onSave={savePassword}
      >
        <Field
          placeholder={t("New password")}
          value={pw}
          onChangeText={setPw}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
        />
      </Sheet>
    </Card>
  );
}
