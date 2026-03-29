<template>
  <div id="layout">
    <nav>
      <span class="brand">📋 AI Document Dashboard</span>
      <div class="links">
        <router-link to="/">Upload</router-link>
        <router-link to="/history">History</router-link>
      </div>
    </nav>
    <main>
      <router-view />
    </main>
  </div>
</template>

<script setup></script>

<style>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg: #f5f7fa;
  --surface: #ffffff;
  --border: #e0e4ec;
  --text: #1a1d23;
  --muted: #6b7280;
  --accent: #3b6fff;
  --accent-hover: #2a55dd;
  --danger: #e53e3e;
  --radius: 10px;
  --shadow: 0 1px 4px rgba(0,0,0,.08);
}

body {
  font-family: 'Segoe UI', system-ui, sans-serif;
  background: var(--bg);
  color: var(--text);
  font-size: 15px;
  line-height: 1.6;
}

#layout { min-height: 100vh; display: flex; flex-direction: column; }

nav {
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  padding: 0 2rem;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 10;
}

.brand { font-weight: 700; font-size: 1rem; letter-spacing: -.3px; }

.links { display: flex; gap: 1.5rem; }
.links a {
  color: var(--muted);
  text-decoration: none;
  font-size: .9rem;
  font-weight: 500;
  padding: 4px 0;
  border-bottom: 2px solid transparent;
  transition: color .15s, border-color .15s;
}
.links a:hover { color: var(--text); }
.links a.router-link-active { color: var(--accent); border-bottom-color: var(--accent); }

main { flex: 1; padding: 2rem 1rem; max-width: 760px; width: 100%; margin: 0 auto; }

.page h1 { font-size: 1.5rem; font-weight: 700; margin-bottom: .25rem; }
.subtitle { color: var(--muted); margin-bottom: 1.5rem; }

.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 1.5rem;
  box-shadow: var(--shadow);
  margin-bottom: 1.25rem;
}

.drop-zone {
  border: 2px dashed var(--border);
  border-radius: var(--radius);
  padding: 2.5rem 1rem;
  text-align: center;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: .4rem;
  transition: border-color .2s, background .2s;
  color: var(--muted);
  margin-bottom: 1rem;
}
.drop-zone:hover, .drop-zone--over { border-color: var(--accent); background: #f0f4ff; }
.drop-zone--filled { border-color: var(--accent); background: #f0f4ff; color: var(--text); }
.drop-zone strong { color: var(--accent); }
.drop-icon { font-size: 2rem; }
.file-icon { font-size: 2rem; }
.file-name { font-weight: 600; font-size: .95rem; }
.file-size { font-size: .8rem; color: var(--muted); }
.hint { font-size: .8rem; }

.btn {
  display: inline-flex;
  align-items: center;
  gap: .5rem;
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: .6rem 1.4rem;
  font-size: .9rem;
  font-weight: 600;
  cursor: pointer;
  transition: background .15s;
  width: 100%;
  justify-content: center;
}
.btn:hover:not(:disabled) { background: var(--accent-hover); }
.btn:disabled { opacity: .55; cursor: not-allowed; }

.spinner {
  width: 14px; height: 14px;
  border: 2px solid rgba(255,255,255,.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin .6s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.error { color: var(--danger); margin-top: .75rem; font-size: .875rem; }
.status { color: var(--muted); margin-top: 1rem; }

.result h2 { font-size: 1rem; font-weight: 700; margin: 1rem 0 .4rem; }
.result h2:first-child { margin-top: 0; }
.result p { color: var(--text); }
.result ul { padding-left: 1.25rem; }
.result li { margin-bottom: .3rem; }
.meta { font-size: .8rem; color: var(--muted); margin-top: 1rem; }

.tags { display: flex; flex-wrap: wrap; gap: .4rem; margin-top: .25rem; }
.tag {
  display: inline-block;
  padding: .2rem .65rem;
  border-radius: 20px;
  font-size: .8rem;
  font-weight: 600;
}
.tag--tech { background: #e8f0fe; color: #1a56db; }
.tag--soft { background: #e8fdf0; color: #0a7c42; }

.history-item { cursor: pointer; transition: border-color .15s; }
.history-item:hover { border-color: var(--accent); }
.history-item.expanded { border-color: var(--accent); }

.history-header {
  display: flex;
  align-items: center;
  gap: .75rem;
}
.filename { font-weight: 600; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.history-header .meta { flex-shrink: 0; font-size: .8rem; color: var(--muted); }
.chevron { color: var(--muted); flex-shrink: 0; }

.history-body { margin-top: 1rem; border-top: 1px solid var(--border); padding-top: 1rem; }
.history-body h3 { font-size: .9rem; font-weight: 700; margin: .75rem 0 .3rem; }
.history-body h3:first-child { margin-top: 0; }
.history-body ul { padding-left: 1.25rem; }
.history-body li { margin-bottom: .3rem; font-size: .9rem; }
.history-body p { font-size: .9rem; }
</style>
