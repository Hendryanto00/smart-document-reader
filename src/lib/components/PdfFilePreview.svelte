<script lang="ts">
  import { onMount } from 'svelte';
  import { pdfFirstPageToBase64 } from '$lib/pdf-preview';

  let { src, alt = 'Preview PDF halaman 1' } = $props();

  let previewUrl = $state<string | null>(null);
  let loading = $state(true);
  let error = $state('');

  onMount(async () => {
    try {
      const thumb = await fetch(`${src}?preview=1`);
      if (thumb.ok) {
        const type = thumb.headers.get('content-type') ?? '';
        if (type.includes('image')) {
          const blob = await thumb.blob();
          previewUrl = URL.createObjectURL(blob);
          return;
        }
      }

      const res = await fetch(src);
      if (!res.ok) throw new Error('Gagal memuat file PDF');
      const blob = await res.blob();
      const file = new File([blob], 'document.pdf', { type: 'application/pdf' });
      const { base64, mime } = await pdfFirstPageToBase64(file);
      previewUrl = `data:${mime};base64,${base64}`;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Preview PDF gagal';
    } finally {
      loading = false;
    }
  });
</script>

{#if loading}
  <p class="muted" style="padding: 1rem">Memuat preview PDF…</p>
{:else if previewUrl}
  <img class="preview-img" src={previewUrl} {alt} />
{:else if error}
  <p class="alert alert-error" style="margin: 0.75rem">{error}</p>
{/if}
