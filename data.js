// ── Storage & Sync Config ─────────────────────────────────────────────────────

const STORAGE_KEY = "germancards";
const GIST_ID = "f9f86c5e14e3c389ff922777d733b174";
const GIST_TOKEN = "__GIST_TOKEN__";
const GIST_FILE = "vocab.txt";
const GIST_AUTH_KEY = "AsYx_O!!2";

// ── Shared Constants ──────────────────────────────────────────────────────────

const ARTICLES = {
  maskulin: "der",
  feminin: "die",
  netral: "das",
  neutrum: "das",
  kein: "",
};

// Resolves a noun's article; "" for article-less nouns (gender "kein")
function nounArticle(noun) {
  return noun.gender === "kein" ? "" : ARTICLES[noun.gender] || "der";
}

const CONJ_KEYS = ["ich", "du", "er/sie/es", "wir", "ihr", "Sie"];
const CONJ_IDS = [
  "conj-ich",
  "conj-du",
  "conj-er",
  "conj-wir",
  "conj-ihr",
  "conj-sie",
];

const PRAE_IDS = [
  "prae-ich",
  "prae-du",
  "prae-er",
  "prae-wir",
  "prae-ihr",
  "prae-sie",
];

// ── Seed Data ─────────────────────────────────────────────────────────────────

const SEED = {
  verbs: [
    {
      id: "1",
      name: "buchstabieren",
      type: "regular",
      conjugations: {
        ich: "buchstabiere",
        du: "buchstabierst",
        "er/sie/es": "buchstabiert",
        wir: "buchstabieren",
        ihr: "buchstabiert",
        Sie: "buchstabieren",
      },
      praeteritum: {
        ich: "buchstabierte",
        du: "buchstabiertest",
        "er/sie/es": "buchstabierte",
        wir: "buchstabierten",
        ihr: "buchstabiertet",
        Sie: "buchstabierten",
      },
      meaning: { eng: "to spell", ind: "mengeja" },
    },
    {
      id: "2",
      name: "heißen",
      type: "irregular",
      conjugations: {
        ich: "heiße",
        du: "heißt",
        "er/sie/es": "heißt",
        wir: "heißen",
        ihr: "heißt",
        Sie: "heißen",
      },
      praeteritum: {
        ich: "hieß",
        du: "hießt",
        "er/sie/es": "hieß",
        wir: "hießen",
        ihr: "hießt",
        Sie: "hießen",
      },
      meaning: { eng: "to be called", ind: "bernama / dipanggil" },
    },
    {
      id: "3",
      name: "kommen",
      type: "irregular",
      conjugations: {
        ich: "komme",
        du: "kommst",
        "er/sie/es": "kommt",
        wir: "kommen",
        ihr: "kommt",
        Sie: "kommen",
      },
      praeteritum: {
        ich: "kam",
        du: "kamst",
        "er/sie/es": "kam",
        wir: "kamen",
        ihr: "kamt",
        Sie: "kamen",
      },
      meaning: { eng: "to come", ind: "datang" },
    },
    {
      id: "4",
      name: "lernen",
      type: "regular",
      conjugations: {
        ich: "lerne",
        du: "lernst",
        "er/sie/es": "lernt",
        wir: "lernen",
        ihr: "lernt",
        Sie: "lernen",
      },
      praeteritum: {
        ich: "lernte",
        du: "lerntest",
        "er/sie/es": "lernte",
        wir: "lernten",
        ihr: "lerntet",
        Sie: "lernten",
      },
      meaning: { eng: "to learn", ind: "belajar" },
    },
    {
      id: "5",
      name: "sein",
      type: "irregular",
      conjugations: {
        ich: "bin",
        du: "bist",
        "er/sie/es": "ist",
        wir: "sind",
        ihr: "seid",
        Sie: "sind",
      },
      praeteritum: {
        ich: "war",
        du: "warst",
        "er/sie/es": "war",
        wir: "waren",
        ihr: "wart",
        Sie: "waren",
      },
      meaning: { eng: "to be", ind: "adalah / menjadi" },
    },
    {
      id: "6",
      name: "sprechen",
      type: "irregular",
      conjugations: {
        ich: "spreche",
        du: "sprichst",
        "er/sie/es": "spricht",
        wir: "sprechen",
        ihr: "sprecht",
        Sie: "sprechen",
      },
      praeteritum: {
        ich: "sprach",
        du: "sprachst",
        "er/sie/es": "sprach",
        wir: "sprachen",
        ihr: "spracht",
        Sie: "sprachen",
      },
      meaning: { eng: "to speak", ind: "berbicara" },
    },
    {
      id: "7",
      name: "wohnen",
      type: "regular",
      conjugations: {
        ich: "wohne",
        du: "wohnst",
        "er/sie/es": "wohnt",
        wir: "wohnen",
        ihr: "wohnt",
        Sie: "wohnen",
      },
      praeteritum: {
        ich: "wohnte",
        du: "wohntest",
        "er/sie/es": "wohnte",
        wir: "wohnten",
        ihr: "wohntet",
        Sie: "wohnten",
      },
      meaning: { eng: "to live / to reside", ind: "tinggal" },
    },
  ],
  nouns: [
    {
      id: "8",
      name: "Name",
      plural: "Namen",
      gender: "maskulin",
      meaning: { eng: "name", ind: "nama" },
    },
    {
      id: "9",
      name: "Vorname",
      plural: "Vornamen",
      gender: "maskulin",
      meaning: { eng: "first name", ind: "nama depan" },
    },
    {
      id: "10",
      name: "Nachname",
      plural: "Nachnamen",
      gender: "maskulin",
      meaning: { eng: "last name / surname", ind: "nama belakang" },
    },
    {
      id: "11",
      name: "Telefonnummer",
      plural: "Telefonnummern",
      gender: "feminin",
      meaning: { eng: "phone number", ind: "nomor telepon" },
    },
    {
      id: "12",
      name: "Handynummer",
      plural: "Handynummern",
      gender: "feminin",
      meaning: { eng: "mobile number", ind: "nomor HP" },
    },
    {
      id: "13",
      name: "Hausnummer",
      plural: "Hausnummern",
      gender: "feminin",
      meaning: { eng: "house number", ind: "nomor rumah" },
    },
    {
      id: "14",
      name: "E-Mail-Adresse",
      plural: "E-Mail-Adressen",
      gender: "feminin",
      meaning: { eng: "email address", ind: "alamat email" },
    },
    {
      id: "15",
      name: "Webseite",
      plural: "Webseiten",
      gender: "feminin",
      meaning: { eng: "website", ind: "situs web" },
    },
    {
      id: "16",
      name: "Straße",
      plural: "Straßen",
      gender: "feminin",
      meaning: { eng: "street", ind: "jalan" },
    },
    {
      id: "17",
      name: "Postleitzahl",
      plural: "Postleitzahlen",
      gender: "feminin",
      meaning: { eng: "postal code", ind: "kode pos" },
    },
    {
      id: "18",
      name: "Stadt",
      plural: "Städte",
      gender: "feminin",
      meaning: { eng: "city", ind: "kota" },
    },
    {
      id: "19",
      name: "Land",
      plural: "Länder",
      gender: "netral",
      meaning: { eng: "country", ind: "negara" },
    },
    {
      id: "20",
      name: "Sprache",
      plural: "Sprachen",
      gender: "feminin",
      meaning: { eng: "language", ind: "bahasa" },
    },
  ],
  adjectives: [],
  adverbs: [],
  prepositions: [],
  groups: [],
};

// ── Persistence ───────────────────────────────────────────────────────────────

function loadData() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const seed = JSON.parse(JSON.stringify(SEED));
    saveData(seed);
    return seed;
  }
  const data = JSON.parse(raw);
  delete data[GIST_AUTH_KEY];
  if (!data.groups) data.groups = [];
  if (!data.adjectives) data.adjectives = [];
  if (!data.adverbs) data.adverbs = [];
  if (!data.prepositions) data.prepositions = [];
  return data;
}

const PENDING_KEY       = "updatetobepushed";
const PENDING_LABEL_KEY = "updatetobepushed-label";
// Failures retry immediately; after this many rapid attempts, pace out so we
// don't hammer GitHub's rate limit (which would only delay recovery)
const FAST_RETRIES  = 5;
const SLOW_RETRY_MS = 3000;

let _pushTimer    = null;
let _pushInFlight = false;
let _pushAttempts = 0;

function saveData(data, label) {
  // Preserve the auth key so it survives round-trips through localStorage
  let toStore = data;
  const existingRaw = localStorage.getItem(STORAGE_KEY);
  if (existingRaw) {
    const existing = JSON.parse(existingRaw);
    if (existing[GIST_AUTH_KEY])
      toStore = { ...data, [GIST_AUTH_KEY]: existing[GIST_AUTH_KEY] };
  }
  const serialized = JSON.stringify(toStore);
  localStorage.setItem(STORAGE_KEY, serialized);
  // Queue the remote push; the payload stays in localStorage until it succeeds,
  // so a failed push survives page reloads and keeps retrying.
  localStorage.setItem(PENDING_KEY, serialized);
  localStorage.setItem(PENDING_LABEL_KEY, label || "changes");
  _pushAttempts = 0;
  pushPending();
}

function hasPendingPush() {
  return !!localStorage.getItem(PENDING_KEY);
}

async function pushPending() {
  const payload = localStorage.getItem(PENDING_KEY);
  if (!payload || _pushInFlight) return;
  const label = localStorage.getItem(PENDING_LABEL_KEY) || "changes";
  _pushInFlight = true;
  clearTimeout(_pushTimer);
  _pushAttempts++;
  syncToastShow(
    _pushAttempts > 1 ? `Retrying “${label}” (attempt ${_pushAttempts})…` : `Saving “${label}”…`,
    "syncing"
  );

  let ok = false;
  try {
    let res;
    if (GIST_ID && GIST_TOKEN && GIST_TOKEN !== "__GIST" + "_TOKEN__") {
      res = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `token ${GIST_TOKEN}`,
        },
        body: JSON.stringify({
          files: { [GIST_FILE]: { content: JSON.stringify(JSON.parse(payload), null, 2) } },
        }),
      });
    } else {
      // Local dev fallback (server.js); GitHub Pages always has the token injected
      res = await fetch("/vocab.txt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
      });
    }
    ok = res.ok;
  } catch {
    ok = false;
  }
  _pushInFlight = false;

  if (ok) {
    if (localStorage.getItem(PENDING_KEY) === payload) {
      localStorage.removeItem(PENDING_KEY);
      localStorage.removeItem(PENDING_LABEL_KEY);
      _pushAttempts = 0;
      syncToastShow(`Saved “${label}”`, "success");
    } else {
      // A newer save replaced the payload while this push was in flight
      _pushAttempts = 0;
      pushPending();
    }
  } else {
    _pushTimer = setTimeout(pushPending, _pushAttempts < FAST_RETRIES ? 0 : SLOW_RETRY_MS);
  }
}

window.addEventListener("online", pushPending);

// ── Sync status toast ─────────────────────────────────────────────────────────

let _syncToastTimer = null;

function syncToastShow(text, kind) {
  const el = document.getElementById("sync-toast");
  if (!el) return;
  el.classList.remove("hidden", "success", "syncing");
  el.classList.add(kind);
  document.getElementById("sync-toast-text").textContent = text;
  clearTimeout(_syncToastTimer);
  if (kind === "success")
    _syncToastTimer = setTimeout(() => el.classList.add("hidden"), 2500);
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}
