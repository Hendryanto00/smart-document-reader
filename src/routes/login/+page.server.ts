import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { createSessionToken } from '$lib/server/auth';

export const load: PageServerLoad = async ({ locals }) => {
  if (locals.session) throw redirect(303, '/documents');
  return {};
};

export const actions: Actions = {
  default: async ({ request, platform, cookies }) => {
    const env = platform?.env;
    const data = await request.formData();
    const email = String(data.get('email') ?? '').trim();
    const password = String(data.get('password') ?? '');

    const demoEmail = env?.DEMO_EMAIL ?? 'demo@superbrands.test';
    const demoPassword = env?.DEMO_PASSWORD ?? 'DemoPass123!';

    if (email !== demoEmail || password !== demoPassword) {
      return fail(401, { error: 'Email atau kata sandi tidak valid.' });
    }

    const secret = env?.SESSION_SECRET ?? 'dev-secret-change-me';
    const token = await createSessionToken(email, secret);
    cookies.set('sdr_session', token, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60
    });

    throw redirect(303, '/documents');
  }
};
