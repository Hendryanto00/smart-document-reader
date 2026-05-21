import type { DocumentView } from '$lib/types';

const HEADERS = [
	'No',
	'Nama File',
	'Vendor',
	'Tanggal Resi',
	'Total',
	'Mata Uang',
	'Deskripsi Item',
	'Qty',
	'Harga Satuan',
	'Jumlah Item',
	'Status',
	'Diunggah'
] as const;

function escapeCsv(val: string | number | null | undefined): string {
	if (val == null || val === '') return '';
	const s = String(val);
	if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
		return `"${s.replace(/"/g, '""')}"`;
	}
	return s;
}

function fmtNum(n: number | null | undefined): string {
	if (n == null || Number.isNaN(n)) return '';
	return Number(n).toLocaleString('en-US', { maximumFractionDigits: 2 });
}

function fmtDate(iso: string | null | undefined): string {
	if (!iso) return '';
	return iso.slice(0, 10);
}

function safeFilename(name: string): string {
	return name.replace(/[^\w.-]+/g, '_').slice(0, 80) || 'dokumen';
}

export function documentsToCsv(docs: DocumentView[]): string {
	const lines: string[] = [HEADERS.join(',')];
	let rowNo = 0;

	for (const doc of docs) {
		const items = doc.line_items?.length
			? doc.line_items.filter((i) => i.description?.trim())
			: [];

		const base = {
			file: doc.file_name,
			vendor: doc.vendor ?? '',
			date: fmtDate(doc.doc_date),
			total: fmtNum(doc.total),
			currency: doc.currency ?? '',
			status: doc.status,
			uploaded: fmtDate(doc.created_at)
		};

		if (items.length === 0) {
			rowNo += 1;
			lines.push(
				[
					rowNo,
					base.file,
					base.vendor,
					base.date,
					base.total,
					base.currency,
					'',
					'',
					'',
					'',
					base.status,
					base.uploaded
				]
					.map(escapeCsv)
					.join(',')
			);
			continue;
		}

		for (const item of items) {
			rowNo += 1;
			lines.push(
				[
					rowNo,
					base.file,
					base.vendor,
					base.date,
					base.total,
					base.currency,
					item.description,
					item.quantity ?? '',
					fmtNum(item.unit_price),
					fmtNum(item.amount),
					base.status,
					base.uploaded
				]
					.map(escapeCsv)
					.join(',')
			);
		}
	}

	return lines.join('\r\n');
}

export function csvResponse(csvBody: string, filename: string): Response {
	const bom = '\uFEFF';
	return new Response(bom + csvBody, {
		headers: {
			'Content-Type': 'text/csv; charset=utf-8',
			'Content-Disposition': `attachment; filename="${filename}"`
		}
	});
}

export function bulkExportFilename(): string {
	const d = new Date().toISOString().slice(0, 10);
	return `smart-doc-export-${d}.csv`;
}

export function singleExportFilename(doc: DocumentView): string {
	const vendor = safeFilename(doc.vendor ?? 'dokumen');
	const date = doc.doc_date?.slice(0, 10) ?? 'tanpa-tanggal';
	return `${vendor}-${date}.csv`;
}
