# Panduan selesai dalam 1 hari

Project sudah dibuat di folder ini. Ikuti checklist berikut **berurutan**.

## Yang sudah jadi

- Upload JPG/PNG/PDF (multi-file, diproses satu per satu)
- Ekstraksi AI (vendor, tanggal, total, mata uang, line items + confidence)
- Halaman review & koreksi sebelum simpan
- Highlight field confidence rendah (< 65%)
- Daftar dokumen + filter vendor & tanggal
- Export CSV (dokumen berstatus `saved` saja)
- Auth demo + penyimpanan D1 + file R2
- 5 file sampel (PNG/JPG/PDF) di folder `samples/` dan `static/samples/`

## Yang perlu Anda lakukan (±2–4 jam)

### 1. API key OpenRouter (wajib)

1. Daftar di https://openrouter.ai
2. Buat API key (perkiraan biaya uji: &lt; $1 untuk puluhan resi)
3. Simpan untuk langkah deploy

### 2. Akun Cloudflare (gratis)

1. https://dash.cloudflare.com
2. Workers & Pages → Create D1 → nama: `smart-doc-db`
3. Copy **Database ID** → paste ke `wrangler.toml` ganti `REPLACE_WITH_YOUR_D1_ID`
4. R2 → Create bucket → nama: `smart-doc-files`

### 3. Migrasi database

```powershell
cd C:\Users\Asus\smart-document-reader
npm run db:migrate:remote
```

### 4. Deploy ke Cloudflare Pages

**Opsi A — Dashboard (disarankan pertama kali)**

1. Push project ke GitHub (buat repo baru)
2. Pages → Create project → Connect GitHub
3. Build command: `npm run build`
4. Build output: `.svelte-kit/cloudflare`
5. Settings → Functions → bindings:
   - D1 `DB` → `smart-doc-db`
   - R2 `BUCKET` → `smart-doc-files`
6. Settings → Environment variables (Production):
   - `OPENROUTER_API_KEY` = (secret)
   - `SESSION_SECRET` = string acak panjang
   - `DEMO_PASSWORD` = `DemoPass123!`
   - `DEMO_EMAIL` = `demo@superbrands.test`

**Opsi B — CLI**

```powershell
wrangler secret put OPENROUTER_API_KEY
wrangler secret put SESSION_SECRET
wrangler secret put DEMO_PASSWORD
npm run deploy
```

### 5. Uji manual (15 menit)

1. Buka live URL → login demo
2. Upload `samples/sample-indomaret.png` (atau `.jpg`)
3. Periksa field amber → Save
4. Filter & Export CSV
5. Upload `samples/sample-blur-receipt.png` → pastikan ada warning
6. (Opsional) Upload `samples/sample-invoice.pdf` → uji PDF

### 6. Submit email

Reply email brief dengan:

```
Live URL: https://....pages.dev
GitHub: https://github.com/USERNAME/smart-document-reader
Login: demo@superbrands.test / DemoPass123!

Catatan: Ekstraksi memakai OpenRouter + Gemini Flash Vision. 
Sample receipts ada di /samples (data fiktif).
```

Lampiran: link GitHub atau ZIP project (tanpa `node_modules`).

## Tips interview

- Baca README bagian **AI workflow log** dan **contoh prompt**
- Siap jelaskan kenapa SvelteKit + satu call vision (bukan OCR terpisah)
- Jujur: PDF hanya halaman 1; batch upload berurutan
- Jika deploy gagal: tulis di README + kabari HR **sebelum deadline**

## Troubleshooting

| Masalah | Solusi |
|---------|--------|
| `Bindings missing` | D1/R2 belum di-bind di Pages |
| `OPENROUTER_API_KEY not configured` | Set secret di dashboard |
| Ekstraksi gagal | Cek saldo OpenRouter; coba foto lebih terang |
| PDF error | Pastikan preview client jalan (browser modern) |
