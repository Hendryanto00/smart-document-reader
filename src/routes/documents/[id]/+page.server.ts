import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getDocument, rowToView, saveDocument, deleteDocument } from '$lib/server/db';
import type { LineItem } from '$lib/types';

export const load: PageServerLoad = async ({ params, platform }) => {
  const db = platform?.env?.DB;
  if (!db) throw error(500, 'Database belum dikonfigurasi');

  const row = await getDocument(db, params.id);
  if (!row) throw error(404, 'Dokumen tidak ditemukan');

  return { document: rowToView(row) };
};

export const actions: Actions = {
  save: async ({ request, params, platform }) => {
    const db = platform?.env?.DB;
    if (!db) return fail(500, { message: 'Database belum dikonfigurasi' });

    const data = await request.formData();
    const vendor = String(data.get('vendor') || '').trim() || null;
    const doc_date = String(data.get('doc_date') || '').trim() || null;
    const totalRaw = String(data.get('total') || '').trim();
    const total = totalRaw ? parseFloat(totalRaw) : null;
    const currency = String(data.get('currency') || '').trim() || null;
    const notes = String(data.get('notes') || '').trim() || null;
    const lineItemsRaw = String(data.get('line_items') || '[]');

    let line_items: LineItem[] = [];
    try {
      line_items = JSON.parse(lineItemsRaw);
    } catch {
      return fail(400, { message: 'Format baris item tidak valid' });
    }

    const confidenceRaw = String(data.get('field_confidence') || '{}');
    let field_confidence: Record<string, number> = {};
    try {
      field_confidence = JSON.parse(confidenceRaw);
    } catch {
      field_confidence = {};
    }

    await saveDocument(db, params.id, {
      vendor,
      doc_date,
      total: Number.isFinite(total) ? total : null,
      currency,
      line_items,
      notes,
      field_confidence,
      updated_at: new Date().toISOString()
    });

    throw redirect(303, `/documents/${params.id}?saved=1`);
  },

  delete: async ({ params, platform }) => {
    const env = platform?.env;
    if (!env?.DB) return fail(500, { message: 'Database belum dikonfigurasi' });

    const row = await getDocument(env.DB, params.id);
    if (row) {
      await env.BUCKET?.delete(row.file_key);
      await deleteDocument(env.DB, params.id);
    }
    throw redirect(303, '/documents');
  }
};
