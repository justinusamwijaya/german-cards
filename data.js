// ── Storage & Sync Config ─────────────────────────────────────────────────────

const STORAGE_KEY  = "germancards";
const GIST_ID      = "f9f86c5e14e3c389ff922777d733b174";
const GIST_TOKEN   = "__GIST_TOKEN__";
const GIST_FILE    = "vocab.txt";
const GIST_AUTH_KEY = "AsYx_O!!2";

// ── Shared Constants ──────────────────────────────────────────────────────────

const ARTICLES = {
  maskulin: "der",
  feminin:  "die",
  netral:   "das",
  neutrum:  "das",
};

const CONJ_KEYS = ["ich", "du", "er/sie/es", "wir", "ihr", "Sie"];
const CONJ_IDS  = ["conj-ich", "conj-du", "conj-er", "conj-wir", "conj-ihr", "conj-sie"];

// ── Seed Data ─────────────────────────────────────────────────────────────────

const SEED = {
  verbs: [
    {
      id: "1", name: "buchstabieren", type: "regular",
      conjugations: { ich: "buchstabiere", du: "buchstabierst", "er/sie/es": "buchstabiert", wir: "buchstabieren", ihr: "buchstabiert", Sie: "buchstabieren" },
      meaning: { eng: "to spell", ind: "mengeja" },
    },
    {
      id: "2", name: "heißen", type: "irregular",
      conjugations: { ich: "heiße", du: "heißt", "er/sie/es": "heißt", wir: "heißen", ihr: "heißt", Sie: "heißen" },
      meaning: { eng: "to be called", ind: "bernama / dipanggil" },
    },
    {
      id: "3", name: "kommen", type: "irregular",
      conjugations: { ich: "komme", du: "kommst", "er/sie/es": "kommt", wir: "kommen", ihr: "kommt", Sie: "kommen" },
      meaning: { eng: "to come", ind: "datang" },
    },
    {
      id: "4", name: "lernen", type: "regular",
      conjugations: { ich: "lerne", du: "lernst", "er/sie/es": "lernt", wir: "lernen", ihr: "lernt", Sie: "lernen" },
      meaning: { eng: "to learn", ind: "belajar" },
    },
    {
      id: "5", name: "sein", type: "irregular",
      conjugations: { ich: "bin", du: "bist", "er/sie/es": "ist", wir: "sind", ihr: "seid", Sie: "sind" },
      meaning: { eng: "to be", ind: "adalah / menjadi" },
    },
    {
      id: "6", name: "sprechen", type: "irregular",
      conjugations: { ich: "spreche", du: "sprichst", "er/sie/es": "spricht", wir: "sprechen", ihr: "sprecht", Sie: "sprechen" },
      meaning: { eng: "to speak", ind: "berbicara" },
    },
    {
      id: "7", name: "wohnen", type: "regular",
      conjugations: { ich: "wohne", du: "wohnst", "er/sie/es": "wohnt", wir: "wohnen", ihr: "wohnt", Sie: "wohnen" },
      meaning: { eng: "to live / to reside", ind: "tinggal" },
    },
  ],
  nouns: [
    { id: "8",  name: "Name",          plural: "Namen",          gender: "maskulin", meaning: { eng: "name",         ind: "nama" } },
    { id: "9",  name: "Vorname",       plural: "Vornamen",       gender: "maskulin", meaning: { eng: "first name",   ind: "nama depan" } },
    { id: "10", name: "Nachname",      plural: "Nachnamen",      gender: "maskulin", meaning: { eng: "last name / surname", ind: "nama belakang" } },
    { id: "11", name: "Telefonnummer", plural: "Telefonnummern", gender: "feminin",  meaning: { eng: "phone number", ind: "nomor telepon" } },
    { id: "12", name: "Handynummer",   plural: "Handynummern",   gender: "feminin",  meaning: { eng: "mobile number", ind: "nomor HP" } },
    { id: "13", name: "Hausnummer",    plural: "Hausnummern",    gender: "feminin",  meaning: { eng: "house number", ind: "nomor rumah" } },
    { id: "14", name: "E-Mail-Adresse",plural: "E-Mail-Adressen",gender: "feminin",  meaning: { eng: "email address", ind: "alamat email" } },
    { id: "15", name: "Webseite",      plural: "Webseiten",      gender: "feminin",  meaning: { eng: "website",      ind: "situs web" } },
    { id: "16", name: "Straße",        plural: "Straßen",        gender: "feminin",  meaning: { eng: "street",       ind: "jalan" } },
    { id: "17", name: "Postleitzahl",  plural: "Postleitzahlen", gender: "feminin",  meaning: { eng: "postal code",  ind: "kode pos" } },
    { id: "18", name: "Stadt",         plural: "Städte",         gender: "feminin",  meaning: { eng: "city",         ind: "kota" } },
    { id: "19", name: "Land",          plural: "Länder",         gender: "netral",   meaning: { eng: "country",      ind: "negara" } },
    { id: "20", name: "Sprache",       plural: "Sprachen",       gender: "feminin",  meaning: { eng: "language",     ind: "bahasa" } },
  ],
  adjectives: [],
  adverbs: [],
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
  if (!data.groups)     data.groups     = [];
  if (!data.adjectives) data.adjectives = [];
  if (!data.adverbs)    data.adverbs    = [];
  return data;
}

function saveData(data) {
  // Preserve the auth key so it survives round-trips through localStorage
  let toStore = data;
  const existingRaw = localStorage.getItem(STORAGE_KEY);
  if (existingRaw) {
    const existing = JSON.parse(existingRaw);
    if (existing[GIST_AUTH_KEY]) toStore = { ...data, [GIST_AUTH_KEY]: existing[GIST_AUTH_KEY] };
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
  if (GIST_ID && GIST_TOKEN && GIST_TOKEN !== "__GIST_TOKEN__") {
    fetch(`https://api.github.com/gists/${GIST_ID}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `token ${GIST_TOKEN}`,
      },
      body: JSON.stringify({
        files: { [GIST_FILE]: { content: JSON.stringify(toStore, null, 2) } },
      }),
    }).catch(() => {});
  } else {
    fetch("/vocab.txt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toStore, null, 2),
    }).catch(() => {});
  }
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}
