import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useFocusEffect } from "expo-router";
import { useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useAppAlert } from "../../components/AppAlert";
import {
  ATTACHMENTS_DIR,
  EXPORTS_DIR,
  TEMPLATES_DIR,
  copyFile,
  deleteFile,
  listFiles,
  moveFile,
  readTextFile,
  writeTextFile,
} from "../../files/fileService";
import { fontStyles } from "../../fontDefaults";
import { useAppTheme } from "../../theme";

type FileFolder = "exports" | "attachments" | "templates";

type LocalFile = {
  name: string;
  uri: string;
  folder: FileFolder;
};

type TemplatePreset = {
  name: string;
  content: string;
};

const folders: Record<FileFolder, string> = {
  exports: EXPORTS_DIR,
  attachments: ATTACHMENTS_DIR,
  templates: TEMPLATES_DIR,
};

const folderLabels: Record<FileFolder, string> = {
  exports: "Exports",
  attachments: "Attachments",
  templates: "Templates",
};

const templatePresets: TemplatePreset[] = [
  {
    name: "react-effect-template.js",
    content:
      'import { useEffect } from "react";\n\nuseEffect(() => {\n  // Run side effect here\n}, []);\n',
  },
  {
    name: "fetch-json-helper.js",
    content:
      "export async function fetchJson(url) {\n  const response = await fetch(url);\n\n  if (!response.ok) {\n    throw new Error(`Request failed: ${response.status}`);\n  }\n\n  return response.json();\n}\n",
  },
  {
    name: "typescript-type-guard.ts",
    content:
      "export function isRecord(value: unknown): value is Record<string, unknown> {\n  return typeof value === \"object\" && value !== null && !Array.isArray(value);\n}\n",
  },
];

const fileFolders: FileFolder[] = ["exports", "attachments", "templates"];

const initialFilesByFolder: Record<FileFolder, LocalFile[]> = {
  exports: [],
  attachments: [],
  templates: [],
};

function getTargetFolder(folder: FileFolder): FileFolder | null {
  if (folder === "attachments") {
    return null;
  }

  return folder === "templates" ? "exports" : "templates";
}

export default function FilesScreen() {
  const { colors } = useAppTheme();
  const { showAlert } = useAppAlert();

  const [activeFolder, setActiveFolder] = useState<FileFolder>("exports");
  const [filesByFolder, setFilesByFolder] =
    useState<Record<FileFolder, LocalFile[]>>(initialFilesByFolder);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const files = filesByFolder[activeFolder];

  function loadFiles(
    folder: FileFolder = activeFolder,
    options?: { shouldApply?: () => boolean },
  ) {
    if (options?.shouldApply?.() === false) {
      return Promise.resolve();
    }

    return listFiles(folders[folder])
      .then((storedFiles) => {
        const mappedFiles = storedFiles.map((name) => ({
          name,
          folder,
          uri: `${folders[folder]}${name}`,
        }));

        if (options?.shouldApply?.() === false) {
          return;
        }

        setFilesByFolder((currentFilesByFolder) => {
          const currentFiles = currentFilesByFolder[folder];

          if (areSameFiles(currentFiles, mappedFiles)) {
            return currentFilesByFolder;
          }

          return {
            ...currentFilesByFolder,
            [folder]: mappedFiles,
          };
        });
      })
      .catch(() => {
        showAlert("Files error", "Could not load saved files.");
      });
  }

  useFocusEffect(() => {
    let isActive = true;

    loadFiles(activeFolder, { shouldApply: () => isActive });

    return () => {
      isActive = false;
    };
  });

  function handleSelectFolder(folder: FileFolder) {
    setActiveFolder(folder);
    loadFiles(folder);
  }

  async function handleRefresh() {
    setIsRefreshing(true);
    await loadFiles(activeFolder);
    setIsRefreshing(false);
  }

  function handleDelete(file: LocalFile) {
    showAlert(
      "Delete file",
      `"${file.name}" will be permanently deleted from ${folderLabels[file.folder]}.`,
      [
        { label: "Cancel", variant: "cancel" },
        {
          label: "Delete",
          variant: "destructive",
          onPress: async () => {
            try {
              await deleteFile(file.uri);
              await loadFiles(file.folder);
            } catch {
              showAlert("Delete failed", "Could not delete this file.");
            }
          },
        },
      ],
    );
  }

  async function handleCopy(file: LocalFile) {
    const targetFolder = getTargetFolder(file.folder);

    if (!targetFolder) {
      showAlert("Not available", "Attachments cannot be saved as templates.");
      return;
    }

    try {
      await copyFile(file.uri, `${folders[targetFolder]}${file.name}`);
      showAlert("Copied", `Copied to ${folderLabels[targetFolder]}.`);
    } catch {
      showAlert("Copy failed", "Could not copy this file.");
    }
  }

  async function handleMove(file: LocalFile) {
    const targetFolder = getTargetFolder(file.folder);

    if (!targetFolder) {
      showAlert("Not available", "Attachments cannot be moved to templates.");
      return;
    }

    try {
      await moveFile(file.uri, `${folders[targetFolder]}${file.name}`);
      await loadFiles(file.folder);
      showAlert("Moved", `Moved to ${folderLabels[targetFolder]}.`);
    } catch {
      showAlert("Move failed", "Could not move this file.");
    }
  }

  async function handleSaveTemplate(template: TemplatePreset) {
    try {
      await writeTextFile(`${TEMPLATES_DIR}${template.name}`, template.content);
      await loadFiles("templates");
      showAlert("Saved", "Template saved locally.");
    } catch {
      showAlert("Save failed", "Could not save this template.");
    }
  }

  async function handleUseTemplate(file: LocalFile) {
    try {
      const code = await readTextFile(file.uri);
      router.push({
        pathname: "/snippet/new",
        params: { code },
      });
    } catch {
      showAlert("Template error", "Could not read this template.");
    }
  }

  function renderFile({ item }: { item: LocalFile }) {
    const targetFolder = getTargetFolder(item.folder);

    return (
      <FileRow
        file={item}
        targetFolder={targetFolder}
        onCopy={handleCopy}
        onDelete={handleDelete}
        onMove={handleMove}
        onUseTemplate={handleUseTemplate}
      />
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FilesHeader />
      <FolderTabs
        activeFolder={activeFolder}
        onSelectFolder={handleSelectFolder}
      />

      <FlatList
        key={activeFolder}
        data={files}
        keyExtractor={(item) => item.uri}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
            progressBackgroundColor={colors.card}
          />
        }
        ListHeaderComponent={
          activeFolder === "templates" ? (
            <TemplatePanel onSaveTemplate={handleSaveTemplate} />
          ) : null
        }
        ListEmptyComponent={
          activeFolder === "templates" ? null : (
            <EmptyFolderState folder={activeFolder} />
          )
        }
        renderItem={renderFile}
      />
    </View>
  );
}

function FilesHeader() {
  const { colors } = useAppTheme();

  return (
    <View style={styles.headerTitleRow}>
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color={colors.foreground} />
      </Pressable>
      <Text style={[styles.title, { color: colors.foreground }]}>Files</Text>
    </View>
  );
}

function FolderTabs({
  activeFolder,
  onSelectFolder,
}: {
  activeFolder: FileFolder;
  onSelectFolder: (folder: FileFolder) => void;
}) {
  const { colors } = useAppTheme();

  return (
    <View
      style={[
        styles.folderTabs,
        { backgroundColor: colors.secondary, borderColor: colors.border },
      ]}
    >
      {fileFolders.map((folder) => {
        const isActive = activeFolder === folder;

        return (
          <Pressable
            key={folder}
            style={[
              styles.folderTab,
              isActive && { backgroundColor: colors.primary },
            ]}
            onPress={() => onSelectFolder(folder)}
          >
            <Text
              style={[
                styles.folderTabText,
                {
                  color: isActive
                    ? colors.primaryForeground
                    : colors.mutedForeground,
                },
              ]}
            >
              {folderLabels[folder]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function TemplatePanel({
  onSaveTemplate,
}: {
  onSaveTemplate: (template: TemplatePreset) => void;
}) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.templatePanel}>
      <Text style={[styles.panelTitle, { color: colors.foreground }]}>
        Save starter templates
      </Text>
      <View style={styles.templateGrid}>
        {templatePresets.map((template) => (
          <Pressable
            key={template.name}
            style={[
              styles.templateButton,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
            onPress={() => onSaveTemplate(template)}
          >
            <Ionicons
              style={[
                styles.templateIcon,
                {
                  backgroundColor: colors.secondary,
                },
              ]}
              name="download-outline"
              size={20}
              color={colors.codeAccent}
            />
            <View style={styles.templateInfo}>
              <Text
                numberOfLines={1}
                style={[styles.templateText, { color: colors.foreground }]}
              >
                {template.name}
              </Text>
              <Text
                style={[
                  styles.templateMeta,
                  { color: colors.mutedForeground },
                ]}
              >
                Save to Templates
              </Text>
            </View>
            <Ionicons
              name="add-circle-outline"
              size={20}
              color={colors.mutedForeground}
            />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function EmptyFolderState({ folder }: { folder: FileFolder }) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.emptyState}>
      <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
        No {folderLabels[folder].toLowerCase()} yet
      </Text>
      <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
        Files saved here stay available offline.
      </Text>
    </View>
  );
}

function FileRow({
  file,
  onCopy,
  onDelete,
  onMove,
  onUseTemplate,
  targetFolder,
}: {
  file: LocalFile;
  onCopy: (file: LocalFile) => void;
  onDelete: (file: LocalFile) => void;
  onMove: (file: LocalFile) => void;
  onUseTemplate: (file: LocalFile) => void;
  targetFolder: FileFolder | null;
}) {
  const { colors } = useAppTheme();

  return (
    <View
      style={[
        styles.fileRow,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={styles.fileInfo}>
        <Text style={[styles.fileName, { color: colors.foreground }]}>
          {file.name}
        </Text>
        <Text style={[styles.fileUri, { color: colors.mutedForeground }]}>
          {folderLabels[file.folder]} / {file.name}
        </Text>

        <View style={styles.fileActions}>
          {file.folder === "templates" && (
            <ActionButton
              icon="code-slash"
              label="Use"
              onPress={() => onUseTemplate(file)}
            />
          )}
          {targetFolder && (
            <>
              <ActionButton
                icon="copy-outline"
                label={`Copy to ${folderLabels[targetFolder]}`}
                onPress={() => onCopy(file)}
              />
              <ActionButton
                icon="swap-horizontal-outline"
                label={`Move to ${folderLabels[targetFolder]}`}
                onPress={() => onMove(file)}
              />
            </>
          )}
          <ActionButton
            destructive
            icon="trash-outline"
            label="Delete"
            onPress={() => onDelete(file)}
          />
        </View>
      </View>
    </View>
  );
}

function ActionButton({
  destructive,
  icon,
  label,
  onPress,
}: {
  destructive?: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();

  return (
    <Pressable
      style={[
        styles.actionButton,
        {
          backgroundColor: destructive ? colors.destructive : colors.secondary,
        },
      ]}
      onPress={onPress}
    >
      <Ionicons
        name={icon}
        size={15}
        color={destructive ? colors.destructiveForeground : colors.foreground}
      />
      <Text
        style={[
          styles.actionText,
          {
            color: destructive
              ? colors.destructiveForeground
              : colors.foreground,
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function areSameFiles(currentFiles: LocalFile[], nextFiles: LocalFile[]) {
  return (
    currentFiles.length === nextFiles.length &&
    currentFiles.every((file, index) => {
      const nextFile = nextFiles[index];

      return (
        file.folder === nextFile.folder &&
        file.name === nextFile.name &&
        file.uri === nextFile.uri
      );
    })
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
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    padding: 8,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -6,
  },
  folderTabs: {
    flexDirection: "row",
    borderRadius: 8,
    borderWidth: 1,
    padding: 4,
    marginTop: 20,
  },
  folderTab: {
    flex: 1,
    height: 40,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  folderTabText: {
    ...fontStyles.extraBold,
    fontSize: 12,
  },
  templatePanel: {
    marginTop: 18,
  },
  panelTitle: {
    ...fontStyles.extraBold,
    fontSize: 15,
    marginBottom: 10,
  },
  templateGrid: {
    gap: 12,
  },
  templateButton: {
    minHeight: 68,
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  templateIcon: {
    width: 38,
    height: 38,
    borderRadius: 8,
    padding: 9,
  },
  templateInfo: {
    flex: 1,
    minWidth: 0,
  },
  templateText: {
    ...fontStyles.extraBold,
    fontSize: 13,
  },
  templateMeta: {
    ...fontStyles.regular,
    fontSize: 11,
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
  },
  fileInfo: {
    gap: 8,
  },
  fileName: {
    ...fontStyles.bold,
    fontSize: 14,
  },
  fileUri: {
    ...fontStyles.regular,
    fontSize: 11,
  },
  fileActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
  },
  actionButton: {
    flexBasis: "48%",
    flexGrow: 1,
    minHeight: 40,
    borderRadius: 8,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  actionText: {
    ...fontStyles.bold,
    flexShrink: 1,
    fontSize: 11,
    textAlign: "center",
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
