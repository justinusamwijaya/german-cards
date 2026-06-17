// ── Card Modal (Add / Edit) ───────────────────────────────────────────────────

function openModal(type, card = null) {
  state.editingId  = card ? card.id : null;
  state.modalType  = type;

  setText("modal-title", card ? "Edit Card" : "Add Card");

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
      CONJ_KEYS.forEach((key, i) => { $(CONJ_IDS[i]).value = card.conjugations[key] || ""; });
      CONJ_KEYS.forEach((key, i) => { $(PRAE_IDS[i]).value = (card.praeteritum && card.praeteritum[key]) || ""; });
      $("verb-eng").value = card.meaning.eng;
      $("verb-ind").value = card.meaning.ind;
    } else if (type === "adjective") {
      $("adj-name").value        = card.name;
      $("adj-comparative").value = card.comparative  || "";
      $("adj-superlative").value = card.superlative  || "";
      $("adj-eng").value         = card.meaning.eng;
      $("adj-ind").value         = card.meaning.ind;
    } else if (type === "adverb") {
      $("adv-name").value = card.name;
      $("adv-type").value = card.adverbType || "modal";
      $("adv-eng").value  = card.meaning.eng;
      $("adv-ind").value  = card.meaning.ind;
    } else {
      $("noun-name").value   = card.name;
      $("noun-plural").value = card.plural;
      $("noun-gender").value = card.gender;
      $("noun-eng").value    = card.meaning.eng;
      $("noun-ind").value    = card.meaning.ind;
    }
  }

  show("modal-overlay");
  (type === "verb" ? $("verb-name") : type === "adjective" ? $("adj-name") : type === "adverb" ? $("adv-name") : $("noun-name")).focus();
}

function closeModal() {
  hide("modal-overlay");
  document.querySelectorAll(".type-btn").forEach((btn) => { btn.disabled = false; });
}

function clearModal() {
  ["verb-name", "verb-eng", "verb-ind", ...CONJ_IDS, ...PRAE_IDS].forEach((id) => { $(id).value = ""; });
  ["noun-name", "noun-plural", "noun-eng", "noun-ind"].forEach((id) => { $(id).value = ""; });
  ["adj-name", "adj-comparative", "adj-superlative", "adj-eng", "adj-ind"].forEach((id) => { $(id).value = ""; });
  ["adv-name", "adv-eng", "adv-ind"].forEach((id) => { $(id).value = ""; });
  $("verb-type").value  = "regular";
  $("noun-gender").value = "maskulin";
  $("adv-type").value   = "modal";
}

function switchModalType(type) {
  state.modalType = type;
  setVisible("verb-form",      type === "verb");
  setVisible("noun-form",      type === "noun");
  setVisible("adjective-form", type === "adjective");
  setVisible("adverb-form",    type === "adverb");
  document.querySelectorAll(".type-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.type === type);
  });
}

function saveCard() {
  const data = loadData();
  let entry;

  if (state.modalType === "verb") {
    const name = $("verb-name").value.trim();
    if (!name) { $("verb-name").focus(); return; }
    const conj = {};
    CONJ_KEYS.forEach((key, i) => { conj[key] = $(CONJ_IDS[i]).value.trim(); });
    const prae = {};
    CONJ_KEYS.forEach((key, i) => { prae[key] = $(PRAE_IDS[i]).value.trim(); });
    entry = {
      id: state.editingId || genId(),
      name,
      type: $("verb-type").value,
      conjugations: conj,
      praeteritum: prae,
      meaning: { eng: $("verb-eng").value.trim(), ind: $("verb-ind").value.trim() },
    };
    if (state.editingId) {
      const idx = data.verbs.findIndex((v) => v.id === state.editingId);
      if (idx !== -1) data.verbs[idx] = entry;
    } else {
      data.verbs.push(entry);
    }

  } else if (state.modalType === "adjective") {
    const name = $("adj-name").value.trim();
    if (!name) { $("adj-name").focus(); return; }
    entry = {
      id: state.editingId || genId(),
      name,
      comparative: $("adj-comparative").value.trim(),
      superlative: $("adj-superlative").value.trim(),
      meaning: { eng: $("adj-eng").value.trim(), ind: $("adj-ind").value.trim() },
    };
    if (state.editingId) {
      const idx = data.adjectives.findIndex((a) => a.id === state.editingId);
      if (idx !== -1) data.adjectives[idx] = entry;
    } else {
      data.adjectives.push(entry);
    }

  } else if (state.modalType === "adverb") {
    const name = $("adv-name").value.trim();
    if (!name) { $("adv-name").focus(); return; }
    entry = {
      id: state.editingId || genId(),
      name,
      adverbType: $("adv-type").value,
      meaning: { eng: $("adv-eng").value.trim(), ind: $("adv-ind").value.trim() },
    };
    if (state.editingId) {
      const idx = data.adverbs.findIndex((a) => a.id === state.editingId);
      if (idx !== -1) data.adverbs[idx] = entry;
    } else {
      data.adverbs.push(entry);
    }

  } else {
    const name = $("noun-name").value.trim();
    if (!name) { $("noun-name").focus(); return; }
    entry = {
      id: state.editingId || genId(),
      name,
      plural: $("noun-plural").value.trim(),
      gender: $("noun-gender").value,
      meaning: { eng: $("noun-eng").value.trim(), ind: $("noun-ind").value.trim() },
    };
    if (state.editingId) {
      const idx = data.nouns.findIndex((n) => n.id === state.editingId);
      if (idx !== -1) data.nouns[idx] = entry;
    } else {
      data.nouns.push(entry);
    }
  }

  // Auto-add to active group when adding a new card during group-study
  if (!state.editingId && state.viewMode === "group-study" && state.activeGroupId) {
    const grp = data.groups && data.groups.find((g) => g.id === state.activeGroupId);
    if (grp && !grp.cardIds.includes(entry.id)) grp.cardIds.push(entry.id);
  }

  saveData(data);
  closeModal();

  const typeToKey = { verb: "verbs", noun: "nouns", adjective: "adjectives", adverb: "adverbs" };
  if (state.editingId && state.deck) {
    const updated = loadData()[
      state.deck === "combined" ? typeToKey[state.modalType] || "nouns" : state.deck
    ].find((c) => c.id === state.editingId);
    if (updated) state.cards[state.index] = updated;
    renderCard();
  } else {
    switchDeck(typeToKey[state.modalType] || "nouns");
  }
}

// ── Delete / Remove ───────────────────────────────────────────────────────────

function deleteCard() {
  if (state.viewMode === "group-study") {
    removeFromGroup(state.cards[state.index].id);
    return;
  }
  const card    = state.cards[state.index];
  const data    = loadData();
  const listKey = isNounCard(card) ? "nouns" : isAdjectiveCard(card) ? "adjectives" : isAdverbCard(card) ? "adverbs" : "verbs";
  data[listKey] = data[listKey].filter((c) => c.id !== card.id);
  saveData(data);
  state.cards.splice(state.index, 1);
  if (state.cards.length === 0) { showSummary(); return; }
  if (state.index >= state.cards.length) state.index = state.cards.length - 1;
  renderCard();
}

function removeFromGroup(cardId) {
  const data  = loadData();
  const group = data.groups.find((g) => g.id === state.activeGroupId);
  if (group) {
    group.cardIds = group.cardIds.filter((id) => id !== cardId);
    saveData(data);
  }
  state.cards.splice(state.index, 1);
  if (state.cards.length === 0) { showSummary(); return; }
  if (state.index >= state.cards.length) state.index = state.cards.length - 1;
  renderCard();
}

// ── Export / Import ───────────────────────────────────────────────────────────

function exportData() {
  const blob = new Blob([JSON.stringify(loadData(), null, 2)], { type: "application/json" });
  const a    = document.createElement("a");
  a.href     = URL.createObjectURL(blob);
  a.download = "vocab.txt";
  a.click();
  URL.revokeObjectURL(a.href);
}

function importData(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (!Array.isArray(data.verbs) || !Array.isArray(data.nouns)) throw new Error();
      if (!data.groups)     data.groups     = [];
      if (!data.adjectives) data.adjectives = [];
      saveData(data);
      switchDeck(state.deck);
    } catch {
      alert('Could not import: file must be a valid vocab.txt with "verbs" and "nouns" arrays.');
    }
  };
  reader.readAsText(file);
}
