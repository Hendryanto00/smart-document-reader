import type { D1Database } from '@cloudflare/workers-types';
import { normalizeDocDate } from '$lib/dates';
import type { DocumentRow, DocumentView, ExtractionResult, LineItem } from '$lib/types';

function parseJson<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function rowToView(row: DocumentRow): DocumentView {
  return {
    ...row,
    doc_date: normalizeDocDate(row.doc_date),
    line_items: parseJson<LineItem[]>(row.line_items, []),
    field_confidence: parseJson(row.field_confidence, {}),
    warnings: parseJson<string[]>(row.warnings, [])
  };
}

export async function insertDocument(
  db: D1Database,
  doc: {
    id: string;
    file_key: string;
    file_name: string;
    mime_type: string;
    status: string;
    created_at: string;
    updated_at: string;
  }
) {
  await db
    .prepare(
      `INSERT INTO documents (id, file_key, file_name, mime_type, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      doc.id,
      doc.file_key,
      doc.file_name,
      doc.mime_type,
      doc.status,
      doc.created_at,
      doc.updated_at
    )
    .run();
}

export async function updateExtraction(
  db: D1Database,
  id: string,
  extraction: ExtractionResult,
  status: 'review' | 'failed',
  updated_at: string
) {
  await db
    .prepare(
      `UPDATE documents SET
        status = ?, vendor = ?, doc_date = ?, total = ?, currency = ?,
        line_items = ?, field_confidence = ?, warnings = ?, updated_at = ?
       WHERE id = ?`
    )
    .bind(
      status,
      extraction.vendor,
      normalizeDocDate(extraction.date),
      extraction.total,
      extraction.currency,
      JSON.stringify(extraction.line_items),
      JSON.stringify(extraction.confidence),
      JSON.stringify(extraction.warnings),
      updated_at,
      id
    )
    .run();
}

export async function saveDocument(
  db: D1Database,
  id: string,
  data: {
    vendor: string | null;
    doc_date: string | null;
    total: number | null;
    currency: string | null;
    line_items: LineItem[];
    notes: string | null;
    field_confidence: Record<string, number>;
    updated_at: string;
  }
) {
  await db
    .prepare(
      `UPDATE documents SET
        status = 'saved', vendor = ?, doc_date = ?, total = ?, currency = ?,
        line_items = ?, field_confidence = ?, notes = ?, updated_at = ?
       WHERE id = ?`
    )
    .bind(
      data.vendor,
      normalizeDocDate(data.doc_date),
      data.total,
      data.currency,
      JSON.stringify(data.line_items),
      JSON.stringify(data.field_confidence),
      data.notes,
      data.updated_at,
      id
    )
    .run();
}

export async function getDocument(db: D1Database, id: string): Promise<DocumentRow | null> {
  return (
    (await db.prepare('SELECT * FROM documents WHERE id = ?').bind(id).first<DocumentRow>()) ?? null
  );
}

/** Ambil semua dokumen; filter dilakukan di layer atas (satu tempat, mudah debug). */
export async function listAllDocuments(db: D1Database): Promise<DocumentRow[]> {
  const result = await db
    .prepare('SELECT * FROM documents ORDER BY created_at DESC LIMIT 200')
    .all<DocumentRow>();
  return result.results ?? [];
}

/** @deprecated Pakai listAllDocuments + filterDocuments */
export async function listDocuments(
  db: D1Database,
  _filters?: { vendor?: string; dateFrom?: string; dateTo?: string }
): Promise<DocumentRow[]> {
  return listAllDocuments(db);
}

export async function deleteDocument(db: D1Database, id: string) {
  await db.prepare('DELETE FROM documents WHERE id = ?').bind(id).run();
}
