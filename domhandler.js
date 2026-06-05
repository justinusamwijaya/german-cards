// ── DOM Helpers ───────────────────────────────────────────────────────────────

const $ = (id) => document.getElementById(id);

function show(id)                  { $(id).classList.remove("hidden"); }
function hide(id)                  { $(id).classList.add("hidden"); }
function setVisible(id, visible)   { $(id).classList.toggle("hidden", !visible); }
function setActive(id, active)     { $(id).classList.toggle("active", active); }
function setText(id, text)         { $(id).textContent = text; }

function setCardContent(frontHtml, backHtml) {
  $("card-front").className = "card-front";
  $("card-front").innerHTML = frontHtml;
  $("card-back").innerHTML  = backHtml;
}

// ── Utilities ─────────────────────────────────────────────────────────────────

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g,  "&lt;")
    .replace(/>/g,  "&gt;");
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

// ── Card type detectors ───────────────────────────────────────────────────────

function isNounCard(card)      { return card.gender      !== undefined; }
function isAdjectiveCard(card) { return card.comparative !== undefined; }
function isAdverbCard(card)    { return card.adverbType  !== undefined; }
