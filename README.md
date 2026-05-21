# Smart Document Reader

Pengumpulan tes teknis — **AI Native Fullstack Developer** (PT Superbrands International).

Aplikasi live yang mengunggah dokumen keuangan (struk/faktur), mengekstrak data terstruktur lewat vision AI, membiarkan manusia meninjau field dengan confidence rendah, menyimpan ke **Cloudflare D1**, menyimpan file di **R2**, dan mengekspor record tersimpan ke **CSV**.

## Stack & pilihan arsitektur

| Lapisan | Pilihan | Alasan |
|-------|--------|-----|
| **Frontend** | **SvelteKit** + SSR | Satu framework untuk tampilan web dan logika server, jadi upload → review → simpan bisa dikerjakan tanpa bikin backend/API terpisah. Cocok untuk deadline tes dan deploy langsung ke Cloudflare. |
| **Runtime** | **Cloudflare Pages** (Worker) | Sesuai stack yang diminta di brief. Aplikasi, database, dan penyimpanan file berada di ekosistem yang sama sehingga setup deploy lebih sederhana. |
| **Database** | **D1 (SQLite)** | Menyimpan data dokumen (vendor, tanggal, total, line items, status) secara permanen — data tidak hilang setelah refresh atau deploy ulang. |
| **Penyimpanan file** | **R2** | Menyimpan file asli yang di-upload (foto/PDF). Mirip “cloud storage” yang terhubung langsung ke aplikasi, biayanya ringan untuk skala tes. |
| **OCR/AI** | **OpenRouter** → `google/gemini-2.0-flash-001` (vision) | Model “melihat” gambar struk lalu mengisi data terstruktur sekaligus memberi **tingkat keyakinan** dan **peringatan** jika gambarnya buram atau bukan struk. Lebih praktis daripada OCR klasik lalu parsing teks manual. |
| **PDF** | **pdf.js** (client) | Lingkungan Cloudflare tidak mudah mengubah PDF jadi gambar di server. PDF diubah ke gambar di browser pengguna dulu (halaman 1), baru dikirim ke AI — sama seperti user memfoto struk. |

Backend **tidak terpisah**: halaman web dan API (upload, simpan, ekspor) jalan di satu aplikasi yang sama, sehingga lebih sedikit yang perlu di-deploy dan di-debug.

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
| Deploy | **pengembang** | API key OpenRouter, akun Cloudflare, deploy, 2–3 foto sampel nyata & fiktif |

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

- Dukungan PDF multi-halaman
- Ekspor JSON + Excel, audit log edit
- Sistem login untuk tiap pengguna/perusahaan + pembatasan jumlah penggunaan agar tidak spam
- Testing akurasi AI menggunakan contoh struk asli + penyesuaian nilai confidence agar hasil lebih akurat

## Lisensi

Dibuat untuk rekrutmen saja — tidak untuk penggunaan komersial tanpa izin pengembang.
