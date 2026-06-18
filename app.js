// ── State ─────────────────────────────────────────────────────────────────────

let state = {
  deck:          "nouns",
  cards:         [],
  index:         0,
  knew:          0,
  didnt:         0,
  answers:       {},
  editingId:     null,
  modalType:     "noun",
  viewMode:      "library",   // 'library' | 'group-study'
  activeGroupId: null,
  shuffleEnabled: false,
};

// ── Deck constants ────────────────────────────────────────────────────────────

const DECK_CYCLE  = ["nouns", "verbs", "adjectives", "adverbs"];
const DECK_LABELS = { nouns: "Nouns", verbs: "Verbs", adjectives: "Adjectives", adverbs: "Adverbs", combined: "All" };

// ── View Navigation ───────────────────────────────────────────────────────────

function showView(id) {
  document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));
  $(id).classList.add("active");
}

function goToLibrary() {
  state.viewMode    = "library";
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
  state.viewMode    = "group-study";
  state.activeGroupId = groupId;
  showView("view-study");
  updateStudyHeader();
  switchDeck("nouns");
}

function updateStudyHeader() {
  const inGroup = state.viewMode === "group-study";
  setVisible("btn-back-groups", inGroup);
  setVisible("group-title-bar", inGroup);
  setVisible("btn-groups",      !inGroup);
  if (inGroup) {
    const data  = loadData();
    const group = data.groups.find((g) => g.id === state.activeGroupId);
    setText("group-mode-label", group ? group.name : "");
  }
}

// ── Deck Switching ────────────────────────────────────────────────────────────

function updateDeckBtn() {
  setText("deck-cycle-btn", DECK_LABELS[state.deck] || state.deck);
}

function switchDeck(deckName) {
  state.deck = deckName;
  updateDeckBtn();
  setActive("btn-combine", deckName === "combined");
  startDeck(deckName);
}

function startDeck(deckName) {
  const data = loadData();

  if (state.viewMode === "group-study") {
    const group      = data.groups.find((g) => g.id === state.activeGroupId);
    const ids        = new Set(group ? group.cardIds : []);
    const groupCards = [...data.verbs, ...data.nouns, ...data.adjectives, ...data.adverbs]
      .filter((c) => ids.has(c.id));

    if      (deckName === "combined")   state.cards = groupCards;
    else if (deckName === "verbs")      state.cards = groupCards.filter((c) => !isNounCard(c) && !isAdjectiveCard(c) && !isAdverbCard(c));
    else if (deckName === "adjectives") state.cards = groupCards.filter(isAdjectiveCard);
    else if (deckName === "adverbs")    state.cards = groupCards.filter(isAdverbCard);
    else                                state.cards = groupCards.filter(isNounCard);
  } else {
    state.cards = deckName === "combined"
      ? [...data.verbs, ...data.nouns, ...data.adjectives, ...data.adverbs]
      : [...data[deckName]];
  }

  // Revision-deck filter
  const revisionRaw = localStorage.getItem("revision-deck");
  if (revisionRaw) {
    const revIds = new Set(JSON.parse(revisionRaw));
    state.cards  = state.cards.filter((c) => revIds.has(c.id));
  }
  setVisible("revision-banner", !!revisionRaw);

  state.index   = 0;
  state.knew    = 0;
  state.didnt   = 0;
  state.answers = {};

  if (state.shuffleEnabled) shuffle(state.cards);

  show("study-content");
  hide("summary-wrap");
  renderCard();
}

// ── Init ──────────────────────────────────────────────────────────────────────

function init() {
  // ── Deck cycle button (tap = cycle, hold + drag = pick) ──────────────
  const LONG_PRESS_MS = 350;
  let _deckTimer = null;
  let _deckLong  = false;
  let _deckHeld  = false;

  function highlightDeckOpt(el) {
    $("deck-dropdown").querySelectorAll(".deck-drop-opt").forEach((opt) => {
      opt.classList.toggle("highlighted", opt === el || opt.contains(el));
    });
  }

  function clearDeckHighlight() {
    $("deck-dropdown").querySelectorAll(".deck-drop-opt").forEach((o) => o.classList.remove("highlighted"));
  }

  function showDeckDropdown() {
    $("deck-dropdown").querySelectorAll(".deck-drop-opt").forEach((opt) => {
      opt.classList.toggle("active", opt.dataset.deck === state.deck);
    });
    show("deck-dropdown");
  }

  function hideDeckDropdown() {
    hide("deck-dropdown");
    clearDeckHighlight();
  }

  function nextDeck() {
    const cur = DECK_CYCLE.includes(state.deck) ? state.deck : "nouns";
    switchDeck(DECK_CYCLE[(DECK_CYCLE.indexOf(cur) + 1) % DECK_CYCLE.length]);
  }

  const cycleBtn = $("deck-cycle-btn");

  // Mouse
  cycleBtn.addEventListener("mousedown", (e) => {
    e.preventDefault();
    _deckHeld  = true;
    _deckLong  = false;
    _deckTimer = setTimeout(() => { _deckLong = true; showDeckDropdown(); }, LONG_PRESS_MS);
  });

  document.addEventListener("mousemove", (e) => {
    if (!_deckHeld || !_deckLong) return;
    highlightDeckOpt(e.target);
  });

  document.addEventListener("mouseup", (e) => {
    if (!_deckHeld) return;
    _deckHeld = false;
    clearTimeout(_deckTimer);
    if (!_deckLong) {
      nextDeck();
    } else {
      const opt = e.target.closest(".deck-drop-opt");
      if (opt) switchDeck(opt.dataset.deck);
      hideDeckDropdown();
    }
  });

  document.addEventListener("click", (e) => {
    if (!$("deck-switcher").contains(e.target)) hideDeckDropdown();
  });

  // Touch
  cycleBtn.addEventListener("touchstart", (e) => {
    e.preventDefault();
    _deckLong  = false;
    _deckTimer = setTimeout(() => { _deckLong = true; showDeckDropdown(); }, LONG_PRESS_MS);
  }, { passive: false });

  cycleBtn.addEventListener("touchmove", (e) => {
    if (!_deckLong) return;
    const t = e.touches[0];
    highlightDeckOpt(document.elementFromPoint(t.clientX, t.clientY));
  }, { passive: true });

  cycleBtn.addEventListener("touchend", (e) => {
    clearTimeout(_deckTimer);
    if (!_deckLong) { nextDeck(); return; }
    const t   = e.changedTouches[0];
    const el  = document.elementFromPoint(t.clientX, t.clientY);
    const opt = el && el.closest(".deck-drop-opt");
    if (opt) switchDeck(opt.dataset.deck);
    hideDeckDropdown();
  }, { passive: true });

  cycleBtn.addEventListener("touchcancel", () => {
    clearTimeout(_deckTimer);
    _deckLong = false;
  });

  // Combine button
  $("btn-combine").addEventListener("click", () => {
    switchDeck(state.deck === "combined" ? "nouns" : "combined");
  });

  // Shuffle
  function setShuffleUI(enabled) {
    setActive("shuffle-btn", enabled);
    setText("shuffle-btn", enabled ? "↺ Shuffle" : "Shuffle");
    setVisible("shuffle-off", enabled);
  }

  $("shuffle-btn").addEventListener("click", () => {
    state.shuffleEnabled = true;
    setShuffleUI(true);
    startDeck(state.deck);
  });

  $("shuffle-off").addEventListener("click", () => {
    state.shuffleEnabled = false;
    setShuffleUI(false);
    startDeck(state.deck);
  });

  // Add card
  $("btn-add").addEventListener("click", () => {
    const type = state.deck === "verbs" ? "verb" : state.deck === "adjectives" ? "adjective" : state.deck === "adverbs" ? "adverb" : "noun";
    openModal(type);
  });

  // Bulk add vocab via JSON paste
  $("btn-bulk-add").addEventListener("click",  () => guardCUD(openBulkModal));
  $("btn-bulk-save").addEventListener("click", () => guardCUD(saveBulkVocab));
  $("btn-bulk-cancel").addEventListener("click", closeBulkModal);
  $("modal-bulk-overlay").addEventListener("click", (e) => {
    if (e.target === $("modal-bulk-overlay")) closeBulkModal();
  });
  $("bulk-vocab-type").addEventListener("change", updateBulkPlaceholder);

  // Export / Import
  $("btn-export").addEventListener("click", exportData);

  // Mode dropdown
  $("mode-cycle-btn").addEventListener("click", (e) => {
    e.stopPropagation();
    $("mode-dropdown").classList.toggle("hidden");
  });
  document.addEventListener("click", () => $("mode-dropdown").classList.add("hidden"));

  // Groups navigation
  $("btn-groups").addEventListener("click", goToGroups);
  $("btn-back-groups").addEventListener("click", goToGroups);
  $("btn-back-library").addEventListener("click", goToLibrary);
  $("btn-new-group").addEventListener("click", () => openGroupModal());

  // Card flip — tap to toggle
  const cardInner = $("card-inner");
  cardInner.addEventListener("click", () => cardInner.classList.toggle("flipped"));

  // Navigation
  $("btn-prev").addEventListener("click", () => {
    if (state.index > 0) { state.index--; renderCard(); }
  });
  $("btn-next").addEventListener("click", () => {
    if (state.index < state.cards.length - 1) { state.index++; renderCard(); }
    else showSummary();
  });
  $("btn-knew").addEventListener("click", () => {
    markCard("knew");
    if (state.index < state.cards.length - 1) { state.index++; renderCard(); }
    else showSummary();
  });
  $("btn-didnt").addEventListener("click", () => {
    markCard("didnt");
    if (state.index < state.cards.length - 1) { state.index++; renderCard(); }
    else showSummary();
  });

  $("btn-reset").addEventListener("click", () => startDeck(state.deck));

  // Edit / Delete
  $("btn-edit-card").addEventListener("click", () => {
    const card = state.cards[state.index];
    openModal(isNounCard(card) ? "noun" : isAdjectiveCard(card) ? "adjective" : isAdverbCard(card) ? "adverb" : "verb", card);
  });
  $("btn-delete-card").addEventListener("click",  () => showDeleteConfirm(true));
  $("btn-confirm-delete").addEventListener("click", () => guardCUD(deleteCard));
  $("btn-cancel-delete").addEventListener("click",  () => showDeleteConfirm(false));

  // Summary
  $("btn-restart").addEventListener("click", () => startDeck(state.deck));

  $("btn-retry-missed").addEventListener("click", () => {
    const missedIds = state.cards.filter((c) => state.answers[c.id] === "didnt").map((c) => c.id);
    localStorage.setItem("revision-deck", JSON.stringify(missedIds));
    startDeck(state.deck);
  });

  function clearRevision() {
    localStorage.removeItem("revision-deck");
    startDeck(state.deck);
  }
  $("btn-refill-deck").addEventListener("click",    clearRevision);
  $("btn-clear-revision").addEventListener("click", clearRevision);

  // German special-character shortcuts (both modals)
  const CHAR_SHORTCUTS = [
    { from: "[ss]", to: "ß", shift: 3 },
    { from: "a:",   to: "ä", shift: 1 },
    { from: "o:",   to: "ö", shift: 1 },
    { from: "u:",   to: "ü", shift: 1 },
    { from: "A:",   to: "Ä", shift: 1 },
    { from: "O:",   to: "Ö", shift: 1 },
    { from: "U:",   to: "Ü", shift: 1 },
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
    btn.addEventListener("click", () => { if (!btn.disabled) switchModalType(btn.dataset.type); });
  });
  $("btn-modal-save").addEventListener("click",   () => guardCUD(saveCard));
  $("btn-modal-cancel").addEventListener("click", closeModal);
  $("modal-overlay").addEventListener("click", (e) => {
    if (e.target === $("modal-overlay")) closeModal();
  });

  // Group modal
  $("btn-group-save").addEventListener("click",   () => guardCUD(saveGroup));
  $("btn-group-cancel").addEventListener("click", closeGroupModal);
  $("modal-group-overlay").addEventListener("click", (e) => {
    if (e.target === $("modal-group-overlay")) closeGroupModal();
  });
  $("card-picker-search").addEventListener("input", (e) => {
    clearTimeout(_pickerTimer);
    _pickerTimer = setTimeout(() => renderCardPicker(e.target.value), 150);
  });

  // Keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (!$("modal-group-overlay").classList.contains("hidden")) closeGroupModal();
      else if (!$("modal-bulk-overlay").classList.contains("hidden")) closeBulkModal();
      else if (!$("modal-overlay").classList.contains("hidden")) closeModal();
      else closeSearch();
    }
    if (e.key === "Enter" && !$("modal-overlay").classList.contains("hidden")) {
      if (document.activeElement.tagName !== "SELECT") {
        if (e.shiftKey) { const type = state.modalType; saveCard(); openModal(type); }
        else saveCard();
      }
    }
  });

  // Search
  let _searchTimer;
  $("search-input").addEventListener("input", (e) => {
    clearTimeout(_searchTimer);
    const q = e.target.value.trim();
    if (!q) { hide("search-dropdown"); return; }
    _searchTimer = setTimeout(() => renderSearchDropdown(searchCards(q), q), 150);
  });
  document.addEventListener("click", (e) => {
    if (!$("search-wrap").contains(e.target)) hide("search-dropdown");
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

// ── Bootstrap ─────────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", async () => {
  try {
    let data;
    if (GIST_ID) {
      const res = await fetch(`https://api.github.com/gists/${GIST_ID}`);
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

  $("btn-logout").addEventListener("click", doLogout);

  init();
  applyAuthUI();
});
