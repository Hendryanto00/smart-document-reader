import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDocument } from '$lib/server/db';
import { previewObjectKey } from '$lib/server/preview';

export const GET: RequestHandler = async ({ params, platform, url }) => {
  const env = platform?.env;
  if (!env?.DB || !env?.BUCKET) throw error(500, 'Bindings missing');

  const doc = await getDocument(env.DB, params.id);
  if (!doc) throw error(404, 'Document not found');

  const wantPreview =
    url.searchParams.get('preview') === '1' || doc.mime_type === 'application/pdf';

  if (wantPreview) {
    const preview = await env.BUCKET.get(previewObjectKey(doc.id));
    if (preview) {
      const headers = new Headers();
      headers.set('Content-Type', 'image/png');
      headers.set('Cache-Control', 'private, max-age=3600');
      return new Response(preview.body, { headers });
    }
  }

  const obj = await env.BUCKET.get(doc.file_key);
  if (!obj) throw error(404, 'File not found');

  const headers = new Headers();
  headers.set('Content-Type', doc.mime_type);
  headers.set('Cache-Control', 'private, max-age=3600');

  return new Response(obj.body, { headers });
};
