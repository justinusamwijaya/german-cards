// ── AI Auto-fill (Anthropic API) ──────────────────────────────────────────────
// The API key is never shipped with the app: it is pasted by the user at
// runtime and lives only in this browser's localStorage.

const AI_KEY_STORAGE = "gc_anthropic_key";
const AI_MODEL = "claude-haiku-4-5"; // cheap + accurate for vocab lookups; use "claude-opus-4-8" if quality ever slips

const AI_DECK_KEYS = { verb: "verbs", noun: "nouns", adjective: "adjectives", adverb: "adverbs", preposition: "prepositions" };

let aiPendingEntry = null; // { type, entry } awaiting Accept / Edit / Cancel

// ── API Key ───────────────────────────────────────────────────────────────────

function getStoredAiKey() {
  return localStorage.getItem(AI_KEY_STORAGE) || "";
}

// In-modal key editor (no window.prompt — unusable on mobile browsers)

function updateAiKeyStatus() {
  setText("ai-key-status", getStoredAiKey() ? "· saved ✓" : "· none");
}

function toggleAiKeyEditor(open) {
  const show = open !== undefined ? open : $("ai-key-editor").classList.contains("hidden");
  setVisible("ai-key-editor", show);
  if (show) {
    updateAiKeyStatus();
    $("ai-key-input").value = "";
    $("ai-key-input").focus();
  }
}

function saveAiKeyFromInput() {
  const key = $("ai-key-input").value.trim();
  if (!key) { $("ai-key-input").focus(); return; }
  localStorage.setItem(AI_KEY_STORAGE, key);
  $("ai-key-input").value = "";
  toggleAiKeyEditor(false);
  setText("ai-error", "");
}

function removeAiKey() {
  localStorage.removeItem(AI_KEY_STORAGE);
  $("ai-key-input").value = "";
  updateAiKeyStatus();
}

// ── JSON Schemas (structured outputs) ─────────────────────────────────────────

const AI_MEANING_SCHEMA = {
  type: "object",
  properties: {
    eng: { type: "string", description: "Concise English meaning" },
    ind: { type: "string", description: "Concise Indonesian meaning" },
  },
  required: ["eng", "ind"],
  additionalProperties: false,
};

function aiPersonTable(description) {
  const properties = {};
  CONJ_KEYS.forEach((person) => { properties[person] = { type: "string" }; });
  return { type: "object", description, properties, required: [...CONJ_KEYS], additionalProperties: false };
}

const AI_SCHEMAS = {
  verb: {
    type: "object",
    properties: {
      name: { type: "string", description: "Infinitive, correctly spelled" },
      type: { type: "string", enum: ["regular", "irregular"] },
      reflexive: { type: "boolean", description: "True if the verb is primarily used reflexively (sich freuen)" },
      trennbar: { type: "boolean", description: "True if the verb has a separable prefix (anrufen -> ich rufe an)" },
      conjugations: aiPersonTable("Präsens conjugation"),
      praeteritum: aiPersonTable("Präteritum conjugation"),
      partizip2: { type: "string", description: "Partizip II, bare participle only, e.g. gegangen" },
      meaning: AI_MEANING_SCHEMA,
    },
    required: ["name", "type", "reflexive", "trennbar", "conjugations", "praeteritum", "partizip2", "meaning"],
    additionalProperties: false,
  },
  noun: {
    type: "object",
    properties: {
      name: { type: "string", description: "Singular noun, capitalized, without article" },
      plural: { type: "string", description: "Plural form without article" },
      gender: { type: "string", enum: ["maskulin", "feminin", "netral", "kein"] },
      meaning: AI_MEANING_SCHEMA,
    },
    required: ["name", "plural", "gender", "meaning"],
    additionalProperties: false,
  },
  adjective: {
    type: "object",
    properties: {
      name: { type: "string", description: "Grundform" },
      comparative: { type: "string", description: "Komparativ, e.g. schneller" },
      superlative: { type: "string", description: "Superlativ with am, e.g. am schnellsten" },
      meaning: AI_MEANING_SCHEMA,
    },
    required: ["name", "comparative", "superlative", "meaning"],
    additionalProperties: false,
  },
  adverb: {
    type: "object",
    properties: {
      name: { type: "string" },
      adverbType: { type: "string", enum: ["modal", "temporal", "lokal", "kausal"] },
      meaning: AI_MEANING_SCHEMA,
    },
    required: ["name", "adverbType", "meaning"],
    additionalProperties: false,
  },
  preposition: {
    type: "object",
    properties: {
      name: { type: "string" },
      prepCase: { type: "string", enum: ["dativ", "akkusativ", "dativ/akkusativ"] },
      meaning: AI_MEANING_SCHEMA,
    },
    required: ["name", "prepCase", "meaning"],
    additionalProperties: false,
  },
};

// Wrapper: the model reports the word's ACTUAL class and builds that entry,
// so a word typed under the wrong type still comes back usable in one call.
const AI_WRAPPER_SCHEMA = {
  type: "object",
  properties: {
    type: {
      type: "string",
      enum: Object.keys(AI_SCHEMAS),
      description: "The actual word class of the generated entry",
    },
    entry: { anyOf: Object.values(AI_SCHEMAS) },
  },
  required: ["type", "entry"],
  additionalProperties: false,
};

const AI_SYSTEM_PROMPT =
  "You are a German dictionary assistant for an A1–B2 vocabulary flashcard app. " +
  "The user selects a word class and types a German word; return its dictionary entry data. " +
  "If the word genuinely belongs to the selected class, set type to the selected class and build that entry — " +
  "when a word exists in multiple classes, prefer the selected one. " +
  "Remember that most German adjectives also work as adverbs (schnell, gut, langsam …): " +
  "if the user selects adverb for such a word, build the adverb entry — do not switch to adjective. " +
  "Only if the word does NOT exist in the selected class, set type to its actual word class " +
  "and build the entry for that class instead. " +
  "Use correct German spelling and capitalization (nouns capitalized, verbs lowercase). " +
  "If the input looks misspelled, correct it to the most likely intended word. " +
  "The entry must be internally consistent with the returned type: " +
  "a verb entry's name is a lowercase infinitive, a noun entry's name is a capitalized singular. " +
  "If a typo's most likely correction is a word of a different class, return that class. " +
  "Keep meanings short and learner-friendly: eng in English, ind in Indonesian. " +
  "For verbs, give Präsens and Präteritum forms for all six persons and the bare Partizip II. " +
  "Set reflexive true only for verbs primarily used with a reflexive pronoun (sich freuen, sich beeilen); " +
  "keep the name as the bare infinitive without sich, but include the pronoun in the conjugated forms (ich freue mich). " +
  "Set trennbar true for separable-prefix verbs (anrufen, einkaufen) and conjugate them with the prefix separated (ich rufe an). " +
  "If a noun is singular-only (e.g. Milch, Obst) or plural-only (e.g. Eltern, Leute), " +
  "append the marker to BOTH the name and plural fields, using the same word in both: " +
  'singular-only → name: "Milch (Singular)", plural: "Milch (Singular)"; ' +
  'plural-only → name: "Eltern (Plural)", plural: "Eltern (Plural)". ' +
  "Normal nouns with both forms get no marker. " +
  'For plural-only nouns always use gender "feminin" so the card shows the article "die". ' +
  'Use gender "kein" for nouns used without an article (most countries and cities like Deutschland, ' +
  "languages like Deutsch, and school subjects like Mathematik).";

// ── API Call ──────────────────────────────────────────────────────────────────

async function generateAiEntry(type, word) {
  const key = getStoredAiKey();
  if (!key) {
    toggleAiKeyEditor(true);
    throw new Error("Paste your Anthropic API key first, then hit Generate again.");
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: AI_MODEL,
      max_tokens: 2048,
      system: AI_SYSTEM_PROMPT,
      output_config: { format: { type: "json_schema", schema: AI_WRAPPER_SCHEMA } },
      messages: [
        { role: "user", content: `Selected word class: ${type}. Word: "${word}"` },
      ],
    }),
  });

  if (res.status === 401) {
    removeAiKey();
    toggleAiKeyEditor(true);
    throw new Error("Invalid API key — it has been cleared. Paste it again.");
  }
  if (!res.ok) {
    let msg = `API error (${res.status})`;
    try { msg = (await res.json()).error?.message || msg; } catch {}
    throw new Error(msg);
  }

  const data = await res.json();
  if (data.stop_reason === "refusal") throw new Error("The model declined this request.");
  const text = (data.content || []).find((b) => b.type === "text")?.text;
  if (!text) throw new Error("Empty response from the API.");
  return JSON.parse(text); // { type, entry }
}

// ── AI Mode Switch ────────────────────────────────────────────────────────────

function setAiMode(on) {
  state.aiMode = on;
  $("ai-mode-toggle").checked = on;
  setVisible("ai-panel", on);
  setVisible("btn-modal-save", !on);
  resetAiPreview();
  switchModalType(state.modalType); // re-applies form visibility with aiMode considered
  if (on) $("ai-word").focus();
}

function resetAiPreview() {
  aiPendingEntry = null;
  hide("ai-preview");
  hide("ai-mismatch");
  show("ai-input-row");
  setText("ai-error", "");
}

// ── Generate → Preview ────────────────────────────────────────────────────────

async function aiGenerate() {
  const word = $("ai-word").value.trim();
  if (!word) { $("ai-word").focus(); return; }

  const btn = $("btn-ai-generate");
  btn.disabled = true;
  setText("btn-ai-generate", "Generating…");
  setText("ai-error", "");
  try {
    const result = await generateAiEntry(state.modalType, word);
    const entry = result.entry;
    const type = AI_SCHEMAS[result.type] ? result.type : state.modalType;
    aiPendingEntry = { type, entry };

    // Word exists as a different class than selected — ask in-modal before switching
    if (type !== state.modalType) {
      $("ai-mismatch-text").innerHTML =
        `"<b>${escapeHtml(word)}</b>" doesn't seem to be a ${escapeHtml(state.modalType)}.<br>` +
        `Do you mean <b>${escapeHtml(entry.name)}</b> (${escapeHtml(type)})?`;
      hide("ai-input-row");
      show("ai-mismatch");
      $("btn-ai-mismatch-yes").focus();
      return;
    }

    renderAiPreview(type, entry);
    hide("ai-input-row");
    show("ai-preview");
    $("btn-ai-accept").focus();
  } catch (err) {
    setText("ai-error", err.message);
  } finally {
    btn.disabled = false;
    setText("btn-ai-generate", "✨ Generate");
  }
}

function renderAiPreview(type, entry) {
  const meaning = entry.meaning || {};
  const e = escapeHtml;
  const meanings = `${e(meaning.eng || "?")} / ${e(meaning.ind || "?")}`;

  let title = e(entry.name);
  let badge = "";
  let extraBadges = "";
  let details = "";

  if (type === "verb") {
    badge = e(entry.type || "");
    extraBadges =
      (entry.reflexive ? '<span class="ai-badge">reflexiv</span>' : "") +
      (entry.trennbar  ? '<span class="ai-badge">trennbar</span>'  : "");
    const rows = CONJ_KEYS.map((k) =>
      `<tr><td class="ai-person">${e(k)}</td><td>${e(entry.conjugations?.[k] || "")}</td><td>${e(entry.praeteritum?.[k] || "")}</td></tr>`
    ).join("");
    details = `
      <table class="ai-conj-table">
        <tr><th></th><th>Präsens</th><th>Präteritum</th></tr>
        ${rows}
      </table>
      <div class="ai-detail-line">Partizip II: <b>${e(entry.partizip2 || "")}</b></div>`;
  } else if (type === "noun") {
    const article = ARTICLES[entry.gender] || "";
    title = `${article ? e(article) + " " : ""}${e(entry.name)}`;
    badge = entry.gender === "kein" ? "kein Artikel" : e(entry.gender || "");
    details = `<div class="ai-detail-line">Plural: <b>${entry.plural ? "die " + e(entry.plural) : "—"}</b></div>`;
  } else if (type === "adjective") {
    details = `
      <div class="ai-detail-line">Komparativ: <b>${e(entry.comparative || "")}</b></div>
      <div class="ai-detail-line">Superlativ: <b>${e(entry.superlative || "")}</b></div>`;
  } else if (type === "adverb") {
    badge = e(entry.adverbType || "");
  } else if (type === "preposition") {
    badge = e(entry.prepCase || "");
  }

  $("ai-preview-content").innerHTML = `
    <div class="ai-question">Add <b>${title}</b> — ${meanings}?</div>
    ${badge ? `<span class="ai-badge">${badge}</span>` : ""}${extraBadges}
    ${details}`;
}

// ── Mismatch Yes / No ─────────────────────────────────────────────────────────

function confirmAiMismatch() {
  if (!aiPendingEntry) return;
  hide("ai-mismatch");
  switchModalType(aiPendingEntry.type); // updates state.modalType + active type buttons
  renderAiPreview(aiPendingEntry.type, aiPendingEntry.entry);
  show("ai-preview");
  $("btn-ai-accept").focus();
}

function declineAiMismatch() {
  resetAiPreview();
  setText("ai-error", "Not added — try another word or type.");
  $("ai-word").focus();
}

// ── Accept / Edit / Cancel ────────────────────────────────────────────────────

function acceptAiEntry() {
  if (!aiPendingEntry) return;
  const { type, entry } = aiPendingEntry;
  const data = loadData();
  const deckKey = AI_DECK_KEYS[type];
  const card = { id: genId(), ...entry };
  // normal verbs carry no flags at all (matches manual-form and clean-vocab.js schema)
  if (type === "verb") {
    if (!card.reflexive) delete card.reflexive;
    if (!card.trennbar)  delete card.trennbar;
  }
  data[deckKey].push(card);

  // Auto-add to active group when adding during group-study (mirrors saveCard)
  if (state.viewMode === "group-study" && state.activeGroupId) {
    const grp = data.groups && data.groups.find((g) => g.id === state.activeGroupId);
    if (grp && !grp.cardIds.includes(card.id)) grp.cardIds.push(card.id);
  }

  saveData(data, card.name);
  switchDeck(deckKey); // refresh deck behind the modal

  // Stay open for the next word (batch adding)
  resetAiPreview();
  $("ai-word").value = "";
  $("ai-word").focus();
}

function editAiEntry() {
  if (!aiPendingEntry) return;
  const { type, entry } = aiPendingEntry;
  setAiMode(false); // back to the manual form (also clears aiPendingEntry)
  switchModalType(type);
  fillModalFromAiEntry(type, entry);
}

// ── Fill the manual form (Edit path) ──────────────────────────────────────────

function fillModalFromAiEntry(type, entry) {
  const meaning = entry.meaning || {};
  if (type === "verb") {
    $("verb-name").value = entry.name || "";
    $("verb-type").value = entry.type || "regular";
    $("verb-reflexive").checked = !!entry.reflexive;
    $("verb-trennbar").checked  = !!entry.trennbar;
    CONJ_KEYS.forEach((key, i) => { $(CONJ_IDS[i]).value = (entry.conjugations && entry.conjugations[key]) || ""; });
    CONJ_KEYS.forEach((key, i) => { $(PRAE_IDS[i]).value = (entry.praeteritum && entry.praeteritum[key]) || ""; });
    $("verb-partizip2").value = entry.partizip2 || "";
    $("verb-eng").value = meaning.eng || "";
    $("verb-ind").value = meaning.ind || "";
  } else if (type === "noun") {
    $("noun-name").value   = entry.name || "";
    $("noun-plural").value = entry.plural || "";
    $("noun-gender").value = entry.gender || "maskulin";
    $("noun-eng").value    = meaning.eng || "";
    $("noun-ind").value    = meaning.ind || "";
  } else if (type === "adjective") {
    $("adj-name").value        = entry.name || "";
    $("adj-comparative").value = entry.comparative || "";
    $("adj-superlative").value = entry.superlative || "";
    $("adj-eng").value         = meaning.eng || "";
    $("adj-ind").value         = meaning.ind || "";
  } else if (type === "adverb") {
    $("adv-name").value = entry.name || "";
    $("adv-type").value = entry.adverbType || "modal";
    $("adv-eng").value  = meaning.eng || "";
    $("adv-ind").value  = meaning.ind || "";
  } else if (type === "preposition") {
    $("prep-name").value = entry.name || "";
    $("prep-case").value = entry.prepCase || "dativ";
    $("prep-eng").value  = meaning.eng || "";
    $("prep-ind").value  = meaning.ind || "";
  }
}
