/* ══════════════════════════════════════
   PANIC BUTTON — game.js
   ══════════════════════════════════════ */
'use strict';

// ══════════════════════════════════════
//  DEVICE DETECTION
// ══════════════════════════════════════
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  || (navigator.maxTouchPoints > 1 && window.innerWidth <= 820);

// ══════════════════════════════════════
//  THEMES
// ══════════════════════════════════════
const THEMES = [
  {
    id: 'default', name: 'PANIC', swatch: '#ff1133', unlock: 0,
    vars: {} // uses CSS defaults
  },
  {
    id: 'cyber', name: 'CYBER', swatch: '#00eeff', unlock: 10,
    vars: { '--red':'#00eeff','--yellow':'#cc00ff','--cyan':'#2dff00','--green':'#ffe500','--purple':'#ff5500','--orange':'#ff1133','--panel':'#020a10','--border':'#001a22' }
  },
  {
    id: 'toxic', name: 'TOXIC', swatch: '#2dff00', unlock: 22,
    vars: { '--red':'#2dff00','--yellow':'#aaff00','--cyan':'#00ffaa','--green':'#ffffff','--purple':'#ccff00','--orange':'#88ff00','--panel':'#030a00','--border':'#0a2000' }
  },
  {
    id: 'void', name: 'VOID', swatch: '#cc00ff', unlock: 38,
    vars: { '--red':'#cc00ff','--yellow':'#ff00aa','--cyan':'#aa00ff','--green':'#ff44cc','--purple':'#7700ff','--orange':'#ff0088','--panel':'#05000f','--border':'#1a0030' }
  },
  {
    id: 'gold', name: 'GOLD', swatch: '#ffe500', unlock: 55,
    vars: { '--red':'#ffe500','--yellow':'#ffaa00','--cyan':'#fff0a0','--green':'#ffd700','--purple':'#ffcc00','--orange':'#ff8800','--panel':'#0a0800','--border':'#1a1400' }
  },
  {
    id: 'ghost', name: 'GHOST', swatch: '#aaaacc', unlock: 80,
    vars: { '--red':'#ffffff','--yellow':'#ccccff','--cyan':'#aaaadd','--green':'#ddddff','--purple':'#9999cc','--orange':'#bbbbee','--panel':'#050508','--border':'#111118' }
  },
];

let activeTheme = localStorage.getItem('pb_theme') || 'default';
let unlockedThemes = JSON.parse(localStorage.getItem('pb_themes_unlocked') || '["default"]');

function applyTheme(id) {
  const theme = THEMES.find(t => t.id === id) || THEMES[0];
  activeTheme = id;
  localStorage.setItem('pb_theme', id);
  const root = document.documentElement;
  // Reset all theme vars first
  THEMES.forEach(t => Object.keys(t.vars).forEach(k => root.style.removeProperty(k)));
  // Apply selected theme vars
  Object.entries(theme.vars).forEach(([k, v]) => root.style.setProperty(k, v));
}

function checkThemeUnlocks(score) {
  let newUnlock = false;
  THEMES.forEach(t => {
    if (score >= t.unlock && !unlockedThemes.includes(t.id)) {
      unlockedThemes.push(t.id);
      newUnlock = t;
    }
  });
  if (newUnlock) {
    localStorage.setItem('pb_themes_unlocked', JSON.stringify(unlockedThemes));
    renderThemeSwatches();
    showThemeUnlock(newUnlock);
  }
}

function showThemeUnlock(theme) {
  const el = document.getElementById('sp-ban');
  if (!el) return;
  el.textContent = `🎨 SKIN UNLOCKED: ${theme.name}`;
  el.className = 'sp-ban bonus on';
  setTimeout(() => el.classList.remove('on'), 3000);
}

function renderThemeSwatches() {
  const container = document.getElementById('theme-swatches');
  if (!container) return;
  container.innerHTML = THEMES.map(t => {
    const locked = !unlockedThemes.includes(t.id);
    const active = activeTheme === t.id;
    return `<button class="theme-swatch${active?' active':''}${locked?' locked':''}"
      style="background:${t.swatch}"
      onclick="pickTheme('${t.id}')"
      title="${locked ? 'Reach score '+t.unlock+' to unlock' : t.name}">
      ${locked ? '🔒' : ''}
    </button>`;
  }).join('');
}

function pickTheme(id) {
  if (!unlockedThemes.includes(id)) return;
  applyTheme(id);
  renderThemeSwatches();
}

// ══════════════════════════════════════
//  MODULAR ROUND SYSTEM
// ══════════════════════════════════════
// Each round is a self-contained config object.
// Custom packs are stored in localStorage and can be exported/imported as JSON.

const ROUND_SCHEMA = {
  // Required fields every round must have
  required: ['text','type','col'],
  // Optional: hint, tutMsg, platform ('desktop'|'mobile'|'both')
};

// Convert legacy flat arrays into modular round objects with metadata
function makeRound(text, type, col, hint = '', platform = 'both') {
  return { text, type, col, hint, platform, _builtin: true };
}

// Built-in round packs (converted from old INSTS_DESKTOP / INSTS_MOBILE)
const PACK_DESKTOP_BUILTIN = [
  makeRound('CLICK NOW',       'click',       'cr',  'click the button',  'desktop'),
  makeRound("DON'T CLICK",     'wait',        'cy',  'hands off!',        'desktop'),
  makeRound('PRESS SPACE',     'space',       'cy2', 'hit spacebar',      'desktop'),
  makeRound('PRESS ENTER',     'enter',       'cg',  'hit enter',         'desktop'),
  makeRound('DOUBLE CLICK',    'dblclick',    'co',  'click twice fast',  'desktop'),
  makeRound('WAIT FOR IT…',    'wait',        'cp',  'do nothing',        'desktop'),
  makeRound('HIT IT!',         'click',       'cr',  'click it',          'desktop'),
  makeRound('RIGHT CLICK',     'rightclick',  'cp',  'right mouse btn',   'desktop'),
  makeRound('MOVE MOUSE FAST', 'move',        'cy',  'shake it!',         'desktop'),
  makeRound('HOLD SPACE',      'hold_space',  'co',  'hold 400ms',        'desktop'),
  makeRound('PRESS A',         'key_a',       'cg',  'press A key',       'desktop'),
  makeRound('STAY STILL',      'wait',        'cp',  'freeze',            'desktop'),
  makeRound('SMASH IT!',       'click',       'cr',  'click it',          'desktop'),
  makeRound("DON'T MOVE",      'wait',        'cy',  'freeze',            'desktop'),
  makeRound('NOW!!!',          'click',       'cr',  'click it',          'desktop'),
  makeRound('PRESS ESCAPE',    'key_escape',  'co',  'press ESC',         'desktop'),
  makeRound('CLICK TWICE',     'dblclick',    'cy2', 'double-click',      'desktop'),
  makeRound('HANDS OFF!',      'wait',        'cy',  'nothing',           'desktop'),
  makeRound('TAP IT!',         'click',       'cr',  'click it',          'desktop'),
  makeRound('FREEZE!',         'wait',        'cp',  'stay still',        'desktop'),
  makeRound('TRIPLE CLICK',    'tripleclick', 'co',  '3 rapid clicks',    'desktop'),
];

const PACK_MOBILE_BUILTIN = [
  makeRound('TAP NOW!',        'click',       'cr',  'tap the button',   'mobile'),
  makeRound("DON'T TAP",       'wait',        'cy',  'hands off!',       'mobile'),
  makeRound('DOUBLE TAP',      'dblclick',    'co',  'tap twice fast',   'mobile'),
  makeRound('WAIT FOR IT…',    'wait',        'cp',  'do nothing',       'mobile'),
  makeRound('HIT IT!',         'click',       'cr',  'tap it',           'mobile'),
  makeRound('HOLD THE BUTTON', 'hold_btn',    'co',  'hold 500ms',       'mobile'),
  makeRound('STAY STILL',      'wait',        'cp',  'freeze',           'mobile'),
  makeRound('SMASH IT!',       'click',       'cr',  'tap it',           'mobile'),
  makeRound("DON'T TOUCH",     'wait',        'cy',  'freeze',           'mobile'),
  makeRound('NOW!!!',          'click',       'cr',  'tap it',           'mobile'),
  makeRound('SWIPE UP',        'swipe_up',    'cg',  'swipe up on screen','mobile'),
  makeRound('SWIPE DOWN',      'swipe_down',  'cy2', 'swipe down',       'mobile'),
  makeRound('TRIPLE TAP',      'tripleclick', 'co',  'tap 3 times fast', 'mobile'),
  makeRound('FREEZE!',         'wait',        'cp',  'stay still',       'mobile'),
  makeRound('TAP TWICE',       'dblclick',    'cy2', 'two taps',         'mobile'),
  makeRound('HOLD IT!',        'hold_btn',    'co',  'hold the button',  'mobile'),
  makeRound('RESIST!',         'wait',        'cp',  'do NOT tap',       'mobile'),
  makeRound('GO GO GO!',       'click',       'cr',  'tap it NOW',       'mobile'),
  makeRound('SWIPE LEFT',      'swipe_left',  'cp',  'swipe left',       'mobile'),
  makeRound('SWIPE RIGHT',     'swipe_right', 'cy2', 'swipe right',      'mobile'),
];

// ── ROUND PACK MANAGER ──
const CUSTOM_PACKS_KEY = 'pb_custom_packs';

function loadCustomPacks() {
  try { return JSON.parse(localStorage.getItem(CUSTOM_PACKS_KEY) || '[]'); }
  catch { return []; }
}

function saveCustomPacks(packs) {
  localStorage.setItem(CUSTOM_PACKS_KEY, JSON.stringify(packs));
}

function validateRound(r) {
  if (!r || typeof r !== 'object') return false;
  return ROUND_SCHEMA.required.every(f => typeof r[f] === 'string' && r[f].length > 0);
}

function validatePack(pack) {
  if (!pack || typeof pack !== 'object') return { ok: false, err: 'Invalid pack structure' };
  if (!pack.name || typeof pack.name !== 'string') return { ok: false, err: 'Pack must have a name' };
  if (!Array.isArray(pack.rounds) || pack.rounds.length === 0) return { ok: false, err: 'Pack must have at least 1 round' };
  const bad = pack.rounds.findIndex(r => !validateRound(r));
  if (bad >= 0) return { ok: false, err: `Round ${bad + 1} is missing required fields (text, type, col)` };
  return { ok: true };
}

function exportPack(pack) {
  const json = JSON.stringify(pack, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = (pack.name || 'pack').replace(/\s+/g, '-').toLowerCase() + '.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function importPackFromJSON(jsonStr) {
  try {
    const pack = JSON.parse(jsonStr);
    const { ok, err } = validatePack(pack);
    if (!ok) return { ok: false, err };
    const packs = loadCustomPacks();
    const existing = packs.findIndex(p => p.name === pack.name);
    if (existing >= 0) packs[existing] = pack; // overwrite by name
    else packs.push(pack);
    saveCustomPacks(packs);
    return { ok: true, pack };
  } catch (e) {
    return { ok: false, err: 'Invalid JSON: ' + e.message };
  }
}

function getActiveRounds() {
  // Merge builtin + any active custom packs
  const base   = isMobile ? PACK_MOBILE_BUILTIN : PACK_DESKTOP_BUILTIN;
  const packs  = loadCustomPacks().filter(p => p.active);
  const custom = packs.flatMap(p => p.rounds);
  return [...base, ...custom];
}

// ── ROUND EDITOR UI ──
function openRoundEditor() {
  const existing = document.getElementById('round-editor-screen');
  if (existing) { existing.classList.remove('off'); return; }

  const el = document.createElement('div');
  el.id        = 'round-editor-screen';
  el.className = 'screen';
  el.innerHTML = buildEditorHTML();
  document.getElementById('cab').appendChild(el);
  bindEditorEvents(el);
}

function closeRoundEditor() {
  const el = document.getElementById('round-editor-screen');
  if (el) el.classList.add('off');
}

const VALID_TYPES = [
  'click','wait','dblclick','tripleclick','rightclick','move',
  'hold_space','hold_btn','space','enter','key_a','key_escape',
  'swipe_up','swipe_down','swipe_left','swipe_right'
];
const VALID_COLS = ['cr','cy','cy2','cg','cp','co'];

function buildEditorHTML() {
  const packs = loadCustomPacks();
  return `
    <div class="editor-hdr">
      <div class="editor-title">ROUND EDITOR</div>
      <button class="editor-close" onclick="closeRoundEditor()">✕</button>
    </div>
    <div class="editor-body">
      <!-- NEW ROUND FORM -->
      <div class="editor-section">
        <div class="editor-sec-title">NEW ROUND</div>
        <input  id="ed-text"  class="editor-input" placeholder="Instruction text (e.g. TAP NOW!)" maxlength="28">
        <select id="ed-type"  class="editor-select">
          ${VALID_TYPES.map(t => `<option value="${t}">${t}</option>`).join('')}
        </select>
        <select id="ed-col"   class="editor-select">
          <option value="cr">RED</option><option value="cy">CYAN</option>
          <option value="cy2">YELLOW</option><option value="cg">GREEN</option>
          <option value="cp">PURPLE</option><option value="co">ORANGE</option>
        </select>
        <input  id="ed-hint"  class="editor-input" placeholder="Hint (optional)" maxlength="32">
      </div>
      <!-- PACK MANAGER -->
      <div class="editor-section">
        <div class="editor-sec-title">PACKS</div>
        <input id="ed-pack-name" class="editor-input" placeholder="Pack name">
        <div class="editor-btns">
          <button class="editor-btn" onclick="editorSaveRound()">+ ADD TO PACK</button>
          <button class="editor-btn" onclick="editorExportPack()">⬇ EXPORT</button>
        </div>
        <label class="editor-btn editor-btn-import">
          ⬆ IMPORT JSON
          <input type="file" accept=".json,application/json" style="display:none" onchange="editorImportFile(this)">
        </label>
        <div id="ed-pack-list" class="editor-pack-list">${buildPackListHTML()}</div>
        <div id="ed-status" class="editor-status"></div>
      </div>
    </div>
  `;
}

function buildPackListHTML() {
  const packs = loadCustomPacks();
  if (!packs.length) return '<div class="editor-empty">No custom packs yet.</div>';
  return packs.map((p, i) => `
    <div class="editor-pack-row">
      <label class="editor-pack-toggle">
        <input type="checkbox" ${p.active ? 'checked' : ''} onchange="editorTogglePack(${i}, this.checked)">
        <span>${p.name}</span>
        <span class="editor-pack-count">${p.rounds.length} rounds</span>
      </label>
      <div class="editor-pack-actions">
        <button onclick="editorExportNamedPack(${i})">⬇</button>
        <button onclick="editorDeletePack(${i})">🗑</button>
      </div>
    </div>
  `).join('');
}

function bindEditorEvents(el) {
  // nothing extra needed — all onclick handlers are global functions
}

function editorStatus(msg, ok = true) {
  const el = document.getElementById('ed-status');
  if (!el) return;
  el.textContent  = msg;
  el.className    = 'editor-status ' + (ok ? 'ok' : 'err');
  setTimeout(() => { el.textContent = ''; el.className = 'editor-status'; }, 2500);
}

function editorSaveRound() {
  const text     = document.getElementById('ed-text')?.value.trim();
  const type     = document.getElementById('ed-type')?.value;
  const col      = document.getElementById('ed-col')?.value;
  const hint     = document.getElementById('ed-hint')?.value.trim();
  const packName = document.getElementById('ed-pack-name')?.value.trim() || 'My Pack';

  if (!text) { editorStatus('Enter instruction text', false); return; }

  const round = makeRound(text, type, col, hint, isMobile ? 'mobile' : 'desktop');
  delete round._builtin;

  const packs = loadCustomPacks();
  let pack = packs.find(p => p.name === packName);
  if (!pack) { pack = { name: packName, active: true, rounds: [] }; packs.push(pack); }
  pack.rounds.push(round);
  saveCustomPacks(packs);

  // Refresh pack list
  const listEl = document.getElementById('ed-pack-list');
  if (listEl) listEl.innerHTML = buildPackListHTML();
  document.getElementById('ed-text').value = '';
  document.getElementById('ed-hint').value = '';
  editorStatus(`✓ Added "${text}" to ${packName}`);
}

function editorTogglePack(idx, active) {
  const packs = loadCustomPacks();
  if (packs[idx]) { packs[idx].active = active; saveCustomPacks(packs); }
}

function editorExportPack() {
  const packName = document.getElementById('ed-pack-name')?.value.trim() || 'My Pack';
  const packs    = loadCustomPacks();
  const pack     = packs.find(p => p.name === packName);
  if (!pack) { editorStatus('No pack with that name to export', false); return; }
  exportPack(pack);
}

function editorExportNamedPack(idx) {
  const packs = loadCustomPacks();
  if (packs[idx]) exportPack(packs[idx]);
}

function editorDeletePack(idx) {
  const packs = loadCustomPacks();
  packs.splice(idx, 1);
  saveCustomPacks(packs);
  const listEl = document.getElementById('ed-pack-list');
  if (listEl) listEl.innerHTML = buildPackListHTML();
  editorStatus('Pack deleted');
}

function editorImportFile(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const result = importPackFromJSON(e.target.result);
    if (result.ok) {
      const listEl = document.getElementById('ed-pack-list');
      if (listEl) listEl.innerHTML = buildPackListHTML();
      editorStatus(`✓ Imported "${result.pack.name}" (${result.pack.rounds.length} rounds)`);
    } else {
      editorStatus('Import failed: ' + result.err, false);
    }
    input.value = '';
  };
  reader.readAsText(file);
}


// ══════════════════════════════════════
//  VIBRATION
// ══════════════════════════════════════
function vib(pattern) { try { if (navigator.vibrate) navigator.vibrate(pattern); } catch (e) {} }
function vibOK()     { vib(30); }
function vibWrong()  { vib([60, 30, 120]); }
function vibCombo()  { vib([20, 20, 40]); }
function vibLastCh() { vib([100, 50, 100, 50, 200]); }

// ══════════════════════════════════════
//  BACKGROUND CANVAS
// ══════════════════════════════════════
const bgCvs = document.getElementById('bgcanvas');
const bgCtx = bgCvs.getContext('2d');
let BW, BH, bgIntensity = 0;

function resizeBG() { BW = bgCvs.width = innerWidth; BH = bgCvs.height = innerHeight; }
resizeBG();
addEventListener('resize', resizeBG);

const PCOLS = ['#ff1133', '#00eeff', '#cc00ff', '#2dff00', '#ffe500', '#ff5500'];
const pts = Array.from({ length: 70 }, () => ({
  x:     Math.random() * 2000,
  y:     Math.random() * 2000,
  vx:    (Math.random() - .5) * .22,
  vy:    (Math.random() - .5) * .22,
  r:     Math.random() * 1.5 + .4,
  col:   PCOLS[Math.floor(Math.random() * PCOLS.length)],
  phase: Math.random() * Math.PI * 2,
}));

const EKG_LEN = 80;
const ekgPts  = new Array(EKG_LEN).fill(0);
let ekgPhase = 0, ekgPanic = 0;

function drawBG() {
  requestAnimationFrame(drawBG);
  bgCtx.clearRect(0, 0, BW, BH);
  const spd = 1 + bgIntensity * 6;

  for (const p of pts) {
    p.x += p.vx * spd; p.y += p.vy * spd; p.phase += .01 * spd;
    if (p.x < 0) p.x = BW; if (p.x > BW) p.x = 0;
    if (p.y < 0) p.y = BH; if (p.y > BH) p.y = 0;
    const a = (.18 + .3 * Math.sin(p.phase)) * (.18 + bgIntensity * .55);
    bgCtx.beginPath();
    bgCtx.arc(p.x, p.y, p.r * (1 + bgIntensity * .8), 0, Math.PI * 2);
    bgCtx.fillStyle = p.col + Math.floor(a * 255).toString(16).padStart(2, '0');
    bgCtx.fill();
  }

  ekgPhase += (.02 + ekgPanic * .08) * spd;
  for (let i = EKG_LEN - 1; i > 0; i--) ekgPts[i] = ekgPts[i - 1];
  ekgPts[0] = (Math.sin(ekgPhase * 3) > .94)
    ? (Math.sin(ekgPhase * 30) * 40 * ekgPanic)
    : Math.sin(ekgPhase) * 4 * ekgPanic;

  if (ekgPanic > .1) {
    const ex = BW * .5 - EKG_LEN * 3, ey = BH - 40;
    bgCtx.beginPath();
    for (let i = 0; i < EKG_LEN; i++) {
      const x = ex + i * 6, y = ey - ekgPts[i];
      i === 0 ? bgCtx.moveTo(x, y) : bgCtx.lineTo(x, y);
    }
    bgCtx.strokeStyle = `rgba(255,17,51,${Math.min(ekgPanic, .8)})`;
    bgCtx.lineWidth   = 1.5;
    bgCtx.shadowColor = '#ff1133';
    bgCtx.shadowBlur  = 6 * ekgPanic;
    bgCtx.stroke();
    bgCtx.shadowBlur  = 0;
  }
}
drawBG();

// ── Corruption canvas ──
const corCvs = document.getElementById('corrupt');
const corCtx = corCvs.getContext('2d');
let corruptLevel = 0;

function drawCorrupt() {
  corCtx.clearRect(0, 0, 440, 780);
  if (corruptLevel <= 0) return;
  const n = Math.floor(corruptLevel * 14);
  for (let i = 0; i < n; i++) {
    const x = Math.random() * 440, y = Math.random() * 780;
    const w = Math.random() * 90 + 10, h = Math.random() * 5 + 2;
    corCtx.fillStyle = `rgba(${Math.floor(Math.random() * 255)},0,${Math.floor(Math.random() * 255)},${corruptLevel * .28})`;
    corCtx.fillRect(x, y, w, h);
  }
}
setInterval(drawCorrupt, 80);

// ══════════════════════════════════════
//  AUDIO
// ══════════════════════════════════════
let AC = null;
let isMuted = localStorage.getItem('pb_muted') === '1';

function getAC() {
  if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)();
  if (AC.state === 'suspended') AC.resume();
  return AC;
}

function toggleMute() {
  isMuted = !isMuted;
  localStorage.setItem('pb_muted', isMuted ? '1' : '0');
  // Update every mute button in the DOM
  document.querySelectorAll('.mute-btn').forEach(el => {
    el.textContent   = isMuted ? '🔇' : '🔊';
    el.title         = isMuted ? 'Unmute' : 'Mute';
    el.classList.toggle('muted', isMuted);
  });
}

function beep(f, t, d, v, delay = 0) {
  if (isMuted) return;
  try {
    const ctx = getAC(), o = ctx.createOscillator(), g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.type = t;
    o.frequency.setValueAtTime(f, ctx.currentTime + delay);
    g.gain.setValueAtTime(v, ctx.currentTime + delay);
    g.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + delay + d);
    o.start(ctx.currentTime + delay);
    o.stop(ctx.currentTime + delay + d + .02);
  } catch (e) {}
}

function noise(d = .05, v = .2, delay = 0) {
  if (isMuted) return;
  try {
    const ctx = getAC(), buf = ctx.createBuffer(1, ctx.sampleRate * d, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * .9;
    const src = ctx.createBufferSource(), g = ctx.createGain();
    src.buffer = buf; src.connect(g); g.connect(ctx.destination);
    g.gain.setValueAtTime(v, ctx.currentTime + delay);
    g.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + delay + d);
    src.start(ctx.currentTime + delay);
  } catch (e) {}
}

const S = {
  ok:     () => { beep(480,'sine',.05,.14); beep(680,'sine',.07,.17,.06); beep(920,'sine',.09,.14,.12); },
  bonus:  () => { beep(440,'sine',.04,.18); beep(550,'sine',.04,.2,.05); beep(660,'sine',.04,.2,.1); beep(880,'sine',.07,.22,.16); beep(1100,'sine',.1,.2,.24); noise(.04,.1,.28); },
  wrong:  () => { noise(.1,.35); beep(180,'sawtooth',.18,.45); beep(120,'sawtooth',.22,.38,.16); beep(80,'sawtooth',.28,.3,.32); },
  tick:   () => { beep(1100,'square',.022,.12); },
  warn:   () => { beep(800,'square',.04,.2); beep(650,'square',.04,.17,.08); },
  combo:  () => { beep(660,'sine',.04,.2); beep(880,'sine',.05,.2,.05); beep(1100,'sine',.07,.18,.1); beep(1320,'sine',.08,.16,.16); },
  click:  () => { noise(.015,.1); beep(1500,'square',.012,.04); },
  tele:   () => { beep(350,'sine',.04,.18); beep(900,'sine',.03,.12,.05); noise(.02,.08,.03); },
  life:   () => { beep(280,'sawtooth',.1,.3); beep(190,'sawtooth',.14,.25,.1); noise(.06,.15,.08); },
  hb:     () => { beep(75,'sine',.08,.35); beep(65,'sine',.07,.25,.17); },
  frenzy: () => { noise(.05,.25); beep(180,'sawtooth',.1,.3); beep(250,'square',.08,.2,.08); },
  rank:   () => { beep(440,'sine',.06,.2); beep(554,'sine',.06,.2,.07); beep(659,'sine',.07,.2,.14); beep(880,'sine',.12,.22,.21); },
  lastch: () => { noise(.12,.4); beep(160,'sawtooth',.2,.4); beep(100,'sawtooth',.25,.35,.18); },
  sbr:    () => { noise(.15,.5); beep(100,'sawtooth',.2,.5); beep(60,'sawtooth',.3,.4,.15); },
};

let hbTO = null;

function startHB(dur) {
  stopHB();
  let e = 0;
  function beat() {
    if (!gameActive) return;
    e++;
    const pct  = Math.max(0, 1 - e / (dur / 100));
    if (pct < .4) {
      S.hb();
      hbEl.classList.remove('pulse');
      void hbEl.offsetWidth;
      hbEl.classList.add('pulse');
      ekgPanic = Math.max(0, 1 - pct * 2.5);
    }
    const next = pct < .08 ? 130 : pct < .18 ? 190 : pct < .3 ? 270 : pct < .4 ? 360 : null;
    if (next) hbTO = setTimeout(beat, next);
  }
  hbTO = setTimeout(beat, dur * .6);
}

function stopHB() { clearTimeout(hbTO); ekgPanic = 0; }

// ══════════════════════════════════════
//  GAME DATA
// ══════════════════════════════════════
const RANKS = [
  { min: 0,  t: 'BEGINNER'       },
  { min: 5,  t: 'TWITCHY'        },
  { min: 12, t: 'PANIC SURVIVOR' },
  { min: 22, t: 'CHAOS MASTER'   },
  { min: 38, t: 'MIND NINJA'     },
  { min: 55, t: 'BUTTON GOD'     },
  { min: 80, t: 'OMNIPANIC'      },
];

const TAUNTS_IDLE = ['WAITING…','DO SOMETHING.','TICK TOCK…','HURRY UP.','ANYTIME NOW…','STILL ALIVE?','COME ON…'];
const TAUNTS_HOT  = ['FASTER!!','DO IT NOW!!','YOUR HANDS!','FOCUS!!!','NOW NOW NOW','MOVE IT!!','LAST CHANCE'];
const FAIL_MSGS   = [
  "Too slow, chief.", "Reflex.exe stopped.", "Brain.dll not found.",
  "Your neurons on holiday.", "404: Reaction not found.", "You had ONE job.",
  "Grandma sends condolences.", "ctrl+z your entire life.", "You absolute disaster.",
  "The button is crying.", "Skills: not found.", "Even a sloth said wow.",
  "Panic achieved. Victory: no.", "That was painful to watch.",
  "Your hands have resigned.", "Instructions were unclear?",
  "Incredible. Incredibly bad.",
];

// ── INSTRUCTION SETS (desktop vs mobile) ──
const INSTS_DESKTOP = [
  { text: 'CLICK NOW',       type: 'click',       col: 'cr',  hint: 'click the button' },
  { text: "DON'T CLICK",     type: 'wait',         col: 'cy',  hint: 'hands off!' },
  { text: 'PRESS SPACE',     type: 'space',        col: 'cy2', hint: 'hit spacebar' },
  { text: 'PRESS ENTER',     type: 'enter',        col: 'cg',  hint: 'hit enter' },
  { text: 'DOUBLE CLICK',    type: 'dblclick',     col: 'co',  hint: 'click twice fast' },
  { text: 'WAIT FOR IT…',    type: 'wait',         col: 'cp',  hint: 'do nothing' },
  { text: 'HIT IT!',         type: 'click',        col: 'cr',  hint: 'click it' },
  { text: 'RIGHT CLICK',     type: 'rightclick',   col: 'cp',  hint: 'right mouse btn' },
  { text: 'MOVE MOUSE FAST', type: 'move',         col: 'cy',  hint: 'shake it!' },
  { text: 'HOLD SPACE',      type: 'hold_space',   col: 'co',  hint: 'hold 400ms' },
  { text: 'PRESS A',         type: 'key_a',        col: 'cg',  hint: 'press A key' },
  { text: 'STAY STILL',      type: 'wait',         col: 'cp',  hint: 'freeze' },
  { text: 'SMASH IT!',       type: 'click',        col: 'cr',  hint: 'click it' },
  { text: "DON'T MOVE",      type: 'wait',         col: 'cy',  hint: 'freeze' },
  { text: 'NOW!!!',          type: 'click',        col: 'cr',  hint: 'click it' },
  { text: 'PRESS ESCAPE',    type: 'key_escape',   col: 'co',  hint: 'press ESC' },
  { text: 'CLICK TWICE',     type: 'dblclick',     col: 'cy2', hint: 'double-click' },
  { text: 'HANDS OFF!',      type: 'wait',         col: 'cy',  hint: 'nothing' },
  { text: 'TAP IT!',         type: 'click',        col: 'cr',  hint: 'click it' },
  { text: 'FREEZE!',         type: 'wait',         col: 'cp',  hint: 'stay still' },
  { text: 'TRIPLE CLICK',    type: 'tripleclick',  col: 'co',  hint: '3 rapid clicks' },
];

const INSTS_MOBILE = [
  { text: 'TAP NOW!',         type: 'click',        col: 'cr',  hint: 'tap the button' },
  { text: "DON'T TAP",        type: 'wait',         col: 'cy',  hint: 'hands off!' },
  { text: 'DOUBLE TAP',       type: 'dblclick',     col: 'co',  hint: 'tap twice fast' },
  { text: 'WAIT FOR IT…',     type: 'wait',         col: 'cp',  hint: 'do nothing' },
  { text: 'HIT IT!',          type: 'click',        col: 'cr',  hint: 'tap it' },
  { text: 'HOLD THE BUTTON',  type: 'hold_btn',     col: 'co',  hint: 'hold 500ms' },
  { text: 'STAY STILL',       type: 'wait',         col: 'cp',  hint: 'freeze' },
  { text: 'SMASH IT!',        type: 'click',        col: 'cr',  hint: 'tap it' },
  { text: "DON'T TOUCH",      type: 'wait',         col: 'cy',  hint: 'freeze' },
  { text: 'NOW!!!',           type: 'click',        col: 'cr',  hint: 'tap it' },
  { text: 'SWIPE UP',         type: 'swipe_up',     col: 'cg',  hint: 'swipe up on screen' },
  { text: 'SWIPE DOWN',       type: 'swipe_down',   col: 'cy2', hint: 'swipe down' },
  { text: 'TRIPLE TAP',       type: 'tripleclick',  col: 'co',  hint: 'tap 3 times fast' },
  { text: 'FREEZE!',          type: 'wait',         col: 'cp',  hint: 'stay still' },
  { text: 'TAP TWICE',        type: 'dblclick',     col: 'cy2', hint: 'two taps' },
  { text: 'HOLD IT!',         type: 'hold_btn',     col: 'co',  hint: 'hold the button' },
  { text: 'RESIST!',          type: 'wait',         col: 'cp',  hint: 'do NOT tap' },
  { text: 'GO GO GO!',        type: 'click',        col: 'cr',  hint: 'tap it NOW' },
  { text: 'SWIPE LEFT',       type: 'swipe_left',   col: 'cp',  hint: 'swipe left' },
  { text: 'SWIPE RIGHT',      type: 'swipe_right',  col: 'cy2', hint: 'swipe right' },
];

const FRENZY_DESKTOP = [
  { text: 'CLICK!', type: 'click', col: 'cr' }, { text: 'WAIT!',  type: 'wait',  col: 'cy' },
  { text: 'SPACE!', type: 'space', col: 'cy2'},  { text: 'SMASH!', type: 'click', col: 'cr' },
  { text: "DON'T!", type: 'wait',  col: 'cp' }, { text: 'HIT!',   type: 'click', col: 'cr' },
  { text: 'STOP!',  type: 'wait',  col: 'cy' }, { text: 'GO!!',   type: 'click', col: 'cr' },
];

const FRENZY_MOBILE = [
  { text: 'TAP!',   type: 'click',    col: 'cr' }, { text: 'WAIT!',  type: 'wait',     col: 'cy' },
  { text: 'HOLD!',  type: 'hold_btn', col: 'co' }, { text: 'SMASH!', type: 'click',    col: 'cr' },
  { text: "DON'T!", type: 'wait',     col: 'cp' }, { text: 'HIT!',   type: 'click',    col: 'cr' },
  { text: 'STOP!',  type: 'wait',     col: 'cy' }, { text: 'GO!!',   type: 'click',    col: 'cr' },
];

let INSTS, FRENZY_INSTS;

const BTN_LBLS = {
  click:       ['PANIC!', 'TAP ME!', 'HIT IT!', 'SMASH!', 'GO!', 'DO IT!', 'NOW!'],
  wait:        ["NO TOUCH", "WAIT...", "DON'T!", "STOP!", "RESIST!", "FREEZE!", "NOPE!"],
  dblclick:    ['DOUBLE!', 'TAP×2', 'TWICE!'],
  tripleclick: ['×3', 'THREE!', 'TRIPLE!'],
  rightclick:  ['R-CLICK', 'RIGHT ME', 'ALT-CLICK'],
  move:        ['SHAKE!', 'MOVE!', 'WIGGLE!'],
  hold_space:  ['HOLD IT', 'SPACE BAR', 'HOLD…'],
  hold_btn:    ['HOLD ME', 'HOLD IT', 'LONG PRESS'],
  space:       ['SPACEBAR!', 'PRESS!', 'HIT SPACE'],
  enter:       ['ENTER!', 'RETURN!', 'CONFIRM!'],
  key_a:       ['THE A KEY', 'PRESS A!', 'A!!'],
  key_escape:  ['ESCAPE!', 'ESC!', 'FLEE!'],
  swipe_up:    ['SWIPE UP', 'GO UP!', '↑'],
  swipe_down:  ['SWIPE DN', 'GO DOWN', '↓'],
  swipe_left:  ['SWIPE ←', 'LEFT!', '←'],
  swipe_right: ['SWIPE →', 'RIGHT!', '→'],
};

const BTN_COLS = ['', 'blue', 'green', 'yellow', 'purple'];

function getDiff(s) {
  if (s >= 35) return { name: 'CHAOS',  ms: 520,  cls: 'dp-chaos'  };
  if (s >= 20) return { name: 'HARD',   ms: 780,  cls: 'dp-hard'   };
  if (s >= 9)  return { name: 'MEDIUM', ms: 1250, cls: 'dp-medium' };
  return              { name: 'EASY',   ms: 1900, cls: 'dp-easy'   };
}

function getRank(s) {
  let r = RANKS[0];
  for (const k of RANKS) if (s >= k.min) r = k;
  return r.t;
}

// ══════════════════════════════════════
//  STATE
// ══════════════════════════════════════
// ── TRAINING & HOT SEAT flags (declared early to avoid TDZ issues) ──
let trainingMode     = false;
let hsMode   = false;
let hsPlayer = 1;
let hsRoundsPlayed = 0;
let hsScores = [0, 0];
let hsLives  = [3, 3];
let hsReactTimes = [[], []];

let score = 0, bestScore = +(localStorage.getItem('pb_best') || 0);
let bestScoreDate = localStorage.getItem('pb_best_date') || null; // ISO timestamp
let lives = 3, gameActive = false, roundEnded = false;
let timerRAF = null, timerStart = 0, timerDur = 2000;
let curInst = null, prevInst = null;
let waitTO = null, switchTO = null, holdTO = null, tauntTO = null;
let holdActive = false, holdDone = false, holdProgress = 0, holdRAF = null;
let mouseDist = 0, lastMX = 0, lastMY = 0;
let touchStartX = 0, touchStartY = 0, touchMoved = false, swipeHandled = false;
let streak = 0;
const STREAK_BONUS_AT = 5;
let roundN = 0, specialRound = null;
let isFrenzy = false, frenzyCount = 0, frenzyDone = 0;
let dblGuard = false, tripleCount = 0, tripleTO = null;
let nearMissShown = false, lastPctVal = 1;

// ── REACTION TIME TRACKING ──
let reactTimes = [];
let roundActionStart = 0;

// ══════════════════════════════════════
//  CHALLENGE MODES
// ══════════════════════════════════════
const MODES = ['classic','sprint','zen','daily'];
let currentMode = 'classic';

// Per-mode best scores
const modeBest = {
  classic: +(localStorage.getItem('pb_best')        || 0),
  sprint:  +(localStorage.getItem('pb_best_sprint')  || 0),
  zen:     +(localStorage.getItem('pb_best_zen')     || 0),
  daily:   +(localStorage.getItem('pb_best_daily')   || 0),
};
const modeBestDate = {
  classic: localStorage.getItem('pb_best_date')        || null,
  sprint:  localStorage.getItem('pb_best_date_sprint')  || null,
  zen:     localStorage.getItem('pb_best_date_zen')     || null,
  daily:   localStorage.getItem('pb_best_date_daily')   || null,
};

// Sprint mode
const SPRINT_DURATION = 30000; // 30 seconds in ms
let sprintEndTime = 0, sprintRAF = null;

// Daily mode — seed from today's date (YYYYMMDD)
function getDailySeed() {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}
function getDailyNum() {
  const start = new Date('2024-01-01');
  const now   = new Date();
  return Math.floor((now - start) / 86400000) + 1;
}

// Seeded random (mulberry32)
function makeSeededRand(seed) {
  let s = seed;
  return function() {
    s |= 0; s = s + 0x6D2B79F5 | 0;
    let t = Math.imul(s ^ s >>> 15, 1 | s);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

let seededR = null; // set to seededRand in daily mode, null otherwise
let dailyRoundLog = []; // 'hit' | 'miss' | 'frenzy' per round for share grid

// Daily already played today?
function dailyAlreadyPlayed() {
  return localStorage.getItem('pb_daily_date') === String(getDailySeed());
}

function saveDailyResult(sc) {
  localStorage.setItem('pb_daily_date',  String(getDailySeed()));
  localStorage.setItem('pb_daily_score', String(sc));
  localStorage.setItem('pb_daily_log',   JSON.stringify(dailyRoundLog));
}

function selectMode(mode) {
  currentMode = mode;
  document.querySelectorAll('.mode-btn').forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
  // Update best panel
  bestScore     = modeBest[mode];
  bestScoreDate = modeBestDate[mode];
  const hsNum  = document.getElementById('hs-num');
  const hsDate = document.getElementById('hs-date');
  const hsLbl  = document.getElementById('hs-lbl');
  if (hsNum)  hsNum.textContent  = modeBest[mode];
  if (hsDate) hsDate.textContent = modeBestDate[mode] ? timeAgo(modeBestDate[mode]) : '';
  if (hsLbl)  hsLbl.textContent  = mode === 'daily' ? (dailyAlreadyPlayed() ? '✓ Played Today' : 'Best Score') : 'Best Score';
}

function saveModeScore(sc) {
  const key     = 'pb_best' + (currentMode === 'classic' ? '' : '_' + currentMode);
  const dateKey = 'pb_best_date' + (currentMode === 'classic' ? '' : '_' + currentMode);
  if (sc > modeBest[currentMode]) {
    modeBest[currentMode]     = sc;
    modeBestDate[currentMode] = new Date().toISOString();
    localStorage.setItem(key,     String(sc));
    localStorage.setItem(dateKey, modeBestDate[currentMode]);
    // keep legacy pb_best in sync for classic
    if (currentMode === 'classic') {
      bestScore = sc; bestScoreDate = modeBestDate[currentMode];
    }
    return true; // new best
  }
  return false;
}

// ══════════════════════════════════════
//  DOM REFERENCES
// ══════════════════════════════════════
function g(id) { return document.getElementById(id); }

const cab        = g('cab'),        flashOv    = g('flash'),      frRing  = g('fr-ring');
const spBan      = g('sp-ban'),     bigMult    = g('big-mult'),   ptsFloat = g('pts-float');
const lcOv       = g('lc-ov'),      lcTxt      = g('lc-txt');
const scrStart   = g('scr-start'),  scrGO      = g('scr-go');
const btnStart   = g('btn-start'),  btnRetry   = g('btn-retry');
const svalEl     = g('sval'),       bestSval   = g('best-sval'), rankLbl  = g('rank-lbl');
const tbarEl     = g('tbar'),       timerNumEl = g('timer-num');
const instEl     = g('inst'),       subInstEl  = g('sub-inst'),  glitchTxt = g('glitch-txt');
const nearMissEl = g('near-miss'),  comboLbl   = g('combo-lbl'), feedbackEl = g('feedback');
const pb         = g('pb'),         btnZone    = g('btn-zone');
const stkFill    = g('stk-fill'),   stkVal     = g('stk-val'),   diffPill = g('diff-pill');
const hbEl       = g('hb-stripe'),  tauntEl    = g('taunt');
const holdRingEl = g('hold-ring'),  hrFill     = g('hr-fill'),   swipeArrow = g('swipe-arrow');
const lifeEls    = [0, 1, 2].map(i => g('lf' + i));
const goScore    = g('go-score'),   goBest     = g('go-best'),   goMsg  = g('go-msg');
const goRank     = g('go-rank'),    goDied     = g('go-died'),   goNB   = g('go-nb');
const hsNum      = g('hs-num');
const reactSval  = g('react-sval'), goReact    = g('go-react'),  reactBD = g('react-breakdown');
const sprintBadge = g('sprint-badge'), sprintTimeEl = g('sprint-time');
const dailyResultEl = g('daily-result'), dailyNumEl = g('daily-num'), dailyGridEl = g('daily-grid');
const shareCanvas = g('share-canvas');

// ── TUTORIAL & START-SCREEN TAUNT ──
let isFirstGame = !localStorage.getItem('pb_played');
let tutorialStep = 0;
const TUTORIAL_STEPS = [
  { text: isMobile ? 'TAP NOW!' : 'CLICK NOW', type: 'click',  hint: isMobile ? '→ tap the big button' : '→ click the button', tutMsg: 'Welcome! When you see this, click the button.' },
  { text: isMobile ? "DON'T TAP" : "DON'T CLICK", type: 'wait', hint: '→ do NOTHING',  tutMsg: 'Now wait — do NOT touch anything!' },
  { text: isMobile ? 'DOUBLE TAP' : 'DOUBLE CLICK', type: 'dblclick', hint: isMobile ? '→ tap twice fast' : '→ click twice fast', tutMsg: 'Two taps/clicks in quick succession.' },
];

function showStartTaunt() {
  const lastMsg = localStorage.getItem('pb_last_fail');
  const el = document.getElementById('start-taunt');
  if (el && lastMsg) {
    el.textContent = '"' + lastMsg + '"';
    el.classList.add('show');
  }
}
// ══════════════════════════════════════
function fillTips() {
  const grid = g('tips-grid');
  const tips = isMobile
    ? ["TAP IT", "DON'T TAP", "DOUBLE TAP", "HOLD BUTTON", "SWIPE UP", "SWIPE DOWN", "STAY STILL", "TRIPLE TAP"]
    : ["CLICK IT", "DON'T CLICK", "DOUBLE-CLICK", "HOLD SPACE", "PRESS ENTER", "MOVE MOUSE", "RIGHT-CLICK", "STAY STILL"];
  grid.innerHTML = tips.map(t => `<div class="tip">${t}</div>`).join('');
}

// ══════════════════════════════════════
//  HELPERS
// ══════════════════════════════════════
const rand = a => {
  const r = seededR ? seededR() : Math.random();
  return a[Math.floor(r * a.length)];
};

// Track last 3 instructions to prevent repetitive back-to-back picks
const recentInsts = [];
function pick(a) {
  const filtered = a.filter(i => !recentInsts.includes(i));
  const r = seededR ? seededR() : Math.random();
  const chosen = filtered.length ? filtered[Math.floor(r * filtered.length)] : rand(a);
  recentInsts.push(chosen);
  if (recentInsts.length > 3) recentInsts.shift();
  return chosen;
}

function timeAgo(isoStr) {
  if (!isoStr) return '';
  const secs = Math.floor((Date.now() - new Date(isoStr)) / 1000);
  if (secs < 60)    return 'just now';
  if (secs < 3600)  return Math.floor(secs / 60) + 'm ago';
  if (secs < 86400) return Math.floor(secs / 3600) + 'h ago';
  const d = Math.floor(secs / 86400);
  return d === 1 ? 'yesterday' : d + ' days ago';
}

function updateBestDateUI() {
  const el = document.getElementById('hs-date');
  if (!el) return;
  const d = modeBestDate[currentMode];
  el.textContent = d ? timeAgo(d) : '';
}

function updateScoreUI() {
  svalEl.textContent   = score;
  bestSval.textContent = modeBest[currentMode];
  rankLbl.textContent  = getRank(score);
  svalEl.classList.add('pop');
  setTimeout(() => svalEl.classList.remove('pop'), 170);
  bgIntensity  = Math.min(score / 32, 1);
  corruptLevel = Math.max(0, (score - 25) / 30);
  updateBestDateUI();
  checkThemeUnlocks(score);
}

function updateLives() {
  if (currentMode === 'zen' || (trainingMode)) {
    lifeEls.forEach(el => { el.textContent = '∞'; el.classList.remove('lost'); el.style.display = ''; });
    const lbl = document.getElementById('lives-lbl');
    if (lbl) { lbl.textContent = 'Zen'; lbl.style.display = ''; }
    return;
  }
  if (currentMode === 'sprint') {
    lifeEls.forEach(el => { el.style.display = 'none'; });
    const lbl = document.getElementById('lives-lbl');
    if (lbl) lbl.style.display = 'none';
    return;
  }
  const lbl = document.getElementById('lives-lbl');
  if (lbl) { lbl.textContent = 'Lives'; lbl.style.display = ''; }
  lifeEls.forEach((el, i) => {
    el.textContent = '❤️'; el.style.display = '';
    el.classList.toggle('lost', i >= lives);
  });
}

function updateStreak() {
  const pct = Math.min(streak / STREAK_BONUS_AT, 1) * 100;
  stkFill.style.width = pct + '%';
  stkVal.textContent  = streak;
  const hot = streak >= STREAK_BONUS_AT;
  stkFill.classList.toggle('hot', hot);
  stkVal.classList.toggle('hot', hot);

  // Live multiplier preview
  const multEl = document.getElementById('mult-preview');
  if (multEl) {
    const m = calcMult();
    if (m > 1) {
      multEl.textContent = '×' + m;
      multEl.classList.add('active');
    } else {
      multEl.textContent = '';
      multEl.classList.remove('active');
    }
  }
}

function doFlash(cls) {
  flashOv.className = 'flash-ov ' + cls;
  setTimeout(() => flashOv.className = 'flash-ov', 300);
}

function doShake() {
  cab.classList.remove('shake');
  void cab.offsetWidth;
  cab.classList.add('shake');
  setTimeout(() => cab.classList.remove('shake'), 420);
}

function chromaOn()  { cab.classList.add('chroma'); }
function chromaOff() { cab.classList.remove('chroma'); }

function showFB(msg, cls) {
  feedbackEl.textContent = msg;
  feedbackEl.className   = 'feedback show ' + cls;
  setTimeout(() => feedbackEl.className = 'feedback', 850);
}

function floatPts(txt, ex, ey) {
  const r = cab.getBoundingClientRect();
  ptsFloat.textContent = txt;
  ptsFloat.style.left  = (ex - r.left - 18) + 'px';
  ptsFloat.style.top   = (ey - r.top  - 18) + 'px';
  ptsFloat.className   = 'pts-float pop';
  setTimeout(() => ptsFloat.className = 'pts-float', 850);
}

function showMult(txt) {
  bigMult.textContent = txt;
  bigMult.classList.remove('pop');
  void bigMult.offsetWidth;
  bigMult.classList.add('pop');
  setTimeout(() => bigMult.classList.remove('pop'), 1150);
}

function showCombo(n) {
  if (n < 2) return;
  comboLbl.textContent = n >= STREAK_BONUS_AT ? `🔥 ×${n} STREAK — BONUS!` : `🔥 STREAK ×${n}`;
  comboLbl.classList.remove('show');
  void comboLbl.offsetWidth;
  comboLbl.classList.add('show');
  if (n % STREAK_BONUS_AT === 0) { S.combo(); vibCombo(); }
  setTimeout(() => comboLbl.classList.remove('show'), 1400);

  // Hot seat rivalry taunts at key milestones
  if (hsMode && n === 3) {
    const [s1, s2] = hsScores;
    const cur = hsPlayer === 1 ? s1 : s2;
    const opp = hsPlayer === 1 ? s2 : s1;
    let pool;
    if (cur > opp)      pool = RIVALRY_TAUNTS_P1_AHEAD;
    else if (opp > cur) pool = RIVALRY_TAUNTS_P2_AHEAD;
    else                pool = RIVALRY_TAUNTS_TIED;
    const t = document.getElementById('taunt');
    if (t) {
      t.textContent = rand(pool);
      t.classList.add('hot');
      setTimeout(() => { t.textContent = ''; t.classList.remove('hot'); }, 1800);
    }
  }
}

function showNearMiss() {
  nearMissEl.textContent = rand(['⚡ NEAR MISS!', '😬 CLOSE ONE…', '⏱ BARELY!']);
  nearMissEl.classList.remove('show');
  void nearMissEl.offsetWidth;
  nearMissEl.classList.add('show');
  setTimeout(() => nearMissEl.classList.remove('show'), 1050);
}

function showGlitch(txt) {
  glitchTxt.textContent = txt;
  glitchTxt.classList.remove('show');
  void glitchTxt.offsetWidth;
  glitchTxt.classList.add('show');
  setTimeout(() => glitchTxt.classList.remove('show'), 650);
}

function showLastChance() {
  lcTxt.textContent = 'LAST CHANCE';
  lcOv.classList.remove('show');
  void lcOv.offsetWidth;
  lcOv.classList.add('show');
  S.lastch(); vibLastCh();
  setTimeout(() => lcOv.classList.remove('show'), 650);
}

function showSwipeArrow(dir) {
  const arrows = { swipe_up: '⬆', swipe_down: '⬇', swipe_left: '⬅', swipe_right: '➡' };
  swipeArrow.textContent = arrows[dir] || '';
  swipeArrow.className   = 'swipe-arrow ' + dir.replace('swipe_', '');
  setTimeout(() => swipeArrow.className = 'swipe-arrow', 850);
}

function startTaunt(dur) {
  clearTimeout(tauntTO);
  const hot = dur < 900, pool = hot ? TAUNTS_HOT : TAUNTS_IDLE;
  const at  = dur * (.3 + Math.random() * .3);
  tauntTO = setTimeout(() => {
    if (roundEnded) return;
    const pct = 1 - (performance.now() - timerStart) / timerDur;
    if (pct < .1) return;
    tauntEl.textContent = rand(pool);
    tauntEl.classList.toggle('hot', hot);
    setTimeout(() => { tauntEl.textContent = ''; tauntEl.classList.remove('hot'); }, dur * .35);
  }, at);
}

function resetButton() {
  pb.style.position = ''; pb.style.left = ''; pb.style.top = '';
  pb.className = '';
  document.querySelectorAll('.decoy').forEach(d => d.remove());
  cancelAnimationFrame(holdRAF);
  holdRingEl.classList.remove('show');
  hrFill.style.strokeDashoffset = '113';
}

function setInst(inst, anim = 'appear') {
  if (anim === 'leave') {
    instEl.classList.add('leaving');
    setTimeout(() => {
      instEl.textContent = inst.text;
      instEl.className   = 'inst ' + inst.col + ' appear';
      updateShapeInd();
    }, 150);
  } else {
    instEl.textContent = inst.text;
    instEl.className   = 'inst ' + inst.col + ' ' + anim;
    updateShapeInd();
  }
}

function clearAllTimers() {
  cancelAnimationFrame(timerRAF);
  clearTimeout(waitTO); clearTimeout(switchTO);
  clearTimeout(holdTO); clearTimeout(tauntTO);
  cancelAnimationFrame(holdRAF);
  stopHB();
  holdRingEl.classList.remove('show');
  // Bug 6 fix: always disarm holdActive when clearing timers so that a keyup/touchend
  // arriving after a timeout (roundEnded=true) cannot re-trigger handleWrong().
  holdActive = false;
}

// ══════════════════════════════════════
//  HOLD PROGRESS
// ══════════════════════════════════════
const HOLD_DUR  = 500;
const RING_CIRC = 113.1;

function startHoldProgress() {
  holdProgress = 0;
  holdRingEl.classList.add('show');
  const start = performance.now();
  function tick() {
    holdProgress = Math.min(1, (performance.now() - start) / HOLD_DUR);
    hrFill.style.strokeDashoffset = (RING_CIRC * (1 - holdProgress)).toFixed(2);
    if (holdProgress < 1 && holdActive) holdRAF = requestAnimationFrame(tick);
  }
  holdRAF = requestAnimationFrame(tick);
}

// ══════════════════════════════════════
//  TIMER
// ══════════════════════════════════════
function startTimer(dur) {
  clearAllTimers();
  timerDur   = dur;
  timerStart = performance.now();
  roundEnded = false;
  mouseDist  = 0;
  nearMissShown = false;
  lastPctVal    = 1;
  swipeHandled  = false;
  touchMoved    = false;
  startHB(dur);
  startTaunt(dur);

  function tick() {
    const el  = performance.now() - timerStart;
    const pct = Math.max(0, 1 - el / dur);
    const rem = Math.max(0, (dur - el) / 1000);

    tbarEl.style.width         = (pct * 100) + '%';
    timerNumEl.textContent     = rem.toFixed(1) + 's';

    if (pct < .18) {
      tbarEl.className    = 'timer-bar danger';
      timerNumEl.className = 'timer-num danger';
      chromaOn();
      instEl.classList.add('jitter');
      if (curInst && curInst.type === 'click') pb.classList.add('danger-pulse');
    } else if (pct < .45) {
      tbarEl.className    = 'timer-bar warn';
      timerNumEl.className = 'timer-num warn';
      chromaOff(); instEl.classList.remove('jitter'); pb.classList.remove('danger-pulse');
    } else {
      tbarEl.className    = 'timer-bar';
      timerNumEl.className = 'timer-num';
      chromaOff(); instEl.classList.remove('jitter'); pb.classList.remove('danger-pulse');
    }

    if (!nearMissShown && pct < .13 && pct > .04 && curInst && curInst.type !== 'wait') {
      nearMissShown = true; showNearMiss(); S.warn();
    }
    if (lastPctVal >= .35 && pct < .35) S.tick();
    lastPctVal = pct;

    if (el >= dur) {
      tbarEl.style.width = '0%';
      chromaOff();
      instEl.classList.remove('jitter');
      pb.classList.remove('danger-pulse');
      handleTimeout();
    } else {
      timerRAF = requestAnimationFrame(tick);
    }
  }
  timerRAF = requestAnimationFrame(tick);
}

// ══════════════════════════════════════
//  ROUND
// ══════════════════════════════════════
function startRound() {
  if (!gameActive) return;
  resetButton(); holdActive = false; holdDone = false;
  dblGuard = false; tripleCount = 0; clearTimeout(tripleTO);
  roundN++;

  // ── Tutorial mode (first-ever game, steps 0-2) ──
  if (tutorialStep >= 0 && tutorialStep < TUTORIAL_STEPS.length) {
    const ts   = TUTORIAL_STEPS[tutorialStep];
    curInst    = ts;
    specialRound = null;
    const diff = { ms: 3500 }; // generous time for tutorial
    diffPill.textContent = 'TUTORIAL'; diffPill.className = 'diff-pill dp-easy';
    subInstEl.textContent = ts.hint;
    pb.textContent = isMobile ? 'TAP ME!' : 'CLICK!';
    pb.className   = '';
    setInst(ts);
    // Tutorial message via taunt slot
    tauntEl.textContent = ts.tutMsg;
    tauntEl.classList.remove('hot');
    if (ts.type === 'wait') {
      roundActionStart = 0;
      waitTO = setTimeout(() => {
        if (!roundEnded) {
          tutorialStep++; // advance here since doCorrect skips wait-type advancement
          if (tutorialStep >= TUTORIAL_STEPS.length) tutorialStep = -1;
          doCorrect(null, 1);
        }
      }, diff.ms - 100);
    } else {
      roundActionStart = performance.now();
    }
    startTimer(diff.ms);
    return;
  }

  const diff = getDiff(score);
  diffPill.textContent = diff.name;
  diffPill.className   = 'diff-pill ' + diff.cls;

  // Frenzy every 10 rounds (score ≥ 10)
  if (score >= 10 && roundN % 10 === 0) { launchFrenzy(diff); return; }

  // Special rounds every 7
  specialRound = (roundN > 1 && roundN % 7 === 0)
    ? (Math.random() < .55 ? 'bonus' : 'reverse')
    : null;

  if (specialRound === 'bonus') {
    spBan.textContent = '⚡ BONUS ROUND — ×3';
    spBan.className   = 'sp-ban bonus on';
    setTimeout(() => spBan.classList.remove('on'), 2400);
  } else if (specialRound === 'reverse') {
    spBan.textContent = '🔄 REVERSE ROUND';
    spBan.className   = 'sp-ban reverse on';
    setTimeout(() => spBan.classList.remove('on'), 2400);
  }

  // Silent round every 15 (score ≥ 15)
  const isSilent = score >= 15 && roundN % 15 === 0;

  let inst = trainingMode ? trainingPickRound() : pick(INSTS);
  prevInst = inst;

  if (specialRound === 'reverse') {
    inst = { ...inst };
    if (inst.type === 'click') {
      inst.type = 'wait'; inst.text += ' (NOPE!)'; inst.col = 'cy';
    } else if (inst.type === 'wait') {
      inst.type = 'click'; inst.text = 'ACTUALLY: ' + (isMobile ? 'TAP IT!' : 'HIT IT!'); inst.col = 'cr';
    }
  }
  curInst = inst;

  subInstEl.textContent = roundN <= 8 ? (inst.hint || '') : '';

  // Button label + distractor colour
  const lblPool = BTN_LBLS[inst.type] || BTN_LBLS.click;
  pb.textContent = rand(lblPool);
  pb.className   = (score >= 3 && Math.random() < .32) ? rand(BTN_COLS.filter(c => c !== '')) : '';

  // Tricks
  if (score >= 12 && Math.random() < .22) {
    Math.random() < .5 ? pb.classList.add('shrunken') : pb.classList.add('grown');
  }
  if (score >= 18 && inst.type === 'wait' && Math.random() < .25) pb.classList.add('spinning');
  if (score >= 10 && ['click','dblclick','tripleclick'].includes(inst.type) && Math.random() < .3) doTeleport();
  if (score >= 20 && inst.type === 'click' && Math.random() < .28) spawnDecoys(2);
  if (score >= 30 && inst.type === 'click' && Math.random() < .22) spawnDecoys(1);

  // Mid-round switch
  if (score >= 5 && Math.random() < .28) scheduleSwitch(diff.ms);

  // Swipe hint arrow
  if (['swipe_up','swipe_down','swipe_left','swipe_right'].includes(inst.type)) showSwipeArrow(inst.type);

  if (isSilent) {
    spBan.textContent = '🤫 SILENT ROUND';
    spBan.className   = 'sp-ban silent on';
    setTimeout(() => spBan.classList.remove('on'), 2000);
    instEl.textContent = ''; instEl.className = 'inst';
    setTimeout(() => { if (!roundEnded) { setInst(inst, 'appear'); S.sbr(); } }, 550);
  } else {
    setInst(inst);
  }

  const mult = calcMult();
  if (inst.type === 'wait') {
    waitTO = setTimeout(() => { if (!roundEnded) doCorrect(null, mult); }, diff.ms - 100);
  } else {
    roundActionStart = performance.now(); // start reaction clock for non-wait rounds
  }
  startTimer(diff.ms);
}

function calcMult() {
  return (specialRound === 'bonus' ? 3 : 1) + Math.floor(streak / STREAK_BONUS_AT);
}

function doTeleport() {
  S.tele();
  pb.classList.add('teleport-out');
  setTimeout(() => {
    const z   = btnZone.getBoundingClientRect();
    const m   = 14, bw = pb.offsetWidth || 120, bh = pb.offsetHeight || 120;
    const nx  = m + Math.random() * Math.max(4, z.width  - bw - m * 2);
    const ny  = m + Math.random() * Math.max(4, z.height - bh - m * 2);
    pb.style.position = 'absolute';
    pb.style.left     = nx + 'px';
    pb.style.top      = ny + 'px';
    pb.classList.remove('teleport-out');
  }, 100);
}

function spawnDecoys(count) {
  for (let i = 0; i < count; i++) {
    const d    = document.createElement('button');
    d.className = 'decoy';
    d.classList.add(rand(['blue','green','yellow','purple']));
    d.textContent  = rand(['FAKE', 'NOPE', "DON'T", 'TRAP', 'WRONG', 'FALSE']);
    d.style.background = `radial-gradient(circle at 35% 30%,${rand(['#66aaff','#66ff99','#ffee66','#ee66ff'])},${rand(['#003388','#006622','#885500','#550077'])})`;
    const z         = btnZone.getBoundingClientRect();
    d.style.position = 'absolute';
    d.style.left     = (10 + Math.random() * (z.width  - 88)) + 'px';
    d.style.top      = (10 + Math.random() * (z.height - 88)) + 'px';
    const kill = e => { e.preventDefault(); e.stopPropagation(); if (!gameActive || roundEnded) return; handleWrong(); };
    d.addEventListener('click',    kill);
    d.addEventListener('touchend', kill, { passive: false });
    btnZone.appendChild(d);
  }
}

function scheduleSwitch(total) {
  const at = total * (.32 + Math.random() * .28);
  switchTO = setTimeout(() => {
    if (roundEnded) return;
    const nt   = Math.random() < .5 ? 'click' : 'wait';
    const STXT = {
      click: ['CLICK NOW!!!', 'NOW!!!', 'HIT IT!!!!', 'GO GO GO!', 'DO IT!!', 'TAP TAP TAP!'],
      wait:  ["WAIT!", "STOP!", "FREEZE!", "DON'T TOUCH!", "HANDS OFF!!"],
    };
    const ni = { text: rand(STXT[nt]), type: nt, col: nt === 'click' ? 'cr' : 'cy', hint: '' };
    curInst = ni;
    setInst(ni, 'leave');
    clearTimeout(waitTO);
    if (ni.type === 'wait') {
      const rem = total - at, m = calcMult();
      waitTO = setTimeout(() => { if (!roundEnded) doCorrect(null, m); }, rem - 100);
    }
    showGlitch(ni.text); S.tick();
  }, at);
}

function updateFrenzyBanner() {
  spBan.textContent = `⚠ FRENZY ${frenzyDone + 1}/${frenzyCount} ⚠`;
}

// ── FRENZY ──
function launchFrenzy(diff) {
  isFrenzy = true;
  frenzyCount = 6 + Math.floor(score / 12) * 2;
  frenzyDone  = 0;
  frRing.classList.add('on');
  spBan.textContent = '⚠ FRENZY MODE ⚠';
  spBan.className   = 'sp-ban frenzy on';
  doFlash('fr'); S.frenzy(); vib([30, 20, 30, 20, 60]);
  setTimeout(() => runFrenzyRound(diff), 350);
}

function runFrenzyRound(diff) {
  if (!gameActive) return;
  if (frenzyDone >= frenzyCount) { endFrenzy(); return; }
  resetButton(); holdActive = false; holdDone = false; dblGuard = false; mouseDist = 0; roundEnded = false;
  updateFrenzyBanner();
  const inst = rand(FRENZY_INSTS);
  curInst = inst; specialRound = 'frenzy'; subInstEl.textContent = '';
  pb.textContent = rand(BTN_LBLS[inst.type] || BTN_LBLS.click);
  pb.className   = rand(BTN_COLS);
  setInst(inst);
  const ft = Math.max(320, diff.ms * .5);
  if (inst.type === 'wait') waitTO = setTimeout(() => { if (!roundEnded) frenzyOK(); }, ft - 80);
  startTimer(ft);
}

function frenzyOK() {
  if (roundEnded) return;
  roundEnded = true; clearAllTimers(); S.ok(); vibOK();
  const earned = 1 + Math.floor(streak / STREAK_BONUS_AT);
  score += earned;
  const isNewBestF = saveModeScore(score);
  if (isNewBestF) { bestScore = modeBest[currentMode]; bestScoreDate = modeBestDate[currentMode]; }
  streak++; updateScoreUI(); updateStreak(); doFlash('fg'); frenzyDone++;
  showFB('✓', 'ok');
  setTimeout(() => runFrenzyRound(getDiff(score)), 110);
}

function frenzyWrong() {
  if (roundEnded) return;
  roundEnded = true; clearAllTimers(); endFrenzy(); loseLife();
}

function endFrenzy() {
  isFrenzy = false; frRing.classList.remove('on');
  spBan.classList.remove('on'); spBan.textContent = '';
  if (!gameActive) return;
  setTimeout(startRound, 400);
}

// ══════════════════════════════════════
//  CORRECT / WRONG / TIMEOUT
// ══════════════════════════════════════
function doCorrect(ev, multOverride) {
  if (roundEnded) return;
  if (isFrenzy) { frenzyOK(); return; }
  roundEnded = true; clearAllTimers(); S.click(); vibOK();

  // Advance tutorial step (only for non-wait rounds; wait rounds are advanced in their own timeout)
  if (tutorialStep >= 0 && tutorialStep < TUTORIAL_STEPS.length) {
    const ts = TUTORIAL_STEPS[tutorialStep];
    if (ts.type !== 'wait') {
      tutorialStep++;
      if (tutorialStep >= TUTORIAL_STEPS.length) tutorialStep = -1;
    } else {
      // wait rounds advance tutorialStep in their waitTO callback
      if (tutorialStep >= TUTORIAL_STEPS.length) tutorialStep = -1;
    }
  }

  // Record reaction time for non-wait rounds
  let lastRT = 0;
  if (roundActionStart > 0 && curInst && curInst.type !== 'wait') {
    lastRT = Math.round(performance.now() - roundActionStart);
    reactTimes.push(lastRT);
    const avg = Math.round(reactTimes.reduce((a, b) => a + b, 0) / reactTimes.length);
    if (reactSval) reactSval.textContent = avg + 'ms';
  }
  roundActionStart = 0;
  // Training mode: log this round
  if (trainingMode) trainingOnRoundEnd(true, lastRT);
  streak++; updateStreak(); if (streak > 1) showCombo(streak);

  const mult   = multOverride !== undefined ? multOverride : calcMult();
  const earned = Math.max(1, mult);
  score += earned;
  const isNewBest = saveModeScore(score);
  if (isNewBest) { bestScore = modeBest[currentMode]; bestScoreDate = modeBestDate[currentMode]; }
  updateScoreUI();
  if (currentMode === 'daily') dailyRoundLog.push(specialRound === 'frenzy' ? 'frenzy' : 'hit');

  const pr = getRank(score - earned), nr = getRank(score);
  if (pr !== nr) S.rank();

  if (earned > 1) {
    doFlash('fy'); S.bonus();
    showFB('✓ +' + earned + ' BONUS!', 'bonus');
    showMult('×' + earned);
  } else {
    doFlash('fg'); S.ok(); showFB('✓ CORRECT', 'ok');
  }

  if (ev) floatPts('+' + earned, ev.clientX, ev.clientY);
  setTimeout(startRound, 230);
}

function loseLife() {
  // Training mode: log miss, never actually end game
  if (trainingMode) {
    trainingOnRoundEnd(false, 0);
    streak = 0; updateStreak();
    S.life(); vibWrong(); doShake(); doFlash('fr');
    showFB('✗ MISS', 'bad');
    setTimeout(startRound, 550);
    return;
  }
  // Zen mode: no lives — just reset streak and continue
  if (currentMode === 'zen') {
    streak = 0; updateStreak();
    S.life(); vibWrong(); doShake(); doFlash('fr');
    showFB('✗ MISS', 'bad');
    setTimeout(startRound, 550);
    return;
  }
  if (currentMode === 'daily') dailyRoundLog.push('miss');
  if (lives === 1) showLastChance();
  lives--; updateLives(); S.life(); vibWrong(); doShake(); doFlash('fr');
  lifeEls[lives]?.classList.add('flash-die');
  setTimeout(() => lifeEls[lives]?.classList.remove('flash-die'), 450);
  streak = 0; updateStreak();
  if (lives <= 0) { gameOver(); return; }
  showFB('✗ -1 LIFE!', 'bad');
  setTimeout(startRound, 550);
}

function handleWrong() {
  if (roundEnded) return;
  if (isFrenzy) { frenzyWrong(); return; }
  roundEnded = true; clearAllTimers(); loseLife();
}

function handleTimeout() {
  if (roundEnded) return;
  if (curInst && curInst.type === 'wait') doCorrect(null);
  else { roundEnded = true; clearAllTimers(); loseLife(); }
}

// ══════════════════════════════════════
//  INPUT: TRIPLE CLICK / TAP
// ══════════════════════════════════════
function handleTriple(ev) {
  tripleCount++; clearTimeout(tripleTO);
  if (tripleCount >= 3) {
    tripleCount = 0;
    if (!gameActive || roundEnded || !curInst) return;
    curInst.type === 'tripleclick' ? doCorrect(ev) : handleWrong();
    return;
  }
  tripleTO = setTimeout(() => { tripleCount = 0; }, 450);
}

// ══════════════════════════════════════
//  INPUT: MOUSE (desktop)
// ══════════════════════════════════════
function handleClick(e) {
  if (!gameActive || roundEnded || !curInst) return;
  e.preventDefault(); e.stopPropagation();
  if (curInst.type === 'tripleclick') { handleTriple(e); return; }
  if (curInst.type === 'dblclick') {
    dblGuard = true;
    setTimeout(() => { if (!roundEnded && dblGuard) { dblGuard = false; handleWrong(); } }, 290);
    return;
  }
  dblGuard = false;
  curInst.type === 'click' ? doCorrect(e) : handleWrong();
}

function handleDblClick(e) {
  if (!gameActive || roundEnded || !curInst) return;
  e.preventDefault(); e.stopPropagation();
  dblGuard = false;
  curInst.type === 'dblclick' ? doCorrect(e) : (!roundEnded && handleWrong());
}

function handleRightClick(e) {
  e.preventDefault();
  if (!gameActive || roundEnded || !curInst) return;
  curInst.type === 'rightclick' ? doCorrect(e) : handleWrong();
}

function handleKeyDown(e) {
  if (!gameActive || roundEnded || !curInst) return;
  const k = e.code;

  if (k === 'Space') {
    e.preventDefault();
    if (curInst.type === 'space') { doCorrect(null); return; }
    if (curInst.type === 'hold_space') {
      if (!holdActive && !holdDone) {
        holdActive = true; startHoldProgress();
        holdTO = setTimeout(() => { if (holdActive && !roundEnded) { holdDone = true; doCorrect(null); } }, HOLD_DUR);
      }
      return;
    }
    handleWrong(); return;
  }
  if (k === 'Enter')   { e.preventDefault(); curInst.type === 'enter'      ? doCorrect(null) : handleWrong(); return; }
  if (k === 'KeyA')    {                      curInst.type === 'key_a'     ? doCorrect(null) : handleWrong(); return; }
  if (k === 'Escape')  { if (curInst.type === 'key_escape') doCorrect(null); return; }
}

function handleKeyUp(e) {
  if (e.code !== 'Space' || !holdActive) return;
  holdActive = false; clearTimeout(holdTO); cancelAnimationFrame(holdRAF);
  holdRingEl.classList.remove('show');
  // Bug 6 fix: check roundEnded AND gameActive here — the timeout may have already
  // ended the round (setting roundEnded=true) while the key was still physically held,
  // so releasing it must not fire handleWrong() on the dead round.
  if (!holdDone && !roundEnded && gameActive && curInst && curInst.type === 'hold_space') handleWrong();
}

function handleMouseMove(e) {
  if (!gameActive || roundEnded || !curInst) return;
  const dx = e.clientX - lastMX, dy = e.clientY - lastMY;
  mouseDist += Math.sqrt(dx * dx + dy * dy);
  lastMX = e.clientX; lastMY = e.clientY;
  if (curInst.type === 'move'  && mouseDist > 90  && !roundEnded) { doCorrect(e);    return; }
  if (curInst.type === 'wait'  && mouseDist > 120 && !roundEnded) handleWrong();
}

// ══════════════════════════════════════
//  INPUT: TOUCH (mobile)
// ══════════════════════════════════════

// Hold button — touchstart
pb.addEventListener('touchstart', (e) => {
  if (!gameActive || roundEnded || !curInst) return;
  e.preventDefault();
  if (curInst.type === 'hold_btn' && !holdActive && !holdDone) {
    holdActive = true; startHoldProgress();
    holdTO = setTimeout(() => { if (holdActive && !roundEnded) { holdDone = true; doCorrect(null); } }, HOLD_DUR);
  }
}, { passive: false });

// Tap / release — touchend (single unified handler, Bug 5 fix)
// Previously there were TWO touchend listeners for dblclick (one bubble, one capture)
// which caused a race: the bubble handler could fire handleWrong() before the
// capture handler registered the second tap. Now handled entirely here with lastTapTime.
let lastTapTime = 0;
pb.addEventListener('touchend', (e) => {
  if (!gameActive || roundEnded || !curInst) return;
  e.preventDefault(); e.stopPropagation();
  const t = curInst.type;

  if (t === 'hold_btn') {
    holdActive = false; clearTimeout(holdTO); cancelAnimationFrame(holdRAF);
    holdRingEl.classList.remove('show');
    if (!holdDone && !roundEnded) handleWrong();
    return;
  }
  if (t === 'tripleclick') { handleTriple(e.changedTouches[0] || e); return; }

  // Unified double-tap: track timing here, no separate capture listener needed
  if (t === 'dblclick') {
    const now = Date.now();
    if (now - lastTapTime < 350) {
      // Second tap within window — success
      lastTapTime = 0;
      doCorrect(e.changedTouches[0] || e);
    } else {
      // First tap — start the window, arm a wrong-answer timeout
      lastTapTime = now;
      dblGuard = true;
      setTimeout(() => {
        // If lastTapTime was reset by second tap, dblGuard is already false — skip
        if (!roundEnded && dblGuard && lastTapTime !== 0) {
          dblGuard = false; lastTapTime = 0; handleWrong();
        }
      }, 350);
    }
    return;
  }

  t === 'click' ? doCorrect(e.changedTouches[0] || e) : handleWrong();
}, { passive: false });

// Swipe — touchstart on cabinet
cab.addEventListener('touchstart', (e) => {
  if (!gameActive || roundEnded) return;
  const t = e.touches[0]; touchStartX = t.clientX; touchStartY = t.clientY;
  touchMoved = false; swipeHandled = false;
}, { passive: true });

// Swipe — touchmove
cab.addEventListener('touchmove', (e) => {
  if (!gameActive || roundEnded || !curInst) return;
  const t   = e.touches[0];
  const dx  = t.clientX - touchStartX, dy = t.clientY - touchStartY;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist > 8) touchMoved = true;
  if (curInst.type === 'wait' && dist > 80 && !roundEnded) handleWrong();
}, { passive: true });

// Swipe — touchend on cabinet
cab.addEventListener('touchend', (e) => {
  if (!gameActive || roundEnded || !curInst || swipeHandled) return;
  if (!touchMoved) return;
  const t   = e.changedTouches[0];
  const dx  = t.clientX - touchStartX, dy = t.clientY - touchStartY;
  const adx = Math.abs(dx), ady = Math.abs(dy);
  if (Math.max(adx, ady) < 40) return;
  swipeHandled = true;
  const dir = adx > ady ? (dx > 0 ? 'swipe_right' : 'swipe_left') : (dy > 0 ? 'swipe_down' : 'swipe_up');
  if (curInst.type === dir) doCorrect(t);
  else if (['swipe_up','swipe_down','swipe_left','swipe_right'].includes(curInst.type)) handleWrong();
  else if (curInst.type === 'wait') handleWrong();
}, { passive: true });

// Outside tap — wait violation on mobile
document.addEventListener('touchend', (e) => {
  if (!gameActive || roundEnded || !curInst) return;
  if (e.target === pb || e.target.classList.contains('decoy')) return;
  if (scrStart.contains(e.target) || scrGO.contains(e.target)) return;
  if (curInst.type === 'wait') handleWrong();
}, { passive: true });

// Outside click — wait violation on desktop
document.addEventListener('click', (e) => {
  if (!gameActive || roundEnded || !curInst) return;
  if (e.target === pb || e.target.classList.contains('decoy')) return;
  if (scrStart.contains(e.target) || scrGO.contains(e.target)) return;
  if (curInst.type === 'wait') handleWrong();
}, true);

// ══════════════════════════════════════
//  GAME OVER
// ══════════════════════════════════════
function gameOver() {
  gameActive = false; isFrenzy = false;
  frRing.classList.remove('on');
  chromaOff(); stopHB(); ekgPanic = 0; bgIntensity = 0; corruptLevel = 0;
  doShake(); doFlash('fr'); S.wrong(); streak = 0; updateStreak();
  stopSprintTimer();

  const isNew = saveModeScore(score);
  if (isNew) { bestScore = modeBest[currentMode]; bestScoreDate = modeBestDate[currentMode]; }

  // ── HOT SEAT: intercept P1 game over ──
  if (hsMode && hsPlayer === 1) {
    hotSeatRoundComplete(score);
    return;
  }
  if (hsMode && hsPlayer === 2) {
    hotSeatRoundComplete(score);
    return;
  }

  // Save daily result
  if (currentMode === 'daily') saveDailyResult(score);

  goScore.textContent = score;
  goBest.textContent  = modeBest[currentMode];
  const failMsg = rand(FAIL_MSGS);
  localStorage.setItem('pb_last_fail', failMsg);
  goMsg.textContent   = failMsg;
  goRank.textContent  = getRank(score);
  goDied.textContent  = currentMode === 'sprint'
    ? 'Sprint ended! 30 seconds up.'
    : 'Died on: ' + (curInst ? curInst.text : '???');
  goNB.className      = isNew ? 'new-best-badge' : 'new-best-badge hidden';

  // Daily grid
  if (currentMode === 'daily') {
    dailyResultEl.classList.remove('hidden');
    dailyNumEl.textContent = `Day #${getDailyNum()}`;
    dailyGridEl.innerHTML  = dailyRoundLog.map(r => {
      return `<span class="dg-cell ${r}">${r==='hit'?'🟩':r==='miss'?'🟥':'🟨'}</span>`;
    }).join('');
  } else {
    dailyResultEl.classList.add('hidden');
  }

  // Sprint mode label
  if (currentMode === 'sprint') {
    goMsg.textContent = `Survived 30 seconds!`;
  }

  // Reaction time summary
  if (reactTimes.length > 0) {
    const avg = Math.round(reactTimes.reduce((a, b) => a + b, 0) / reactTimes.length);
    goReact.textContent = avg + 'ms';
    const last8 = reactTimes.slice(-8);
    reactBD.innerHTML = last8.map(t => {
      const cls = t < 350 ? 'fast' : t < 650 ? 'mid' : 'slow';
      return `<span class="rt-pill ${cls}">${t}ms</span>`;
    }).join('');
  } else {
    goReact.textContent = '—';
    reactBD.innerHTML = '';
  }

  scrGO.classList.remove('off');
}

// ══════════════════════════════════════
//  2-PLAYER HOT SEAT
// ══════════════════════════════════════
const HOTSEAT_ROUNDS = 5; // rounds per player per turn

const RIVALRY_TAUNTS_P1_AHEAD = [
  'P1 is smoking you! 🔥', 'You call that panic?', 'P1 left you in the dust.',
  'Better luck next life, P2.', 'P1 is on fire — can you even feel it?',
];
const RIVALRY_TAUNTS_P2_AHEAD = [
  'P2 is coming for you! 👀', 'P1 feeling the heat?', 'P2 just turned up the pressure.',
  'P1 panic mode: activated.', 'P2 smells blood. React faster!',
];
const RIVALRY_TAUNTS_TIED = [
  'Dead even — who blinks first?', 'It\'s neck and neck!',
  'Too close to call…', 'Someone has to crack. Will it be you?',
];
const HANDOFF_MSGS = [
  ['GET READY, P2!', 'P1 has set the bar. Can you beat it?'],
  ['YOUR TURN, P2!', 'Don\'t choke now.'],
  ['PASS THE DEVICE', 'P2 steps up.'],
];
const WIN_TAUNTS = [
  (winner, diff) => `${winner} WINS by ${diff} point${diff !== 1 ? 's' : ''}!`,
  (winner, diff) => `${winner} dominated. ${diff} point gap.`,
  (winner)       => `${winner} is the Panic Champion!`,
];
const DRAW_TAUNTS = [
  'A PERFECT DRAW. Rematch?', 'Neither cracked. True rivals.', 'Tied at the top. Impressive.',
];

// hsMode, hsPlayer, hsScores, hsLives, hsReactTimes declared near top

function startHotSeat() {
  hsMode = true; hsPlayer = 1; hsRoundsPlayed = 0;
  hsScores = [0, 0]; hsLives = [3, 3]; hsReactTimes = [[], []];
  selectMode('classic'); // hot seat always classic rules
  updateHotSeatHUD();
  startGame();
}

function updateHotSeatHUD() {
  const hud = document.getElementById('hs-hud');
  if (!hud) return;
  hud.innerHTML = `
    <span class="hs-hud-player ${hsPlayer===1?'active':''}">P1: ${hsScores[0]}</span>
    <span class="hs-hud-sep">vs</span>
    <span class="hs-hud-player ${hsPlayer===2?'active':''}">P2: ${hsScores[1]}</span>
    <span class="hs-hud-rounds">${hsRoundsPlayed}/${HOTSEAT_ROUNDS}</span>
  `;
  hud.classList.remove('hidden');
}

function hotSeatRoundComplete(playerScore) {
  if (!hsMode) return;
  hsScores[hsPlayer - 1] = playerScore;
  hsReactTimes[hsPlayer - 1] = [...reactTimes];
  if (hsPlayer === 1) {
    // Show handoff overlay then start P2
    showHandoffOverlay();
  } else {
    // Both players done — show results
    showHotSeatResults();
  }
}

function showHandoffOverlay() {
  const msg = HANDOFF_MSGS[Math.floor(Math.random() * HANDOFF_MSGS.length)];
  const diff = hsScores[0];
  const taunt = diff > 0
    ? rand(RIVALRY_TAUNTS_P2_AHEAD.concat([`P1 scored ${diff}. Beat it.`]))
    : `P1 scored 0. Easy target.`;

  const el = document.createElement('div');
  el.id        = 'handoff-ov';
  el.className = 'handoff-ov';
  el.innerHTML = `
    <div class="handoff-title">${msg[0]}</div>
    <div class="handoff-sub">${msg[1]}</div>
    <div class="handoff-score">P1 scored <span>${hsScores[0]}</span></div>
    <div class="handoff-taunt">${taunt}</div>
    <button class="btn-cta handoff-btn" id="handoff-go">P2 START!</button>
  `;
  document.getElementById('cab').appendChild(el);

  document.getElementById('handoff-go').addEventListener('click', () => {
    el.remove();
    hsPlayer = 2; hsRoundsPlayed = 0;
    reactTimes = []; roundActionStart = 0;
    updateHotSeatHUD();
    // Start fresh game for P2
    score = 0; lives = 3; streak = 0; roundN = 0;
    prevInst = null; specialRound = null; isFrenzy = false;
    bgIntensity = 0; corruptLevel = 0; ekgPanic = 0;
    recentInsts.length = 0; dailyRoundLog = [];
    seededR = null; tutorialStep = -1;
    gameActive = true;
    updateScoreUI(); updateLives(); updateStreak();
    scrGO.classList.add('off');
    tbarEl.style.width = '100%'; tbarEl.className = 'timer-bar';
    frRing.classList.remove('on'); chromaOff();
    if (tauntEl) tauntEl.textContent = '';
    startRound();
  });
}

function showHotSeatResults() {
  const el = document.getElementById('scr-go');
  const [s1, s2] = hsScores;

  // Build rivalry taunt
  let rivalTaunt;
  if (s1 > s2)       rivalTaunt = WIN_TAUNTS[Math.floor(Math.random() * WIN_TAUNTS.length)]('PLAYER 1', s1 - s2);
  else if (s2 > s1)  rivalTaunt = WIN_TAUNTS[Math.floor(Math.random() * WIN_TAUNTS.length)]('PLAYER 2', s2 - s1);
  else               rivalTaunt = DRAW_TAUNTS[Math.floor(Math.random() * DRAW_TAUNTS.length)];

  const avg1 = hsReactTimes[0].length ? Math.round(hsReactTimes[0].reduce((a,b)=>a+b,0)/hsReactTimes[0].length) : null;
  const avg2 = hsReactTimes[1].length ? Math.round(hsReactTimes[1].reduce((a,b)=>a+b,0)/hsReactTimes[1].length) : null;

  const existingHS = document.getElementById('hs-split-results');
  if (existingHS) existingHS.remove();

  const split = document.createElement('div');
  split.id = 'hs-split-results';
  split.className = 'hs-split-results';
  split.innerHTML = `
    <div class="hs-split-title">RESULTS</div>
    <div class="hs-split-taunt">${rivalTaunt}</div>
    <div class="hs-split-row">
      <div class="hs-split-col ${s1 >= s2 ? 'winner' : ''}">
        <div class="hs-split-plbl">PLAYER 1</div>
        <div class="hs-split-score">${s1}</div>
        <div class="hs-split-react">${avg1 ? avg1+'ms' : '—'}</div>
        ${s1 > s2 ? '<div class="hs-split-crown">👑</div>' : ''}
      </div>
      <div class="hs-split-vs">VS</div>
      <div class="hs-split-col ${s2 >= s1 ? 'winner' : ''}">
        <div class="hs-split-plbl">PLAYER 2</div>
        <div class="hs-split-score">${s2}</div>
        <div class="hs-split-react">${avg2 ? avg2+'ms' : '—'}</div>
        ${s2 > s1 ? '<div class="hs-split-crown">👑</div>' : ''}
      </div>
    </div>
    ${s1 === s2 ? '<div class="hs-split-draw">🤝 DRAW!</div>' : ''}
  `;

  el.insertBefore(split, el.querySelector('.go-btns'));

  // Override retry to reset hot seat
  const retryBtn = document.getElementById('btn-retry');
  retryBtn.textContent = 'REMATCH';
  retryBtn.onclick = () => {
    split.remove();
    retryBtn.textContent = 'RETRY';
    retryBtn.onclick = startGame;
    startHotSeat();
  };

  // Show game over screen
  goScore.textContent = `${s1} / ${s2}`;
  goBest.textContent  = Math.max(s1, s2);
  goMsg.textContent   = rivalTaunt;
  goRank.textContent  = '';
  goDied.textContent  = 'Hot Seat complete';
  goNB.className      = 'new-best-badge hidden';
  reactBD.innerHTML   = '';
  goReact.textContent = `${avg1||'—'}ms / ${avg2||'—'}ms`;
  dailyResultEl.classList.add('hidden');

  const hud = document.getElementById('hs-hud');
  if (hud) hud.classList.add('hidden');

  hsMode = false;
  scrGO.classList.remove('off');
}

// ══════════════════════════════════════
//  REFLEX TRAINING MODE
// ══════════════════════════════════════
// trainingMode declared near top
const TRAINING_ROUNDS   = 20;
const TRAINING_KEY      = 'pb_training_sessions';
const TRAINING_MAX_HIST = 30;

const TRAINING_PHASES = {
  warmup:   { label: 'WARM-UP',   desc: 'Click only — no tricks',    rounds: 6,  filter: r => r.type === 'click' },
  main:     { label: 'MAIN SET',  desc: '20 measured rounds',         rounds: 20, filter: () => true },
  cooldown: { label: 'COOL-DOWN', desc: 'Wait rounds — self-control', rounds: 5,  filter: r => r.type === 'wait' },
};

let trainingPhase    = 'warmup';
let trainingRoundN   = 0;
let trainingRTs      = [];
let trainingPhaseLog = [];

function loadTrainingSessions() {
  try { return JSON.parse(localStorage.getItem(TRAINING_KEY) || '[]'); }
  catch { return []; }
}

function saveTrainingSession(avgRT, rts) {
  const sessions = loadTrainingSessions();
  sessions.push({ date: new Date().toISOString(), avg: avgRT, rts: rts.slice(0, 20) });
  if (sessions.length > TRAINING_MAX_HIST) sessions.splice(0, sessions.length - TRAINING_MAX_HIST);
  localStorage.setItem(TRAINING_KEY, JSON.stringify(sessions));
}

function startTraining() {
  trainingMode     = true;
  trainingPhase    = 'warmup';
  trainingRoundN   = 0;
  trainingRTs      = [];
  trainingPhaseLog = [];
  selectMode('classic');
  score = 0; lives = 99; streak = 0; roundN = 0;
  prevInst = null; specialRound = null; isFrenzy = false;
  bgIntensity = 0; corruptLevel = 0; ekgPanic = 0;
  reactTimes = []; roundActionStart = 0;
  recentInsts.length = 0; dailyRoundLog = [];
  seededR = null; tutorialStep = -1;
  INSTS        = getActiveRounds();
  FRENZY_INSTS = isMobile ? FRENZY_MOBILE : FRENZY_DESKTOP;
  gameActive   = true;
  updateScoreUI(); updateLives(); updateStreak();
  scrStart.classList.add('off'); scrGO.classList.add('off');
  tbarEl.style.width = '100%'; tbarEl.className = 'timer-bar';
  frRing.classList.remove('on'); chromaOff();
  updateTrainingHUD();
  startRound();
}

function updateTrainingHUD() {
  const hud = document.getElementById('training-hud');
  if (!hud) return;
  const phase  = TRAINING_PHASES[trainingPhase];
  const total  = phase.rounds;
  const done   = trainingRoundN;
  const pct    = Math.min(done / total, 1) * 100;
  const avgNow = trainingRTs.length
    ? Math.round(trainingRTs.reduce((a,b)=>a+b,0) / trainingRTs.length) : null;
  hud.innerHTML = `
    <div class="tr-phase">${phase.label}</div>
    <div class="tr-prog-track"><div class="tr-prog-fill" style="width:${pct}%"></div></div>
    <div class="tr-info">${done}/${total}${avgNow ? ' · avg <b>'+avgNow+'ms</b>' : ''}</div>
  `;
  hud.classList.remove('hidden');
}

function trainingPickRound() {
  const phase = TRAINING_PHASES[trainingPhase];
  const pool  = getActiveRounds().filter(phase.filter);
  return pool.length ? pick(pool) : pick(getActiveRounds());
}

function trainingOnRoundEnd(hit, rt) {
  if (!trainingMode) return;
  trainingRoundN++;
  trainingPhaseLog.push({ phase: trainingPhase, hit, rt });
  if (trainingPhase === 'main' && hit && rt > 0) trainingRTs.push(rt);
  const phase = TRAINING_PHASES[trainingPhase];
  updateTrainingHUD();
  if (trainingRoundN >= phase.rounds) {
    if (trainingPhase === 'warmup') {
      trainingPhase = 'main'; trainingRoundN = 0;
      showTrainingPhaseTransition('MAIN SET', 'Measurement begins now.');
    } else if (trainingPhase === 'main') {
      trainingPhase = 'cooldown'; trainingRoundN = 0;
      showTrainingPhaseTransition('COOL-DOWN', 'Stay still. Control yourself.');
    } else {
      finishTraining();
    }
  }
}

function showTrainingPhaseTransition(title, sub) {
  gameActive = false; clearAllTimers();
  const el = document.createElement('div');
  el.className = 'training-transition';
  el.innerHTML = `
    <div class="tr-trans-title">${title}</div>
    <div class="tr-trans-sub">${sub}</div>
    <button class="btn-cta tr-trans-btn" id="tr-trans-go">READY</button>
  `;
  document.getElementById('cab').appendChild(el);
  document.getElementById('tr-trans-go').addEventListener('click', () => {
    el.remove(); gameActive = true; updateTrainingHUD(); startRound();
  });
}

function finishTraining() {
  trainingMode = false; gameActive = false;
  const hud = document.getElementById('training-hud');
  if (hud) hud.classList.add('hidden');
  const avg = trainingRTs.length
    ? Math.round(trainingRTs.reduce((a,b)=>a+b,0) / trainingRTs.length) : null;
  if (avg) saveTrainingSession(avg, trainingRTs);
  showTrainingResults(avg);
}

function showTrainingResults(avg) {
  const sessions = loadTrainingSessions();
  const prev     = sessions.length >= 2 ? sessions[sessions.length - 2] : null;
  const trend    = prev && avg ? avg - prev.avg : null;
  const sparkData = sessions.slice(-10).map(s => s.avg);

  const existingTR = document.getElementById('training-results');
  if (existingTR) existingTR.remove();

  const tr = document.createElement('div');
  tr.id = 'training-results';
  tr.className = 'training-results-panel';
  tr.innerHTML = `
    <div class="tr-res-title">TRAINING COMPLETE</div>
    <div class="tr-res-avg">${avg ? avg + 'ms' : '—'}</div>
    <div class="tr-res-lbl">AVG REACTION TIME</div>
    ${trend !== null ? `<div class="tr-res-trend ${trend < 0 ? 'better' : 'worse'}">
      ${trend < 0 ? '▼ '+Math.abs(trend)+'ms faster' : '▲ '+trend+'ms slower'} than last session
    </div>` : '<div class="tr-res-trend neutral">First session recorded!</div>'}
    ${sparkData.length > 1 ? `
    <div class="tr-sparkline-wrap">
      <div class="tr-sparkline-lbl">TREND (last ${sparkData.length} sessions)</div>
      <canvas id="tr-sparkline" width="260" height="50"></canvas>
    </div>` : ''}
    <div class="tr-breakdown">
      ${trainingRTs.slice(0, 20).map(t => {
        const cls = t < 300 ? 'fast' : t < 550 ? 'mid' : 'slow';
        return `<span class="rt-pill ${cls}">${t}ms</span>`;
      }).join('')}
    </div>
  `;

  const goEl = document.getElementById('scr-go');
  goEl.insertBefore(tr, goEl.querySelector('.go-btns'));

  goScore.textContent = avg ? avg + 'ms' : '—';
  goBest.textContent  = sessions.length ? Math.min(...sessions.map(s => s.avg)) + 'ms' : '—';
  goMsg.textContent   = avg
    ? (avg < 300 ? 'Inhuman reflexes.' : avg < 450 ? 'Sharp. Keep it up.' : avg < 650 ? 'Room to improve.' : 'Train harder.')
    : 'No data recorded.';
  goRank.textContent  = '';
  goDied.textContent  = TRAINING_ROUNDS + ' rounds completed';
  goNB.className      = 'new-best-badge hidden';
  reactBD.innerHTML   = '';
  goReact.textContent = avg ? avg + 'ms' : '—';
  dailyResultEl.classList.add('hidden');
  scrGO.classList.remove('off');
  setTimeout(() => drawSparkline(sparkData), 50);
}

function drawSparkline(data) {
  const c = document.getElementById('tr-sparkline');
  if (!c || data.length < 2) return;
  const ctx = c.getContext('2d');
  const W = c.width, H = c.height, pad = 6;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => ({
    x: pad + (i / (data.length - 1)) * (W - pad * 2),
    y: H - pad - ((v - min) / range) * (H - pad * 2),
  }));
  ctx.clearRect(0, 0, W, H);
  ctx.beginPath();
  ctx.moveTo(pts[0].x, H);
  pts.forEach(p => ctx.lineTo(p.x, p.y));
  ctx.lineTo(pts[pts.length-1].x, H);
  ctx.closePath();
  ctx.fillStyle = 'rgba(0,238,255,0.08)';
  ctx.fill();
  ctx.beginPath();
  pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
  ctx.strokeStyle = '#00eeff'; ctx.lineWidth = 1.5;
  ctx.shadowColor = '#00eeff'; ctx.shadowBlur = 5;
  ctx.stroke(); ctx.shadowBlur = 0;
  pts.forEach(p => {
    ctx.beginPath(); ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = '#00eeff'; ctx.fill();
  });
  const last = pts[pts.length - 1];
  ctx.beginPath(); ctx.arc(last.x, last.y, 4, 0, Math.PI * 2);
  ctx.fillStyle = data[data.length-1] <= (data[data.length-2]||Infinity) ? '#2dff00' : '#ff1133';
  ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 8;
  ctx.fill(); ctx.shadowBlur = 0;
}

function startSprintTimer() {
  if (currentMode !== 'sprint') return;
  sprintEndTime = performance.now() + SPRINT_DURATION;
  sprintBadge.classList.remove('hidden');
  function tick() {
    const rem = Math.max(0, sprintEndTime - performance.now());
    const secs = Math.ceil(rem / 1000);
    if (sprintTimeEl) sprintTimeEl.textContent = secs;
    sprintBadge.classList.toggle('sprint-urgent', secs <= 10);
    if (rem <= 0) { gameOver(); return; }
    sprintRAF = requestAnimationFrame(tick);
  }
  sprintRAF = requestAnimationFrame(tick);
}

function stopSprintTimer() {
  cancelAnimationFrame(sprintRAF);
  if (sprintBadge) sprintBadge.classList.add('hidden');
}

// ══════════════════════════════════════
//  START GAME
// ══════════════════════════════════════
function startGame() {
  getAC();
  // Modular round system: merge builtin + active custom packs
  INSTS        = getActiveRounds();
  FRENZY_INSTS = isMobile ? FRENZY_MOBILE : FRENZY_DESKTOP;

  score = 0; streak = 0; roundN = 0;
  prevInst = null; specialRound = null; isFrenzy = false;
  bgIntensity = 0; corruptLevel = 0; ekgPanic = 0;
  reactTimes = []; roundActionStart = 0;
  if (reactSval) reactSval.textContent = '—';
  recentInsts.length = 0;
  dailyRoundLog = [];

  // Mode-specific setup
  if (currentMode === 'sprint') {
    lives = 99; // effectively unlimited — sprint ends by timer
  } else if (currentMode === 'zen') {
    lives = 99;
  } else {
    lives = 3;
  }

  // Daily seeded RNG
  seededR = currentMode === 'daily' ? makeSeededRand(getDailySeed()) : null;

  // Tutorial on first ever game (classic only)
  if (isFirstGame && currentMode === 'classic') {
    tutorialStep = 0;
    localStorage.setItem('pb_played', '1');
    isFirstGame = false;
  } else {
    tutorialStep = -1;
  }

  gameActive = true;
  updateScoreUI(); updateLives(); updateStreak();
  scrStart.classList.add('off'); scrGO.classList.add('off');
  tbarEl.style.width = '100%'; tbarEl.className = 'timer-bar';
  frRing.classList.remove('on'); chromaOff();
  if (tauntEl) tauntEl.textContent = '';

  stopSprintTimer();
  if (currentMode === 'sprint') startSprintTimer();

  startRound();
}

// ── COPY RESULT ──
function copyResult() {
  const avg = reactTimes.length
    ? Math.round(reactTimes.reduce((a, b) => a + b, 0) / reactTimes.length) + 'ms'
    : '—';
  const modeLabel = currentMode.toUpperCase();
  const dailyLine = currentMode === 'daily'
    ? `\nDay #${getDailyNum()}: ${dailyRoundLog.map(r=>r==='hit'?'🟩':r==='miss'?'🟥':'🟨').join('')}`
    : '';
  const text =
    `🚨 PANIC BUTTON [${modeLabel}]\n` +
    `Score: ${score}  |  Best: ${modeBest[currentMode]}\n` +
    `Rank: ${getRank(score)}\n` +
    `Avg React: ${avg}` +
    dailyLine + `\n` +
    `panic-button.game`;
  navigator.clipboard.writeText(text).then(() => {
    const btn = document.getElementById('btn-copy');
    if (!btn) return;
    btn.classList.add('copied');
    btn.innerHTML = '<span>✓</span> COPIED!';
    setTimeout(() => { btn.classList.remove('copied'); btn.innerHTML = '<span>📋</span> COPY'; }, 2000);
  }).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
  });
}

// ── SHARE CARD IMAGE ──
function drawShareCard() {
  const c = shareCanvas;
  if (!c) return null;
  const ctx = c.getContext('2d');
  const W = c.width, H = c.height;

  // Background
  ctx.fillStyle = '#030306';
  ctx.fillRect(0, 0, W, H);

  // Red glow border
  ctx.shadowColor = '#ff1133';
  ctx.shadowBlur  = 24;
  ctx.strokeStyle = '#ff1133';
  ctx.lineWidth   = 3;
  ctx.strokeRect(8, 8, W - 16, H - 16);
  ctx.shadowBlur  = 0;

  // Title
  ctx.font         = 'bold 48px "Bebas Neue", sans-serif';
  ctx.fillStyle    = '#ff1133';
  ctx.textAlign    = 'center';
  ctx.shadowColor  = '#ff1133';
  ctx.shadowBlur   = 18;
  ctx.fillText('PANIC BUTTON', W / 2, 72);
  ctx.shadowBlur   = 0;

  // Mode badge
  ctx.font      = '16px "Share Tech Mono", monospace';
  ctx.fillStyle = '#44446a';
  ctx.fillText(currentMode.toUpperCase() + ' MODE', W / 2, 100);

  // Score
  ctx.font      = 'bold 96px "Bebas Neue", sans-serif';
  ctx.fillStyle = '#ffe500';
  ctx.shadowColor = '#ffe500';
  ctx.shadowBlur  = 20;
  ctx.fillText(score, W / 2, 210);
  ctx.shadowBlur  = 0;
  ctx.font      = '14px "Share Tech Mono", monospace';
  ctx.fillStyle = '#44446a';
  ctx.fillText('SCORE', W / 2, 232);

  // Rank
  ctx.font      = '28px "Bebas Neue", sans-serif';
  ctx.fillStyle = '#00eeff';
  ctx.shadowColor = '#00eeff';
  ctx.shadowBlur  = 12;
  ctx.fillText(getRank(score), W / 2, 272);
  ctx.shadowBlur  = 0;

  // Avg React
  const avg = reactTimes.length
    ? Math.round(reactTimes.reduce((a, b) => a + b, 0) / reactTimes.length) + 'ms'
    : '—';
  ctx.font      = '16px "Share Tech Mono", monospace';
  ctx.fillStyle = '#cc00ff';
  ctx.fillText('AVG REACT: ' + avg, W / 2, 306);

  // Reaction pills row (last 12)
  if (reactTimes.length > 0) {
    const pills = reactTimes.slice(-12);
    const pw = 36, ph = 18, gap = 6;
    const total = pills.length * (pw + gap) - gap;
    let px = (W - total) / 2;
    const py = 326;
    pills.forEach(t => {
      const col = t < 350 ? '#2dff00' : t < 650 ? '#ffe500' : '#ff1133';
      ctx.fillStyle = col + '33';
      ctx.strokeStyle = col;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(px, py, pw, ph, 4);
      ctx.fill(); ctx.stroke();
      ctx.font = '9px "Share Tech Mono", monospace';
      ctx.fillStyle = col;
      ctx.fillText(t + 'ms', px + pw/2, py + 12);
      px += pw + gap;
    });
  }

  // Daily grid
  if (currentMode === 'daily' && dailyRoundLog.length > 0) {
    ctx.font      = '13px "Share Tech Mono", monospace';
    ctx.fillStyle = '#44446a';
    ctx.fillText(`DAY #${getDailyNum()}`, W / 2, 368);
    const emojis = dailyRoundLog.slice(0, 30).map(r => r==='hit'?'🟩':r==='miss'?'🟥':'🟨').join('');
    ctx.font = '20px sans-serif';
    ctx.fillStyle = '#fff';
    ctx.fillText(emojis, W / 2, 395);
  }

  // Footer
  ctx.font      = '12px "Share Tech Mono", monospace';
  ctx.fillStyle = '#44446a';
  ctx.fillText('panic-button.game', W / 2, H - 16);

  return c;
}

async function shareImage() {
  const canvas = drawShareCard();
  if (!canvas) return;

  const btn = document.getElementById('btn-share-img');

  canvas.toBlob(async blob => {
    const file = new File([blob], 'panic-button.png', { type: 'image/png' });
    // Try Web Share API first (mobile)
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: 'PANIC BUTTON', text: `I scored ${score}!` });
        return;
      } catch (e) { /* fallback to download */ }
    }
    // Fallback: download the image
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href     = url;
    a.download = 'panic-button.png';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    if (btn) {
      btn.classList.add('copied');
      btn.innerHTML = '<span>✓</span> SAVED!';
      setTimeout(() => { btn.classList.remove('copied'); btn.innerHTML = '<span>🖼️</span> SHARE'; }, 2000);
    }
  }, 'image/png');
}

// ══════════════════════════════════════
// ══════════════════════════════════════
let cbMode = false;

const SHAPE_MAP = {
  click:       '▶',
  wait:        '✋',
  dblclick:    '▶▶',
  tripleclick: '▶▶▶',
  rightclick:  '◀',
  move:        '〰',
  hold_space:  '⏸',
  hold_btn:    '⏸',
  space:       '▣',
  enter:       '↵',
  key_a:       'Ⓐ',
  key_escape:  '✕',
  swipe_up:    '⬆',
  swipe_down:  '⬇',
  swipe_left:  '⬅',
  swipe_right: '➡',
};

function toggleCB() {
  cbMode = !cbMode;
  document.body.classList.toggle('cb-mode', cbMode);
  // Update all toggle buttons
  ['cb-toggle-start','cb-mini'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const lbl = el.querySelector('[id^="cb-label"]');
    if (lbl) lbl.textContent = 'Shape Mode: ' + (cbMode ? 'ON' : 'OFF');
    el.classList.toggle('on', cbMode);
  });
  // Update shape indicator if mid-game
  updateShapeInd();
}

function updateShapeInd() {
  const ind = document.getElementById('shape-ind');
  if (!ind) return;
  if (cbMode && curInst) {
    ind.textContent = SHAPE_MAP[curInst.type] || '';
  } else {
    ind.textContent = '';
  }
}

// ══════════════════════════════════════
// ══════════════════════════════════════

// ── PAUSE ON TAB AWAY (Bug 4 fix) ──
let isPaused = false;
let pauseTimeRemaining = 0;

function pauseGame() {
  if (!gameActive || isPaused || roundEnded) return;
  isPaused = true;
  pauseTimeRemaining = Math.max(0, timerDur - (performance.now() - timerStart));
  cancelAnimationFrame(timerRAF);
  clearTimeout(waitTO); clearTimeout(switchTO);
  clearTimeout(holdTO); clearTimeout(tauntTO);
  stopHB();
  document.getElementById('pause-ov').classList.add('show');
}

function resumeGame() {
  if (!gameActive || !isPaused) return;
  isPaused = false;
  document.getElementById('pause-ov').classList.remove('show');
  if (roundEnded) return;

  // Re-anchor timerStart so remaining time is honoured
  timerStart = performance.now() - (timerDur - pauseTimeRemaining);

  if (curInst && curInst.type === 'wait') {
    const mult = calcMult();
    waitTO = setTimeout(() => { if (!roundEnded) doCorrect(null, mult); }, pauseTimeRemaining - 100);
  }
  startHB(pauseTimeRemaining);
  startTaunt(pauseTimeRemaining);

  // Restart RAF timer loop
  (function tick() {
    const el  = performance.now() - timerStart;
    const pct = Math.max(0, 1 - el / timerDur);
    const rem = Math.max(0, (timerDur - el) / 1000);
    tbarEl.style.width     = (pct * 100) + '%';
    timerNumEl.textContent = rem.toFixed(1) + 's';
    if (pct < .18) {
      tbarEl.className = 'timer-bar danger'; timerNumEl.className = 'timer-num danger';
      chromaOn(); instEl.classList.add('jitter');
      if (curInst && curInst.type === 'click') pb.classList.add('danger-pulse');
    } else if (pct < .45) {
      tbarEl.className = 'timer-bar warn'; timerNumEl.className = 'timer-num warn';
      chromaOff(); instEl.classList.remove('jitter'); pb.classList.remove('danger-pulse');
    } else {
      tbarEl.className = 'timer-bar'; timerNumEl.className = 'timer-num';
      chromaOff(); instEl.classList.remove('jitter'); pb.classList.remove('danger-pulse');
    }
    if (el >= timerDur) {
      tbarEl.style.width = '0%'; chromaOff();
      instEl.classList.remove('jitter'); pb.classList.remove('danger-pulse');
      handleTimeout();
    } else { timerRAF = requestAnimationFrame(tick); }
  })();
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) pauseGame();
  else resumeGame();
});

// Start / Retry buttons
btnStart.addEventListener('click',    startGame);
btnRetry.addEventListener('click',    startGame);
btnStart.addEventListener('touchend', e => { e.preventDefault(); startGame(); }, { passive: false });
btnRetry.addEventListener('touchend', e => { e.preventDefault(); startGame(); }, { passive: false });

// Panic button — mouse/keyboard
pb.addEventListener('click',       handleClick);
pb.addEventListener('dblclick',    handleDblClick);
pb.addEventListener('contextmenu', handleRightClick);
document.addEventListener('keydown',    handleKeyDown);
document.addEventListener('keyup',      handleKeyUp);
document.addEventListener('mousemove',  handleMouseMove);
document.addEventListener('contextmenu', e => { if (gameActive) e.preventDefault(); });

// Prevent scroll / zoom on mobile during gameplay
document.addEventListener('touchmove', e => { if (gameActive) e.preventDefault(); }, { passive: false });

// ══════════════════════════════════════
//  INIT
// ══════════════════════════════════════
applyTheme(activeTheme);
renderThemeSwatches();
fillTips();
updateScoreUI();
const hsNumEl = document.getElementById('hs-num');
if (hsNumEl) hsNumEl.textContent = modeBest[currentMode];
bestSval.textContent = modeBest[currentMode];
updateLives();
showStartTaunt();

// Apply saved mute state
if (isMuted) {
  document.querySelectorAll('.mute-btn').forEach(el => {
    el.textContent = '🔇'; el.title = 'Unmute'; el.classList.add('muted');
  });
}

// ── PWA: Register Service Worker ──
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}

// ── PWA: Install prompt ──
let deferredInstallPrompt = null;
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredInstallPrompt = e;
  const banner = document.getElementById('install-banner');
  if (banner && !localStorage.getItem('pb_install_dismissed')) {
    banner.classList.add('show');
  }
});

document.getElementById('install-btn')?.addEventListener('click', async () => {
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  const { outcome } = await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  document.getElementById('install-banner')?.classList.remove('show');
});

document.getElementById('install-dismiss')?.addEventListener('click', () => {
  document.getElementById('install-banner')?.classList.remove('show');
  localStorage.setItem('pb_install_dismissed', '1');
});
