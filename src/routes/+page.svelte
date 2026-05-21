<script lang="ts">
  const features = [
    {
      title: 'Unggah multi-format',
      desc: 'JPG, PNG, dan PDF (halaman pertama). Beberapa file sekaligus untuk batch review.',
      icon: 'upload'
    },
    {
      title: 'Ekstraksi AI',
      desc: 'Vision model membaca resi/faktur ke JSON: vendor, tanggal, total, mata uang, line items.',
      icon: 'spark'
    },
    {
      title: 'Tinjau manusia',
      desc: 'Field confidence rendah disorot. Anda koreksi sebelum data disimpan.',
      icon: 'check'
    },
    {
      title: 'Simpan & ekspor',
      desc: 'Data persisten di Cloudflare D1. Ekspor CSV bulk atau per dokumen.',
      icon: 'csv'
    }
  ];

  const steps = [
    { n: '1', title: 'Unggah', text: 'Pilih resi atau faktur (JPG, PNG, PDF).' },
    { n: '2', title: 'Ekstrak', text: 'AI mengisi vendor, tanggal, total, dan line items.' },
    { n: '3', title: 'Tinjau', text: 'Koreksi field yang perlu, lalu simpan ke database.' },
    { n: '4', title: 'Ekspor', text: 'Unduh CSV untuk laporan atau integrasi.' }
  ];
</script>

<div class="landing">
  <section class="landing-hero">
    <div class="landing-hero-content">
      <p class="landing-eyebrow">Pembaca dokumen keuangan berbasis AI</p>
      <h1 class="landing-title">
        <span class="landing-title-accent">Smart Document Reader</span>
      </h1>
      <p class="landing-lead">
        Ubah foto resi dan faktur menjadi data terstruktur — dengan alur tinjau manusia sebelum
        disimpan ke database.
      </p>
      <div class="landing-cta-row">
        <a href="/login" class="btn btn-primary btn-lg">Mulai sekarang</a>
      </div>
    </div>

    <div class="landing-hero-visual" aria-hidden="true">
      <div class="landing-mock">
        <div class="landing-mock-header">
          <span class="landing-mock-dot"></span>
          <span class="landing-mock-dot"></span>
          <span class="landing-mock-dot"></span>
          <span class="landing-mock-label">sample-invoice.pdf</span>
        </div>
        <div class="landing-mock-body">
          <div class="landing-mock-preview">
            <div class="landing-mock-receipt">
              <strong>PT DEMO SUPPLIER</strong>
              <span>INV-2026-042</span>
              <span class="landing-mock-line"></span>
              <span class="landing-mock-line short"></span>
              <span class="landing-mock-total">Total SGD 570</span>
            </div>
          </div>
          <div class="landing-mock-fields">
            <div class="landing-mock-field">
              <span>Vendor</span>
              <strong>PT DEMO SUPPLIER</strong>
              <em class="badge-ok">AI 94%</em>
            </div>
            <div class="landing-mock-field warn">
              <span>Tanggal</span>
              <strong>2026-05-10</strong>
              <em class="badge-warn">AI 58%</em>
            </div>
            <div class="landing-mock-field">
              <span>Total</span>
              <strong>570</strong>
              <em class="badge-ok">AI 91%</em>
            </div>
          </div>
        </div>
      </div>
      <div class="landing-glow landing-glow-a"></div>
      <div class="landing-glow landing-glow-b"></div>
    </div>
  </section>

  <section class="landing-section">
    <h2 class="landing-section-title">Fitur utama</h2>
    <p class="landing-section-sub muted">Dibangun untuk tes teknis — fokus pada alur nyata, bukan demo kosong.</p>
    <div class="landing-features">
      {#each features as f}
        <article class="landing-feature-card">
          <div class="landing-feature-icon" data-icon={f.icon}>
            {#if f.icon === 'upload'}
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            {:else if f.icon === 'spark'}
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2l2.4 7.2H22l-6 4.6 2.3 7.2L12 16.8 5.7 21l2.3-7.2-6-4.6h7.6z" />
              </svg>
            {:else if f.icon === 'check'}
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
            {:else}
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            {/if}
          </div>
          <h3>{f.title}</h3>
          <p class="muted">{f.desc}</p>
        </article>
      {/each}
    </div>
  </section>

  <section class="landing-section landing-section-alt">
    <div class="landing-section-inner">
      <h2 class="landing-section-title landing-section-title-center">Cara kerja</h2>
      <p class="landing-section-sub landing-section-sub-center muted">
        Empat langkah dari unggah dokumen sampai ekspor CSV.
      </p>
      <ol class="landing-steps">
        {#each steps as s}
          <li class="landing-step-card">
            <span class="landing-step-num">{s.n}</span>
            <div class="landing-step-body">
              <strong>{s.title}</strong>
              <p class="muted">{s.text}</p>
            </div>
          </li>
        {/each}
      </ol>
    </div>
  </section>

  <section class="landing-bottom-cta">
    <h2>Siap meninjau dokumen pertama?</h2>
    <p class="muted">Masuk dengan akun demo, unggah sampel, lalu ekspor CSV.</p>
    <a href="/login" class="btn btn-primary btn-lg">Buka aplikasi</a>
  </section>
</div>
