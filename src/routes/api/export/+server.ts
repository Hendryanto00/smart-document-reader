import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { filterDocuments } from '$lib/filter-documents';
import { bulkExportFilename, csvResponse, documentsToCsv } from '$lib/server/csv-export';
import { listAllDocuments, rowToView } from '$lib/server/db';

export const GET: RequestHandler = async ({ url, platform }) => {
	const db = platform?.env?.DB;
	if (!db) throw error(500, 'DB not configured');

	const vendor = (url.searchParams.get('vendor') ?? '').trim() || undefined;
	const dateFrom = (url.searchParams.get('dateFrom') ?? '').trim() || undefined;
	const dateTo = (url.searchParams.get('dateTo') ?? '').trim() || undefined;

	const all = (await listAllDocuments(db)).map(rowToView);
	const filtered = filterDocuments(all, { vendor, dateFrom, dateTo });
	const saved = filtered.filter((d) => d.status === 'saved');

	if (saved.length === 0) {
		throw error(404, 'Tidak ada dokumen berstatus saved untuk diekspor. Simpan dokumen dulu.');
	}

	const csv = documentsToCsv(saved);
	return csvResponse(csv, bulkExportFilename());
};
