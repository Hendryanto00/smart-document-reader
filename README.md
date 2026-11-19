# Smart Document Reader

Aplikasi live yang mengunggah dokumen keuangan (struk/faktur), mengekstrak data terstruktur lewat vision AI, membiarkan manusia meninjau field dengan confidence rendah.
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

```

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

