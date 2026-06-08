// ── Auth ──────────────────────────────────────────────────────────────────────

const TOKEN_KEY = "gc_token";

function isAuthed() {
  return !!localStorage.getItem(TOKEN_KEY);
}

async function fetchRemoteToken() {
  try {
    let data;
    if (GIST_ID) {
      const res  = await fetch(`https://api.github.com/gists/${GIST_ID}`);
      if (!res.ok) return null;
      const gist = await res.json();
      const raw  = gist.files?.[GIST_FILE]?.content;
      if (!raw) return null;
      data = JSON.parse(raw);
    } else {
      const res = await fetch("/vocab.txt");
      if (!res.ok) return null;
      data = await res.json();
    }
    return data[GIST_AUTH_KEY] ?? null;
  } catch {
    return null;
  }
}

async function guardCUD(fn) {
  // Already have a token — verify it still matches remote
  if (isAuthed()) {
    const stored  = localStorage.getItem(TOKEN_KEY);
    const current = await fetchRemoteToken();
    if (current && current === stored) { fn(); return; }
    // Token changed or unreachable — clear and bail; user can retry
    localStorage.removeItem(TOKEN_KEY);
    applyAuthUI();
    return;
  }

  // No token — prompt for credentials
  const username = window.prompt("User:");
  if (username === null || username.trim() !== "admin") return;

  const password = window.prompt("Password:");
  if (password === null) return;
  if (password !== "admindeutsch") { window.alert("Incorrect password."); return; }

  const token = await fetchRemoteToken();
  if (!token) { window.alert("Could not reach server."); return; }

  localStorage.setItem(TOKEN_KEY, token);
  applyAuthUI();
  fn();
}

function doLogout() {
  localStorage.removeItem(TOKEN_KEY);
  applyAuthUI();
}

function applyAuthUI() {
  setVisible("btn-logout", isAuthed());
}
