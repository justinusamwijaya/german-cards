// ── Groups List ───────────────────────────────────────────────────────────────

function renderGroupsList() {
  const data = loadData();
  const list = $("groups-list");

  if (!data.groups.length) {
    list.innerHTML = '<div class="groups-empty">No groups yet. Hit <strong>+ New Group</strong> to create one.</div>';
    return;
  }

  list.innerHTML = data.groups.map((g) => {
    const ids   = new Set(g.cardIds);
    const count = [...data.verbs, ...data.nouns, ...data.adjectives, ...data.adverbs]
      .filter((c) => ids.has(c.id)).length;
    return `<div class="group-row" data-id="${escapeHtml(g.id)}">
      <div class="group-info">
        <span class="group-name">${escapeHtml(g.name)}</span>
        <span class="group-count">${count} card${count !== 1 ? "s" : ""}</span>
      </div>
      <div class="group-btns" data-id="${escapeHtml(g.id)}">
        <button class="group-open-btn" data-id="${escapeHtml(g.id)}">Open</button>
        <button class="group-edit-btn" data-id="${escapeHtml(g.id)}" title="Edit group">✏️</button>
        <button class="group-del-btn"  data-id="${escapeHtml(g.id)}" title="Delete group">🗑️</button>
      </div>
    </div>`;
  }).join("");

  list.querySelectorAll(".group-open-btn").forEach((btn) =>
    btn.addEventListener("click", () => openGroup(btn.dataset.id))
  );
  list.querySelectorAll(".group-edit-btn").forEach((btn) =>
    btn.addEventListener("click", () => openGroupModal(btn.dataset.id))
  );
  list.querySelectorAll(".group-del-btn").forEach((btn) =>
    btn.addEventListener("click", () => promptDeleteGroup(btn.dataset.id, btn))
  );
}

function promptDeleteGroup(groupId, triggerBtn) {
  const btns = triggerBtn.closest(".group-btns");
  btns.innerHTML = `
    <span class="group-del-confirm-text">Delete group?</span>
    <button class="group-confirm-yes" data-id="${escapeHtml(groupId)}">Yes</button>
    <button class="group-confirm-no">No</button>`;
  btns.querySelector(".group-confirm-yes").addEventListener("click", () => {
    guardCUD(() => {
      const data = loadData();
      const grp  = data.groups.find((g) => g.id === groupId);
      data.groups = data.groups.filter((g) => g.id !== groupId);
      saveData(data, grp ? `group ${grp.name}` : "group");
      renderGroupsList();
    });
  });
  btns.querySelector(".group-confirm-no").addEventListener("click", renderGroupsList);
}

// ── Group Modal ───────────────────────────────────────────────────────────────

let _groupEditId      = null;
let _groupSelectedIds = new Set();
let _pickerTimer;

function openGroupModal(groupId = null) {
  const data = loadData();
  _groupEditId = groupId;

  if (groupId) {
    const group = data.groups.find((g) => g.id === groupId);
    setText("modal-group-title", "Edit Group");
    $("group-name-input").value = group ? group.name : "";
    _groupSelectedIds = new Set(group ? group.cardIds : []);
  } else {
    setText("modal-group-title", "New Group");
    $("group-name-input").value = "";
    _groupSelectedIds = new Set();
  }

  $("card-picker-search").value = "";
  renderCardPicker("");
  show("modal-group-overlay");
  $("group-name-input").focus();
}

function closeGroupModal() {
  hide("modal-group-overlay");
}

function renderCardPicker(query) {
  const data = loadData();
  const q    = normalizeSearch(query).trim();

  const allCards = [
    ...data.verbs.map((c)            => ({ ...c, _type: "verb" })),
    ...data.nouns.map((c)            => ({ ...c, _type: "noun" })),
    ...data.adjectives.map((c)       => ({ ...c, _type: "adjective" })),
    ...data.adverbs.map((c)          => ({ ...c, _type: "adverb" })),
    ...(data.prepositions || []).map((c) => ({ ...c, _type: "preposition" })),
  ].filter((c) => {
    if (!q) return true;
    const prefix = c._type === "noun" && nounArticle(c) ? nounArticle(c) + " " : "";
    return (
      normalizeSearch(prefix + c.name).includes(q) ||
      normalizeSearch(c.meaning.eng).includes(q) ||
      normalizeSearch(c.meaning.ind).includes(q)
    );
  });

  const list = $("card-picker-list");
  if (!allCards.length) {
    list.innerHTML = '<div class="picker-empty">No cards found</div>';
    return;
  }

  list.innerHTML = allCards.map((c) => {
    const sel       = _groupSelectedIds.has(c.id);
    const badgeCls  = c._type === "noun" ? "noun-badge" : c._type === "adjective" ? "adj-badge" : c._type === "adverb" ? "adv-badge" : c._type === "preposition" ? "prep-badge" : "verb-badge";
    const typeLabel = c._type === "noun" ? "Noun"       : c._type === "adjective" ? "Adj"       : c._type === "adverb" ? "Adv"       : c._type === "preposition" ? "Prep"        : "Verb";
    const prefix    = c._type === "noun" && nounArticle(c) ? nounArticle(c) + " " : "";
    return `<div class="picker-item${sel ? " selected" : ""}" data-id="${c.id}">
      <span class="badge ${badgeCls}">${typeLabel}</span>
      <span class="picker-name">${escapeHtml(prefix + c.name)}</span>
      <span class="picker-meaning">${escapeHtml(c.meaning.eng)}</span>
      <button class="picker-toggle${sel ? " is-in" : ""}" data-id="${c.id}">${sel ? "−" : "+"}</button>
    </div>`;
  }).join("");

  list.querySelectorAll(".picker-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      if (_groupSelectedIds.has(id)) _groupSelectedIds.delete(id);
      else _groupSelectedIds.add(id);
      renderCardPicker($("card-picker-search").value);
    });
  });
}

function saveGroup() {
  const name = $("group-name-input").value.trim();
  if (!name) { $("group-name-input").focus(); return; }

  const data  = loadData();
  const entry = { id: _groupEditId || genId(), name, cardIds: [..._groupSelectedIds] };

  if (_groupEditId) {
    const idx = data.groups.findIndex((g) => g.id === _groupEditId);
    if (idx !== -1) data.groups[idx] = entry;
    else data.groups.push(entry);
  } else {
    data.groups.push(entry);
  }

  saveData(data, `group ${entry.name}`);
  closeGroupModal();
  renderGroupsList();
}
