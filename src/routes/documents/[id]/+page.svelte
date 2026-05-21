<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
  import PdfFilePreview from '$lib/components/PdfFilePreview.svelte';
  import { normalizeDocDate } from '$lib/dates';
  import { nextInQueue, queuePosition, readReviewQueue } from '$lib/review-queue';
  import type { LineItem } from '$lib/types';
  import { statusLabel } from '$lib/ui-labels';

  let { data, form } = $props();

  const THRESHOLD = 0.65;

  let queue = $state<string[]>([]);
  let showDeleteConfirm = $state(false);
  let deleteFormEl = $state<HTMLFormElement | null>(null);

  onMount(() => {
    queue = readReviewQueue();
  });

  function confirmDelete() {
    deleteFormEl?.requestSubmit();
    showDeleteConfirm = false;
  }

  function cancelDelete() {
    showDeleteConfirm = false;
  }

  let reviewPos = $derived(queuePosition(data.document.id, queue));
  let nextDocId = $derived(nextInQueue(data.document.id, queue));

  const confidence = $derived(data.document.field_confidence);
  const warnings = $derived(data.document.warnings);

  let vendor = $state('');
  let doc_date = $state('');
  let total = $state('');
  let currency = $state('');
  let notes = $state('');
  let line_items = $state<LineItem[]>([]);

  function loadFormFromDocument() {
    const doc = data.document;
    vendor = doc.vendor ?? '';
    doc_date = normalizeDocDate(doc.doc_date) ?? '';
    total = doc.total?.toString() ?? '';
    currency = doc.currency ?? '';
    notes = doc.notes ?? '';
    line_items = doc.line_items.length
      ? doc.line_items.map((item) => ({ ...item }))
      : [{ description: '', quantity: null, unit_price: null, amount: null }];
  }

  $effect(() => {
    data.document.id;
    loadFormFromDocument();
  });

  function isLow(field: string): boolean {
    const v = confidence[field as keyof typeof confidence];
    return typeof v === 'number' && v < THRESHOLD;
  }

  function confLabel(field: string): string | null {
    const v = confidence[field as keyof typeof confidence];
    if (typeof v !== 'number') return null;
    return `${Math.round(v * 100)}%`;
  }

  function addLineItem() {
    line_items = [
      ...line_items,
      { description: '', quantity: null, unit_price: null, amount: null }
    ];
  }

  function removeLineItem(i: number) {
    line_items = line_items.filter((_, idx) => idx !== i);
  }

  function lineItemsJson() {
    return JSON.stringify(line_items.filter((l) => l.description.trim()));
  }
</script>

{#if reviewPos}
  <div class="queue-banner">
    Antrian peninjauan: dokumen <strong>{reviewPos.index}</strong> dari <strong>{reviewPos.total}</strong>
  </div>
{/if}

{#if $page.url.searchParams.get('saved')}
  <div class="alert alert-success alert-flex">
    <span>Dokumen berhasil disimpan.</span>
    {#if nextDocId}
      <a href="/documents/{nextDocId}" class="btn btn-primary btn-sm">
        Lanjut ke dokumen {reviewPos ? reviewPos.index + 1 : 2} →
      </a>
    {:else}
      <a href="/documents" class="btn btn-secondary btn-sm">Ke daftar dokumen</a>
    {/if}
  </div>
{/if}

{#if form?.message}
  <div class="alert alert-error">{form.message}</div>
{/if}

<div class="page-header">
  <div>
    <h2 class="page-title">{data.document.file_name}</h2>
    <div class="doc-meta">
      <span class="status status-{data.document.status}">{statusLabel(data.document.status)}</span>
    </div>
  </div>
  <div class="page-actions">
    {#if data.document.status === 'saved'}
      <a href="/api/export/{data.document.id}" class="btn btn-secondary">Single CSV export</a>
    {/if}
    <a href="/documents" class="btn btn-secondary">← Daftar</a>
  </div>
</div>

{#if warnings.length > 0}
  <div class="alert alert-warn">
    <strong>Peringatan AI — mohon diverifikasi:</strong>
    <ul style="margin: 0.5rem 0 0; padding-left: 1.2rem">
      {#each warnings as w}
        <li>{w}</li>
      {/each}
    </ul>
  </div>
{/if}

{#key data.document.id}
<div class="grid-2">
  <div class="card card-panel">
    <h3>Dokumen asli</h3>
    {#if data.document.mime_type.startsWith('image/')}
      <div class="doc-preview-wrap">
        <img class="preview-img" src="/api/files/{data.document.id}" alt="Pratinjau dokumen" />
      </div>
    {:else if data.document.mime_type === 'application/pdf'}
      <div class="doc-preview-wrap">
        <PdfFilePreview src="/api/files/{data.document.id}" />
      </div>
      <p style="margin: 0.75rem 0 0">
        <a href="/api/files/{data.document.id}" target="_blank" rel="noreferrer">Unduh PDF asli</a>
      </p>
    {:else}
      <a href="/api/files/{data.document.id}" target="_blank" rel="noreferrer">Unduh file</a>
    {/if}
  </div>

  <div class="card card-panel">
    <h3>Tinjau & koreksi</h3>
    <p class="muted">Kolom berwarna amber = tingkat keyakinan AI rendah. Periksa sebelum menyimpan.</p>

    <form method="POST" action="?/save">
      <input type="hidden" name="line_items" value={lineItemsJson()} />
      <input type="hidden" name="field_confidence" value={JSON.stringify(data.document.field_confidence)} />

      <div class="field" class:low-confidence={isLow('vendor')}>
        <label for="vendor">
          Vendor / pedagang
          {#if confLabel('vendor')}
            <span class="badge-warn">AI {confLabel('vendor')}</span>
          {/if}
        </label>
        <input id="vendor" name="vendor" bind:value={vendor} />
      </div>

      <div class="field" class:low-confidence={isLow('date')}>
        <label for="doc_date">
          Tanggal
          {#if confLabel('date')}
            <span class="badge-warn">AI {confLabel('date')}</span>
          {/if}
        </label>
        <input id="doc_date" name="doc_date" type="date" bind:value={doc_date} />
      </div>

      <div class="grid-2">
        <div class="field" class:low-confidence={isLow('total')}>
          <label for="total">
            Total
            {#if confLabel('total')}
              <span class="badge-warn">AI {confLabel('total')}</span>
            {/if}
          </label>
          <input id="total" name="total" type="number" step="0.01" bind:value={total} />
        </div>
        <div class="field" class:low-confidence={isLow('currency')}>
          <label for="currency">
            Mata uang
            {#if confLabel('currency')}
              <span class="badge-warn">AI {confLabel('currency')}</span>
            {/if}
          </label>
          <input id="currency" name="currency" placeholder="IDR, USD, SGD" bind:value={currency} />
        </div>
      </div>

      <div class="field" class:low-confidence={isLow('line_items')}>
        <span class="muted" style="display: block; font-size: 0.8rem; margin-bottom: 0.35rem">
          Baris item
          {#if confLabel('line_items')}
            <span class="badge-warn">AI {confLabel('line_items')}</span>
          {/if}
        </span>
        <div class="line-items-editor">
          <table class="line-items-table">
            <colgroup>
              <col class="col-desc" />
              <col class="col-qty" />
              <col class="col-price" />
              <col class="col-amt" />
              <col class="col-del" />
            </colgroup>
            <thead>
              <tr>
                <th>Deskripsi</th>
                <th>Jml</th>
                <th>Harga satuan</th>
                <th>Jumlah</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {#each line_items as item, i}
                <tr>
                  <td class="cell-desc" data-label="Deskripsi">
                    <textarea
                      class="line-item-desc"
                      rows="2"
                      bind:value={item.description}
                      placeholder="Nama item"
                    ></textarea>
                  </td>
                  <td class="cell-num" data-label="Jml">
                    <input type="number" class="line-item-num" bind:value={item.quantity} placeholder="—" />
                  </td>
                  <td class="cell-num" data-label="Harga satuan">
                    <input
                      type="number"
                      step="0.01"
                      class="line-item-num"
                      bind:value={item.unit_price}
                      placeholder="—"
                    />
                  </td>
                  <td class="cell-num" data-label="Jumlah">
                    <input
                      type="number"
                      step="0.01"
                      class="line-item-num"
                      bind:value={item.amount}
                      placeholder="—"
                    />
                  </td>
                  <td class="cell-del">
                    <button
                      type="button"
                      class="btn btn-danger btn-line-del"
                      aria-label="Hapus baris"
                      onclick={() => removeLineItem(i)}>×</button>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
        <button type="button" class="btn btn-secondary" style="margin-top: 0.5rem" onclick={addLineItem}>+ Tambah baris</button>
      </div>

      <div class="field">
        <label for="notes">Catatan (opsional)</label>
        <textarea id="notes" name="notes" rows="2" bind:value={notes} placeholder="Koreksi manual, konteks…"></textarea>
      </div>

      <div class="page-actions" style="margin-top: 0.5rem">
        <button type="submit" class="btn btn-primary">Simpan dokumen</button>
      </div>
    </form>

    <form bind:this={deleteFormEl} method="POST" action="?/delete" style="margin-top: 1.5rem">
      <button type="button" class="btn btn-danger" onclick={() => (showDeleteConfirm = true)}>
        Hapus dokumen
      </button>
    </form>
  </div>
</div>

<ConfirmDialog
  open={showDeleteConfirm}
  message={`"${data.document.file_name}" akan dihapus.`}
  onConfirm={confirmDelete}
  onCancel={cancelDelete}
/>
{/key}
