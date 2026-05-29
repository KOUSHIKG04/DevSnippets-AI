import { StyleSheet, Text, View } from "react-native";
import { fontStyles } from "../fontDefaults";

type AiFormattedTextProps = {
  text: string;
  colors: {
    border: string;
    card: string;
    code: string;
    codeAccent: string;
    foreground: string;
    mutedForeground: string;
  };
  monoFontFamily: string;
};

type Block =
  | { id: string; type: "blank" }
  | { id: string; text: string; type: "heading" }
  | { id: string; text: string; type: "paragraph" }
  | { id: string; text: string; type: "bullet" }
  | { id: string; marker: string; text: string; type: "numbered" }
  | { code: string; id: string; type: "code" };

export function AiFormattedText({
  text,
  colors,
  monoFontFamily,
}: AiFormattedTextProps) {
  const blocks = parseBlocks(text);

  return (
    <View style={styles.container}>
      {blocks.map((block) => {
        if (block.type === "blank") {
          return <View key={block.id} style={styles.blank} />;
        }

        if (block.type === "heading") {
          return (
            <Text
              key={block.id}
              style={[styles.heading, { color: colors.foreground }]}
            >
              {renderInline(block.text, colors, monoFontFamily)}
            </Text>
          );
        }

        if (block.type === "bullet") {
          return (
            <View key={block.id} style={styles.listRow}>
              <Text style={[styles.marker, { color: colors.codeAccent }]}>
                {"\u2022"}
              </Text>
              <Text style={[styles.body, styles.listText, { color: colors.foreground }]}>
                {renderInline(block.text, colors, monoFontFamily)}
              </Text>
            </View>
          );
        }

        if (block.type === "numbered") {
          return (
            <View key={block.id} style={styles.listRow}>
              <Text style={[styles.numberMarker, { color: colors.codeAccent }]}>
                {block.marker}
              </Text>
              <Text style={[styles.body, styles.listText, { color: colors.foreground }]}>
                {renderInline(block.text, colors, monoFontFamily)}
              </Text>
            </View>
          );
        }

        if (block.type === "code") {
          return (
            <View
              key={block.id}
              style={[
                styles.codeBlock,
                { backgroundColor: colors.code, borderColor: colors.border },
              ]}
            >
              <Text
                selectable
                style={[
                  styles.codeText,
                  { color: colors.foreground, fontFamily: monoFontFamily },
                ]}
              >
                {block.code}
              </Text>
            </View>
          );
        }

        return (
          <Text
            key={block.id}
            style={[styles.body, { color: colors.foreground }]}
          >
            {renderInline(block.text, colors, monoFontFamily)}
          </Text>
        );
      })}
    </View>
  );
}

function parseBlocks(text: string) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let codeLines: string[] = [];
  let isInCodeBlock = false;

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (trimmed.startsWith("```")) {
      if (isInCodeBlock) {
        blocks.push({
          code: codeLines.join("\n").trimEnd(),
          id: `code-${index}`,
          type: "code",
        });
        codeLines = [];
        isInCodeBlock = false;
      } else {
        isInCodeBlock = true;
      }
      return;
    }

    if (isInCodeBlock) {
      codeLines.push(line);
      return;
    }

    if (!trimmed) {
      blocks.push({ id: `blank-${index}`, type: "blank" });
      return;
    }

    const headingMatch = trimmed.match(/^#{1,6}\s+(.+)$/);
    if (headingMatch) {
      blocks.push({
        id: `heading-${index}`,
        text: headingMatch[1],
        type: "heading",
      });
      return;
    }

    const bulletMatch = trimmed.match(/^[-*]\s+(.+)$/);
    if (bulletMatch) {
      blocks.push({
        id: `bullet-${index}`,
        text: bulletMatch[1],
        type: "bullet",
      });
      return;
    }

    const numberedMatch = trimmed.match(/^(\d+\.)\s+(.+)$/);
    if (numberedMatch) {
      blocks.push({
        id: `numbered-${index}`,
        marker: numberedMatch[1],
        text: numberedMatch[2],
        type: "numbered",
      });
      return;
    }

    blocks.push({ id: `paragraph-${index}`, text: trimmed, type: "paragraph" });
  });

  if (codeLines.length > 0) {
    blocks.push({
      code: codeLines.join("\n").trimEnd(),
      id: "code-last",
      type: "code",
    });
  }

  return blocks.filter((block, index, allBlocks) => {
    if (block.type !== "blank") {
      return true;
    }

    return allBlocks[index - 1]?.type !== "blank" && index !== allBlocks.length - 1;
  });
}

function renderInline(
  text: string,
  colors: AiFormattedTextProps["colors"],
  monoFontFamily: string,
) {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).filter(Boolean);

  return parts.map((part, index) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <Text
          key={`${part}-${index}`}
          style={[
            styles.inlineCode,
            {
              backgroundColor: colors.card,
              color: colors.codeAccent,
              fontFamily: monoFontFamily,
            },
          ]}
        >
          {part.slice(1, -1)}
        </Text>
      );
    }

    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <Text key={`${part}-${index}`} style={styles.bold}>
          {part.slice(2, -2)}
        </Text>
      );
    }

    return part;
  });
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  body: {
    ...fontStyles.regular,
    fontSize: 13,
    lineHeight: 20,
  },
  blank: {
    height: 2,
  },
  heading: {
    ...fontStyles.extraBold,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  listRow: {
    flexDirection: "row",
    gap: 8,
  },
  marker: {
    ...fontStyles.extraBold,
    fontSize: 16,
    lineHeight: 20,
    width: 14,
  },
  numberMarker: {
    ...fontStyles.extraBold,
    fontSize: 13,
    lineHeight: 20,
    minWidth: 22,
  },
  listText: {
    flex: 1,
  },
  codeBlock: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
  },
  codeText: {
    fontSize: 12,
    lineHeight: 18,
  },
  inlineCode: {
    borderRadius: 4,
    fontSize: 12,
    paddingHorizontal: 4,
  },
  bold: {
    ...fontStyles.extraBold,
  },
});
