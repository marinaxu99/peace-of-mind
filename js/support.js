/* ========= Helpers ========= */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const store = {
    get(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } },
    set(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
};

/* ========= Router ========= */
const outlet = $('#routerOutlet');
const menuButtons = $$('.menu-btn');
const choiceButtons = $$('.choice');

function setActiveMenu(route) { menuButtons.forEach(b => b.classList.toggle('active', b.dataset.route === route)); }
function navigate(route) { if (!route) route = ''; if (location.hash.slice(1) !== route) { location.hash = route; } else { render(route); } }
window.addEventListener('hashchange', () => render(location.hash.slice(1)));
choiceButtons.forEach(btn => btn.addEventListener('click', () => navigate(btn.dataset.route)));
menuButtons.forEach(btn => btn.addEventListener('click', () => navigate(btn.dataset.route)));

/* ========= Views ========= */
function viewBreath() {
    outlet.setAttribute('aria-busy', 'true');
    outlet.innerHTML = `
    <h1 class="page-title">4·4·6 Breathing</h1>
    <p class="page-subtitle">Inhale 4s · Hold 4s · Exhale 6s</p>
    <div class="card breath-shell">
      <div class="breath-visual" style="text-align:center">
        <div id="breathCircle" class="circle" aria-hidden="true"></div>
      </div>
      <div class="controls">
        <div class="row"><label for="inhale">Inhale</label><input id="inhale" type="number" min="1" value="4"/><span>s</span></div>
        <div class="row"><label for="hold">Hold</label><input id="hold" type="number" min="0" value="4"/><span>s</span></div>
        <div class="row"><label for="exhale">Exhale</label><input id="exhale" type="number" min="1" value="6"/><span>s</span></div>
        <div class="row"><button id="startBreath" class="btn">Start</button><button id="stopBreath" class="btn ghost">Stop</button></div>
        <div class="status"><span id="phaseLabel">Ready</span> · <span id="countdown">0</span>s</div>
      </div>
    </div>`;
    outlet.setAttribute('aria-busy', 'false');
    bindBreathing();
}

function viewSenses() {
    outlet.setAttribute('aria-busy', 'true');
    outlet.innerHTML = `
    <h1 class="page-title">5-4-3-2-1 Senses</h1>
    <p class="page-subtitle">Notice and list them. Check off as you go.</p>
    <div class="card">
      <div class="senses">
        ${senseBlock('see', '5 things you see')}
        ${senseBlock('hear', '4 sounds')}
        ${senseBlock('touch', '3 things you can touch')}
        ${senseBlock('smell', '2 smells (or 2 things you like)')}
        ${senseBlock('taste', '1 taste or one slow breath')}
      </div>
      <div class="row end" style="margin-top:.6rem">
        <button id="resetSenses" class="btn ghost">Reset</button>
        <button id="saveSenses" class="btn">Save to Archive</button>
      </div>
    </div>`;
    outlet.setAttribute('aria-busy', 'false');
    bindSenses();
}
function senseBlock(key, title) {
    return `<div class="sense"><h3>${title}</h3><ul id="${key}List" class="list"></ul><div class="row"><button class="btn small ghost" data-add="${key}">+ Add</button></div></div>`;
}

function viewReframe() {
    outlet.setAttribute('aria-busy', 'true');
    outlet.innerHTML = `
    <h1 class="page-title">Cognitive Reframes (Fast)</h1>
    <div class="card">
      <div class="prompt"><label for="fact">What happened (just the facts)?</label><textarea id="fact" rows="2" placeholder="ex: They left my message on read for 2 hours."></textarea></div>
      <div class="prompt"><label for="friend">What would I tell a friend worrying about this?</label><textarea id="friend" rows="2" placeholder="ex: It may not mean anything about you; they could be busy."></textarea></div>
      <div class="prompt"><label for="worst">If true, what’s the worst realistic outcome — could I handle it?</label><textarea id="worst" rows="2" placeholder="ex: I might feel rejected, but I can cope and try again later."></textarea></div>
      <div class="row end"><button id="clearReframe" class="btn ghost">Clear</button><button id="saveReframe" class="btn">Save to Archive</button></div>
    </div>`;
    outlet.setAttribute('aria-busy', 'false');
    bindReframe();
}

/* ========= Breathing Logic ========= */
let breathStop = false;
function bindBreathing() {
    const circle = $('#breathCircle');
    const inhaleInput = $('#inhale'), holdInput = $('#hold'), exhaleInput = $('#exhale');
    const startBtn = $('#startBreath'), stopBtn = $('#stopBreath');
    const phaseLabel = $('#phaseLabel'), countdown = $('#countdown');
    const wait = ms => new Promise(r => setTimeout(r, ms));

    async function runPhase(label, seconds, targetScale = null) {
        phaseLabel.textContent = label;
        for (let t = seconds; t >= 0; t--) {
            countdown.textContent = t;
            if (targetScale !== null && seconds > 0) {
                const progress = 1 - t / seconds;
                const scale = 1 + (targetScale - 1) * progress;
                circle.style.transform = `scale(${scale})`;
            }
            await wait(1000);
            if (breathStop) throw new Error('stopped');
        }
    }
    async function loop() {
        const inh = Math.max(1, Number(inhaleInput.value) || 4);
        const hold = Math.max(0, Number(holdInput.value) || 4);
        const exh = Math.max(1, Number(exhaleInput.value) || 6);
        try {
            while (true) {
                await runPhase('Inhale', inh, 1.25);
                await runPhase('Hold', hold, null);
                await runPhase('Exhale', exh, 0.85);
                circle.style.transform = 'scale(1)';
            }
        } catch { phaseLabel.textContent = 'Paused'; }
    }
    startBtn.addEventListener('click', () => { breathStop = false; phaseLabel.textContent = 'Starting…'; countdown.textContent = '0'; loop(); });
    stopBtn.addEventListener('click', () => { breathStop = true; });
}

/* ========= Senses Logic ========= */
const senseTargets = { see: 5, hear: 4, touch: 3, smell: 2, taste: 1 };
function bindSenses() {
    const lists = { see: $('#seeList'), hear: $('#hearList'), touch: $('#touchList'), smell: $('#smellList'), taste: $('#tasteList') };

    function makeItem(text = '') {
        const li = document.createElement('li');
        const cb = document.createElement('input'); cb.type = 'checkbox';
        const input = document.createElement('input'); input.type = 'text'; input.value = text; input.placeholder = 'type here…';
        const del = document.createElement('button'); del.className = 'x'; del.textContent = '✕';
        del.addEventListener('click', () => li.remove());
        li.append(cb, input, del); return li;
    }
    function ensureCount(kind) {
        const ul = lists[kind], target = senseTargets[kind];
        while (ul.children.length < target) ul.appendChild(makeItem());
    }
    function loadSenses() {
        Object.keys(lists).forEach(k => {
            lists[k].innerHTML = '';
            const saved = store.get(`senses_${k}`, []);
            (saved.length ? saved : Array(senseTargets[k]).fill('')).forEach(txt => lists[k].appendChild(makeItem(txt)));
            ensureCount(k);
        });
    }
    loadSenses();

    $$('#routerOutlet [data-add]').forEach(btn => {
        btn.addEventListener('click', () => {
            const kind = btn.getAttribute('data-add'); lists[kind].appendChild(makeItem());
        });
    });

    $('#saveSenses')?.addEventListener('click', () => {
        Object.keys(lists).forEach(k => {
            const vals = [...lists[k].querySelectorAll('input[type="text"]')].map(i => i.value.trim()).filter(Boolean);
            store.set(`senses_${k}`, vals);
        });
        const payload = {
            ts: new Date().toISOString(),
            see: getTexts(lists.see), hear: getTexts(lists.hear),
            touch: getTexts(lists.touch), smell: getTexts(lists.smell), taste: getTexts(lists.taste)
        };
        const arc = store.get('archive_senses', []); arc.push(payload); store.set('archive_senses', arc);
        alert('Saved to Archive ✓');
    });

    $('#resetSenses')?.addEventListener('click', () => {
        Object.keys(lists).forEach(k => { lists[k].innerHTML = ''; ensureCount(k); });
    });

    function getTexts(ul) { return [...ul.querySelectorAll('input[type="text"]')].map(i => i.value).filter(Boolean); }
}

/* ========= Reframes Logic ========= */
function bindReframe() {
    const fact = $('#fact'), friend = $('#friend'), worst = $('#worst');
    $('#clearReframe')?.addEventListener('click', () => { fact.value = ''; friend.value = ''; worst.value = ''; });
    $('#saveReframe')?.addEventListener('click', () => {
        const entry = { ts: new Date().toISOString(), fact: fact.value.trim(), friend: friend.value.trim(), worst: worst.value.trim() };
        const arc = store.get('archive_reframes_fast', []); arc.push(entry); store.set('archive_reframes_fast', arc);
        alert('Saved to Archive ✓');
    });
}

/* ========= Floating Worry Widget ========= */
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

/* ========= Render ========= */
function render(route) {
    setActiveMenu(route);
    switch (route) {
        case 'breath': viewBreath(); break;
        case 'senses': viewSenses(); break;
        case 'reframe': viewReframe(); break;
        default: /* keep placeholder */ break;
    }
}

/* ========= Init ========= */
(function init() {
    render(location.hash.slice(1));
    renderWorries();
})();
