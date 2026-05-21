<script lang="ts">
  let { form } = $props();
  let showPassword = $state(false);
</script>

<div class="login-wrap">
  <div class="card login-card">
    <div class="login-brand">
      <span class="brand-icon" aria-hidden="true">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="8" y1="13" x2="16" y2="13" />
          <line x1="8" y1="17" x2="13" y2="17" />
        </svg>
      </span>
      <h2>Smart Document Reader</h2>
      <p class="muted" style="margin: 0.35rem 0 0">Masuk untuk meninjau dan mengekspor dokumen</p>
    </div>

    {#if form?.error}
      <div class="alert alert-error">{form.error}</div>
    {/if}

    <form method="POST">
      <div class="field">
        <label for="email">Email</label>
        <input id="email" name="email" type="email" required value="demo@superbrands.test" />
      </div>
      <div class="field">
        <label for="password">Kata sandi</label>
        <div class="password-wrap">
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            required
            placeholder="DemoPass123!"
            autocomplete="current-password"
          />
          <button
            type="button"
            class="password-toggle"
            aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
            onclick={() => (showPassword = !showPassword)}
          >
            {#if showPassword}
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            {:else}
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            {/if}
          </button>
        </div>
      </div>
      <button type="submit" class="btn btn-primary btn-block">Masuk</button>
    </form>
  </div>
</div>
