/** Normalize receipt dates to YYYY-MM-DD for storage. */
export function normalizeDocDate(raw: string | null | undefined): string | null {
	if (!raw?.trim()) return null;
	const s = raw.trim();

	const isoPrefix = s.match(/^(\d{4}-\d{2}-\d{2})/);
	if (isoPrefix) return isoPrefix[1];

	const dmy = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
	if (dmy) {
		const [, d, m, y] = dmy;
		return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
	}

	const parsed = Date.parse(s);
	if (!Number.isNaN(parsed)) {
		return new Date(parsed).toISOString().slice(0, 10);
	}

	return null;
}
