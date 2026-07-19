// ── Card Modal (Add / Edit) ───────────────────────────────────────────────────

// ── Duplicate-word warning ────────────────────────────────────────────────────

const DUP_NAME_INPUTS = { verb: "verb-name", noun: "noun-name", adjective: "adj-name", adverb: "adv-name", preposition: "prep-name" };

function normalizeDupName(name) {
  return name.trim().toLowerCase().replace(/\s*\((singular|plural)\)$/i, "");
}

function findDuplicateCard(type, name) {
  const key  = AI_DECK_KEYS[type];
  const norm = normalizeDupName(name || "");
  if (!key || !norm) return null;
  return loadData()[key].find((c) => c.id !== state.editingId && normalizeDupName(c.name) === norm) || null;
}

function updateDupWarning(type) {
  const input  = $(DUP_NAME_INPUTS[type]);
  const warnEl = $(DUP_NAME_INPUTS[type] + "-dup");
  const dup    = findDuplicateCard(type, input.value);
  input.classList.toggle("input-dup", !!dup);
  warnEl.textContent = dup ? `⚠ „${dup.name}“ is already in your ${AI_DECK_KEYS[type]}` : "";
  setVisible(warnEl.id, !!dup);
}

function updateAiWordDup() {
  const dup = findDuplicateCard(state.modalType, $("ai-word").value);
  $("ai-word").classList.toggle("input-dup", !!dup);
  $("ai-word-dup").textContent = dup ? `⚠ „${dup.name}“ is already in your ${AI_DECK_KEYS[state.modalType]}` : "";
  setVisible("ai-word-dup", !!dup);
}

// Re-checks every dup-aware input (values persist across type switches)
function refreshDupWarnings() {
  Object.keys(DUP_NAME_INPUTS).forEach(updateDupWarning);
  updateAiWordDup();
}

// Called from the shared modal input handler, after ä/ö/ü/ß shortcut expansion
function updateDupWarningFor(inputId) {
  if (inputId === "ai-word") { updateAiWordDup(); return; }
  const type = Object.keys(DUP_NAME_INPUTS).find((t) => DUP_NAME_INPUTS[t] === inputId);
  if (type) updateDupWarning(type);
}

function openModal(type, card = null) {
  state.editingId  = card ? card.id : null;
  state.modalType  = type;

  setText("modal-title", card ? "Edit Card" : "Add Card");

  document.querySelectorAll(".type-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.type === type);
    btn.disabled = !!card;
  });

  // AI mode: only offered when adding, never when editing
  setVisible("ai-toggle-row", !card);
  setAiMode(false);

  switchModalType(type);
  clearModal();

  if (card) {
    if (type === "verb") {
      $("verb-name").value = card.name;
      $("verb-type").value = card.type;
      $("verb-reflexive").checked = !!card.reflexive;
      $("verb-trennbar").checked  = !!card.trennbar;
      CONJ_KEYS.forEach((key, i) => { $(CONJ_IDS[i]).value = card.conjugations[key] || ""; });
      CONJ_KEYS.forEach((key, i) => { $(PRAE_IDS[i]).value = (card.praeteritum && card.praeteritum[key]) || ""; });
      $("verb-partizip2").value = card.partizip2 || "";
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
    } else if (type === "preposition") {
      $("prep-name").value = card.name;
      $("prep-case").value = card.prepCase || "dativ";
      $("prep-eng").value  = card.meaning.eng;
      $("prep-ind").value  = card.meaning.ind;
    } else {
      $("noun-name").value   = card.name;
      $("noun-plural").value = card.plural;
      $("noun-gender").value = card.gender;
      $("noun-eng").value    = card.meaning.eng;
      $("noun-ind").value    = card.meaning.ind;
    }
  }

  show("modal-overlay");
  (type === "verb" ? $("verb-name") : type === "adjective" ? $("adj-name") : type === "adverb" ? $("adv-name") : type === "preposition" ? $("prep-name") : $("noun-name")).focus();
}

function closeModal() {
  hide("modal-overlay");
  document.querySelectorAll(".type-btn").forEach((btn) => { btn.disabled = false; });
}

function clearModal() {
  ["verb-name", "verb-partizip2", "verb-eng", "verb-ind", ...CONJ_IDS, ...PRAE_IDS].forEach((id) => { $(id).value = ""; });
  ["noun-name", "noun-plural", "noun-eng", "noun-ind"].forEach((id) => { $(id).value = ""; });
  ["adj-name", "adj-comparative", "adj-superlative", "adj-eng", "adj-ind"].forEach((id) => { $(id).value = ""; });
  ["adv-name", "adv-eng", "adv-ind"].forEach((id) => { $(id).value = ""; });
  ["prep-name", "prep-eng", "prep-ind"].forEach((id) => { $(id).value = ""; });
  $("verb-type").value  = "regular";
  $("verb-reflexive").checked = false;
  $("verb-trennbar").checked  = false;
  $("noun-gender").value = "maskulin";
  $("adv-type").value   = "modal";
  $("prep-case").value  = "dativ";
  $("ai-word").value    = "";
  resetAiPreview();
  setVisible("ai-key-editor", false);
  refreshDupWarnings();
}

function switchModalType(type) {
  state.modalType = type;
  const manual = !state.aiMode; // in AI mode the detail forms stay hidden
  setVisible("verb-form",        manual && type === "verb");
  setVisible("noun-form",        manual && type === "noun");
  setVisible("adjective-form",   manual && type === "adjective");
  setVisible("adverb-form",      manual && type === "adverb");
  setVisible("preposition-form", manual && type === "preposition");
  document.querySelectorAll(".type-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.type === type);
  });
  refreshDupWarnings();
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
      ...($("verb-reflexive").checked && { reflexive: true }),
      ...($("verb-trennbar").checked  && { trennbar: true }),
      conjugations: conj,
      praeteritum: prae,
      partizip2: $("verb-partizip2").value.trim(),
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

  } else if (state.modalType === "preposition") {
    const name = $("prep-name").value.trim();
    if (!name) { $("prep-name").focus(); return; }
    entry = {
      id: state.editingId || genId(),
      name,
      prepCase: $("prep-case").value,
      meaning: { eng: $("prep-eng").value.trim(), ind: $("prep-ind").value.trim() },
    };
    if (state.editingId) {
      const idx = data.prepositions.findIndex((p) => p.id === state.editingId);
      if (idx !== -1) data.prepositions[idx] = entry;
    } else {
      data.prepositions.push(entry);
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

  saveData(data, entry.name);
  closeModal();

  const typeToKey = { verb: "verbs", noun: "nouns", adjective: "adjectives", adverb: "adverbs", preposition: "prepositions" };
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
  const listKey = isNounCard(card) ? "nouns" : isAdjectiveCard(card) ? "adjectives" : isAdverbCard(card) ? "adverbs" : isPrepositionCard(card) ? "prepositions" : "verbs";
  data[listKey] = data[listKey].filter((c) => c.id !== card.id);
  saveData(data, card.name);
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
    const card = state.cards[state.index];
    saveData(data, card ? card.name : undefined);
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

// ── Bulk Add Vocab (JSON paste) ───────────────────────────────────────────────

const BULK_PLACEHOLDERS = {
  noun: `{
  "name": "Hund",
  "plural": "Hunde",
  "gender": "maskulin",
  "meaning": { "eng": "dog", "ind": "anjing" }
}`,
  verb: `{
  "name": "gehen",
  "type": "regular",
  "reflexive": false,
  "trennbar": false,
  "conjugations": {
    "ich": "gehe", "du": "gehst", "er/sie/es": "geht",
    "wir": "gehen", "ihr": "geht", "Sie": "gehen"
  },
  "praeteritum": {
    "ich": "ging", "du": "gingst", "er/sie/es": "ging",
    "wir": "gingen", "ihr": "gingt", "Sie": "gingen"
  },
  "partizip2": "gegangen",
  "meaning": { "eng": "to go", "ind": "pergi" }
}`,
  adjective: `{
  "name": "schnell",
  "comparative": "schneller",
  "superlative": "am schnellsten",
  "meaning": { "eng": "fast", "ind": "cepat" }
}`,
  adverb: `{
  "name": "da",
  "adverbType": "lokal",
  "meaning": { "eng": "there", "ind": "di sana" }
}`,
  preposition: `{
  "name": "bei",
  "prepCase": "dativ",
  "meaning": { "eng": "at / near / with", "ind": "di / dekat / dengan" }
}`,
};

const BULK_PLACEHOLDER_COMBINED = `{
  "nouns": [ ${BULK_PLACEHOLDERS.noun} ],
  "verbs": [ ${BULK_PLACEHOLDERS.verb} ],
  "adjectives": [ ${BULK_PLACEHOLDERS.adjective} ],
  "adverbs": [ ${BULK_PLACEHOLDERS.adverb} ],
  "prepositions": [ ${BULK_PLACEHOLDERS.preposition} ]
}`;

const BULK_KEY_TO_TYPE = { nouns: "noun", verbs: "verb", adjectives: "adjective", adverbs: "adverb", prepositions: "preposition" };

function openBulkModal() {
  $("bulk-add-mode").value = "single";
  $("bulk-vocab-type").value = "noun";
  $("bulk-input-type").value = "text";
  $("bulk-vocab-file").value = "";
  hide("bulk-vocab-file");
  show("bulk-single-fields");
  hide("bulk-combined-fields");
  $("bulk-vocab-json").value = "";
  $("bulk-vocab-error").textContent = "";
  updateBulkPlaceholder();
  show("modal-bulk-overlay");
  $("bulk-vocab-json").focus();
}

function closeBulkModal() {
  hide("modal-bulk-overlay");
}

function updateBulkAddMode() {
  const combined = $("bulk-add-mode").value === "combined";
  if (combined) { hide("bulk-single-fields"); show("bulk-combined-fields"); }
  else          { show("bulk-single-fields"); hide("bulk-combined-fields"); }
  updateBulkPlaceholder();
}

function updateBulkInputType() {
  if ($("bulk-input-type").value === "file") show("bulk-vocab-file");
  else hide("bulk-vocab-file");
}

function loadBulkFile(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => { $("bulk-vocab-json").value = e.target.result; };
  reader.readAsText(file);
}

function updateBulkPlaceholder() {
  $("bulk-vocab-json").placeholder = $("bulk-add-mode").value === "combined"
    ? BULK_PLACEHOLDER_COMBINED
    : BULK_PLACEHOLDERS[$("bulk-vocab-type").value] || "";
}

function validateBulkEntry(type, entry) {
  if (!entry.meaning || !("eng" in entry.meaning) || !("ind" in entry.meaning))
    return 'Missing "meaning" — needs { "eng": "...", "ind": "..." }';

  if (type === "noun") {
    if (!("name"   in entry)) return 'Missing key "name"';
    if (!("plural" in entry)) return 'Missing key "plural"';
    if (!("gender" in entry)) return 'Missing key "gender"';
    if (!["maskulin", "feminin", "netral", "neutrum", "kein"].includes(entry.gender))
      return `Invalid "gender": "${entry.gender}" — must be maskulin, feminin, netral or kein`;
  } else if (type === "verb") {
    if (!("name" in entry))          return 'Missing key "name"';
    if (!("type" in entry))          return 'Missing key "type"';
    if (!("conjugations" in entry))  return 'Missing key "conjugations"';
    if (!("praeteritum" in entry))   return 'Missing key "praeteritum"';
    if ("reflexive" in entry && typeof entry.reflexive !== "boolean")
      return '"reflexive" must be true or false';
    if ("trennbar" in entry && typeof entry.trennbar !== "boolean")
      return '"trennbar" must be true or false';
    for (const key of CONJ_KEYS) {
      if (!(key in entry.conjugations)) return `Missing conjugations["${key}"]`;
      if (!(key in entry.praeteritum))  return `Missing praeteritum["${key}"]`;
    }
  } else if (type === "adjective") {
    if (!("name"        in entry)) return 'Missing key "name"';
    if (!("comparative" in entry)) return 'Missing key "comparative"';
    if (!("superlative" in entry)) return 'Missing key "superlative"';
  } else if (type === "adverb") {
    if (!("name"       in entry)) return 'Missing key "name"';
    if (!("adverbType" in entry)) return 'Missing key "adverbType"';
  } else if (type === "preposition") {
    if (!("name"     in entry)) return 'Missing key "name"';
    if (!("prepCase" in entry)) return 'Missing key "prepCase"';
  }
  return null;
}

function saveBulkVocab() {
  if ($("bulk-add-mode").value === "combined") { saveBulkVocabCombined(); return; }

  const type    = $("bulk-vocab-type").value;
  const raw     = $("bulk-vocab-json").value.trim();
  const errorEl = $("bulk-vocab-error");
  errorEl.textContent = "";

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (_) {
    // Allow pasting a bare comma-separated list of objects without [ ]
    try {
      const trimmed = raw.replace(/,\s*$/, ""); // strip trailing comma
      parsed = JSON.parse("[" + trimmed + "]");
    } catch (e) {
      errorEl.textContent = "Invalid JSON: " + e.message;
      return;
    }
  }

  const entries = Array.isArray(parsed) ? parsed : [parsed];
  for (let i = 0; i < entries.length; i++) {
    const err = validateBulkEntry(type, entries[i]);
    if (err) {
      errorEl.textContent = entries.length > 1 ? `Entry ${i + 1}: ${err}` : err;
      return;
    }
  }

  const data = loadData();
  const typeToKey = { verb: "verbs", noun: "nouns", adjective: "adjectives", adverb: "adverbs", preposition: "prepositions" };
  const key = typeToKey[type];

  for (const entry of entries) {
    const { id: _ignored, ...rest } = entry;
    data[key].push({ id: genId(), ...rest });
  }

  saveData(data, entries.length === 1 ? entries[0].name : `${entries.length} cards`);
  closeBulkModal();
  switchDeck(key);
}

function saveBulkVocabCombined() {
  const raw     = $("bulk-vocab-json").value.trim();
  const errorEl = $("bulk-vocab-error");
  errorEl.textContent = "";

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    errorEl.textContent = "Invalid JSON: " + e.message;
    return;
  }

  const keys = Object.keys(BULK_KEY_TO_TYPE);
  for (const key of keys) {
    if (key in parsed && !Array.isArray(parsed[key])) {
      errorEl.textContent = `"${key}" must be an array`;
      return;
    }
  }

  for (const key of keys) {
    const entries = parsed[key] || [];
    const type = BULK_KEY_TO_TYPE[key];
    for (let i = 0; i < entries.length; i++) {
      const err = validateBulkEntry(type, entries[i]);
      if (err) {
        errorEl.textContent = `${key}[${i + 1}]: ${err}`;
        return;
      }
    }
  }

  const data = loadData();
  let added = 0;
  for (const key of keys) {
    const entries = parsed[key] || [];
    for (const entry of entries) {
      const { id: _ignored, ...rest } = entry;
      data[key].push({ id: genId(), ...rest });
      added++;
    }
  }

  saveData(data, `${added} cards`);
  closeBulkModal();
  switchDeck(state.deck);
}

function importData(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (!Array.isArray(data.verbs) || !Array.isArray(data.nouns)) throw new Error();
      if (!data.groups)       data.groups       = [];
      if (!data.adjectives)   data.adjectives   = [];
      if (!data.adverbs)      data.adverbs      = [];
      if (!data.prepositions) data.prepositions = [];
      saveData(data, "imported file");
      switchDeck(state.deck);
    } catch {
      alert('Could not import: file must be a valid vocab.txt with "verbs" and "nouns" arrays.');
    }
  };
  reader.readAsText(file);
}
