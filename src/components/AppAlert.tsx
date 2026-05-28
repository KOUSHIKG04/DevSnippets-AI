import {
  createContext,
  PropsWithChildren,
  useContext,
  useMemo,
  useState,
} from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { fontStyles } from "../fontDefaults";
import { useAppTheme } from "../theme";

type AlertAction = {
  label: string;
  onPress?: () => void;
  variant?: "default" | "destructive" | "cancel";
};

type AlertState = {
  title: string;
  message?: string;
  actions: AlertAction[];
};

type AppAlertContextValue = {
  showAlert: (
    title: string,
    message?: string,
    actions?: AlertAction[],
  ) => void;
};

const AppAlertContext = createContext<AppAlertContextValue | null>(null);

export function AppAlertProvider({ children }: PropsWithChildren) {
  const [alertState, setAlertState] = useState<AlertState | null>(null);
  const { colors } = useAppTheme();

  const value = useMemo<AppAlertContextValue>(
    () => ({
      showAlert: (title, message, actions) => {
        setAlertState({
          title,
          message,
          actions: actions?.length ? actions : [{ label: "OK" }],
        });
      },
    }),
    [],
  );

  function handleActionPress(action: AlertAction) {
    setAlertState(null);
    action.onPress?.();
  }

  return (
    <AppAlertContext.Provider value={value}>
      {children}

      <Modal transparent animationType="fade" visible={Boolean(alertState)}>
        <View style={styles.backdrop}>
          <View
            style={[
              styles.dialog,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.title, { color: colors.foreground }]}>
              {alertState?.title}
            </Text>

            {alertState?.message ? (
              <Text
                style={[styles.message, { color: colors.mutedForeground }]}
              >
                {alertState.message}
              </Text>
            ) : null}

            <View style={styles.actions}>
              {alertState?.actions.map((action) => {
                const isDestructive = action.variant === "destructive";
                const isCancel = action.variant === "cancel";

                return (
                  <Pressable
                    key={action.label}
                    style={[
                      styles.actionButton,
                      {
                        backgroundColor: isDestructive
                          ? colors.destructive
                          : isCancel
                            ? colors.secondary
                            : colors.primary,
                      },
                    ]}
                    onPress={() => handleActionPress(action)}
                  >
                    <Text
                      style={[
                        styles.actionText,
                        {
                          color: isDestructive
                            ? colors.destructiveForeground
                            : isCancel
                              ? colors.foreground
                              : colors.primaryForeground,
                        },
                      ]}
                    >
                      {action.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </AppAlertContext.Provider>
  );
}

export function useAppAlert() {
  const value = useContext(AppAlertContext);

  if (!value) {
    throw new Error("useAppAlert must be used inside AppAlertProvider");
  }

  return value;
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  dialog: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 8,
    borderWidth: 1,
    padding: 18,
  },
  title: {
    ...fontStyles.extraBold,
    fontSize: 18,
  },
  message: {
    ...fontStyles.regular,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
  },
  actionButton: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  actionText: {
    ...fontStyles.extraBold,
    fontSize: 14,
  },
});
