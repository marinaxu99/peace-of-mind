/* ===== Helpers & Store ===== */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const store = {
  get(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } },
  set(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
};

/* ===== Router (worry | triage | mood | archive) ===== */
const outlet = $('#routerOutlet');
const menuButtons = $$('.menu-btn');
const choiceButtons = $$('.choice');

function setActiveMenu(route) { menuButtons.forEach(b => b.classList.toggle('active', b.dataset.route === route)); }
function navigate(route) { if (!route) route = ''; if (location.hash.slice(1) !== route) { location.hash = route; } else { render(route); } }
window.addEventListener('hashchange', () => render(location.hash.slice(1)));
choiceButtons.forEach(btn => btn.addEventListener('click', () => navigate(btn.dataset.route)));
menuButtons.forEach(btn => btn.addEventListener('click', () => navigate(btn.dataset.route)));

/* ===== Views ===== */
function viewWorryWindow() {
  outlet.setAttribute('aria-busy', 'true');
  const cfg = store.get('worry_window_cfg', { start: '19:00', durationMin: 15 });
  outlet.innerHTML = `
    <h1 class="page-title">Worry Window</h1>
    <p class="page-subtitle">Choose a daily window to review your worries with intention.</p>

    <div class="card">
      <div class="split">
        <div>
          <label>Start time</label>
          <input id="wwStart" type="time" value="${cfg.start}">
        </div>
        <div>
          <label>Duration (minutes)</label>
          <input id="wwDuration" type="number" min="5" step="5" value="${cfg.durationMin}">
        </div>
      </div>
      <div class="row" style="margin-top:.6rem">
        <button id="wwSaveCfg" class="btn">Save</button>
        <span id="wwStatus" class="muted"></span>
      </div>
    </div>

    <div class="card" id="wwGate">
      <h3>Today’s Window</h3>
      <p id="wwGateText" class="muted"></p>
      <button id="wwOpenNow" class="btn small ghost">Open anyway</button>
    </div>

    <div class="card" id="wwBoard" style="display:none">
      <h3>Review & Sort</h3>
      <div class="split">
        <div>
          <h4 class="muted">Inbox</h4>
          <ul id="wwInbox" class="list"></ul>
        </div>
        <div>
          <h4 class="muted">Decisions</h4>
          <div class="row">
            <button class="btn small" id="markImportant">→ Important</button>
            <button class="btn small ghost" id="markLetGo">→ Let go</button>
          </div>
          <ul id="wwChosen" class="list" style="margin-top:.6rem"></ul>
        </div>
      </div>
      <div class="row end" style="margin-top:.6rem">
        <button id="wwCommit" class="btn">Save Decisions</button>
      </div>
    </div>
  `;
  outlet.setAttribute('aria-busy', 'false');
  bindWorryWindow();
}

function viewTriage() {
  outlet.setAttribute('aria-busy', 'true');
  outlet.innerHTML = `
    <h1 class="page-title">Conversation Triage</h1>
    <div class="card">
      <div class="split">
        <div>
          <label for="triageDate">Date</label>
          <input id="triageDate" type="date" />
        </div>
        <div>
          <label for="triageTag">Tag (optional)</label>
          <input id="triageTag" type="text" placeholder="e.g., social, work, family">
        </div>
      </div>

      <label style="margin-top:.6rem">3 facts (no interpretation)</label>
      <div class="split">
        <input id="f1" type="text" placeholder="Fact 1">
        <input id="f2" type="text" placeholder="Fact 2">
        <input id="f3" type="text" placeholder="Fact 3">
      </div>

      <label style="margin-top:.6rem">1 evidence-based thought</label>
      <textarea id="evidence" placeholder="ex: They smiled when I said X."></textarea>

      <label style="margin-top:.6rem">1 lesson / next step (optional)</label>
      <textarea id="lesson" placeholder="ex: Ask a clarifying question next time."></textarea>

      <div class="row end">
        <button id="triageClear" class="btn ghost">Clear</button>
        <button id="triageSave" class="btn">Save Entry</button>
      </div>
    </div>
  `;
  outlet.setAttribute('aria-busy', 'false');
  bindTriage();
}

function viewMood() {
  outlet.setAttribute('aria-busy', 'true');
  outlet.innerHTML = `
    <h1 class="page-title">Mood-Check Diary</h1>
    <div class="card">
      <div class="split">
        <div>
          <label for="moodDate">Date / Time</label>
          <input id="moodDate" type="datetime-local" />
        </div>
        <div>
          <label for="moodDid">Today I did (short list)</label>
          <input id="moodDid" type="text" placeholder="e.g., gym, call mom, edited reel">
        </div>
      </div>

      <div class="split" style="margin-top:.6rem">
        <div class="slider-row">
          <label for="energyBefore">Energy BEFORE</label>
          <input id="energyBefore" type="range" min="1" max="10" value="5">
          <span id="ebLabel">5</span>
        </div>
        <div class="slider-row">
          <label for="energyAfter">Energy AFTER</label>
          <input id="energyAfter" type="range" min="1" max="10" value="5">
          <span id="eaLabel">5</span>
        </div>
      </div>

      <label style="margin-top:.6rem">What I noticed about myself</label>
      <textarea id="noticed" placeholder="e.g., scanning for reactions; felt proud; felt tired"></textarea>

      <label style="margin-top:.6rem">3 small wins</label>
      <div class="split">
        <input id="w1" type="text" placeholder="Win 1">
        <input id="w2" type="text" placeholder="Win 2">
        <input id="w3" type="text" placeholder="Win 3">
      </div>

      <label style="margin-top:.6rem">What felt negative and why</label>
      <textarea id="negative"></textarea>

      <label style="margin-top:.6rem">One thing I’ll try next time</label>
      <textarea id="tryNext"></textarea>

      <div class="row end">
        <button id="moodClear" class="btn ghost">Clear</button>
        <button id="moodSave" class="btn">Save Entry</button>
      </div>
    </div>
  `;
  outlet.setAttribute('aria-busy', 'false');
  bindMood();
}

function viewArchive() {
  outlet.setAttribute('aria-busy', 'true');
  outlet.innerHTML = `
    <h1 class="page-title">Archive / Review</h1>
    <div class="card">
      <div class="split">
        <div>
          <label>Type</label>
          <select id="archType">
            <option value="senses">Senses (5-4-3-2-1)</option>
            <option value="reframes_fast">Reframes (Fast)</option>
            <option value="triage">Conversation Triage</option>
            <option value="mood">Mood-Check Diary</option>
            <option value="worry_decisions">Worry Decisions</option>
          </select>
        </div>
        <div>
          <label>Filter text (optional)</label>
          <input id="archFilter" type="text" placeholder="search...">
        </div>
      </div>
      <div id="archList" style="margin-top:.8rem"></div>
    </div>
  `;
  outlet.setAttribute('aria-busy', 'false');
  bindArchive();
}

/* ===== Worry Window Logic ===== */
function bindWorryWindow() {
  const startEl = $('#wwStart'), durEl = $('#wwDuration'), saveBtn = $('#wwSaveCfg'), status = $('#wwStatus');
  const gate = $('#wwGate'), gateText = $('#wwGateText'), openNow = $('#wwOpenNow');
  const board = $('#wwBoard'), inboxUL = $('#wwInbox'), chosenUL = $('#wwChosen');
  const markImportant = $('#markImportant'), markLetGo = $('#markLetGo'), commit = $('#wwCommit');

  let selectedIndex = null;
  let chosen = [];

  function fmtHM(d) { return d.toTimeString().slice(0, 5); }
  function computeWindow() {
    const [h, m] = startEl.value.split(':').map(Number);
    const dur = Math.max(5, Number(durEl.value) || 15);
    const now = new Date();
    const start = new Date(now); start.setHours(h, m, 0, 0);
    const end = new Date(start); end.setMinutes(start.getMinutes() + dur);
    return { now, start, end, dur };
  }
  function inWindow(now, start, end) { return now >= start && now <= end; }

  function refreshGate() {
    const { now, start, end, dur } = computeWindow();
    const open = inWindow(now, start, end);
    if (open) {
      gate.style.display = 'none';
      board.style.display = '';
    } else {
      gate.style.display = '';
      board.style.display = 'none';
      const when = now < start ? `opens at ${fmtHM(start)} for ${dur}m` : `ended at ${fmtHM(end)}`;
      gateText.textContent = `Your worry window ${when}. You can change the time or “Open anyway”.`;
    }
  }

  function saveCfg() {
    store.set('worry_window_cfg', { start: startEl.value, durationMin: Math.max(5, Number(durEl.value) || 15) });
    status.textContent = 'Saved ✓';
    setTimeout(() => status.textContent = '', 1200);
    refreshGate();
  }

  function renderInbox() {
    const items = store.get('worry_inbox', []);
    inboxUL.innerHTML = '';
    items.forEach((w, i) => {
      const li = document.createElement('li');
      li.textContent = w.text;
      li.tabIndex = 0;
      li.addEventListener('click', () => {
        selectedIndex = i;
        [...inboxUL.children].forEach(n => n.classList.remove('sel'));
        li.classList.add('sel');
      });
      inboxUL.appendChild(li);
    });
  }
  function renderChosen() {
    chosenUL.innerHTML = '';
    chosen.forEach((c, idx) => {
      const li = document.createElement('li');
      li.textContent = `${c.text} — ${c.decision}`;
      const del = document.createElement('button'); del.className = 'x'; del.textContent = '✕';
      del.addEventListener('click', () => { chosen.splice(idx, 1); renderChosen(); });
      li.appendChild(del);
      chosenUL.appendChild(li);
    });
  }

  markImportant.addEventListener('click', () => {
    if (selectedIndex == null) return;
    const item = store.get('worry_inbox', [])[selectedIndex];
    if (!item) return;
    chosen.push({ text: item.text, ts: new Date().toISOString(), decision: 'Important' });
    renderChosen();
  });
  markLetGo.addEventListener('click', () => {
    if (selectedIndex == null) return;
    const item = store.get('worry_inbox', [])[selectedIndex];
    if (!item) return;
    chosen.push({ text: item.text, ts: new Date().toISOString(), decision: 'Let go' });
    renderChosen();
  });

  commit.addEventListener('click', () => {
    if (chosen.length === 0) return;
    let inbox = store.get('worry_inbox', []);
    chosen.forEach(c => {
      const idx = inbox.findIndex(x => x.text === c.text);
      if (idx > -1) inbox.splice(idx, 1);
    });
    store.set('worry_inbox', inbox);
    const arc = store.get('archive_worry_decisions', []);
    arc.push({ ts: new Date().toISOString(), decisions: chosen });
    store.set('archive_worry_decisions', arc);
    chosen = [];
    renderChosen(); renderInbox();
    alert('Decisions saved ✓');
  });

  saveBtn.addEventListener('click', saveCfg);
  openNow.addEventListener('click', () => { gate.style.display = 'none'; board.style.display = ''; });

  refreshGate();
  renderInbox();
  setInterval(refreshGate, 30000);
}

/* ===== Triage Logic ===== */
function bindTriage() {
  const date = $('#triageDate'), tag = $('#triageTag');
  const f1 = $('#f1'), f2 = $('#f2'), f3 = $('#f3'), evidence = $('#evidence'), lesson = $('#lesson');

  const now = new Date();
  date.value = new Date(now - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

  $('#triageClear').addEventListener('click', () => { [f1, f2, f3, evidence, lesson, tag].forEach(el => el.value = ''); });
  $('#triageSave').addEventListener('click', () => {
    const entry = {
      ts: new Date().toISOString(), date: date.value, tag: tag.value.trim(),
      facts: [f1.value.trim(), f2.value.trim(), f3.value.trim()].filter(Boolean),
      evidence: evidence.value.trim(), lesson: lesson.value.trim()
    };
    const arc = store.get('archive_triage', []); arc.push(entry); store.set('archive_triage', arc);
    alert('Triage saved ✓');
  });
}

/* ===== Mood Logic ===== */
function bindMood() {
  const dt = $('#moodDate'), did = $('#moodDid');
  const eb = $('#energyBefore'), ea = $('#energyAfter'); const ebL = $('#ebLabel'), eaL = $('#eaLabel');
  const noticed = $('#noticed'), w1 = $('#w1'), w2 = $('#w2'), w3 = $('#w3');
  const negative = $('#negative'), tryNext = $('#tryNext');

  const now = new Date();
  dt.value = new Date(now - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

  const bindLabel = (range, label) => { const sync = () => label.textContent = range.value; range.addEventListener('input', sync); sync(); };
  bindLabel(eb, ebL); bindLabel(ea, eaL);

  $('#moodClear').addEventListener('click', () => {
    did.value = ''; eb.value = '5'; ea.value = '5'; ebL.textContent = '5'; eaL.textContent = '5';
    noticed.value = '';[w1, w2, w3].forEach(e => e.value = ''); negative.value = ''; tryNext.value = '';
  });

  $('#moodSave').addEventListener('click', () => {
    const entry = {
      ts: new Date().toISOString(), datetime: dt.value, did: did.value.trim(),
      energyBefore: Number(eb.value), energyAfter: Number(ea.value),
      noticed: noticed.value.trim(), wins: [w1.value.trim(), w2.value.trim(), w3.value.trim()].filter(Boolean),
      negative: negative.value.trim(), tryNext: tryNext.value.trim()
    };
    const arc = store.get('archive_mood', []); arc.push(entry); store.set('archive_mood', arc);
    alert('Mood entry saved ✓');
  });
}

/* ===== Archive Logic ===== */
function bindArchive() {
  const typeSel = $('#archType'), filterEl = $('#archFilter'), list = $('#archList');

  function render() {
    const type = typeSel.value;
    const q = (filterEl.value || '').toLowerCase();
    let data = [];
    if (type === 'senses') data = store.get('archive_senses', []);
    if (type === 'reframes_fast') data = store.get('archive_reframes_fast', []);
    if (type === 'triage') data = store.get('archive_triage', []);
    if (type === 'mood') data = store.get('archive_mood', []);
    if (type === 'worry_decisions') data = store.get('archive_worry_decisions', []);

    const html = data.slice().reverse().map(entry => {
      const blob = JSON.stringify(entry).toLowerCase();
      if (q && !blob.includes(q)) return '';
      return `<div class="card small">
        <div class="muted" style="margin-bottom:.2rem">${new Date(entry.ts || entry.datetime || entry.date || Date.now()).toLocaleString()}</div>
        <pre style="white-space:pre-wrap; margin:0">${escapeHTML(pretty(entry))}</pre>
      </div>`;
    }).join('') || `<p class="muted">No entries yet.</p>`;

    list.innerHTML = html;
  }

  function pretty(entry) {
    if (entry.decisions && Array.isArray(entry.decisions)) {
      return entry.decisions.map(d => `• ${d.text} — ${d.decision}`).join('\n');
    }
    if (entry.facts && entry.evidence !== undefined) {
      return [
        entry.date ? `Date: ${entry.date}` : '',
        entry.tag ? `Tag: ${entry.tag}` : '',
        entry.facts.length ? `Facts:\n  - ${entry.facts.join('\n  - ')}` : 'Facts: (none)',
        entry.evidence ? `Evidence: ${entry.evidence}` : 'Evidence: (none)',
        entry.lesson ? `Lesson/Next: ${entry.lesson}` : ''
      ].filter(Boolean).join('\n');
    }
    if (entry.energyBefore && entry.energyAfter) {
      return [
        entry.datetime ? `When: ${entry.datetime}` : '',
        entry.did ? `Did: ${entry.did}` : '',
        `Energy: ${entry.energyBefore} → ${entry.energyAfter}`,
        entry.noticed ? `Noticed: ${entry.noticed}` : '',
        entry.wins?.length ? `Wins:\n  - ${entry.wins.join('\n  - ')}` : '',
        entry.negative ? `Negative: ${entry.negative}` : '',
        entry.tryNext ? `Try next: ${entry.tryNext}` : ''
      ].filter(Boolean).join('\n');
    }
    if (entry.see || entry.hear || entry.touch || entry.smell || entry.taste) {
      return [
        entry.see?.length ? `See: ${entry.see.join(', ')}` : '',
        entry.hear?.length ? `Hear: ${entry.hear.join(', ')}` : '',
        entry.touch?.length ? `Touch: ${entry.touch.join(', ')}` : '',
        entry.smell?.length ? `Smell: ${entry.smell.join(', ')}` : '',
        entry.taste?.length ? `Taste: ${entry.taste.join(', ')}`
          : ''
      ].filter(Boolean).join('\n');
    }
    if (entry.fact !== undefined && entry.friend !== undefined) {
      return [
        entry.fact ? `Fact: ${entry.fact}` : 'Fact: (blank)',
        entry.friend ? `Friend: ${entry.friend}` : 'Friend: (blank)',
        entry.worst ? `Worst: ${entry.worst}` : 'Worst: (blank)'
      ].join('\n');
    }
    return JSON.stringify(entry, null, 2);
  }

  function escapeHTML(s) { return s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

  typeSel.addEventListener('change', render);
  filterEl.addEventListener('input', render);
  render();
}

/* ===== Floating Worry Widget (same as Support) ===== */
const worryFab = $('#worryFab');
const worryChat = $('#worryChat');
const worryBadge = $('#worryBadge');
const worryInput = $('#worryInput');
const worryList = $('#worryList');
const worryCount = $('#worryCount');

function renderWorries() {
  const items = store.get('worry_inbox', []);
  worryList.innerHTML = '';
  items.forEach((w, i) => {
    const li = document.createElement('li');
    const txt = document.createElement('input'); txt.type = 'text'; txt.value = w.text; txt.ariaLabel = 'worry text';
    txt.addEventListener('change', () => {
      items[i].text = txt.value;
      store.set('worry_inbox', items);
      updateWorryCounts();
    });
    const del = document.createElement('button'); del.className = 'x'; del.textContent = '✕';
    del.addEventListener('click', () => {
      items.splice(i, 1);
      store.set('worry_inbox', items);
      renderWorries();
    });
    li.append(txt, del);
    worryList.appendChild(li);
  });
  updateWorryCounts();
}
function updateWorryCounts() {
  const n = (store.get('worry_inbox', [])).length;
  worryCount.textContent = `${n} saved`;
  worryBadge.textContent = n;
  worryBadge.style.display = n > 0 ? 'grid' : 'none';
}
function addWorry(text) {
  const trimmed = text.trim();
  if (!trimmed) return;
  const items = store.get('worry_inbox', []);
  items.unshift({ text: trimmed, ts: new Date().toISOString() });
  store.set('worry_inbox', items);
  worryInput.value = '';
  renderWorries();
}

$('#addWorry')?.addEventListener('click', () => addWorry(worryInput.value));
worryInput?.addEventListener('keydown', (e) => { if (e.key === 'Enter') { addWorry(worryInput.value); } });
$('#worryClearAll')?.addEventListener('click', () => {
  if (confirm('Clear all worries?')) { store.set('worry_inbox', []); renderWorries(); }
});
$('#worryClose')?.addEventListener('click', () => toggleChat(false));
function toggleChat(forceOpen) {
  const isOpen = worryChat.getAttribute('aria-hidden') === 'false';
  const next = (typeof forceOpen === 'boolean') ? forceOpen : !isOpen;
  worryChat.setAttribute('aria-hidden', next ? 'false' : 'true');
  worryFab.setAttribute('aria-expanded', String(next));
  if (next) setTimeout(() => worryInput?.focus(), 60);
}
worryFab?.addEventListener('click', () => toggleChat());

/* ===== Render ===== */
function render(route) {
  setActiveMenu(route);
  switch (route) {
    case 'worry': viewWorryWindow(); break;
    case 'triage': viewTriage(); break;
    case 'mood': viewMood(); break;
    case 'archive': viewArchive(); break;
    default: /* keep placeholder */ break;
  }
}

/* ===== Init ===== */
(function init() {
  render(location.hash.slice(1));
  renderWorries();
})();
