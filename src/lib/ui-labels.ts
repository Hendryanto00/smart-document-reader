/** Label UI Bahasa Indonesia untuk status dokumen */
export const STATUS_LABELS: Record<string, string> = {
	processing: 'Memproses',
	review: 'Meninjau',
	saved: 'Tersimpan',
	failed: 'Gagal'
};

export function statusLabel(status: string): string {
	return STATUS_LABELS[status] ?? status;
}
