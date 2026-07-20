// ── Training module (Review A1) ───────────────────────────────────────────────

const GIST_ID = "f9f86c5e14e3c389ff922777d733b174";
const BANK_GIST_ID = "f363dba0f4678f9328e71109fef35fb4"; // gist that holds bank.txt (question banks)
const GIST_TOKEN = "__GIST_TOKEN__";
const GIST_VOCAB_FILE = "vocab.txt";
const GIST_BANK_FILE = "bank.txt";
const GIST_SUBMISSIONS_FILE = "training-submissions.json";
const TOKEN_KEY = "gc_token";
const GIST_AUTH_KEY = "AsYx_O!!2";
const SESSION_KEY = "gc-training-session";

const ARTICLES = { maskulin: "der", feminin: "die", netral: "das", kein: "" };
const CHAPTER_RE = /^Chapter ([1-9]|1[0-2])$/;

const TEIL1_COUNT = 15;
const TEIL2_COUNT = 10;
const TEIL3_COUNT = 10;

// sed injects the token into every literal, so compare against a split string
function hasToken() {
  return !!GIST_TOKEN && GIST_TOKEN !== "__GIST" + "_TOKEN__";
}

let bank = null;
let vocabData = null;
let session = null;

const $id = (id) => document.getElementById(id);

function escHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const sample = (arr, n) => shuffle(arr).slice(0, n);

// ── Data loading ──────────────────────────────────────────────────────────────

async function fetchGistFile(gistId, fileName) {
  const headers = hasToken() ? { Authorization: `token ${GIST_TOKEN}` } : {};
  const res = await fetch(`https://api.github.com/gists/${gistId}`, {
    headers,
  });
  if (!res.ok) throw new Error(`gist ${gistId}: HTTP ${res.status}`);
  const gist = await res.json();
  const file = gist.files && gist.files[fileName];
  if (!file) return null;
  if (file.truncated) {
    const raw = await fetch(file.raw_url);
    if (!raw.ok) throw new Error(`raw_url: HTTP ${raw.status}`);
    return raw.text();
  }
  return file.content;
}

async function loadBank() {
  if (bank) return bank;
  if (BANK_GIST_ID) {
    try {
      const content = await fetchGistFile(BANK_GIST_ID, GIST_BANK_FILE);
      if (content) {
        bank = JSON.parse(content);
        return bank;
      }
    } catch (e) {}
  }
  const res = await fetch(`bank.txt?t=${Date.now()}`);
  if (!res.ok) throw new Error("bank.txt not found");
  bank = await res.json();
  return bank;
}

async function loadVocab() {
  if (vocabData) return vocabData;
  try {
    const content = await fetchGistFile(GIST_ID, GIST_VOCAB_FILE);
    if (content) {
      vocabData = JSON.parse(content);
      return vocabData;
    }
  } catch (e) {}
  const res = await fetch(`../vocab.txt?t=${Date.now()}`);
  if (!res.ok) throw new Error("vocab not found");
  vocabData = await res.json();
  return vocabData;
}

// ── Views ─────────────────────────────────────────────────────────────────────

const VIEW_IDS = ["view-list", "view-exercise", "view-done", "view-admin"];

function showView(id) {
  VIEW_IDS.forEach((v) => $id(v).classList.toggle("hidden", v !== id));
  $id("tr-title").textContent =
    id === "view-exercise"
      ? "Review A1"
      : id === "view-admin"
        ? "Training · Admin"
        : "Training";
  window.scrollTo(0, 0);
}

// ── Session build ─────────────────────────────────────────────────────────────

function buildTeil2Pool() {
  const chapterIds = new Set(
    (vocabData.groups || [])
      .filter((g) => CHAPTER_RE.test(g.name))
      .flatMap((g) => g.cardIds || []),
  );
  const nouns = (vocabData.nouns || [])
    .filter((n) => chapterIds.has(n.id))
    .map((n) => ({
      wordId: n.id,
      word: (ARTICLES[n.gender] ? ARTICLES[n.gender] + " " : "") + n.name,
      deck: "nouns",
      meaning: n.meaning || {},
    }));
  const verbs = (vocabData.verbs || [])
    .filter((v) => chapterIds.has(v.id))
    .map((v) => ({
      wordId: v.id,
      word: v.name,
      deck: "verbs",
      meaning: v.meaning || {},
    }));
  return nouns.concat(verbs);
}

function buildSession() {
  return {
    training: "review-a1",
    startedAt: new Date().toISOString(),
    teil1: sample(bank.teil1, TEIL1_COUNT).map((q) => ({
      ...q,
      studentAnswer: "",
    })),
    teil2: sample(buildTeil2Pool(), TEIL2_COUNT).map((q) => ({
      ...q,
      studentAnswer: "",
    })),
    teil3: sample(bank.teil3, TEIL3_COUNT).map((q) => ({
      ...q,
      studentAnswer: "",
    })),
  };
}

function loadSavedSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (s && s.training === "review-a1" && s.teil1 && s.teil2 && s.teil3)
      return s;
  } catch (e) {}
  return null;
}

let _saveTimer = null;
function saveSessionDebounced() {
  clearTimeout(_saveTimer);
  _saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch (e) {}
  }, 300);
}

function clearSavedSession() {
  clearTimeout(_saveTimer);
  localStorage.removeItem(SESSION_KEY);
}

// ── Rendering ─────────────────────────────────────────────────────────────────

function renderExercise() {
  $id("teil1-list").innerHTML = session.teil1
    .map((q, i) => {
      const parts = q.sentence.split("___");
      const vals = Array.isArray(q.studentAnswer)
        ? q.studentAnswer
        : [q.studentAnswer];
      let text = escHtml(parts[0]);
      for (let b = 0; b < parts.length - 1; b++) {
        text += `<input type="text" class="blank-input"
        data-teil="teil1" data-idx="${i}" data-blank="${b}" value="${escHtml(vals[b] || "")}"
        autocapitalize="off" autocomplete="off" spellcheck="false">${escHtml(parts[b + 1] || "")}`;
      }
      return `<div class="q-item">
      <span class="q-num">${i + 1}</span>
      <div class="q-text">${text}</div>
    </div>`;
    })
    .join("");

  $id("teil2-list").innerHTML = session.teil2
    .map((q, i) => {
      const badge = q.deck === "verbs" ? "Verb" : "Nomen";
      return `<div class="q-item">
      <span class="q-num">${i + 1}</span>
      <div class="q-text"><span class="q-word">${escHtml(q.word)}</span><span class="q-word-badge">${badge}</span></div>
      <input type="text" class="full-input" data-teil="teil2" data-idx="${i}"
        value="${escHtml(q.studentAnswer)}" autocomplete="off" spellcheck="false">
    </div>`;
    })
    .join("");

  $id("teil3-list").innerHTML = session.teil3
    .map(
      (q, i) => `<div class="q-item">
      <span class="q-num">${i + 1}</span>
      <div class="q-text">${escHtml(q.de)}</div>
      <textarea class="full-input" rows="2" data-teil="teil3" data-idx="${i}"
        autocomplete="off" spellcheck="false">${escHtml(q.studentAnswer)}</textarea>
    </div>`,
    )
    .join("");

  $id("btn-submit").disabled = false;
  $id("submit-status").classList.add("hidden");
  $id("btn-download-fallback").classList.add("hidden");
}

// ── Start flow ────────────────────────────────────────────────────────────────

async function startTraining() {
  const status = $id("list-status");
  status.textContent = "Loading…";
  status.classList.remove("hidden");
  try {
    await Promise.all([loadBank(), loadVocab()]);
  } catch (e) {
    status.textContent =
      "Gagal memuat soal. Periksa koneksi internet, lalu coba lagi.";
    return;
  }
  status.classList.add("hidden");

  const saved = loadSavedSession();
  if (saved) {
    $id("resume-modal-overlay").classList.remove("hidden");
    return;
  }
  session = buildSession();
  saveSessionDebounced();
  renderExercise();
  showView("view-exercise");
}

function resumeSaved(continueIt) {
  $id("resume-modal-overlay").classList.add("hidden");
  if (continueIt) {
    session = loadSavedSession();
  } else {
    clearSavedSession();
    session = buildSession();
    saveSessionDebounced();
  }
  renderExercise();
  showView("view-exercise");
}

// ── Answer tracking + validation ──────────────────────────────────────────────

function onAnswerInput(e) {
  const el = e.target;
  const teil = el.dataset.teil;
  if (!teil || !session) return;
  const item = session[teil][Number(el.dataset.idx)];
  const nBlanks =
    teil === "teil1" ? item.sentence.split("___").length - 1 : 1;
  if (nBlanks > 1) {
    if (!Array.isArray(item.studentAnswer))
      item.studentAnswer = new Array(nBlanks).fill("");
    item.studentAnswer[Number(el.dataset.blank)] = el.value;
  } else {
    item.studentAnswer = el.value;
  }
  el.classList.remove("unanswered");
  saveSessionDebounced();
}

function validateAnswers() {
  const fields = $id("view-exercise").querySelectorAll("[data-teil]");
  let firstEmpty = null;
  fields.forEach((el) => {
    if (!el.value.trim()) {
      el.classList.add("unanswered");
      if (!firstEmpty) firstEmpty = el;
    }
  });
  if (firstEmpty) {
    const status = $id("submit-status");
    status.textContent = "Masih ada soal yang belum diisi.";
    status.classList.remove("hidden", "ok");
    firstEmpty.scrollIntoView({ behavior: "smooth", block: "center" });
    firstEmpty.focus({ preventScroll: true });
    return false;
  }
  return true;
}

// ── Submit ────────────────────────────────────────────────────────────────────

let _pendingSubmission = null;

function buildSubmission(name) {
  return {
    id: genId(),
    training: session.training,
    name,
    startedAt: session.startedAt,
    timestamp: new Date().toISOString(),
    teil1: session.teil1,
    teil2: session.teil2,
    teil3: session.teil3,
  };
}

async function readSubmissionsStore() {
  if (hasToken()) {
    const content = await fetchGistFile(GIST_ID, GIST_SUBMISSIONS_FILE);
    if (!content) return { submissions: [] };
    try {
      return JSON.parse(content);
    } catch (e) {
      return { submissions: [] };
    }
  }
  // local dev
  try {
    const res = await fetch(`../${GIST_SUBMISSIONS_FILE}?t=${Date.now()}`);
    if (res.ok) return await res.json();
  } catch (e) {}
  return { submissions: [] };
}

async function writeSubmissionsStore(store) {
  if (hasToken()) {
    const res = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `token ${GIST_TOKEN}`,
      },
      body: JSON.stringify({
        files: {
          [GIST_SUBMISSIONS_FILE]: { content: JSON.stringify(store, null, 2) },
        },
      }),
    });
    if (!res.ok) throw new Error(`PATCH failed: ${res.status}`);
    return;
  }
  const res = await fetch(`/${GIST_SUBMISSIONS_FILE}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(store, null, 2),
  });
  if (!res.ok) throw new Error(`local save failed: ${res.status}`);
}

async function sendSubmission(submission) {
  let lastErr = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const store = await readSubmissionsStore();
      if (!Array.isArray(store.submissions)) store.submissions = [];
      store.submissions.push(submission);
      await writeSubmissionsStore(store);
      return;
    } catch (e) {
      lastErr = e;
      await new Promise((r) => setTimeout(r, 800 * attempt));
    }
  }
  throw lastErr;
}

async function submitWithName(name) {
  $id("name-modal-overlay").classList.add("hidden");
  const status = $id("submit-status");
  const btn = $id("btn-submit");
  btn.disabled = true;
  status.textContent = "Speichern… / Menyimpan…";
  status.classList.remove("hidden");
  status.classList.add("ok");

  const submission = buildSubmission(name);
  _pendingSubmission = submission;

  try {
    await sendSubmission(submission);
  } catch (e) {
    btn.disabled = false;
    status.textContent =
      "Gagal menyimpan jawaban. Coba lagi, atau download jawabanmu di bawah dan kirim manual.";
    status.classList.remove("ok");
    $id("btn-download-fallback").classList.remove("hidden");
    return;
  }

  clearSavedSession();
  session = null;
  $id("done-text").textContent =
    `Vielen Dank, ${name}! Deine Antworten wurden gespeichert. (Jawabanmu sudah tersimpan.)`;
  showView("view-done");
}

function downloadFallback() {
  if (!_pendingSubmission) return;
  const blob = new Blob([JSON.stringify(_pendingSubmission, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `review-a1_${_pendingSubmission.name || "answers"}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── Admin ─────────────────────────────────────────────────────────────────────

async function fetchRemoteToken() {
  try {
    const data = await loadVocab();
    return data[GIST_AUTH_KEY] ?? null;
  } catch (e) {
    return null;
  }
}

function openLoginModal() {
  $id("login-user").value = "";
  $id("login-pass").value = "";
  setLoginError("");
  $id("btn-login-confirm").disabled = false;
  $id("login-modal-overlay").classList.remove("hidden");
  $id("login-user").focus();
}

function closeLoginModal() {
  $id("login-modal-overlay").classList.add("hidden");
}

function isLoginModalOpen() {
  return !$id("login-modal-overlay").classList.contains("hidden");
}

function setLoginError(msg) {
  const el = $id("login-error");
  el.textContent = msg;
  el.classList.toggle("hidden", !msg);
}

async function submitLogin() {
  const username = $id("login-user").value.trim().toLowerCase();
  const password = $id("login-pass").value;

  if (username !== "admin" || password !== "admindeutsch") {
    setLoginError("Incorrect username or password.");
    return;
  }

  const btn = $id("btn-login-confirm");
  btn.disabled = true;
  setLoginError("");
  const token = await fetchRemoteToken();
  btn.disabled = false;

  if (!token) {
    setLoginError("Could not reach the server — check your connection and try again.");
    return;
  }

  localStorage.setItem(TOKEN_KEY, token);
  closeLoginModal();
  showAdmin();
}

let _submissions = [];

async function showAdmin() {
  showView("view-admin");
  await loadSubmissions();
}

async function openAdmin() {
  const stored = localStorage.getItem(TOKEN_KEY);
  if (stored) {
    const current = await fetchRemoteToken();
    // Unreachable: don't log out over a network hiccup — the admin view's own
    // loading will surface any real connectivity problem.
    if (current === null || current === stored) { showAdmin(); return; }
    // Token rotated remotely — session revoked
    localStorage.removeItem(TOKEN_KEY);
  }
  openLoginModal();
}

async function loadSubmissions() {
  const status = $id("admin-status");
  const list = $id("submissions-list");
  status.textContent = "Loading…";
  status.classList.remove("hidden");
  list.innerHTML = "";
  let store;
  try {
    store = await readSubmissionsStore();
  } catch (e) {
    status.textContent = "Could not load submissions.";
    return;
  }
  _submissions = (store.submissions || []).slice().reverse();
  if (!_submissions.length) {
    status.textContent = "No submissions yet.";
    return;
  }
  status.classList.add("hidden");
  list.innerHTML = _submissions
    .map(
      (s, i) => `<div class="submission-row">
      <span class="s-name">${escHtml(s.name || "?")}</span>
      <span class="s-date">${escHtml(new Date(s.timestamp).toLocaleString())}</span>
      <button class="s-pdf" data-sub="${i}">Download PDF</button>
    </div>`,
    )
    .join("");
}

// ── PDF (print window) ────────────────────────────────────────────────────────

function submissionHtml(sub) {
  const date = new Date(sub.timestamp).toLocaleString();
  const t1 = (sub.teil1 || [])
    .map((q, i) => {
      const parts = q.sentence.split("___");
      const vals = Array.isArray(q.studentAnswer)
        ? q.studentAnswer
        : [q.studentAnswer];
      let filled = escHtml(parts[0]);
      for (let b = 0; b < parts.length - 1; b++) {
        const v = (vals[b] || "").trim();
        filled += `<strong class="stud">${escHtml(v || "___")}</strong>${escHtml(parts[b + 1] || "")}`;
      }
      return `<div class="item">
      <p class="prob">${i + 1}. ${filled}</p>
      <p class="aid">Richtig: ${escHtml((q.answers || []).join(" / "))}</p>
    </div>`;
    })
    .join("");
  const t2 = (sub.teil2 || [])
    .map(
      (q, i) => `<div class="item">
      <p class="prob">${i + 1}. <strong>${escHtml(q.word)}</strong>
        <em>(${q.deck === "verbs" ? "Verb" : "Nomen"}${q.meaning && q.meaning.ind ? " · " + escHtml(q.meaning.ind) : ""}${q.meaning && q.meaning.eng ? " · " + escHtml(q.meaning.eng) : ""})</em></p>
      <p class="ans">Satz: <strong class="stud">${escHtml(q.studentAnswer || "—")}</strong></p>
    </div>`,
    )
    .join("");
  const t3 = (sub.teil3 || [])
    .map(
      (q, i) => `<div class="item">
      <p class="prob">${i + 1}. ${escHtml(q.de)}</p>
      <p class="ans">Übersetzung: <strong class="stud">${escHtml(q.studentAnswer || "—")}</strong></p>
      <p class="aid">Referenz: ${escHtml(q.ind || "")}</p>
    </div>`,
    )
    .join("");

  return `<meta charset="UTF-8">
<style>
  @page { margin: 1.5cm; }
  body { font-family: system-ui, -apple-system, "Segoe UI", sans-serif; color: #111; font-size: 12px; }
  h1 { font-size: 18px; margin-bottom: 2px; }
  .meta { color: #555; margin-bottom: 18px; }
  h2 { font-size: 14px; margin: 18px 0 8px; border-bottom: 1px solid #999; padding-bottom: 3px; }
  section { page-break-inside: avoid; }
  section + section { page-break-before: always; }
  .item { margin-bottom: 10px; page-break-inside: avoid; }
  .prob { margin: 0 0 2px; }
  .ans { margin: 0 0 1px; background: #f3f3f3; padding: 2px 6px; border-radius: 4px; }
  .aid { margin: 0; color: #777; font-size: 10.5px; }
  .stud { color: #c62828; font-weight: bold; }
</style>
<h1>Review A1</h1>
<p class="meta">Name: <strong>${escHtml(sub.name || "?")}</strong> &nbsp;·&nbsp; ${escHtml(date)}</p>
<section><h2>Teil 1 · Konjugation</h2>${t1}</section>
<section><h2>Teil 2 · Sätze schreiben</h2>${t2}</section>
<section><h2>Teil 3 · Übersetzung (Deutsch → Indonesisch)</h2>${t3}</section>`;
}

function downloadPdf(sub) {
  const w = window.open("", "_blank");
  if (!w) {
    window.alert("Pop-up blocked. Please allow pop-ups for this site.");
    return;
  }
  w.document.write(submissionHtml(sub));
  const day = (sub.timestamp || "").slice(0, 10);
  w.document.title = `ReviewA1_${(sub.name || "student").replace(/[^\w-]+/g, "_")}_${day}`;
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 250);
}

// ── Init ──────────────────────────────────────────────────────────────────────

function init() {
  document.querySelectorAll(".training-card").forEach((btn) => {
    btn.addEventListener("click", startTraining);
  });

  $id("view-exercise").addEventListener("input", onAnswerInput);

  $id("btn-submit").addEventListener("click", () => {
    if (!validateAnswers()) return;
    $id("student-name").value = "";
    $id("name-modal-overlay").classList.remove("hidden");
    $id("student-name").focus();
  });

  $id("btn-name-cancel").addEventListener("click", () => {
    $id("name-modal-overlay").classList.add("hidden");
  });
  $id("btn-name-confirm").addEventListener("click", () => {
    const name = $id("student-name").value.trim();
    if (!name) {
      $id("student-name").classList.add("unanswered");
      return;
    }
    submitWithName(name);
  });
  $id("student-name").addEventListener("input", (e) =>
    e.target.classList.remove("unanswered"),
  );
  $id("student-name").addEventListener("keydown", (e) => {
    if (e.key === "Enter") $id("btn-name-confirm").click();
  });

  $id("btn-resume-continue").addEventListener("click", () => resumeSaved(true));
  $id("btn-resume-new").addEventListener("click", () => resumeSaved(false));

  $id("btn-download-fallback").addEventListener("click", downloadFallback);
  $id("btn-done-back").addEventListener("click", () => showView("view-list"));

  $id("btn-admin").addEventListener("click", openAdmin);
  $id("btn-admin-refresh").addEventListener("click", loadSubmissions);
  $id("btn-login-confirm").addEventListener("click", submitLogin);
  $id("btn-login-cancel").addEventListener("click", closeLoginModal);
  $id("login-modal-overlay").addEventListener("click", (e) => {
    if (e.target === $id("login-modal-overlay")) closeLoginModal();
  });
  ["login-user", "login-pass"].forEach((id) =>
    $id(id).addEventListener("keydown", (e) => {
      if (e.key === "Enter") submitLogin();
    }),
  );
  $id("submissions-list").addEventListener("click", (e) => {
    const btn = e.target.closest(".s-pdf");
    if (btn) downloadPdf(_submissions[Number(btn.dataset.sub)]);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      $id("name-modal-overlay").classList.add("hidden");
      $id("resume-modal-overlay").classList.add("hidden");
      closeLoginModal();
    }
  });
}

init();
