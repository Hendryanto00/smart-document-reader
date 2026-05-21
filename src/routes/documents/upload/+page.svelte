<script lang="ts">
  import { goto } from '$app/navigation';
  import { pdfFirstPageToBase64 } from '$lib/pdf-preview';
  import { writeReviewQueue } from '$lib/review-queue';

  const ACCEPT_TYPES = ['image/jpeg', 'image/png', 'application/pdf'] as const;
  const ACCEPT_ATTR = '.jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf';

  const SAMPLE_FILES = [
    { name: 'sample-indomaret.png', label: 'Resi Indomaret (PNG)' },
    { name: 'sample-indomaret.jpg', label: 'Resi Indomaret (JPG)' },
    { name: 'sample-invoice.png', label: 'Faktur (PNG)' },
    { name: 'sample-invoice.pdf', label: 'Faktur (PDF)' },
    { name: 'sample-blur-receipt.png', label: 'Resi buram / kualitas rendah (PNG)' }
  ] as const;

  let files = $state<File[]>([]);
  let uploading = $state(false);
  let error = $state('');
  let dragActive = $state(false);
  let progress = $state('');

  function fileKey(f: File) {
    return `${f.name}:${f.size}:${f.lastModified}`;
  }

  function onFilesSelected(list: FileList | null, append = false) {
    if (!list) return;
    const picked = [...list].filter((f) => ACCEPT_TYPES.includes(f.type as (typeof ACCEPT_TYPES)[number]));
    if (picked.length < list.length) {
      error = 'Hanya JPG, PNG, atau PDF yang didukung.';
    } else if (!append) {
      error = '';
    }

    if (append) {
      const seen = new Set(files.map(fileKey));
      const merged = [...files];
      for (const f of picked) {
        const k = fileKey(f);
        if (!seen.has(k)) {
          seen.add(k);
          merged.push(f);
        }
      }
      files = merged;
    } else {
      files = picked;
    }
  }

  function removeFile(index: number) {
    files = files.filter((_, i) => i !== index);
  }

  async function uploadAll() {
    if (files.length === 0) return;
    uploading = true;
    error = '';

    const uploadedIds: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      progress = `Memproses ${i + 1} dari ${files.length}: ${file.name}`;

      const form = new FormData();
      form.append('file', file);

      try {
        if (file.type === 'application/pdf') {
          const { base64, mime } = await pdfFirstPageToBase64(file);
          form.append('imageBase64', base64);
          form.append('previewMime', mime);
        }

        const res = await fetch('/api/upload', { method: 'POST', body: form });
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || body.message || 'Upload gagal');
        uploadedIds.push(body.id as string);
      } catch (e) {
        error = e instanceof Error ? e.message : 'Upload gagal';
        uploading = false;
        return;
      }
    }

    uploading = false;
    progress = '';
    files = [];

    if (uploadedIds.length === 0) return;

    writeReviewQueue(uploadedIds);
    await goto(`/documents/${uploadedIds[0]}`);
  }
</script>

<div class="page-header">
  <div>
    <h2 class="page-title">Unggah dokumen</h2>
    <p class="page-subtitle">
      Resi atau faktur dalam JPG, PNG, atau PDF. Pilih beberapa berkas sekaligus — semua diekstrak AI,
      lalu Anda tinjau satu per satu.
    </p>
  </div>
</div>

{#if error}
  <div class="alert alert-error">{error}</div>
{/if}

<div
  class="dropzone"
  class:active={dragActive}
  role="button"
  tabindex="0"
  ondragover={(e) => {
    e.preventDefault();
    dragActive = true;
  }}
  ondragleave={() => (dragActive = false)}
  ondrop={(e) => {
    e.preventDefault();
    dragActive = false;
    onFilesSelected(e.dataTransfer?.files ?? null, true);
  }}
  onclick={() => document.getElementById('file-input')?.click()}
  onkeydown={(e) => e.key === 'Enter' && document.getElementById('file-input')?.click()}
>
  <div class="dropzone-icon" aria-hidden="true">
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  </div>
  <p>Letakkan file di sini atau klik untuk memilih</p>
  <p class="muted">.jpg · .jpeg · .png · .pdf (maks. 8 MB) · bisa pilih banyak</p>
  <input
    id="file-input"
    type="file"
    accept={ACCEPT_ATTR}
    multiple
    style="display: none"
    onchange={(e) => onFilesSelected((e.currentTarget as HTMLInputElement).files, true)}
  />
</div>

<div class="card">
  <p class="section-label">Dokumen sampel</p>
  <p class="muted" style="margin: 0 0 0.85rem">
    Data fiktif untuk pengujian. Unduh dari folder <code>samples/</code> lalu unggah.
  </p>
  <ul class="sample-list">
    {#each SAMPLE_FILES as s}
      <li>
        <a href="/samples/{s.name}" download={s.name}>{s.label}</a>
      </li>
    {/each}
  </ul>
</div>

{#if files.length > 0}
  <div class="card">
    <p class="section-label">{files.length} file siap diekstrak</p>
    <ul class="file-list">
      {#each files as f, i}
        <li>
          <span class="muted"
            >{f.name} · {(f.size / 1024).toFixed(0)} KB · {f.type === 'application/pdf'
              ? 'PDF'
              : f.type === 'image/jpeg'
                ? 'JPG'
                : 'PNG'}</span
          >
          <button type="button" class="btn btn-secondary btn-sm" onclick={() => removeFile(i)}>Hapus</button>
        </li>
      {/each}
    </ul>
    <button class="btn btn-primary" disabled={uploading} onclick={uploadAll}>
      {uploading ? progress || 'Mengekstrak…' : `Ekstrak ${files.length} dokumen`}
    </button>
  </div>
{/if}
