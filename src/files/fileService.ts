import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

const ROOT_DIRECT = `${FileSystem.documentDirectory}devsnippets/`;

export const EXPORTS_DIR = `${ROOT_DIRECT}exports/`;
export const ATTACHMENTS_DIR = `${ROOT_DIRECT}attachments/`;
export const TEMPLATES_DIR = `${ROOT_DIRECT}templates/`;

export async function ensureFileDirs() {
  await FileSystem.makeDirectoryAsync(ROOT_DIRECT, {
    intermediates: true,
  });
  await FileSystem.makeDirectoryAsync(EXPORTS_DIR, {
    intermediates: true,
  });
  await FileSystem.makeDirectoryAsync(ATTACHMENTS_DIR, {
    intermediates: true,
  });
  await FileSystem.makeDirectoryAsync(TEMPLATES_DIR, {
    intermediates: true,
  });
}

export async function listFiles(folderUri: string) {
  await ensureFileDirs();
  return FileSystem.readDirectoryAsync(folderUri);
}

export async function deleteFile(uri: string) {
  await FileSystem.deleteAsync(uri, { idempotent: true });
}

export async function writeTextFile(uri: string, content: string) {
  await ensureFileDirs();
  await FileSystem.writeAsStringAsync(uri, content);
  return uri;
}

export async function copyFile(fromUri: string, toUri: string) {
  await ensureFileDirs();
  await FileSystem.copyAsync({ from: fromUri, to: toUri });
}

export async function moveFile(fromUri: string, toUri: string) {
  await ensureFileDirs();
  await FileSystem.moveAsync({ from: fromUri, to: toUri });
}

export async function saveSnippetExport(filename: string, content: string) {
  await ensureFileDirs();
  const uri = `${EXPORTS_DIR}${filename}`;
  await FileSystem.writeAsStringAsync(uri, content);
  return uri;
}

export type SnippetExportFormat = "txt" | "js" | "json";

export async function shareFile(uri: string) {
  const canShare = await Sharing.isAvailableAsync();

  if (!canShare) {
    throw new Error("Sharing is not available on this device.");
  }

  await Sharing.shareAsync(uri);
}

export async function saveSnippetImageAttachment(
  sourceUri: string,
  snippetId: number,
) {
  await ensureFileDirs();

  const extension = sourceUri.split(".").pop()?.split("?")[0] ?? "jpg";
  const filename = `snippet-${snippetId}-${Date.now()}.${extension}`;
  const destinationUri = `${ATTACHMENTS_DIR}${filename}`;

  await FileSystem.copyAsync({
    from: sourceUri,
    to: destinationUri,
  });

  return destinationUri;
}
