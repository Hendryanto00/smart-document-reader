# Smart Document Reader

Tes teknis — AI Native Fullstack (PT Superbrands). Unggah struk/faktur → ekstraksi vision AI → review manusia → simpan **D1** + file **R2** → ekspor **CSV**.

## Live & login

| | |
|---|---|
| **URL** | `https://smart-document-reader-4gl.pages.dev` *(ganti jika deploy baru)* |
| **Login** | `demo@superbrands.test` / `DemoPass123!` |

## Stack & pendekatan OCR/AI

| Lapisan | Pilihan | Alasan singkat |
|---------|---------|----------------|
| UI + API | **SvelteKit** (SSR) di **Cloudflare Pages** | Satu codebase fullstack; adapter Cloudflare + binding D1/R2 native. |
| DB / file | **D1** + **R2** | Persisten sesuai brief; tanpa server terpisah. |
| Ekstraksi | **OpenRouter** → `google/gemini-2.0-flash-001` (vision) | Satu call gambar→JSON + **confidence** + **warnings**; lebih cepat dirakit daripada OCR klasik + LLM terpisah. |
| PDF | **pdf.js** (browser) | Halaman 1 → PNG di client; Workers tidak punya raster PDF mudah. |

**Alur:** upload → (PDF→PNG) → vision API → `status=review` → user koreksi field amber → save → CSV (`saved` saja).

## Asumsi

- Satu akun demo (bukan multi-tenant).
- PDF: **halaman pertama** saja.
- Upload max **8MB**; JPG, PNG, PDF; multi-file = antrian review (`sessionStorage` hanya ID, data di D1).
- API key **OpenRouter milik kandidat**.

## Log workflow AI *(wajib interview)*

| Bagian | Tool | Peran |
|--------|------|--------|
| Scaffold, D1/R2, wrangler, auth | **Cursor Agent** | Struktur project & deploy path |
| `extract.ts`, upload API, confidence | **Cursor Agent** | Integrasi OpenRouter + skema JSON |
| UI upload/review/list/CSV/landing | **Cursor Agent** | Svelte 5 + UX review |
| Deploy, sample, uji manual | **Manusia (saya)** | Cloudflare, secrets, foto nyata |

**Prompt paling menentukan** (system message ke vision model):

```
You extract structured data from receipt/invoice photos.
Return ONLY valid JSON matching this schema: { vendor, date, total, currency, line_items, confidence, warnings, is_financial_document }
Rules:
- Lower confidence (0.0-0.4) when text is blurry, rotated, dark, or ambiguous.
- Add warnings for: not a receipt, poor image quality, missing totals.
- If not a financial document, set is_financial_document false and explain in warnings.
```

## Akurasi rendah

- Model mengisi **confidence per field**; UI highlight **&lt; 65%** (amber).
- **warnings[]** di banner (blur, bukan struk, total hilang).
- **Human-in-the-loop** — tidak final sampai **Simpan**.
- Gagal API → `status=failed` + pesan; user bisa hapus / unggah ulang.

## Jika waktu 2× lipat

- Batch upload + progress (Queues/Workflows)
- PDF multi-halaman + fallback OCR (Tesseract) bila vision gagal
- Eval harness (golden receipts) + kalibrasi threshold confidence
- Auth tenant, audit log edit, ekspor Excel/JSON, rate limit

## Dev & deploy (ringkas)

```bash
npm install && cp .env.example .dev.vars
npm run db:migrate:local   # dev
npm run preview            # lokal

npm run db:migrate:remote  # production D1
npm run deploy             # Pages
npx wrangler pages secret put OPENROUTER_API_KEY --project-name=smart-document-reader
# + SESSION_SECRET, DEMO_PASSWORD — lalu deploy lagi
```

Binding Pages: D1 **`DB`** → `smart-doc-db`, R2 **`BUCKET`** → `smart-doc-files`.

Sample: [`samples/`](samples/) · regenerasi: `npm run samples:generate`
