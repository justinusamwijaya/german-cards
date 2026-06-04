// ── Data Layer ────────────────────────────────────────────────────────────────

const STORAGE_KEY = "germancards";

// ── Gist config (fill in to enable GitHub Pages sync) ─────────────────────────
const GIST_ID = "f9f86c5e14e3c389ff922777d733b174"; // your Gist ID from gist.github.com/{user}/{id}
const GIST_TOKEN = "__GIST_TOKEN__"; // replaced by GitHub Actions at deploy time
const GIST_FILE = "vocab.txt";

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
  groups: [],
};

function loadData() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const seed = JSON.parse(JSON.stringify(SEED));
    saveData(seed);
    return seed;
  }
  const data = JSON.parse(raw);
  if (!data.groups) data.groups = [];
  return data;
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  if (GIST_ID && GIST_TOKEN) {
    fetch(`https://api.github.com/gists/${GIST_ID}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `token ${GIST_TOKEN}`,
      },
      body: JSON.stringify({
        files: { [GIST_FILE]: { content: JSON.stringify(data, null, 2) } },
      }),
    }).catch(() => {});
  } else {
    fetch("/vocab.txt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data, null, 2),
    }).catch(() => {});
  }
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// ── Constants ─────────────────────────────────────────────────────────────────

const ARTICLES = {
  maskulin: "der",
  feminin: "die",
  netral: "das",
  neutrum: "das",
};
const CONJ_KEYS = ["ich", "du", "er/sie/es", "wir", "ihr", "Sie"];
const CONJ_IDS = [
  "conj-ich",
  "conj-du",
  "conj-er",
  "conj-wir",
  "conj-ihr",
  "conj-sie",
];

// ── State ─────────────────────────────────────────────────────────────────────

let state = {
  deck: "nouns",
  cards: [],
  index: 0,
  knew: 0,
  didnt: 0,
  answers: {},
  editingId: null,
  modalType: "noun",
  viewMode: "library", // 'library' | 'group-study'
  activeGroupId: null,
};

// ── DOM helpers ───────────────────────────────────────────────────────────────

const $ = (id) => document.getElementById(id);

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function isNounCard(card) {
  return card.gender !== undefined;
}

// ── View Navigation ───────────────────────────────────────────────────────────

function showView(id) {
  document
    .querySelectorAll(".view")
    .forEach((v) => v.classList.remove("active"));
  $(id).classList.add("active");
}

function goToLibrary() {
  state.viewMode = "library";
  state.activeGroupId = null;
  showView("view-study");
  updateStudyHeader();
  switchDeck(state.deck === "combined" ? "nouns" : state.deck);
}

function goToGroups() {
  showView("view-groups");
  renderGroupsList();
}

function openGroup(groupId) {
  state.viewMode = "group-study";
  state.activeGroupId = groupId;
  showView("view-study");
  updateStudyHeader();
  switchDeck("nouns");
}

function updateStudyHeader() {
  const inGroup = state.viewMode === "group-study";
  $("btn-back-groups").classList.toggle("hidden", !inGroup);
  $("group-mode-label").classList.toggle("hidden", !inGroup);
  $("btn-groups").classList.toggle("hidden", inGroup);
  if (inGroup) {
    const data = loadData();
    const group = data.groups.find((g) => g.id === state.activeGroupId);
    $("group-mode-label").textContent = group ? group.name : "";
  }
}

// ── Deck Switching ────────────────────────────────────────────────────────────

function switchDeck(deckName) {
  state.deck = deckName;

  const toggle = $("deck-toggle");
  document
    .querySelectorAll(".toggle-opt")
    .forEach((opt) => opt.classList.remove("active"));
  toggle.classList.remove("verb-active");

  if (deckName === "nouns") {
    document.querySelector('[data-deck="nouns"]').classList.add("active");
  } else if (deckName === "verbs") {
    document.querySelector('[data-deck="verbs"]').classList.add("active");
    toggle.classList.add("verb-active");
  }

  $("btn-combine").classList.toggle("active", deckName === "combined");
  startDeck(deckName);
}

function startDeck(deckName) {
  const data = loadData();

  if (state.viewMode === "group-study") {
    const group = data.groups.find((g) => g.id === state.activeGroupId);
    const ids = new Set(group ? group.cardIds : []);
    const groupCards = [...data.verbs, ...data.nouns].filter((c) =>
      ids.has(c.id),
    );
    if (deckName === "combined") {
      state.cards = groupCards;
    } else if (deckName === "verbs") {
      state.cards = groupCards.filter((c) => !isNounCard(c));
    } else {
      state.cards = groupCards.filter(isNounCard);
    }
  } else {
    if (deckName === "combined") {
      state.cards = [...data.verbs, ...data.nouns];
    } else {
      state.cards = [...data[deckName]];
    }
  }

  // Apply revision-deck filter if active
  const revisionRaw = localStorage.getItem("revision-deck");
  if (revisionRaw) {
    const revIds = new Set(JSON.parse(revisionRaw));
    state.cards = state.cards.filter((c) => revIds.has(c.id));
  }
  $("revision-banner").classList.toggle("hidden", !revisionRaw);

  state.index = 0;
  state.knew = 0;
  state.didnt = 0;
  state.answers = {};

  if ($("shuffle-toggle").checked) shuffle(state.cards);

  $("study-content").classList.remove("hidden");
  $("summary-wrap").classList.add("hidden");
  renderCard();
}

// ── Card Rendering ────────────────────────────────────────────────────────────

function renderCard() {
  showDeleteConfirm(false);
  $("card-inner").classList.remove("flipped");

  const inGroup = state.viewMode === "group-study";
  $("btn-delete-card").textContent = inGroup ? "✗ Remove" : "🗑️ Delete";
  $("delete-confirm-text").textContent = inGroup
    ? "Remove from group?"
    : "Delete this card?";

  if (state.cards.length === 0) {
    showSummary();
    return;
  }

  const card = state.cards[state.index];
  $("card-counter").textContent = `${state.index + 1} / ${state.cards.length}`;
  $("btn-prev").disabled = state.index === 0;
  $("btn-next").disabled = state.index === state.cards.length - 1;

  if (isNounCard(card)) {
    renderNounCard(card);
  } else {
    renderVerbCard(card);
  }

  const ans = state.answers[card.id];
  $("btn-knew").classList.toggle("answered", ans === "knew");
  $("btn-didnt").classList.toggle("answered", ans === "didnt");
  updateScoreDisplay();
}

function renderNounCard(noun) {
  const article = ARTICLES[noun.gender] || "der";
  const gClass =
    { maskulin: "gender-m", feminin: "gender-f", netral: "gender-n" }[
      noun.gender
    ] || "gender-m";
  const articleClass =
    article === "der" ? "article-der" : article === "die" ? "article-die" : "";

  $("card-front").className = "card-front";
  $("card-front").innerHTML = `
    <div class="card-front-inner">
      <span class="badge noun-badge">Nomen</span>
      <div class="card-word"><span class="card-article ${articleClass}">${article}</span> ${noun.name}</div>
      <div class="card-hint">hold to reveal</div>
    </div>`;

  $("card-back").innerHTML = `
    <div class="back-content">
      <div class="back-header">
        <span class="badge ${gClass}">${noun.gender}</span>
        <span class="back-word">${article} ${noun.name}</span>
      </div>
      <div class="back-row">
        <span class="row-label">Plural</span>
        <span>die ${noun.plural}</span>
      </div>
      <div class="back-row">
        <span class="flag">🇬🇧</span><span>${noun.meaning.eng}</span>
      </div>
      <div class="back-row">
        <span class="flag">🇮🇩</span><span>${noun.meaning.ind}</span>
      </div>
    </div>`;
}

function renderVerbCard(verb) {
  const typeClass = verb.type === "irregular" ? "irreg-badge" : "reg-badge";
  const conjRows = CONJ_KEYS.map(
    (s) =>
      `<tr><td class="subj">${s}</td><td>${verb.conjugations[s] || "—"}</td></tr>`,
  ).join("");

  $("card-front").className = "card-front";
  $("card-front").innerHTML = `
    <div class="card-front-inner">
      <div class="badge-row">
        <span class="badge verb-badge">Verb</span>
        <span class="badge ${typeClass}">${verb.type === "irregular" ? "Irregular" : "Regular"}</span>
      </div>
      <div class="card-word">${verb.name}</div>
      <div class="card-hint">hold to reveal</div>
    </div>`;

  $("card-back").innerHTML = `
    <div class="back-content">
      <div class="back-header">
        <span class="badge ${typeClass}">${verb.type}</span>
        <span class="back-word">${verb.name}</span>
      </div>
      <table class="conj-table">${conjRows}</table>
      <div class="back-row">
        <span class="flag">🇬🇧</span><span>${verb.meaning.eng}</span>
      </div>
      <div class="back-row">
        <span class="flag">🇮🇩</span><span>${verb.meaning.ind}</span>
      </div>
    </div>`;
}

function showSummary() {
  $("study-content").classList.add("hidden");
  $("summary-wrap").classList.remove("hidden");
  $("summary-text").textContent =
    `✓ Knew: ${state.knew}  ✗ Didn't: ${state.didnt}  · Total: ${state.cards.length}`;

  const missed = state.cards.filter((c) => state.answers[c.id] === "didnt");

  const listEl = $("summary-missed-list");
  if (missed.length > 0) {
    listEl.innerHTML =
      '<p class="missed-heading">Didn\'t know:</p>' +
      missed
        .map((c) => {
          const label = isNounCard(c)
            ? `<span class="missed-article">${ARTICLES[c.gender] || "der"}</span> ${escapeHtml(c.name)}`
            : escapeHtml(c.name);
          return `<div class="missed-item">${label}<span class="missed-meaning"> — ${escapeHtml(c.meaning.eng)}</span></div>`;
        })
        .join("");
  } else {
    listEl.innerHTML = "";
  }

  $("btn-retry-missed").classList.toggle("hidden", missed.length === 0);
  $("btn-refill-deck").classList.toggle(
    "hidden",
    !localStorage.getItem("revision-deck"),
  );
}

// ── CRUD ──────────────────────────────────────────────────────────────────────

function showDeleteConfirm(show) {
  $("delete-confirm").classList.toggle("hidden", !show);
  $("card-actions").classList.toggle("hidden", show);
}

function openModal(type, card = null) {
  state.editingId = card ? card.id : null;
  state.modalType = type;

  $("modal-title").textContent = card ? "Edit Card" : "Add Card";

  document.querySelectorAll(".type-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.type === type);
    btn.disabled = !!card;
  });

  switchModalType(type);
  clearModal();

  if (card) {
    if (type === "verb") {
      $("verb-name").value = card.name;
      $("verb-type").value = card.type;
      CONJ_KEYS.forEach((key, i) => {
        $(CONJ_IDS[i]).value = card.conjugations[key] || "";
      });
      $("verb-eng").value = card.meaning.eng;
      $("verb-ind").value = card.meaning.ind;
    } else {
      $("noun-name").value = card.name;
      $("noun-plural").value = card.plural;
      $("noun-gender").value = card.gender;
      $("noun-eng").value = card.meaning.eng;
      $("noun-ind").value = card.meaning.ind;
    }
  }

  $("modal-overlay").classList.remove("hidden");
  (type === "verb" ? $("verb-name") : $("noun-name")).focus();
}

function closeModal() {
  $("modal-overlay").classList.add("hidden");
  document.querySelectorAll(".type-btn").forEach((btn) => {
    btn.disabled = false;
  });
}

function clearModal() {
  ["verb-name", "verb-eng", "verb-ind", ...CONJ_IDS].forEach((id) => {
    $(id).value = "";
  });
  ["noun-name", "noun-plural", "noun-eng", "noun-ind"].forEach((id) => {
    $(id).value = "";
  });
  $("verb-type").value = "regular";
  $("noun-gender").value = "maskulin";
}

function switchModalType(type) {
  state.modalType = type;
  $("verb-form").classList.toggle("hidden", type !== "verb");
  $("noun-form").classList.toggle("hidden", type !== "noun");
  document.querySelectorAll(".type-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.type === type);
  });
}

function saveCard() {
  const data = loadData();
  let entry;

  if (state.modalType === "verb") {
    const name = $("verb-name").value.trim();
    if (!name) {
      $("verb-name").focus();
      return;
    }

    const conj = {};
    CONJ_KEYS.forEach((key, i) => {
      conj[key] = $(CONJ_IDS[i]).value.trim();
    });

    entry = {
      id: state.editingId || genId(),
      name,
      type: $("verb-type").value,
      conjugations: conj,
      meaning: {
        eng: $("verb-eng").value.trim(),
        ind: $("verb-ind").value.trim(),
      },
    };

    if (state.editingId) {
      const idx = data.verbs.findIndex((v) => v.id === state.editingId);
      if (idx !== -1) data.verbs[idx] = entry;
    } else {
      data.verbs.push(entry);
    }
  } else {
    const name = $("noun-name").value.trim();
    if (!name) {
      $("noun-name").focus();
      return;
    }

    entry = {
      id: state.editingId || genId(),
      name,
      plural: $("noun-plural").value.trim(),
      gender: $("noun-gender").value,
      meaning: {
        eng: $("noun-eng").value.trim(),
        ind: $("noun-ind").value.trim(),
      },
    };

    if (state.editingId) {
      const idx = data.nouns.findIndex((n) => n.id === state.editingId);
      if (idx !== -1) data.nouns[idx] = entry;
    } else {
      data.nouns.push(entry);
    }
  }

  // When adding a new card while studying a group, auto-add it to that group
  if (
    !state.editingId &&
    state.viewMode === "group-study" &&
    state.activeGroupId
  ) {
    const grp =
      data.groups && data.groups.find((g) => g.id === state.activeGroupId);
    if (grp && !grp.cardIds.includes(entry.id)) grp.cardIds.push(entry.id);
  }

  saveData(data);
  closeModal();

  if (state.editingId && state.deck) {
    const updated = loadData()[
      state.deck === "combined"
        ? state.modalType === "verb"
          ? "verbs"
          : "nouns"
        : state.deck
    ].find((c) => c.id === state.editingId);
    if (updated) state.cards[state.index] = updated;
    renderCard();
  } else {
    const targetDeck = state.modalType === "verb" ? "verbs" : "nouns";
    switchDeck(targetDeck);
  }
}

function deleteCard() {
  if (state.viewMode === "group-study") {
    removeFromGroup(state.cards[state.index].id);
    return;
  }
  const card = state.cards[state.index];
  const data = loadData();
  const listKey = isNounCard(card) ? "nouns" : "verbs";
  data[listKey] = data[listKey].filter((c) => c.id !== card.id);
  saveData(data);
  state.cards.splice(state.index, 1);
  if (state.cards.length === 0) {
    showSummary();
    return;
  }
  if (state.index >= state.cards.length) state.index = state.cards.length - 1;
  renderCard();
}

function removeFromGroup(cardId) {
  const data = loadData();
  const group = data.groups.find((g) => g.id === state.activeGroupId);
  if (group) {
    group.cardIds = group.cardIds.filter((id) => id !== cardId);
    saveData(data);
  }
  state.cards.splice(state.index, 1);
  if (state.cards.length === 0) {
    showSummary();
    return;
  }
  if (state.index >= state.cards.length) state.index = state.cards.length - 1;
  renderCard();
}

// ── Export / Import ───────────────────────────────────────────────────────────

function exportData() {
  const blob = new Blob([JSON.stringify(loadData(), null, 2)], {
    type: "application/json",
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "vocab.txt";
  a.click();
  URL.revokeObjectURL(a.href);
}

function importData(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (!Array.isArray(data.verbs) || !Array.isArray(data.nouns))
        throw new Error();
      if (!data.groups) data.groups = [];
      saveData(data);
      switchDeck(state.deck);
    } catch {
      alert(
        'Could not import: file must be a valid vocab.txt with "verbs" and "nouns" arrays.',
      );
    }
  };
  reader.readAsText(file);
}

// ── Score Tracking ────────────────────────────────────────────────────────────

function markCard(answer) {
  const card = state.cards[state.index];
  const prev = state.answers[card.id];
  if (prev === "knew") state.knew--;
  if (prev === "didnt") state.didnt--;
  if (answer === "knew") state.knew++;
  if (answer === "didnt") state.didnt++;
  state.answers[card.id] = answer;
}

function updateScoreDisplay() {
  const total = state.cards.length;
  $("score-knew").textContent = `✓ ${state.knew}`;
  $("score-didnt").textContent = `✗ ${state.didnt}`;
  $("score-total").textContent = `out of ${total}`;
}

// ── Groups List ───────────────────────────────────────────────────────────────

function renderGroupsList() {
  const data = loadData();
  const list = $("groups-list");

  if (!data.groups.length) {
    list.innerHTML =
      '<div class="groups-empty">No groups yet. Hit <strong>+ New Group</strong> to create one.</div>';
    return;
  }

  list.innerHTML = data.groups
    .map((g) => {
      const ids = new Set(g.cardIds);
      const count = [...data.verbs, ...data.nouns].filter((c) =>
        ids.has(c.id),
      ).length;
      return `<div class="group-row" data-id="${escapeHtml(g.id)}">
      <div class="group-info">
        <span class="group-name">${escapeHtml(g.name)}</span>
        <span class="group-count">${count} card${count !== 1 ? "s" : ""}</span>
      </div>
      <div class="group-btns" data-id="${escapeHtml(g.id)}">
        <button class="group-open-btn" data-id="${escapeHtml(g.id)}">Open</button>
        <button class="group-edit-btn" data-id="${escapeHtml(g.id)}" title="Edit group">✏️</button>
        <button class="group-del-btn"  data-id="${escapeHtml(g.id)}" title="Delete group">🗑️</button>
      </div>
    </div>`;
    })
    .join("");

  list
    .querySelectorAll(".group-open-btn")
    .forEach((btn) =>
      btn.addEventListener("click", () => openGroup(btn.dataset.id)),
    );
  list
    .querySelectorAll(".group-edit-btn")
    .forEach((btn) =>
      btn.addEventListener("click", () => openGroupModal(btn.dataset.id)),
    );
  list
    .querySelectorAll(".group-del-btn")
    .forEach((btn) =>
      btn.addEventListener("click", () =>
        promptDeleteGroup(btn.dataset.id, btn),
      ),
    );
}

function promptDeleteGroup(groupId, triggerBtn) {
  // Inline confirm inside the btns container
  const btns = triggerBtn.closest(".group-btns");
  btns.innerHTML = `
    <span class="group-del-confirm-text">Delete group?</span>
    <button class="group-confirm-yes" data-id="${escapeHtml(groupId)}">Yes</button>
    <button class="group-confirm-no">No</button>`;
  btns.querySelector(".group-confirm-yes").addEventListener("click", () => {
    const data = loadData();
    data.groups = data.groups.filter((g) => g.id !== groupId);
    saveData(data);
    renderGroupsList();
  });
  btns
    .querySelector(".group-confirm-no")
    .addEventListener("click", renderGroupsList);
}

// ── Group Modal ───────────────────────────────────────────────────────────────

let _groupEditId = null;
let _groupSelectedIds = new Set();
let _pickerTimer;

function openGroupModal(groupId = null) {
  const data = loadData();
  _groupEditId = groupId;

  if (groupId) {
    const group = data.groups.find((g) => g.id === groupId);
    $("modal-group-title").textContent = "Edit Group";
    $("group-name-input").value = group ? group.name : "";
    _groupSelectedIds = new Set(group ? group.cardIds : []);
  } else {
    $("modal-group-title").textContent = "New Group";
    $("group-name-input").value = "";
    _groupSelectedIds = new Set();
  }

  $("card-picker-search").value = "";
  renderCardPicker("");
  $("modal-group-overlay").classList.remove("hidden");
  $("group-name-input").focus();
}

function closeGroupModal() {
  $("modal-group-overlay").classList.add("hidden");
}

function renderCardPicker(query) {
  const data = loadData();
  const q = normalizeSearch(query).trim();

  const allCards = [
    ...data.verbs.map((c) => ({ ...c, _isNoun: false })),
    ...data.nouns.map((c) => ({ ...c, _isNoun: true })),
  ].filter((c) => {
    if (!q) return true;
    const prefix = c._isNoun ? (ARTICLES[c.gender] || "") + " " : "";
    return (
      normalizeSearch(prefix + c.name).includes(q) ||
      normalizeSearch(c.meaning.eng).includes(q) ||
      normalizeSearch(c.meaning.ind).includes(q)
    );
  });

  const list = $("card-picker-list");
  if (!allCards.length) {
    list.innerHTML = '<div class="picker-empty">No cards found</div>';
    return;
  }

  list.innerHTML = allCards
    .map((c) => {
      const sel = _groupSelectedIds.has(c.id);
      const badgeCls = c._isNoun ? "noun-badge" : "verb-badge";
      const typeLabel = c._isNoun ? "Noun" : "Verb";
      const prefix = c._isNoun ? (ARTICLES[c.gender] || "") + " " : "";
      return `<div class="picker-item${sel ? " selected" : ""}" data-id="${c.id}">
      <span class="badge ${badgeCls}">${typeLabel}</span>
      <span class="picker-name">${escapeHtml(prefix + c.name)}</span>
      <span class="picker-meaning">${escapeHtml(c.meaning.eng)}</span>
      <button class="picker-toggle${sel ? " is-in" : ""}" data-id="${c.id}">${sel ? "−" : "+"}</button>
    </div>`;
    })
    .join("");

  list.querySelectorAll(".picker-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      if (_groupSelectedIds.has(id)) _groupSelectedIds.delete(id);
      else _groupSelectedIds.add(id);
      renderCardPicker($("card-picker-search").value);
    });
  });
}

function saveGroup() {
  const name = $("group-name-input").value.trim();
  if (!name) {
    $("group-name-input").focus();
    return;
  }

  const data = loadData();
  const entry = {
    id: _groupEditId || genId(),
    name,
    cardIds: [..._groupSelectedIds],
  };

  if (_groupEditId) {
    const idx = data.groups.findIndex((g) => g.id === _groupEditId);
    if (idx !== -1) data.groups[idx] = entry;
    else data.groups.push(entry);
  } else {
    data.groups.push(entry);
  }

  saveData(data);
  closeGroupModal();
  renderGroupsList();
}

// ── Search ────────────────────────────────────────────────────────────────────

function normalizeSearch(s) {
  return String(s)
    .toLowerCase()
    .replace(/ä/g, "a")
    .replace(/ö/g, "o")
    .replace(/ü/g, "u")
    .replace(/ß/g, "s");
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function highlightMatch(text, query) {
  const i = normalizeSearch(text).indexOf(normalizeSearch(query));
  if (i === -1) return escapeHtml(text);
  return (
    escapeHtml(text.slice(0, i)) +
    "<mark>" +
    escapeHtml(text.slice(i, i + query.length)) +
    "</mark>" +
    escapeHtml(text.slice(i + query.length))
  );
}

function searchCards(query) {
  const q = normalizeSearch(query).trim();
  if (!q) return [];
  const data = loadData();
  const seen = new Set();
  const results = [];

  function add(card, type, matchLabel, matchValue) {
    if (seen.has(card.id)) return;
    seen.add(card.id);
    results.push({ card, type, matchLabel, matchValue });
  }

  const m = (s) => normalizeSearch(s).includes(q);

  data.verbs.forEach((v) => {
    if (m(v.name)) add(v, "verb", null, v.name);
    CONJ_KEYS.forEach((k) => {
      if (m(v.conjugations[k] || "")) add(v, "verb", k, v.conjugations[k]);
    });
    if (m(v.meaning.eng)) add(v, "verb", "English", v.meaning.eng);
    if (m(v.meaning.ind)) add(v, "verb", "Indonesian", v.meaning.ind);
    if (m(v.type)) add(v, "verb", "type", v.type);
  });

  data.nouns.forEach((n) => {
    if (m(n.name)) add(n, "noun", null, n.name);
    if (m(n.plural)) add(n, "noun", "plural", n.plural);
    if (m(n.gender)) add(n, "noun", "gender", n.gender);
    if (m(n.meaning.eng)) add(n, "noun", "English", n.meaning.eng);
    if (m(n.meaning.ind)) add(n, "noun", "Indonesian", n.meaning.ind);
  });

  return results.slice(0, 8);
}

function renderSearchDropdown(results, query) {
  const dd = $("search-dropdown");
  if (!results.length) {
    dd.innerHTML = '<div class="search-no-results">No results</div>';
    dd.classList.remove("hidden");
    return;
  }
  dd.innerHTML = results
    .map((r) => {
      const badgeClass = r.type === "verb" ? "verb-badge" : "noun-badge";
      const badgeLabel = r.type === "verb" ? "Verb" : "Noun";
      const matchHtml = r.matchLabel
        ? `<span class="search-result-match">${escapeHtml(r.matchLabel)} · ${highlightMatch(r.matchValue, query)}</span>`
        : "";
      return `<div class="search-result" data-id="${r.card.id}" data-type="${r.type}">
      <span class="badge ${badgeClass}">${badgeLabel}</span>
      <span class="search-result-parent">${escapeHtml(r.card.name)}</span>
      ${matchHtml}
    </div>`;
    })
    .join("");
  dd.classList.remove("hidden");
  dd.querySelectorAll(".search-result").forEach((el) => {
    el.addEventListener("click", () => {
      navigateToCard(el.dataset.id, el.dataset.type);
      closeSearch();
    });
  });
}

function navigateToCard(cardId, cardType) {
  const targetDeck = cardType === "verb" ? "verbs" : "nouns";
  if (state.deck !== targetDeck) switchDeck(targetDeck);
  const idx = state.cards.findIndex((c) => c.id === cardId);
  if (idx !== -1) {
    state.index = idx;
    renderCard();
  }
}

function closeSearch() {
  $("search-input").value = "";
  $("search-dropdown").classList.add("hidden");
  $("search-dropdown").innerHTML = "";
}

// ── Init ──────────────────────────────────────────────────────────────────────

function init() {
  // Deck toggle
  document.querySelectorAll(".toggle-opt").forEach((btn) => {
    btn.addEventListener("click", () => switchDeck(btn.dataset.deck));
  });

  // Combine button
  $("btn-combine").addEventListener("click", () => {
    switchDeck(state.deck === "combined" ? "nouns" : "combined");
  });

  // Shuffle
  $("shuffle-toggle").addEventListener("change", () => startDeck(state.deck));

  // Add card
  $("btn-add").addEventListener("click", () => {
    const type = state.deck === "verbs" ? "verb" : "noun";
    openModal(type);
  });

  // Export / Import
  $("btn-export").addEventListener("click", exportData);
  $("input-import").addEventListener("change", (e) => {
    if (e.target.files[0]) importData(e.target.files[0]);
    e.target.value = "";
  });

  // Groups navigation
  $("btn-groups").addEventListener("click", goToGroups);
  $("btn-back-groups").addEventListener("click", goToGroups);
  $("btn-back-library").addEventListener("click", goToLibrary);
  $("btn-new-group").addEventListener("click", () => openGroupModal());

  // Card flip (hold to reveal)
  const cardInner = $("card-inner");
  const flip = () => cardInner.classList.add("flipped");
  const unflip = () => cardInner.classList.remove("flipped");
  cardInner.addEventListener("mousedown", flip);
  cardInner.addEventListener("mouseup", unflip);
  cardInner.addEventListener("mouseleave", unflip);
  cardInner.addEventListener(
    "touchstart",
    (e) => {
      e.preventDefault();
      flip();
    },
    { passive: false },
  );
  cardInner.addEventListener("touchend", unflip);
  cardInner.addEventListener("touchcancel", unflip);

  // Navigation
  $("btn-prev").addEventListener("click", () => {
    if (state.index > 0) {
      state.index--;
      renderCard();
    }
  });
  $("btn-next").addEventListener("click", () => {
    if (state.index < state.cards.length - 1) {
      state.index++;
      renderCard();
    } else showSummary();
  });
  $("btn-knew").addEventListener("click", () => {
    markCard("knew");
    if (state.index < state.cards.length - 1) {
      state.index++;
      renderCard();
    } else showSummary();
  });
  $("btn-didnt").addEventListener("click", () => {
    markCard("didnt");
    if (state.index < state.cards.length - 1) {
      state.index++;
      renderCard();
    } else showSummary();
  });

  $("btn-reset").addEventListener("click", () => startDeck(state.deck));

  // Edit / Delete
  $("btn-edit-card").addEventListener("click", () => {
    const card = state.cards[state.index];
    openModal(isNounCard(card) ? "noun" : "verb", card);
  });
  $("btn-delete-card").addEventListener("click", () => showDeleteConfirm(true));
  $("btn-confirm-delete").addEventListener("click", deleteCard);
  $("btn-cancel-delete").addEventListener("click", () =>
    showDeleteConfirm(false),
  );

  // Summary
  $("btn-restart").addEventListener("click", () => startDeck(state.deck));

  $("btn-retry-missed").addEventListener("click", () => {
    const missedIds = state.cards
      .filter((c) => state.answers[c.id] === "didnt")
      .map((c) => c.id);
    localStorage.setItem("revision-deck", JSON.stringify(missedIds));
    startDeck(state.deck);
  });

  function clearRevision() {
    localStorage.removeItem("revision-deck");
    startDeck(state.deck);
  }
  $("btn-refill-deck").addEventListener("click", clearRevision);
  $("btn-clear-revision").addEventListener("click", clearRevision);

  // German special-character shortcuts (both modals)
  const CHAR_SHORTCUTS = [
    { from: "[ss]", to: "ß", shift: 3 },
    { from: "a:", to: "ä", shift: 1 },
    { from: "o:", to: "ö", shift: 1 },
    { from: "u:", to: "ü", shift: 1 },
    { from: "A:", to: "Ä", shift: 1 },
    { from: "O:", to: "Ö", shift: 1 },
    { from: "U:", to: "Ü", shift: 1 },
  ];
  document.querySelectorAll(".modal").forEach((modalEl) => {
    modalEl.addEventListener("input", (e) => {
      if (e.target.tagName !== "INPUT" || e.target.type !== "text") return;
      const input = e.target;
      let val = input.value;
      let pos = input.selectionStart;
      for (const { from, to, shift } of CHAR_SHORTCUTS) {
        const idx = val.indexOf(from);
        if (idx === -1) continue;
        val = val.replace(from, to);
        if (pos > idx) pos = Math.max(idx + 1, pos - shift);
        break;
      }
      if (val !== input.value) {
        input.value = val;
        input.setSelectionRange(pos, pos);
      }
    });
  });

  // Card add/edit modal
  document.querySelectorAll(".type-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!btn.disabled) switchModalType(btn.dataset.type);
    });
  });
  $("btn-modal-save").addEventListener("click", saveCard);
  $("btn-modal-cancel").addEventListener("click", closeModal);
  $("modal-overlay").addEventListener("click", (e) => {
    if (e.target === $("modal-overlay")) closeModal();
  });

  // Group modal
  $("btn-group-save").addEventListener("click", saveGroup);
  $("btn-group-cancel").addEventListener("click", closeGroupModal);
  $("modal-group-overlay").addEventListener("click", (e) => {
    if (e.target === $("modal-group-overlay")) closeGroupModal();
  });
  $("card-picker-search").addEventListener("input", (e) => {
    clearTimeout(_pickerTimer);
    _pickerTimer = setTimeout(() => renderCardPicker(e.target.value), 150);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (!$("modal-group-overlay").classList.contains("hidden"))
        closeGroupModal();
      else if (!$("modal-overlay").classList.contains("hidden")) closeModal();
      else closeSearch();
    }
  });

  // Search
  let _searchTimer;
  $("search-input").addEventListener("input", (e) => {
    clearTimeout(_searchTimer);
    const q = e.target.value.trim();
    if (!q) {
      $("search-dropdown").classList.add("hidden");
      return;
    }
    _searchTimer = setTimeout(
      () => renderSearchDropdown(searchCards(q), q),
      150,
    );
  });
  document.addEventListener("click", (e) => {
    if (!$("search-wrap").contains(e.target))
      $("search-dropdown").classList.add("hidden");
  });

  // Hamburger menu (mobile)
  const _headerRight = document.querySelector("#view-study .header-right");
  $("btn-hamburger").addEventListener("click", (e) => {
    e.stopPropagation();
    _headerRight.classList.toggle("open");
  });
  document.addEventListener("click", (e) => {
    if (!_headerRight.contains(e.target) && e.target !== $("btn-hamburger"))
      _headerRight.classList.remove("open");
  });

  updateStudyHeader();
  switchDeck("nouns");
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    let data;
    if (GIST_ID) {
      const res = await fetch(
        `https://api.github.com/gists/${GIST_ID}`,
        GIST_TOKEN ? { headers: { Authorization: `token ${GIST_TOKEN}` } } : {},
      );
      if (res.ok) {
        const gist = await res.json();
        data = JSON.parse(gist.files[GIST_FILE].content);
      }
    } else {
      const res = await fetch("/vocab.txt?t=" + Date.now());
      if (res.ok) data = await res.json();
    }
    if (data && Array.isArray(data.verbs) && Array.isArray(data.nouns)) {
      if (!data.groups) data.groups = [];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  } catch {}
  init();
});
