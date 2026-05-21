<script lang="ts">
  import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
  import { statusLabel } from '$lib/ui-labels';

  let { data } = $props();

  let pendingDelete = $state<{ id: string; fileName: string } | null>(null);

  function openDeleteDialog(doc: { id: string; file_name: string }) {
    pendingDelete = { id: doc.id, fileName: doc.file_name };
  }

  function confirmDelete() {
    if (!pendingDelete) return;
    const id = pendingDelete.id;
    const form =
      (document.getElementById(`delete-doc-${id}`) as HTMLFormElement | null) ??
      (document.getElementById(`delete-doc-mobile-${id}`) as HTMLFormElement | null);
    form?.requestSubmit();
    pendingDelete = null;
  }

  function cancelDelete() {
    pendingDelete = null;
  }

  function exportUrl() {
    const p = new URLSearchParams();
    if (data.filters.vendor) p.set('vendor', data.filters.vendor);
    if (data.filters.dateFrom) p.set('dateFrom', data.filters.dateFrom);
    if (data.filters.dateTo) p.set('dateTo', data.filters.dateTo);
    const q = p.toString();
    return `/api/export${q ? `?${q}` : ''}`;
  }

  function filterHref(date: string) {
    const p = new URLSearchParams();
    if (data.filters.vendor) p.set('vendor', data.filters.vendor);
    p.set('dateFrom', date);
    p.set('dateTo', date);
    return `/documents?${p.toString()}`;
  }

  function statusClass(status: string) {
    return `status status-${status}`;
  }

  const hasFilters = $derived(
    Boolean(data.filters.vendor || data.filters.dateFrom || data.filters.dateTo)
  );
</script>

<div class="page-header">
  <div>
    <h2 class="page-title">Dokumen</h2>
    <p class="page-subtitle">Kelola resi dan invoice yang sudah diekstrak, difilter, dan diekspor ke CSV.</p>
  </div>
  <div class="page-actions">
    <a href={exportUrl()} class="btn btn-secondary" title="Satu file CSV — semua dokumen saved sesuai filter">Ekspor CSV (semua)</a>
    <a href="/documents/upload" class="btn btn-primary">+ Unggah</a>
  </div>
</div>

<div class="card">
  <p class="section-label">Filter</p>
  <form method="GET" action="/documents">
    <div class="field mb-0" style="margin-bottom: 1rem">
      <label for="vendor">Vendor / pedagang</label>
      <input id="vendor" name="vendor" value={data.filters.vendor} placeholder="Contoh: INDOMARET" />
    </div>
    <div class="filter-dates">
      <div class="field mb-0">
        <label for="dateFrom">Tanggal dari</label>
        <input id="dateFrom" name="dateFrom" type="date" value={data.filters.dateFrom} />
      </div>
      <div class="field mb-0">
        <label for="dateTo">Tanggal sampai</label>
        <input id="dateTo" name="dateTo" type="date" value={data.filters.dateTo} />
      </div>
      <div class="filter-actions">
        <button type="submit" class="btn btn-primary">Terapkan</button>
        {#if hasFilters}
          <a href="/documents" class="btn btn-secondary">Reset</a>
        {/if}
      </div>
    </div>
  </form>

  {#if data.availableDates.length > 0}
    <p class="filter-meta"><strong>Tanggal di database</strong> — klik untuk filter cepat:</p>
    <div class="chip-list">
      {#each data.availableDates as d}
        <a href={filterHref(d)} class="chip">{d}</a>
      {/each}
    </div>
  {/if}

  {#if hasFilters}
    <p class="filter-meta">
      Menampilkan <strong>{data.total}</strong> dari <strong>{data.totalAll}</strong> dokumen
    </p>
  {/if}
</div>

{#if data.documents.length === 0}
  <div class="card empty-state">
    <div class="empty-state-icon" aria-hidden="true">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
    </div>
    {#if hasFilters}
      <p>Tidak ada dokumen yang cocok dengan filter.</p>
      <p class="muted">
        Vendor: <code>{data.filters.vendor || '(semua)'}</code> ·
        {data.filters.dateFrom || '…'} s/d {data.filters.dateTo || '…'}
      </p>
      {#if data.availableDates.length > 0}
        <p class="muted" style="margin-top: 0.75rem">
          Coba <a href={filterHref(data.availableDates[0])}>{data.availableDates[0]}</a> atau
          <a href="/documents">reset filter</a>.
        </p>
      {:else}
        <p class="muted" style="margin-top: 0.75rem"><a href="/documents">Reset filter</a></p>
      {/if}
    {:else}
      <p>Belum ada dokumen tersimpan.</p>
      <p class="muted" style="margin-top: 0.75rem">
        <a href="/documents/upload" class="btn btn-primary">Unggah resi pertama</a>
      </p>
    {/if}
  </div>
{:else}
  <p class="muted doc-count">{data.total} dokumen</p>

  <!-- Desktop / tablet: tabel -->
  <div class="card card-flat doc-table-view">
    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>Berkas</th>
            <th>Vendor</th>
            <th>Tanggal</th>
            <th>Total</th>
            <th>Status</th>
            <th class="col-actions">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {#each data.documents as doc}
            <tr>
              <td><strong class="doc-file-name">{doc.file_name}</strong></td>
              <td>{doc.vendor ?? '—'}</td>
              <td>{doc.doc_date ?? '—'}</td>
              <td>
                {#if doc.total != null}
                  <span class="tabular-nums">{doc.currency ?? ''} {doc.total.toLocaleString()}</span>
                {:else}
                  —
                {/if}
              </td>
              <td><span class={statusClass(doc.status)}>{statusLabel(doc.status)}</span></td>
              <td class="col-actions">
                <div class="table-actions">
                  <a href="/documents/{doc.id}" class="table-link">Buka</a>
                  {#if doc.status === 'saved'}
                    <a
                      href="/api/export/{doc.id}"
                      class="btn btn-secondary btn-inline"
                      title="Unduh CSV untuk dokumen ini saja"
                    >Single CSV</a>
                  {/if}
                  <form
                    id="delete-doc-{doc.id}"
                    method="POST"
                    action="/documents/{doc.id}?/delete"
                    style="display: inline; margin: 0"
                  >
                    <button
                      type="button"
                      class="btn-inline-danger"
                      onclick={() => openDeleteDialog(doc)}
                    >Hapus</button>
                  </form>
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>

  <!-- Mobile: kartu (tidak terpotong) -->
  <div class="doc-cards-view">
    {#each data.documents as doc}
      <article class="card doc-card">
        <div class="doc-card-head">
          <strong class="doc-card-title">{doc.file_name}</strong>
          <span class={statusClass(doc.status)}>{statusLabel(doc.status)}</span>
        </div>
        <dl class="doc-card-meta">
          <div>
            <dt>Vendor</dt>
            <dd>{doc.vendor ?? '—'}</dd>
          </div>
          <div>
            <dt>Tanggal</dt>
            <dd>{doc.doc_date ?? '—'}</dd>
          </div>
          <div>
            <dt>Total</dt>
            <dd>
              {#if doc.total != null}
                <span class="tabular-nums">{doc.currency ?? ''} {doc.total.toLocaleString()}</span>
              {:else}
                —
              {/if}
            </dd>
          </div>
        </dl>
        <div class="doc-card-actions">
          <a href="/documents/{doc.id}" class="btn btn-primary btn-sm">Buka</a>
          {#if doc.status === 'saved'}
            <a
              href="/api/export/{doc.id}"
              class="btn btn-secondary btn-sm"
              title="Unduh CSV untuk dokumen ini saja"
            >Single CSV</a>
          {/if}
          <form
            id="delete-doc-mobile-{doc.id}"
            method="POST"
            action="/documents/{doc.id}?/delete"
            style="display: contents"
          >
            <button
              type="button"
              class="btn btn-inline-danger btn-sm"
              style="flex: 1"
              onclick={() => openDeleteDialog(doc)}
            >Hapus</button>
          </form>
        </div>
      </article>
    {/each}
  </div>
{/if}

<ConfirmDialog
  open={pendingDelete !== null}
  message={pendingDelete ? `"${pendingDelete.fileName}" akan dihapus.` : ''}
  onConfirm={confirmDelete}
  onCancel={cancelDelete}
/>
