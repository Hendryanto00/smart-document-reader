const COOKIE_NAME = 'sdr_session';

function bytesToBase64Url(bytes: Uint8Array): string {
	const bin = Array.from(bytes, (b) => String.fromCharCode(b)).join('');
	return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToBytes(str: string): Uint8Array | null {
	try {
		const pad = '='.repeat((4 - (str.length % 4)) % 4);
		const b64 = str.replace(/-/g, '+').replace(/_/g, '/') + pad;
		const bin = atob(b64);
		return Uint8Array.from(bin, (c) => c.charCodeAt(0));
	} catch {
		return null;
	}
}

function stringToBase64Url(s: string): string {
	return bytesToBase64Url(new TextEncoder().encode(s));
}

function base64UrlToString(str: string): string | null {
	const bytes = base64UrlToBytes(str);
	if (!bytes) return null;
	return new TextDecoder().decode(bytes);
}

export async function createSessionToken(email: string, secret: string): Promise<string> {
	const payload = JSON.stringify({ email, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 });
	const enc = new TextEncoder();
	const key = await crypto.subtle.importKey(
		'raw',
		enc.encode(secret),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign']
	);
	const sig = await crypto.subtle.sign('HMAC', key, enc.encode(payload));
	const sigB64 = bytesToBase64Url(new Uint8Array(sig));
	return `${stringToBase64Url(payload)}.${sigB64}`;
}

export async function verifySessionToken(
	token: string,
	secret: string
): Promise<{ email: string } | null> {
	try {
		const dot = token.indexOf('.');
		if (dot <= 0) return null;

		const payloadB64 = token.slice(0, dot);
		const sigB64 = token.slice(dot + 1);
		if (!sigB64) return null;

		const payload = base64UrlToString(payloadB64);
		if (!payload) return null;

		const sigBytes = base64UrlToBytes(sigB64);
		if (!sigBytes) return null;

		const enc = new TextEncoder();
		const key = await crypto.subtle.importKey(
			'raw',
			enc.encode(secret),
			{ name: 'HMAC', hash: 'SHA-256' },
			false,
			['verify']
		);
		const valid = await crypto.subtle.verify('HMAC', key, sigBytes, enc.encode(payload));
		if (!valid) return null;

		const data = JSON.parse(payload) as { email: string; exp: number };
		if (data.exp < Date.now()) return null;
		return { email: data.email };
	} catch {
		return null;
	}
}

export function sessionCookie(token: string): string {
	return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`;
}

export function clearSessionCookie(): string {
	return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export function getSessionCookie(request: Request): string | null {
	const cookie = request.headers.get('cookie') ?? '';
	const match = cookie.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
	if (!match?.[1]) return null;
	const raw = match[1].trim();
	try {
		return decodeURIComponent(raw);
	} catch {
		return raw;
	}
}

export { COOKIE_NAME };
