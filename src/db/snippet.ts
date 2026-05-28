import { db } from "./database";
import {
  CreateSnippetInput,
  Snippet,
  SnippetAttachment,
} from "../types/snippet";

function mapRow(row: any): Snippet {
  return {
    id: row.id,
    title: row.title,
    code: row.code,
    language: row.language,
    tags: JSON.parse(row.tags),
    isFavorite: row.is_favorite === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapAttachmentRow(row: any): SnippetAttachment {
  return {
    id: row.id,
    snippetId: row.snippet_id,
    uri: row.uri,
    type: row.type,
    createdAt: row.created_at,
  };
}

export function createSnippet(input: CreateSnippetInput) {
  const now = new Date().toISOString();

  const result = db.runSync(
    `
      INSERT INTO snippets (title, code, language, tags, created_at,
      updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
      `,
    input.title,
    input.code,
    input.language,
    JSON.stringify(input.tags),
    now,
    now,
  );

  return result.lastInsertRowId;
}

export function getSnippets(search = ""): Snippet[] {
  const rows = db.getAllSync(
    `
      SELECT * FROM snippets
      WHERE title LIKE ? OR code LIKE ? OR language LIKE ?
      ORDER BY updated_at DESC
      `,
    `%${search}%`,
    `%${search}%`,
    `%${search}%`,
  );

  return rows.map(mapRow);
}

export function getSnippetById(id: number): Snippet | null {
  const row = db.getFirstSync(`SELECT * FROM snippets WHERE id = ?`, id);

  return row ? mapRow(row) : null;
}

export function toggleFavorite(id: number, isFavorite: boolean) {
  db.runSync(
    `
      UPDATE snippets
      SET is_favorite = ?, updated_at = ?
      WHERE id = ?
      `,
    isFavorite ? 1 : 0,
    new Date().toISOString(),
    id,
  );
}

export function updateSnippet(id: number, input: CreateSnippetInput) {
  db.runSync(
    `
      UPDATE snippets
      SET title = ?,
          code = ?,
          language = ?,
          tags = ?,
          updated_at = ?
      WHERE id = ?
      `,
    input.title,
    input.code,
    input.language,
    JSON.stringify(input.tags),
    new Date().toISOString(),
    id,
  );
}

export function getFavoriteSnippets(): Snippet[] {
  const rows = db.getAllSync(
    `
      SELECT * FROM snippets
      WHERE is_favorite = 1
      ORDER BY updated_at DESC
      `,
  );

  return rows.map(mapRow);
}

export function deleteSnippet(id: number) {
  db.runSync(`DELETE FROM snippets WHERE id = ?`, id);
}

export function addSnippetAttachment(snippetId: number, uri: string) {
  const now = new Date().toISOString();

  const result = db.runSync(
    `
      INSERT INTO snippet_attachments (snippet_id, uri, type, created_at)
      VALUES (?, ?, ?, ?)
      `,
    snippetId,
    uri,
    "image",
    now,
  );

  return result.lastInsertRowId;
}

export function getSnippetAttachments(snippetId: number): SnippetAttachment[] {
  const rows = db.getAllSync(
    `
      SELECT * FROM snippet_attachments
      WHERE snippet_id = ?
      ORDER BY created_at DESC
      `,
    snippetId,
  );

  return rows.map(mapAttachmentRow);
}

export function deleteSnippetAttachment(id: number) {
  db.runSync(`DELETE FROM snippet_attachments WHERE id = ?`, id);
}
