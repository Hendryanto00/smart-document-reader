export const REVIEW_QUEUE_KEY = 'sdr_review_queue';

export function readReviewQueue(): string[] {
	if (typeof sessionStorage === 'undefined') return [];
	try {
		const parsed = JSON.parse(sessionStorage.getItem(REVIEW_QUEUE_KEY) ?? '[]');
		return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : [];
	} catch {
		return [];
	}
}

export function writeReviewQueue(ids: string[]) {
	sessionStorage.setItem(REVIEW_QUEUE_KEY, JSON.stringify(ids));
}

export function clearReviewQueue() {
	sessionStorage.removeItem(REVIEW_QUEUE_KEY);
}

export function queuePosition(
	currentId: string,
	queue: string[]
): { index: number; total: number } | null {
	const idx = queue.indexOf(currentId);
	if (idx < 0 || queue.length < 2) return null;
	return { index: idx + 1, total: queue.length };
}

export function nextInQueue(currentId: string, queue: string[]): string | null {
	const idx = queue.indexOf(currentId);
	if (idx < 0 || idx >= queue.length - 1) return null;
	return queue[idx + 1];
}
