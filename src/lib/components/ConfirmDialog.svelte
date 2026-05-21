<script lang="ts">
  type Props = {
    open: boolean;
    title?: string;
    message?: string;
    hint?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
  };

  let {
    open,
    title = 'Anda yakin?',
    message = '',
    hint = 'Anda tidak dapat membatalkan tindakan ini!',
    confirmLabel = 'Ya, hapus!',
    cancelLabel = 'Tidak',
    onConfirm,
    onCancel
  }: Props = $props();

  $effect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });
</script>

{#if open}
  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
  <div class="swal-backdrop" onclick={onCancel}>
    <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
    <div
      class="swal-dialog"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="swal-title"
      onclick={(e) => e.stopPropagation()}
    >
      <div class="swal-icon swal-icon-warning" aria-hidden="true">
        <span class="swal-icon-body">!</span>
      </div>

      <h2 id="swal-title" class="swal-title">{title}</h2>

      {#if message}
        <p class="swal-message">{message}</p>
      {/if}
      {#if hint}
        <p class="swal-hint">{hint}</p>
      {/if}

      <div class="swal-actions">
        <button type="button" class="swal-btn swal-btn-confirm" onclick={onConfirm}>{confirmLabel}</button>
        <button type="button" class="swal-btn swal-btn-cancel" onclick={onCancel}>{cancelLabel}</button>
      </div>
    </div>
  </div>
{/if}
