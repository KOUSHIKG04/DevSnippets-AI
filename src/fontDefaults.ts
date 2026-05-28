import { Text, TextInput } from "react-native";

export const fontFamilies = {
  regular: "GeistMono_400Regular",
  semiBold: "GeistMono_600SemiBold",
  bold: "GeistMono_700Bold",
  extraBold: "GeistMono_800ExtraBold",
} as const;

export const fontStyles = {
  regular: {
    fontFamily: fontFamilies.regular,
  },
  semiBold: {
    fontFamily: fontFamilies.semiBold,
  },
  bold: {
    fontFamily: fontFamilies.bold,
  },
  extraBold: {
    fontFamily: fontFamilies.extraBold,
  },
} as const;


let isConfigured = false;
type ComponentWithDefaultProps = {
  defaultProps?: {
    style?: unknown;
  };
};

export function configureDefaultFonts() {
  if (isConfigured) {
    return;
  }

  const TextComponent = Text as ComponentWithDefaultProps;
  const TextInputComponent = TextInput as ComponentWithDefaultProps;

  TextComponent.defaultProps = TextComponent.defaultProps ?? {};
  TextComponent.defaultProps.style = [
    fontStyles.regular,
    TextComponent.defaultProps.style,
  ];

  TextInputComponent.defaultProps = TextInputComponent.defaultProps ?? {};
  TextInputComponent.defaultProps.style = [
    fontStyles.regular,
    TextInputComponent.defaultProps.style,
  ];

  isConfigured = true;
}
