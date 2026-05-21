# Smart Document Reader

Pengumpulan tes teknis — **AI Native Fullstack Developer** (PT Superbrands International).

Aplikasi live yang mengunggah dokumen keuangan (struk/faktur), mengekstrak data terstruktur lewat vision AI, membiarkan manusia meninjau field dengan confidence rendah, menyimpan ke **Cloudflare D1**, menyimpan file di **R2**, dan mengekspor record tersimpan ke **CSV**.

## Stack & pilihan arsitektur

| Lapisan | Pilihan | Alasan |
|-------|--------|-----|
| **Frontend** | **SvelteKit** + SSR | Cepat diselesaikan dalam 3 hari; **Cloudflare adapter** first-class; bundle kecil; form actions untuk review/save tanpa boilerplate API tambahan. |
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
Anda bertugas mengambil data terstruktur dari foto struk atau invoice.
Kembalikan HANYA JSON valid dengan format:
{ vendor, date, total, currency, line_items, confidence, warnings, is_financial_document }
Aturan:
- Gunakan confidence rendah (0.0–0.4) jika teks blur, miring, gelap, atau tidak jelas.
- Tambahkan warnings jika:
- bukan struk/dokumen pembayaran,
- kualitas gambar buruk,
- total pembayaran tidak ditemukan.
- Jika bukan dokumen keuangan, isi is_financial_document dengan false dan jelaskan alasannya di warnings.
```

## Log alur kerja AI

| Langkah | Tool / agent | Tujuan |
|------|----------------|---------|
| Scaffold & kunci stack | **Cursor Agent (Claude)** | SvelteKit + Cloudflare adapter, skema D1, wrangler.toml |
| Layanan ekstraksi | **Cursor Agent** | Integrasi vision OpenRouter, model confidence |
| UI (upload, review, list, filter) | **Cursor Agent** | Halaman Svelte 5, dropzone, line item yang bisa diedit |
| README & catatan deploy | **Cursor Agent** | Ringkasan Sistem, checklist submission |
| Manual | **Saya** | API key OpenRouter, akun Cloudflare, deploy, 2–3 foto sampel nyata & fiktif |

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


## Dokumen sampel

Lihat [`samples/`](samples/) — resi/invoice sintetis dalam **PNG, JPG, dan PDF** (data fiktif aman). Regenerasi: `npm run samples:generate`.

## Jika punya waktu 2× lipat

- Antrian background (Workflows) untuk unggah batch + UI progress
- Dukungan PDF multi-halaman
- Ekspor JSON + Excel, audit log edit
- Sistem login untuk tiap pengguna/perusahaan + pembatasan jumlah penggunaan agar tidak spam
- Testing akurasi AI menggunakan contoh struk asli + penyesuaian nilai confidence agar hasil lebih akurat

## Lisensi

Dibuat untuk rekrutmen saja — tidak untuk penggunaan komersial tanpa izin pengembang.
