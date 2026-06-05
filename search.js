// ── Search ────────────────────────────────────────────────────────────────────

function normalizeSearch(s) {
  return String(s)
    .toLowerCase()
    .replace(/ä/g, "a")
    .replace(/ö/g, "o")
    .replace(/ü/g, "u")
    .replace(/ß/g, "s");
}

function highlightMatch(text, query) {
  const i = normalizeSearch(text).indexOf(normalizeSearch(query));
  if (i === -1) return escapeHtml(text);
  return (
    escapeHtml(text.slice(0, i)) +
    "<mark>" + escapeHtml(text.slice(i, i + query.length)) + "</mark>" +
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
    if (m(v.meaning.eng)) add(v, "verb", "English",    v.meaning.eng);
    if (m(v.meaning.ind)) add(v, "verb", "Indonesian", v.meaning.ind);
    if (m(v.type))        add(v, "verb", "type",       v.type);
  });

  data.nouns.forEach((n) => {
    if (m(n.name))        add(n, "noun", null,        n.name);
    if (m(n.plural))      add(n, "noun", "plural",    n.plural);
    if (m(n.gender))      add(n, "noun", "gender",    n.gender);
    if (m(n.meaning.eng)) add(n, "noun", "English",   n.meaning.eng);
    if (m(n.meaning.ind)) add(n, "noun", "Indonesian", n.meaning.ind);
  });

  data.adjectives.forEach((a) => {
    if (m(a.name))              add(a, "adjective", null,         a.name);
    if (m(a.comparative || "")) add(a, "adjective", "Komparativ", a.comparative);
    if (m(a.superlative || "")) add(a, "adjective", "Superlativ", a.superlative);
    if (m(a.meaning.eng))       add(a, "adjective", "English",   a.meaning.eng);
    if (m(a.meaning.ind))       add(a, "adjective", "Indonesian", a.meaning.ind);
  });

  data.adverbs.forEach((a) => {
    if (m(a.name))             add(a, "adverb", null,        a.name);
    if (m(a.adverbType || "")) add(a, "adverb", "Type",      a.adverbType);
    if (m(a.meaning.eng))      add(a, "adverb", "English",   a.meaning.eng);
    if (m(a.meaning.ind))      add(a, "adverb", "Indonesian", a.meaning.ind);
  });

  return results.slice(0, 8);
}

function renderSearchDropdown(results, query) {
  const dd = $("search-dropdown");
  if (window.innerWidth <= 600) {
    dd.style.top = document.querySelector("#view-study header").getBoundingClientRect().bottom + "px";
  } else {
    dd.style.top = "";
  }

  if (!results.length) {
    dd.innerHTML = '<div class="search-no-results">No results</div>';
    show("search-dropdown");
    return;
  }

  dd.innerHTML = results.map((r) => {
    const badgeClass = r.type === "verb" ? "verb-badge" : r.type === "adjective" ? "adj-badge" : r.type === "adverb" ? "adv-badge" : "noun-badge";
    const badgeLabel = r.type === "verb" ? "Verb"       : r.type === "adjective" ? "Adj"       : r.type === "adverb" ? "Adv"       : "Noun";
    const matchHtml  = r.matchLabel
      ? `<span class="search-result-match">${escapeHtml(r.matchLabel)} · ${highlightMatch(r.matchValue, query)}</span>`
      : "";
    return `<div class="search-result" data-id="${r.card.id}" data-type="${r.type}">
      <span class="badge ${badgeClass}">${badgeLabel}</span>
      <span class="search-result-parent">${escapeHtml(r.card.name)}</span>
      ${matchHtml}
    </div>`;
  }).join("");

  show("search-dropdown");

  dd.querySelectorAll(".search-result").forEach((el) => {
    el.addEventListener("click", () => {
      navigateToCard(el.dataset.id, el.dataset.type);
      closeSearch();
    });
  });
}

function navigateToCard(cardId, cardType) {
  const typeToKey = { verb: "verbs", noun: "nouns", adjective: "adjectives", adverb: "adverbs" };
  const targetDeck = typeToKey[cardType] || "nouns";
  if (state.deck !== targetDeck) switchDeck(targetDeck);
  const idx = state.cards.findIndex((c) => c.id === cardId);
  if (idx !== -1) {
    state.index = idx;
    renderCard();
  }
}

function closeSearch() {
  setText("search-input", "");
  $("search-input").value = "";
  hide("search-dropdown");
  $("search-dropdown").innerHTML = "";
}
