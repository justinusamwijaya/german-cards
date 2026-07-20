// ── Auth ──────────────────────────────────────────────────────────────────────

const TOKEN_KEY = "gc_token";

// Action waiting for a successful login (set while the login modal is open)
let _pendingAuthedFn = null;

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
  if (isAuthed()) {
    const stored  = localStorage.getItem(TOKEN_KEY);
    const current = await fetchRemoteToken();
    // Unreachable (offline, GitHub rate limit): don't punish the user by
    // logging them out — let the action through; the data push retries anyway.
    if (current === null || current === stored) { fn(); return; }
    // Token rotated remotely — this session was revoked
    localStorage.removeItem(TOKEN_KEY);
    applyAuthUI();
    openLoginModal(fn, "Your session has expired — please log in again.");
    return;
  }
  openLoginModal(fn);
}

// ── Login modal ───────────────────────────────────────────────────────────────

function openLoginModal(fn, notice) {
  _pendingAuthedFn = fn || null;
  $("login-user").value = "";
  $("login-pass").value = "";
  setLoginError(notice || "");
  $("btn-login-confirm").disabled = false;
  show("modal-login-overlay");
  $("login-user").focus();
}

function closeLoginModal() {
  hide("modal-login-overlay");
  _pendingAuthedFn = null;
}

function isLoginModalOpen() {
  return !$("modal-login-overlay").classList.contains("hidden");
}

function setLoginError(msg) {
  setText("login-error", msg);
  setVisible("login-error", !!msg);
}

async function submitLogin() {
  const username = $("login-user").value.trim().toLowerCase();
  const password = $("login-pass").value;

  if (username !== "admin" || password !== "admindeutsch") {
    setLoginError("Incorrect username or password.");
    return;
  }

  const btn = $("btn-login-confirm");
  btn.disabled = true;
  setLoginError("");
  const token = await fetchRemoteToken();
  btn.disabled = false;

  if (!token) {
    setLoginError("Could not reach the server — check your connection and try again.");
    return;
  }

  localStorage.setItem(TOKEN_KEY, token);
  applyAuthUI();
  const fn = _pendingAuthedFn;
  closeLoginModal();
  if (fn) fn();
}

function doLogout() {
  localStorage.removeItem(TOKEN_KEY);
  applyAuthUI();
}

function applyAuthUI() {
  setVisible("btn-logout", isAuthed());
}
