import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useAppAlert } from "../../components/AppAlert";
import { deleteFile, EXPORTS_DIR, listFiles } from "../../files/fileService";
import { fontStyles } from "../../fontDefaults";
import { useAppTheme } from "../../theme";

type LocalFile = {
  name: string;
  uri: string;
};

export default function FilesScreen() {
  const { colors } = useAppTheme();
  const { showAlert } = useAppAlert();

  const [files, setFiles] = useState<LocalFile[]>([]);

  const loadFiles = useCallback(async () => {
    try {
      const storedFiles = await listFiles(EXPORTS_DIR);
      const mappedFiles = storedFiles.map((name) => ({
        name,
        uri: `${EXPORTS_DIR}${name}`,
      }));
      setFiles(mappedFiles);
    } catch {
      showAlert("Files error", "Could not load saved files.");
    }
  }, [showAlert]);

  useFocusEffect(
    useCallback(() => {
      loadFiles();
    }, [loadFiles]),
  );

  async function handleDelete(file: LocalFile) {
    try {
      await deleteFile(file.uri);
      await loadFiles();
    } catch {
      showAlert("Delete failed", "Could not delete this file.");
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.foreground }]}>Files</Text>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
        Saved exports and resources
      </Text>

      <FlatList
        data={files}
        keyExtractor={(item) => item.uri}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              No files yet
            </Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Exported snippets will appear here.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View
            style={[
              styles.fileRow,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={styles.fileInfo}>
              <Text style={[styles.fileName, { color: colors.foreground }]}>
                {item.name}
              </Text>
              <Text style={[styles.fileUri, { color: colors.mutedForeground }]}>
                {item.uri}
              </Text>
            </View>

            <Pressable
              style={[
                styles.deleteButton,
                { backgroundColor: colors.destructive },
              ]}
              onPress={() => handleDelete(item)}
            >
              <Text
                style={[
                  styles.deleteText,
                  { color: colors.destructiveForeground },
                ]}
              >
                Delete
              </Text>
            </Pressable>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 56,
    paddingBottom: 120,
  },
  title: {
    ...fontStyles.extraBold,
    fontSize: 30,
  },
  subtitle: {
    ...fontStyles.regular,
    fontSize: 14,
    marginTop: 4,
  },
  list: {
    paddingTop: 18,
    gap: 12,
  },
  fileRow: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    ...fontStyles.bold,
    fontSize: 14,
  },
  fileUri: {
    ...fontStyles.regular,
    fontSize: 11,
    marginTop: 4,
  },
  deleteButton: {
    height: 36,
    borderRadius: 8,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteText: {
    ...fontStyles.bold,
    fontSize: 12,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 80,
  },
  emptyTitle: {
    ...fontStyles.bold,
    fontSize: 18,
  },
  emptyText: {
    ...fontStyles.regular,
    marginTop: 8,
    textAlign: "center",
  },
});
