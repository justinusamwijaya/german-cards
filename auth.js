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

async function attemptLogin(username, password) {
  if (username !== "admin" || password !== "admindeutsch") return false;
  const token = await fetchRemoteToken();
  if (!token) return false;
  localStorage.setItem(TOKEN_KEY, token);
  return true;
}

// Verifies stored token matches Gist before executing a CUD operation.
// Calls fn() if valid; forces logout if not.
async function guardCUD(fn) {
  if (!isAuthed()) { doLogout(); return; }
  const stored  = localStorage.getItem(TOKEN_KEY);
  const current = await fetchRemoteToken();
  if (!current || current !== stored) { doLogout(); return; }
  fn();
}

function doLogout() {
  localStorage.removeItem(TOKEN_KEY);
  applyAuthUI();
  showView("view-login");
  $("login-user").value = "";
  $("login-pass").value = "";
  hide("login-error");
}

function applyAuthUI() {
  const authed = isAuthed();
  setVisible("btn-add",       authed);
  setVisible("import-label",  authed);
  setVisible("card-actions",  authed);
  setVisible("btn-new-group", authed);
  setVisible("btn-logout",    authed);
}
