import * as Updates from "expo-updates";
import { useEffect, useRef } from "react";
import { Alert } from "react-native";

export function UpdateChecker() {
  const checked = useRef(false);

  useEffect(() => {
    if (checked.current || !Updates.isEnabled) return;
    checked.current = true;

    (async () => {
      try {
        const result = await Updates.checkForUpdateAsync();
        if (!result.isAvailable) return;

        Alert.alert(
          "Update available",
          "A new version of MoneyMate is ready. Update now for the latest fixes and features.",
          [
            { text: "Later", style: "cancel" },
            {
              text: "Update now",
              onPress: async () => {
                try {
                  await Updates.fetchUpdateAsync();
                  await Updates.reloadAsync();
                } catch (error) {
                  console.warn("Could not install the update", error);
                  Alert.alert(
                    "Update failed",
                    "Please try again when you have a stable internet connection.",
                  );
                }
              },
            },
          ],
        );
      } catch (error) {
        // Update checks are optional; the app should continue working offline.
        console.warn("Could not check for an update", error);
      }
    })();
  }, []);

  return null;
}
