import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { getSessionCookie, verifySessionToken } from '$lib/server/auth';

function isPublicPath(path: string): boolean {
	if (path === '/' || path === '/login') return true;
	if (path.startsWith('/api/health')) return true;
	return false;
}

export const handle: Handle = async ({ event, resolve }) => {
	const secret = event.platform?.env?.SESSION_SECRET ?? 'dev-secret-change-me';
	const token = getSessionCookie(event.request);
	event.locals.session = token ? await verifySessionToken(token, secret) : null;

	const path = event.url.pathname;

	if (!isPublicPath(path) && !event.locals.session) {
		throw redirect(303, '/');
	}

	return resolve(event);
};
