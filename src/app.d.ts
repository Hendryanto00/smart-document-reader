import type { D1Database, R2Bucket } from '@cloudflare/workers-types';

declare global {
  namespace App {
    interface Locals {
      session: { email: string } | null;
    }
    interface Platform {
      env: {
        DB: D1Database;
        BUCKET: R2Bucket;
        OPENROUTER_API_KEY: string;
        SESSION_SECRET: string;
        DEMO_EMAIL: string;
        DEMO_PASSWORD: string;
      };
    }
  }
}

export {};
