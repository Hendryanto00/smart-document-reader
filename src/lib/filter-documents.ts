import type { DocumentView } from '$lib/types';

export type DocumentFilters = {
	vendor?: string;
	dateFrom?: string;
	dateTo?: string;
};

/** Bersihkan input vendor (tanpa tanda kutip). */
export function cleanVendorInput(vendor: string): string {
	return vendor.replace(/^["']+|["']+$/g, '').trim();
}

/** Tanggal untuk filter: tanggal resi, kalau kosong pakai tanggal unggah. */
export function docYmd(doc: DocumentView): string {
	if (doc.doc_date && doc.doc_date.length >= 10) return doc.doc_date.slice(0, 10);
	return doc.created_at.slice(0, 10);
}

/** Filter sederhana di memori — mudah dipahami & aman. */
export function filterDocuments(docs: DocumentView[], filters: DocumentFilters): DocumentView[] {
	const vendor = filters.vendor ? cleanVendorInput(filters.vendor).toLowerCase() : '';
	const from = filters.dateFrom?.trim() || '';
	const to = filters.dateTo?.trim() || '';

	return docs.filter((doc) => {
		if (vendor) {
			const name = (doc.vendor ?? '').toLowerCase();
			if (!name.includes(vendor)) return false;
		}

		if (!from && !to) return true;

		const d = docYmd(doc);
		if (from && d < from) return false;
		if (to && d > to) return false;
		return true;
	});
}

/** Daftar tanggal unik di data (untuk petunjuk user). */
export function uniqueDocDates(docs: DocumentView[]): string[] {
	const set = new Set<string>();
	for (const doc of docs) {
		const d = docYmd(doc);
		if (d) set.add(d);
	}
	return [...set].sort();
}
