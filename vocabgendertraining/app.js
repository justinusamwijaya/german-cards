const ARTICLES = { maskulin: 'der', feminin: 'die', netral: 'das', neutrum: 'das' };

const elGroupSelect   = document.getElementById('group-select');
const elCard          = document.getElementById('card');
const elCardBlank     = document.getElementById('card-blank');
const elCardNoun      = document.getElementById('card-noun');
const elCardFeedback  = document.getElementById('card-feedback');
const elBtns          = document.querySelectorAll('.article-btn');
const elProgressFill  = document.getElementById('progress-fill');
const elScoreCorrect  = document.getElementById('score-correct');
const elScoreWrong    = document.getElementById('score-wrong');
const elScoreRemain   = document.getElementById('score-remain');
const elTraining      = document.getElementById('training-area');
const elSummary       = document.getElementById('summary');
const elSummaryScore  = document.getElementById('summary-score');
const elSummaryDetail = document.getElementById('summary-detail');
const elBtnRetry      = document.getElementById('btn-retry');
const elEmpty         = document.getElementById('empty-msg');

let allNouns = [];
let groups   = [];
let deck     = [];
let idx      = 0;
let correct  = 0;
let wrong    = 0;

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

async function loadData() {
  const res  = await fetch('../vocab.txt');
  const data = await res.json();

  allNouns = (data.nouns || []).filter(n => n.gender && ARTICLES[n.gender]);
  groups   = (data.groups || []);

  const nounIds = new Set(allNouns.map(n => n.id));
  groups.forEach(g => {
    const hasNoun = (g.cardIds || []).some(id => nounIds.has(id));
    if (!hasNoun) return;
    const opt = document.createElement('option');
    opt.value = g.id;
    opt.textContent = g.name;
    elGroupSelect.appendChild(opt);
  });

  startSession();
}

function getNounsForSelection() {
  const val = elGroupSelect.value;
  if (val === 'all') return allNouns;
  const g = groups.find(g => g.id === val);
  if (!g) return allNouns;
  const ids = new Set(g.cardIds || []);
  return allNouns.filter(n => ids.has(n.id));
}

function startSession() {
  const nouns = getNounsForSelection();
  if (nouns.length === 0) {
    showEmpty(true);
    return;
  }
  showEmpty(false);
  deck    = shuffle([...nouns]);
  idx     = 0;
  correct = 0;
  wrong   = 0;
  elSummary.classList.remove('active');
  elTraining.style.display = '';
  updateScore();
  showCard();
}

function showCard() {
  const noun = deck[idx];
  elCardBlank.textContent = '___';
  elCardBlank.className = 'card-article';
  elCardNoun.textContent = noun.name;
  elCardFeedback.textContent = '';
  elCard.className = 'gt-card';
  elBtns.forEach(btn => {
    btn.disabled = false;
    btn.className = 'article-btn';
  });
  updateProgress();
}

function updateScore() {
  elScoreCorrect.textContent = correct;
  elScoreWrong.textContent   = wrong;
  elScoreRemain.textContent  = Math.max(0, deck.length - idx);
}

function updateProgress() {
  const pct = deck.length > 0 ? (idx / deck.length) * 100 : 0;
  elProgressFill.style.width = pct + '%';
}

function handleAnswer(chosen) {
  const noun       = deck[idx];
  const correctAns = ARTICLES[noun.gender];
  const isRight    = chosen === correctAns;

  // Reveal the correct article in place of ___
  elCardBlank.textContent = correctAns;
  elCardBlank.classList.add('article-' + correctAns);

  // Lock all buttons immediately
  elBtns.forEach(btn => {
    btn.disabled = true;
    if (btn.dataset.article === correctAns) btn.classList.add('correct-ans');
    if (!isRight && btn.dataset.article === chosen) btn.classList.add('wrong-ans');
  });

  if (isRight) {
    correct++;
    elCard.classList.add('correct');
    elCardFeedback.textContent = '✓ Correct!';
  } else {
    wrong++;
    elCard.classList.add('wrong');
    elCardFeedback.textContent = `✗ It's "${correctAns}"`;
  }

  updateScore();

  setTimeout(() => {
    idx++;
    if (idx >= deck.length) {
      showSummary();
    } else {
      showCard();
    }
  }, 1100);
}

function showSummary() {
  elTraining.style.display = 'none';
  elSummary.classList.add('active');
  const total = correct + wrong;
  const pct   = total > 0 ? Math.round((correct / total) * 100) : 0;
  elSummaryScore.textContent  = pct + '%';
  elSummaryDetail.textContent = `${correct} correct · ${wrong} wrong · ${total} total`;
}

function showEmpty(show) {
  elEmpty.style.display    = show ? '' : 'none';
  elTraining.style.display = show ? 'none' : '';
  elSummary.classList.remove('active');
}

elBtns.forEach(btn => btn.addEventListener('click', () => handleAnswer(btn.dataset.article)));
elBtnRetry.addEventListener('click', startSession);
elGroupSelect.addEventListener('change', startSession);

loadData();
