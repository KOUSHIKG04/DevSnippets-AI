import { Text, type StyleProp, type TextStyle } from "react-native";
import { useAppTheme } from "../theme";

type TokenType =
  | "plain"
  | "comment"
  | "keyword"
  | "string"
  | "number"
  | "function";

type Token = {
  value: string;
  type: TokenType;
};

type SyntaxHighlightedCodeProps = {
  code: string;
  numberOfLines?: number;
  selectable?: boolean;
  style?: StyleProp<TextStyle>;
};

const keywordPattern =
  /^(?:const|let|var|function|return|if|else|for|while|do|async|await|try|catch|finally|throw|new|class|extends|import|from|export|default|switch|case|break|continue|typeof|instanceof|true|false|null|undefined)\b/;

const tokenPatterns: [TokenType, RegExp][] = [
  ["comment", /^(?:\/\/[^\n]*|\/\*[\s\S]*?\*\/)/],
  ["string", /^(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\[\s\S]|[^`\\])*`)/],
  ["number", /^\b\d+(?:\.\d+)?\b/],
  ["keyword", keywordPattern],
  ["function", /^[A-Za-z_$][\w$]*(?=\s*\()/],
];

function tokenize(code: string) {
  const tokens: Token[] = [];
  let remaining = code;

  while (remaining.length > 0) {
    const match = tokenPatterns
      .map(([type, pattern]) => ({ type, match: remaining.match(pattern) }))
      .find((result) => result.match?.[0]);

    if (match?.match?.[0]) {
      tokens.push({ type: match.type, value: match.match[0] });
      remaining = remaining.slice(match.match[0].length);
      continue;
    }

    tokens.push({ type: "plain", value: remaining[0] });
    remaining = remaining.slice(1);
  }

  return tokens;
}

export function SyntaxHighlightedCode({
  code,
  numberOfLines,
  selectable,
  style,
}: SyntaxHighlightedCodeProps) {
  const { colors } = useAppTheme();

  const tokenColors: Record<TokenType, string> = {
    plain: colors.codeForeground,
    comment: colors.syntaxComment,
    keyword: colors.syntaxKeyword,
    string: colors.syntaxString,
    number: colors.syntaxNumber,
    function: colors.syntaxFunction,
  };

  return (
    <Text selectable={selectable} numberOfLines={numberOfLines} style={style}>
      {tokenize(code).map((token, index) => (
        <Text
          key={`${index}-${token.value}`}
          style={{ color: tokenColors[token.type] }}
        >
          {token.value}
        </Text>
      ))}
    </Text>
  );
}
