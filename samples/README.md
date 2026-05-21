# Dokumen sampel untuk pengujian

Unggah file berikut di aplikasi (atau gunakan resi/faktur Anda sendiri yang sudah disamarkan).

| File | Format | Keterangan |
|------|--------|------------|
| `sample-indomaret.png` | PNG | Resi Indomaret (kolom Item / Qty / Unit / Amount) |
| `sample-indomaret.jpg` | JPG | Resi yang sama (uji format JPEG) |
| `sample-invoice.png` | PNG | Invoice B2B (Qty / Unit / Amount) |
| `sample-invoice.pdf` | PDF | Invoice yang sama (uji PDF halaman 1) |
| `sample-blur-receipt.png` | PNG | Resi blur — tetap ada kolom Unit |

Semua data **fiktif** — aman untuk submission.

## Regenerasi dari sumber SVG

```bash
npm run samples:generate
```

Sumber SVG ada di `scripts/sample-sources/`. Hasil ditulis ke `samples/` dan `static/samples/` (untuk unduh dari UI).
