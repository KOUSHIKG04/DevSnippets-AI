import Ionicons from "@expo/vector-icons/Ionicons";
import { StyleSheet, TextInput, View } from "react-native";
import { fontStyles } from "../fontDefaults";
import { useAppTheme } from "../theme";

type HomeSearchFieldProps = {
  value: string;
  onChangeText: (value: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
};

export function HomeSearchField({
  value,
  onBlur,
  onChangeText,
  onFocus,
}: HomeSearchFieldProps) {
  const { colors } = useAppTheme();

  return (
    <View
      style={[
        styles.searchField,
        {
          backgroundColor: colors.card,
          borderColor: colors.input,
        },
      ]}
    >
      <Ionicons name="search" size={18} color={colors.mutedForeground} />
      <TextInput
        value={value}
        onBlur={onBlur}
        onChangeText={onChangeText}
        onFocus={onFocus}
        placeholder="Search snippets, code, or language"
        placeholderTextColor={colors.mutedForeground}
        style={[styles.searchInput, { color: colors.foreground }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  searchField: {
    height: 50,
    borderRadius: 8,
    marginTop: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  searchInput: {
    ...fontStyles.regular,
    flex: 1,
    height: "100%",
    padding: 0,
    fontSize: 15,
  },
});
