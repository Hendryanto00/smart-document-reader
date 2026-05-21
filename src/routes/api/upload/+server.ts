import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { insertDocument, updateExtraction } from '$lib/server/db';
import { extractFromImage } from '$lib/server/extract';
import { decodeBase64ToBytes, previewObjectKey } from '$lib/server/preview';

const MAX_BYTES = 8 * 1024 * 1024;

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}
const ALLOWED = new Set(['image/jpeg', 'image/png', 'application/pdf']);

export const POST: RequestHandler = async ({ request, platform }) => {
  const env = platform?.env;
  if (!env?.DB || !env?.BUCKET) throw error(500, 'Platform bindings missing');
  if (!env.OPENROUTER_API_KEY) throw error(500, 'OPENROUTER_API_KEY not configured');

  const form = await request.formData();
  const file = form.get('file');
  const imageBase64 = form.get('imageBase64') as string | null;
  const previewMime = (form.get('previewMime') as string) || 'image/png';

  if (!(file instanceof File)) throw error(400, 'No file provided');
  if (!ALLOWED.has(file.type)) throw error(400, 'Unsupported file type. Use JPG, PNG, or PDF.');
  if (file.size > MAX_BYTES) throw error(400, 'File too large (max 8MB)');

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const fileKey = `uploads/${id}/${file.name}`;

  await env.BUCKET.put(fileKey, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type }
  });

  await insertDocument(env.DB, {
    id,
    file_key: fileKey,
    file_name: file.name,
    mime_type: file.type,
    status: 'processing',
    created_at: now,
    updated_at: now
  });

  try {
    let b64 = imageBase64;
    let mime = previewMime;

    if (!b64) {
      if (!file.type.startsWith('image/')) {
        throw new Error('PDF requires client-side preview. Re-upload with PDF preview enabled.');
      }
      const bytes = new Uint8Array(await file.arrayBuffer());
      b64 = bytesToBase64(bytes);
      mime = file.type;
    }

    if (file.type === 'application/pdf' && b64) {
      await env.BUCKET.put(previewObjectKey(id), decodeBase64ToBytes(b64), {
        httpMetadata: { contentType: 'image/png' }
      });
    }

    const extraction = await extractFromImage(b64, mime, env.OPENROUTER_API_KEY);
    const status = extraction.is_financial_document ? 'review' : 'review';
    if (!extraction.is_financial_document) {
      extraction.warnings.push('Document may not be a receipt or invoice.');
    }

    await updateExtraction(env.DB, id, extraction, status, new Date().toISOString());

    return json({ id, status: 'review' });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Extraction failed';
    await updateExtraction(
      env.DB,
      id,
      {
        vendor: null,
        date: null,
        total: null,
        currency: null,
        line_items: [],
        confidence: {},
        warnings: [msg],
        is_financial_document: false
      },
      'failed',
      new Date().toISOString()
    );
    return json({ id, status: 'failed', error: msg }, { status: 422 });
  }
};
