# Smart Document Reader

Pengumpulan tes teknis — **AI Native Fullstack Developer** (PT Superbrands International).

Aplikasi live yang mengunggah dokumen keuangan (struk/faktur), mengekstrak data terstruktur lewat vision AI, membiarkan manusia meninjau field dengan confidence rendah, menyimpan ke **Cloudflare D1**, menyimpan file di **R2**, dan mengekspor record tersimpan ke **CSV**.

## URL Live

> Deploy mengikuti [Deploy ke Cloudflare](#deploy-ke-cloudflare) di bawah, lalu tempel URL Anda di sini sebelum submit.

`https://<your-project>.pages.dev`

## Login demo

| Field | Nilai |
|-------|--------|
| Email | `demo@superbrands.test` |
| Password | `DemoPass123!` |

(Diatur lewat Wrangler secrets / vars — lihat bagian deploy.)

## Stack & pilihan arsitektur

| Lapisan | Pilihan | Alasan |
|-------|--------|-----|
| **Frontend** | **SvelteKit** + SSR | Cepat diselesaikan dalam 1 hari; **Cloudflare adapter** first-class; bundle kecil; form actions untuk review/save tanpa boilerplate API tambahan. |
| **Runtime** | **Cloudflare Pages** (Worker) | Stack yang diminta; edge global, cocok dengan binding D1/R2. |
| **Database** | **D1 (SQLite)** | SQL persisten yang diminta; skema sederhana untuk dokumen + field ekstraksi. |
| **Penyimpanan file** | **R2** | Pasangan native dengan Workers; object storage murah untuk file asli. |
| **OCR/AI** | **OpenRouter** → `google/gemini-2.0-flash-001` (vision) | Satu panggilan API: gambar → JSON terstruktur dengan **confidence** per field dan **warnings**. Tradeoff akurasi/biaya/latensi bagus dibanding pipeline OCR + LLM terpisah. |
| **PDF** | **pdf.js** (client) | Workers tidak punya rasterisasi PDF yang mudah; halaman pertama di-render ke PNG di browser sebelum panggilan vision. |

Backend **tidak terpisah**: route server SvelteKit + API `+server.ts` berjalan di Worker yang sama dengan UI (fullstack SSR). Lebih sedikit komponen untuk take-home 72 jam.

## Pendekatan OCR/AI

1. Pengguna mengunggah JPG/PNG/PDF (multi-select diproses berurutan dengan review di antara run).
2. PDF → canvas PNG (halaman 1) di browser.
3. Gambar dikirim ke model vision OpenRouter dengan prompt **skema JSON ketat** (vendor, date, total, currency, line_items, confidence 0–1, warnings, `is_financial_document`).
4. Hasil disimpan di D1 dengan `status=review`; pengguna mengedit form; field confidence rendah disorot (< 65%).
5. Saat save → `status=saved`; ekspor CSV menyertakan baris line-item.

### Contoh prompt (paling berdampak)

```
You extract structured data from receipt/invoice photos.
Return ONLY valid JSON matching this schema: { vendor, date, total, currency, line_items, confidence, warnings, is_financial_document }
Rules:
- Lower confidence (0.0-0.4) when text is blurry, rotated, dark, or ambiguous.
- Add warnings for: not a receipt, poor image quality, missing totals.
- If not a financial document, set is_financial_document false and explain in warnings.
```

## Log alur kerja AI (jujur)

| Langkah | Tool / agent | Tujuan |
|------|----------------|---------|
| Scaffold & kunci stack | **Cursor Agent (Claude)** | SvelteKit + Cloudflare adapter, skema D1, wrangler.toml |
| Layanan ekstraksi | **Cursor Agent** | Integrasi vision OpenRouter, model confidence |
| UI (upload, review, list, filter) | **Cursor Agent** | Halaman Svelte 5, dropzone, line item yang bisa diedit |
| README & catatan deploy | **Cursor Agent** | File ini, checklist submission |
| Manual | **Anda** | API key OpenRouter, akun Cloudflare, deploy, 2–3 foto sampel nyata |

## Menangani akurasi rendah

- Model mengembalikan **confidence per field**; UI menandai field di bawah **65%** dengan border amber + badge.
- **warnings[]** ditampilkan di atas (blur, bukan struk, total hilang, dll.).
- Human-in-the-loop: tidak ada yang final sampai pengguna klik **Save**.
- Ekstraksi gagal → `status=failed` dengan error di warnings; pengguna tetap bisa hapus/unggah ulang.

## Asumsi

- Satu pengguna demo (tanpa auth multi-tenant) — cukup untuk ruang lingkup tes.
- PDF: hanya **halaman pertama** yang dianalisis (umum untuk struk).
- Ekspor: hanya dokumen **saved**; menghormati filter daftar.
- Maks unggah **8MB**; **JPG, PNG, PDF** saja (multi-upload didukung).

## Penyimpanan data (persisten)

| Data | Tempat | Keterangan |
|------|--------|------------|
| Metadata dokumen, ekstraksi, line items | **Cloudflare D1** (SQL) | Tabel `documents`, persisten |
| File asli (JPG/PNG/PDF) + preview PDF | **Cloudflare R2** | Object storage |
| Antrian review multi-upload | `sessionStorage` browser | Hanya daftar ID dokumen untuk navigasi UX — **bukan** data bisnis |
| Session login | Cookie httpOnly | Token session, bukan data dokumen |

Semua data dokumen (vendor, tanggal, total, line items) **wajib ada di D1** setelah upload/simpan — bukan in-memory server dan bukan localStorage.
- API key OpenRouter **disediakan kandidat** (perusahaan tidak menyediakan kredit).

## Dokumen sampel

Lihat [`samples/`](samples/) — resi/invoice sintetis dalam **PNG, JPG, dan PDF** (data fiktif aman). Regenerasi: `npm run samples:generate`.

## Pengembangan lokal

```bash
cd smart-document-reader
npm install
cp .env.example .dev.vars   # tambahkan OPENROUTER_API_KEY
npm run db:migrate:local
npx wrangler r2 bucket create smart-doc-files   # sekali
npm run build
npm run preview
```

## Deploy ke Cloudflare

1. Buat database **D1**: `wrangler d1 create smart-doc-db` → salin `database_id` ke `wrangler.toml`.
2. Buat bucket **R2**: `wrangler r2 bucket create smart-doc-files`.
3. Migrasi DB remote: `npm run db:migrate:remote`.
4. Set secrets:
   ```bash
   wrangler secret put OPENROUTER_API_KEY
   wrangler secret put SESSION_SECRET
   wrangler secret put DEMO_PASSWORD
   ```
5. Hubungkan repo ke **Cloudflare Pages** (build: `npm run build`, output: `.svelte-kit/cloudflare`).
6. Bind **D1** (`DB`) dan **R2** (`BUCKET`) di Pages → Settings → Functions.

Atau CLI: `npm run deploy` setelah mengonfigurasi `wrangler.toml`.

## Jika punya waktu 2× lipat

- Antrian background (Workflows) untuk unggah batch + UI progress
- Dukungan PDF multi-halaman
- Ekspor JSON + Excel, audit log edit manusia
- Auth per-tenant (Better Auth) + rate limiting
- Harness evaluasi dengan struk golden + kalibrasi confidence
- Fallback OCR (Tesseract) saat API vision gagal

## Lisensi

Dibuat untuk rekrutmen saja — tidak untuk penggunaan komersial tanpa izin penulis.
