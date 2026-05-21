<script lang="ts">
  import '../app.css';
  import { page } from '$app/stores';

  let { children, data } = $props();

  const path = $derived($page.url.pathname);
  const isLoginPage = $derived(path === '/login');
  const isLandingPage = $derived(path === '/');

  function navActive(href: string): boolean {
    const p = $page.url.pathname;
    if (href === '/documents') {
      return p === '/documents' || (p.startsWith('/documents/') && !p.startsWith('/documents/upload'));
    }
    return p === href || p.startsWith(href + '/');
  }
</script>

{#if !isLoginPage}
  <header class="app-header" class:app-header-landing={isLandingPage}>
    <div class="header-inner">
      <a href={data.session ? '/documents' : '/'} class="brand">
        <span class="brand-icon" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="8" y1="13" x2="16" y2="13" />
            <line x1="8" y1="17" x2="13" y2="17" />
          </svg>
        </span>
        <span class="brand-name">Smart Document Reader</span>
      </a>

      {#if data.session}
        <nav class="header-nav" aria-label="Navigasi utama">
          <a href="/documents" class="nav-link" class:active={navActive('/documents')}>Dokumen</a>
          <a href="/documents/upload" class="nav-link" class:active={navActive('/documents/upload')}>Unggah</a>
          <form method="POST" action="/logout" class="nav-logout">
            <button type="submit" class="btn btn-secondary btn-sm btn-nav-logout">Keluar</button>
          </form>
        </nav>
      {:else if isLandingPage}
        <nav class="header-nav" aria-label="Navigasi">
          <a href="/login" class="btn btn-primary btn-sm">Masuk</a>
        </nav>
      {/if}
    </div>
  </header>
{/if}

<main
  class="container"
  class:container-login={isLoginPage}
  class:container-landing={isLandingPage}
>
  {@render children()}
</main>
