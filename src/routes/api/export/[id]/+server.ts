import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { csvResponse, documentsToCsv, singleExportFilename } from '$lib/server/csv-export';
import { getDocument, rowToView } from '$lib/server/db';

export const GET: RequestHandler = async ({ params, platform }) => {
	const db = platform?.env?.DB;
	if (!db) throw error(500, 'DB not configured');

	const row = await getDocument(db, params.id);
	if (!row) throw error(404, 'Dokumen tidak ditemukan');

	const doc = rowToView(row);

	if (doc.status !== 'saved') {
		throw error(400, 'Hanya dokumen berstatus saved yang bisa diekspor. Klik Simpan terlebih dahulu.');
	}

	const csv = documentsToCsv([doc]);
	return csvResponse(csv, singleExportFilename(doc));
};
