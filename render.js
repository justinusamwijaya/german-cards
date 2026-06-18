// ── Card Rendering ────────────────────────────────────────────────────────────

function renderCard() {
  showDeleteConfirm(false);
  $("card-inner").classList.remove("flipped");

  const inGroup = state.viewMode === "group-study";
  $("btn-delete-card").textContent      = inGroup ? "✗ Remove"        : "🗑️ Delete";
  $("delete-confirm-text").textContent  = inGroup ? "Remove from group?" : "Delete this card?";

  if (state.cards.length === 0) {
    showSummary();
    return;
  }

  const card = state.cards[state.index];
  setText("card-counter", `${state.index + 1} / ${state.cards.length}`);
  $("btn-prev").disabled = state.index === 0;
  $("btn-next").disabled = state.index === state.cards.length - 1;

  if      (isNounCard(card))      renderNounCard(card);
  else if (isAdjectiveCard(card)) renderAdjectiveCard(card);
  else if (isAdverbCard(card))    renderAdverbCard(card);
  else                            renderVerbCard(card);

  const ans = state.answers[card.id];
  $("btn-knew").classList.toggle("answered", ans === "knew");
  $("btn-didnt").classList.toggle("answered", ans === "didnt");
  updateScoreDisplay();
}

function renderNounCard(noun) {
  const article      = ARTICLES[noun.gender] || "der";
  const gClass       = { maskulin: "gender-m", feminin: "gender-f", netral: "gender-n" }[noun.gender] || "gender-m";
  const articleClass = article === "der" ? "article-der" : article === "die" ? "article-die" : "";

  setCardContent(
    `<div class="card-front-inner">
      <span class="badge noun-badge">Nomen</span>
      <div class="card-word"><span class="card-article ${articleClass}">${article}</span> ${noun.name}</div>
    </div>`,
    `<div class="back-content">
      <div class="back-header">
        <span class="badge ${gClass}">${noun.gender}</span>
        <span class="back-word">${article} ${noun.name}</span>
      </div>
      <div class="back-row"><span class="row-label">Plural</span><span>die ${noun.plural}</span></div>
      <div class="back-row"><span class="flag">🇬🇧</span><span>${noun.meaning.eng}</span></div>
      <div class="back-row"><span class="flag">🇮🇩</span><span>${noun.meaning.ind}</span></div>
    </div>`
  );
}

function renderVerbCard(verb) {
  const typeClass = verb.type === "irregular" ? "irreg-badge" : "reg-badge";
  const conjRows  = CONJ_KEYS.map(
    (s) => `<tr><td class="subj">${s}</td><td>${verb.conjugations[s] || "—"}</td></tr>`
  ).join("");

  const praeRows = verb.praeteritum
    ? CONJ_KEYS.map((s) => `<tr><td class="subj">${s}</td><td>${verb.praeteritum[s] || "—"}</td></tr>`).join("")
    : null;
  const praeSection = praeRows
    ? `<div class="prae-label">Präteritum</div><table class="conj-table">${praeRows}</table>`
    : "";

  setCardContent(
    `<div class="card-front-inner">
      <div class="badge-row">
        <span class="badge verb-badge">Verb</span>
        <span class="badge ${typeClass}">${verb.type === "irregular" ? "Irregular" : "Regular"}</span>
      </div>
      <div class="card-word">${verb.name}</div>
    </div>`,
    `<div class="back-content">
      <div class="back-header">
        <span class="badge ${typeClass}">${verb.type}</span>
        <span class="back-word">${verb.name}</span>
      </div>
      <table class="conj-table">${conjRows}</table>
      ${praeSection}
      <div class="back-row"><span class="flag">🇬🇧</span><span>${verb.meaning.eng}</span></div>
      <div class="back-row"><span class="flag">🇮🇩</span><span>${verb.meaning.ind}</span></div>
    </div>`
  );
}

function renderAdjectiveCard(adj) {
  setCardContent(
    `<div class="card-front-inner">
      <span class="badge adj-badge">Adjektiv</span>
      <div class="card-word">${adj.name}</div>
    </div>`,
    `<div class="back-content">
      <div class="back-header">
        <span class="badge adj-badge">Adjektiv</span>
        <span class="back-word">${adj.name}</span>
      </div>
      <div class="back-row"><span class="row-label">Komparativ</span><span>${adj.comparative || "—"}</span></div>
      <div class="back-row"><span class="row-label">Superlativ</span><span>${adj.superlative || "—"}</span></div>
      <div class="back-row"><span class="flag">🇬🇧</span><span>${adj.meaning.eng}</span></div>
      <div class="back-row"><span class="flag">🇮🇩</span><span>${adj.meaning.ind}</span></div>
    </div>`
  );
}

function renderAdverbCard(adv) {
  const typeLabel = { modal: "Modal", temporal: "Temporal", lokal: "Lokal", kausal: "Kausal" }[adv.adverbType] || adv.adverbType;

  setCardContent(
    `<div class="card-front-inner">
      <span class="badge adv-badge">Adverb</span>
      <div class="card-word">${adv.name}</div>
    </div>`,
    `<div class="back-content">
      <div class="back-header">
        <span class="badge adv-badge">Adverb</span>
        <span class="back-word">${adv.name}</span>
      </div>
      <div class="back-row"><span class="row-label">Type</span><span>${typeLabel}</span></div>
      <div class="back-row"><span class="flag">🇬🇧</span><span>${adv.meaning.eng}</span></div>
      <div class="back-row"><span class="flag">🇮🇩</span><span>${adv.meaning.ind}</span></div>
    </div>`
  );
}

// ── Summary ───────────────────────────────────────────────────────────────────

function showSummary() {
  hide("study-content");
  show("summary-wrap");
  setText("summary-text", `✓ Knew: ${state.knew}  ✗ Didn't: ${state.didnt}  · Total: ${state.cards.length}`);

  const missed  = state.cards.filter((c) => state.answers[c.id] === "didnt");
  const listEl  = $("summary-missed-list");

  if (missed.length > 0) {
    listEl.innerHTML =
      '<p class="missed-heading">Didn\'t know:</p>' +
      missed.map((c) => {
        const label = isNounCard(c)
          ? `<span class="missed-article">${ARTICLES[c.gender] || "der"}</span> ${escapeHtml(c.name)}`
          : escapeHtml(c.name);
        return `<div class="missed-item">${label}<span class="missed-meaning"> — ${escapeHtml(c.meaning.eng)}</span></div>`;
      }).join("");
  } else {
    listEl.innerHTML = "";
  }

  setVisible("btn-retry-missed", missed.length > 0);
  setVisible("btn-refill-deck",  !!localStorage.getItem("revision-deck"));
}

// ── Delete confirm row ────────────────────────────────────────────────────────

function showDeleteConfirm(show) {
  setVisible("delete-confirm", show);
  setVisible("card-actions",   !show);
}

// ── Score ─────────────────────────────────────────────────────────────────────

function markCard(answer) {
  const card = state.cards[state.index];
  const prev = state.answers[card.id];
  if (prev === "knew")  state.knew--;
  if (prev === "didnt") state.didnt--;
  if (answer === "knew")  state.knew++;
  if (answer === "didnt") state.didnt++;
  state.answers[card.id] = answer;
}

function updateScoreDisplay() {
  setText("score-knew",  `✓ ${state.knew}`);
  setText("score-didnt", `✗ ${state.didnt}`);
  setText("score-total", `out of ${state.cards.length}`);
}
