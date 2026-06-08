const ARTICLES      = { maskulin: 'der', feminin: 'die', netral: 'das' };
const CONJ_KEYS     = ['ich', 'du', 'er/sie/es', 'wir', 'ihr', 'Sie'];
const GIST_ID       = "f9f86c5e14e3c389ff922777d733b174";
const GIST_TOKEN    = "__GIST_TOKEN__";
const GIST_FILE     = "vocab.txt";
const REVISION_KEY  = "flipped-revision-deck";

let allData      = {};
let cards        = [];
let index        = 0;
let knew         = 0;
let didnt        = 0;
let answers      = {};
let currentDeck  = "nouns";
let currentGroup = "all";

const $id = (id) => document.getElementById(id);

function isNounCard(c)      { return c.gender      !== undefined; }
function isAdjectiveCard(c) { return c.comparative !== undefined; }
function isAdverbCard(c)    { return c.adverbType  !== undefined; }

function escHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

async function loadData() {
  let data = null;

  const local = localStorage.getItem("germancards");
  if (local) {
    try { data = JSON.parse(local); } catch (e) {}
  }

  if (!data && GIST_ID) {
    try {
      const headers = GIST_TOKEN !== "__GIST_TOKEN__"
        ? { Authorization: `token ${GIST_TOKEN}` }
        : {};
      const res = await fetch(`https://api.github.com/gists/${GIST_ID}`, { headers });
      if (res.ok) {
        const gist = await res.json();
        data = JSON.parse(gist.files[GIST_FILE].content);
      }
    } catch (e) {}
  }

  if (!data) {
    $id("empty-msg").style.display = "";
    $id("training-area").style.display = "none";
    return;
  }

  allData = data;

  const groupSelect = $id("group-select");
  (allData.groups || []).forEach(g => {
    const opt = document.createElement("option");
    opt.value = g.id;
    opt.textContent = g.name;
    groupSelect.appendChild(opt);
  });

  startDeck($id("deck-select").value);
}

function getDeckCards(deckName) {
  if (deckName === "combined") return [
    ...(allData.nouns      || []),
    ...(allData.verbs      || []),
    ...(allData.adjectives || []),
    ...(allData.adverbs    || []),
  ];
  if (deckName === "nouns")      return allData.nouns      || [];
  if (deckName === "verbs")      return allData.verbs      || [];
  if (deckName === "adjectives") return allData.adjectives || [];
  if (deckName === "adverbs")    return allData.adverbs    || [];
  return [];
}

function startDeck(deckName) {
  currentDeck = deckName;

  if (currentGroup !== "all") {
    const group   = (allData.groups || []).find(g => g.id === currentGroup);
    const ids     = new Set(group ? group.cardIds : []);
    const all     = getDeckCards(deckName);
    cards = all.filter(c => ids.has(c.id));
  } else {
    cards = [...getDeckCards(deckName)];
  }

  index   = 0;
  knew    = 0;
  didnt   = 0;
  answers = {};

  const revisionRaw = localStorage.getItem(REVISION_KEY);
  if (revisionRaw) {
    const revIds = new Set(JSON.parse(revisionRaw));
    cards = cards.filter(c => revIds.has(c.id));
  }

  updateCombineBtn();
  updateRevisionBanner();

  $id("summary-wrap").classList.add("hidden");
  $id("training-area").style.display = "";

  if (cards.length === 0) {
    $id("empty-msg").style.display = "";
    $id("training-area").style.display = "none";
    return;
  }
  $id("empty-msg").style.display = "none";
  renderCard();
}

function updateCombineBtn() {
  $id("btn-combine").classList.toggle("active", currentDeck === "combined");
}

function updateRevisionBanner() {
  const active = !!localStorage.getItem(REVISION_KEY);
  $id("revision-banner").classList.toggle("hidden", !active);
}

function clearRevision() {
  localStorage.removeItem(REVISION_KEY);
  startDeck(currentDeck);
}

function renderCard() {
  $id("card-inner").classList.remove("flipped");

  if (cards.length === 0) { showSummary(); return; }

  const card = cards[index];
  $id("card-counter").textContent = `${index + 1} / ${cards.length}`;
  $id("btn-prev").disabled = index === 0;
  $id("btn-next").disabled = index === cards.length - 1;

  if      (isNounCard(card))      renderNounCard(card);
  else if (isAdjectiveCard(card)) renderAdjectiveCard(card);
  else if (isAdverbCard(card))    renderAdverbCard(card);
  else                            renderVerbCard(card);

  const ans = answers[card.id];
  $id("btn-knew").classList.toggle("answered", ans === "knew");
  $id("btn-didnt").classList.toggle("answered", ans === "didnt");

  updateScore();
}

function setCardContent(front, back) {
  $id("card-front").innerHTML = front;
  $id("card-back").innerHTML  = back;
}

function renderNounCard(noun) {
  const article  = ARTICLES[noun.gender] || "der";
  const gClass   = { maskulin: "gender-m", feminin: "gender-f", netral: "gender-n" }[noun.gender] || "gender-m";
  const artClass = article === "der" ? "article-der" : article === "die" ? "article-die" : "";

  setCardContent(
    `<div class="card-front-inner">
      <span class="badge noun-badge">Nomen</span>
      <div class="meaning-rows">
        <div class="meaning-row"><span class="flag">🇬🇧</span><span>${escHtml(noun.meaning.eng)}</span></div>
        <div class="meaning-row"><span class="flag">🇮🇩</span><span>${escHtml(noun.meaning.ind)}</span></div>
      </div>
      <div class="card-hint">hold to reveal</div>
    </div>`,
    `<div class="back-content">
      <div class="back-header">
        <span class="badge ${gClass}">${noun.gender}</span>
        <span class="back-word"><span class="${artClass}">${article}</span> ${escHtml(noun.name)}</span>
      </div>
      <div class="back-row"><span class="row-label">Plural</span><span>die ${escHtml(noun.plural)}</span></div>
    </div>`
  );
}

function renderVerbCard(verb) {
  const typeClass = verb.type === "irregular" ? "irreg-badge" : "reg-badge";
  const conjRows  = CONJ_KEYS.map(
    s => `<tr><td class="subj">${s}</td><td>${escHtml(verb.conjugations[s] || "—")}</td></tr>`
  ).join("");

  setCardContent(
    `<div class="card-front-inner">
      <div class="badge-row">
        <span class="badge verb-badge">Verb</span>
        <span class="badge ${typeClass}">${verb.type === "irregular" ? "Irregular" : "Regular"}</span>
      </div>
      <div class="meaning-rows">
        <div class="meaning-row"><span class="flag">🇬🇧</span><span>${escHtml(verb.meaning.eng)}</span></div>
        <div class="meaning-row"><span class="flag">🇮🇩</span><span>${escHtml(verb.meaning.ind)}</span></div>
      </div>
      <div class="card-hint">hold to reveal</div>
    </div>`,
    `<div class="back-content">
      <div class="back-header">
        <span class="badge ${typeClass}">${verb.type}</span>
        <span class="back-word">${escHtml(verb.name)}</span>
      </div>
      <table class="conj-table">${conjRows}</table>
    </div>`
  );
}

function renderAdjectiveCard(adj) {
  setCardContent(
    `<div class="card-front-inner">
      <span class="badge adj-badge">Adjektiv</span>
      <div class="meaning-rows">
        <div class="meaning-row"><span class="flag">🇬🇧</span><span>${escHtml(adj.meaning.eng)}</span></div>
        <div class="meaning-row"><span class="flag">🇮🇩</span><span>${escHtml(adj.meaning.ind)}</span></div>
      </div>
      <div class="card-hint">hold to reveal</div>
    </div>`,
    `<div class="back-content">
      <div class="back-header">
        <span class="badge adj-badge">Adjektiv</span>
        <span class="back-word">${escHtml(adj.name)}</span>
      </div>
      <div class="back-row"><span class="row-label">Komparativ</span><span>${escHtml(adj.comparative || "—")}</span></div>
      <div class="back-row"><span class="row-label">Superlativ</span><span>${escHtml(adj.superlative || "—")}</span></div>
    </div>`
  );
}

function renderAdverbCard(adv) {
  const typeLabel = { modal: "Modal", temporal: "Temporal", lokal: "Lokal", kausal: "Kausal" }[adv.adverbType] || adv.adverbType;

  setCardContent(
    `<div class="card-front-inner">
      <span class="badge adv-badge">Adverb</span>
      <div class="meaning-rows">
        <div class="meaning-row"><span class="flag">🇬🇧</span><span>${escHtml(adv.meaning.eng)}</span></div>
        <div class="meaning-row"><span class="flag">🇮🇩</span><span>${escHtml(adv.meaning.ind)}</span></div>
      </div>
      <div class="card-hint">hold to reveal</div>
    </div>`,
    `<div class="back-content">
      <div class="back-header">
        <span class="badge adv-badge">Adverb</span>
        <span class="back-word">${escHtml(adv.name)}</span>
      </div>
      <div class="back-row"><span class="row-label">Type</span><span>${typeLabel}</span></div>
    </div>`
  );
}

function updateScore() {
  $id("score-knew").textContent   = knew;
  $id("score-didnt").textContent  = didnt;
  $id("score-remain").textContent = Math.max(0, cards.length - index - 1);
}

function markCard(answer) {
  const card = cards[index];
  const prev = answers[card.id];
  if (prev === "knew")  knew--;
  if (prev === "didnt") didnt--;
  if (answer === "knew")  knew++;
  if (answer === "didnt") didnt++;
  answers[card.id] = answer;
}

function showSummary() {
  $id("training-area").style.display = "none";
  $id("summary-wrap").classList.remove("hidden");
  $id("summary-text").textContent = `✓ Knew: ${knew}  ✗ Didn't: ${didnt}  · Total: ${cards.length}`;

  const missed = cards.filter(c => answers[c.id] === "didnt");
  $id("btn-retry-missed").classList.toggle("hidden", missed.length === 0);
  $id("btn-refill-deck").classList.toggle("hidden",  !localStorage.getItem(REVISION_KEY));
}

// ── Flip interaction ──────────────────────────────────────────────────────────

const cardInner = $id("card-inner");
const flip   = () => cardInner.classList.add("flipped");
const unflip = () => cardInner.classList.remove("flipped");
cardInner.addEventListener("mousedown",   flip);
cardInner.addEventListener("mouseup",     unflip);
cardInner.addEventListener("mouseleave",  unflip);
cardInner.addEventListener("touchstart",  (e) => { e.preventDefault(); flip(); }, { passive: false });
cardInner.addEventListener("touchend",    unflip);
cardInner.addEventListener("touchcancel", unflip);

// ── Navigation ────────────────────────────────────────────────────────────────

$id("btn-prev").addEventListener("click", () => {
  if (index > 0) { index--; renderCard(); }
});
$id("btn-next").addEventListener("click", () => {
  if (index < cards.length - 1) { index++; renderCard(); }
  else showSummary();
});
$id("btn-knew").addEventListener("click", () => {
  markCard("knew");
  if (index < cards.length - 1) { index++; renderCard(); }
  else showSummary();
});
$id("btn-didnt").addEventListener("click", () => {
  markCard("didnt");
  if (index < cards.length - 1) { index++; renderCard(); }
  else showSummary();
});

$id("btn-restart").addEventListener("click", () => startDeck(currentDeck));

$id("btn-retry-missed").addEventListener("click", () => {
  const missedIds = cards.filter(c => answers[c.id] === "didnt").map(c => c.id);
  localStorage.setItem(REVISION_KEY, JSON.stringify(missedIds));
  startDeck(currentDeck);
});

$id("btn-refill-deck").addEventListener("click", clearRevision);
$id("btn-clear-revision").addEventListener("click", clearRevision);

$id("btn-combine").addEventListener("click", () => {
  startDeck(currentDeck === "combined" ? "nouns" : "combined");
  if (currentDeck !== "combined") $id("deck-select").value = "nouns";
});

$id("deck-select").addEventListener("change", (e) => startDeck(e.target.value));
$id("group-select").addEventListener("change", (e) => { currentGroup = e.target.value; startDeck(currentDeck); });

loadData();
