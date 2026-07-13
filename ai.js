// ── AI Auto-fill (Anthropic API) ──────────────────────────────────────────────
// The API key is never shipped with the app: it is pasted by the user at
// runtime and lives only in this browser's localStorage.

const AI_KEY_STORAGE = "gc_anthropic_key";
const AI_MODEL = "claude-opus-4-8";

const AI_DECK_KEYS = { verb: "verbs", noun: "nouns", adjective: "adjectives", adverb: "adverbs", preposition: "prepositions" };

let aiPendingEntry = null; // { type, entry } awaiting Accept / Edit / Cancel

// ── API Key ───────────────────────────────────────────────────────────────────

function getStoredAiKey() {
  return localStorage.getItem(AI_KEY_STORAGE) || "";
}

function promptAiKey() {
  const key = window.prompt(
    getStoredAiKey()
      ? "Anthropic API key (paste a new one, or leave empty to remove):"
      : "Paste your Anthropic API key (stored only in this browser):"
  );
  if (key === null) return getStoredAiKey();
  const trimmed = key.trim();
  if (!trimmed) {
    localStorage.removeItem(AI_KEY_STORAGE);
    window.alert("API key removed.");
    return "";
  }
  localStorage.setItem(AI_KEY_STORAGE, trimmed);
  return trimmed;
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
      conjugations: aiPersonTable("Präsens conjugation"),
      praeteritum: aiPersonTable("Präteritum conjugation"),
      partizip2: { type: "string", description: "Partizip II, bare participle only, e.g. gegangen" },
      meaning: AI_MEANING_SCHEMA,
    },
    required: ["name", "type", "conjugations", "praeteritum", "partizip2", "meaning"],
    additionalProperties: false,
  },
  noun: {
    type: "object",
    properties: {
      name: { type: "string", description: "Singular noun, capitalized, without article" },
      plural: { type: "string", description: "Plural form without article" },
      gender: { type: "string", enum: ["maskulin", "feminin", "netral"] },
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

const AI_SYSTEM_PROMPT =
  "You are a German dictionary assistant for an A1–B2 vocabulary flashcard app. " +
  "Given a German word and its word class, return its dictionary entry data. " +
  "Use correct German spelling and capitalization (nouns capitalized, verbs lowercase). " +
  "If the input looks misspelled, correct it to the most likely intended word. " +
  "Keep meanings short and learner-friendly: eng in English, ind in Indonesian. " +
  "For verbs, give Präsens and Präteritum forms for all six persons and the bare Partizip II.";

// ── API Call ──────────────────────────────────────────────────────────────────

async function generateAiEntry(type, word) {
  let key = getStoredAiKey();
  if (!key) key = promptAiKey();
  if (!key) throw new Error("No API key set. Click 🔑 to add one.");

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
      output_config: { format: { type: "json_schema", schema: AI_SCHEMAS[type] } },
      messages: [
        { role: "user", content: `Create the ${type} entry for: "${word}"` },
      ],
    }),
  });

  if (res.status === 401) {
    localStorage.removeItem(AI_KEY_STORAGE);
    throw new Error("Invalid API key — it has been cleared. Click 🔑 to paste it again.");
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
  return JSON.parse(text);
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
    const entry = await generateAiEntry(state.modalType, word);
    aiPendingEntry = { type: state.modalType, entry };
    renderAiPreview(state.modalType, entry);
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
  let details = "";

  if (type === "verb") {
    badge = e(entry.type || "");
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
    title = `${e(article)} ${e(entry.name)}`;
    badge = e(entry.gender || "");
    details = `<div class="ai-detail-line">Plural: <b>die ${e(entry.plural || "")}</b></div>`;
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
    ${badge ? `<span class="ai-badge">${badge}</span>` : ""}
    ${details}`;
}

// ── Accept / Edit / Cancel ────────────────────────────────────────────────────

function acceptAiEntry() {
  if (!aiPendingEntry) return;
  const { type, entry } = aiPendingEntry;
  const data = loadData();
  const deckKey = AI_DECK_KEYS[type];
  const card = { id: genId(), ...entry };
  data[deckKey].push(card);

  // Auto-add to active group when adding during group-study (mirrors saveCard)
  if (state.viewMode === "group-study" && state.activeGroupId) {
    const grp = data.groups && data.groups.find((g) => g.id === state.activeGroupId);
    if (grp && !grp.cardIds.includes(card.id)) grp.cardIds.push(card.id);
  }

  saveData(data);
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
