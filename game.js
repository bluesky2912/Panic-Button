/* ══════════════════════════════════════
   PANIC BUTTON — game.js
   ══════════════════════════════════════ */
'use strict';

// ══════════════════════════════════════
//  DEVICE DETECTION
// ══════════════════════════════════════
const isMobile = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

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

function getAC() {
  if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)();
  if (AC.state === 'suspended') AC.resume();
  return AC;
}

function beep(f, t, d, v, delay = 0) {
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
let score = 0, bestScore = +(localStorage.getItem('pb_best') || 0);
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

// ══════════════════════════════════════
//  TIPS (device-aware)
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
const rand = a => a[Math.floor(Math.random() * a.length)];
const pick = (a, x) => { const f = a.filter(i => i !== x); return rand(f.length ? f : a); };

function updateScoreUI() {
  svalEl.textContent   = score;
  bestSval.textContent = bestScore;
  rankLbl.textContent  = getRank(score);
  svalEl.classList.add('pop');
  setTimeout(() => svalEl.classList.remove('pop'), 170);
  bgIntensity  = Math.min(score / 32, 1);
  corruptLevel = Math.max(0, (score - 25) / 30);
}

function updateLives() {
  lifeEls.forEach((el, i) => el.classList.toggle('lost', i >= lives));
}

function updateStreak() {
  const pct = Math.min(streak / STREAK_BONUS_AT, 1) * 100;
  stkFill.style.width = pct + '%';
  stkVal.textContent  = streak;
  const hot = streak >= STREAK_BONUS_AT;
  stkFill.classList.toggle('hot', hot);
  stkVal.classList.toggle('hot', hot);
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
    }, 150);
  } else {
    instEl.textContent = inst.text;
    instEl.className   = 'inst ' + inst.col + ' ' + anim;
  }
}

function clearAllTimers() {
  cancelAnimationFrame(timerRAF);
  clearTimeout(waitTO); clearTimeout(switchTO);
  clearTimeout(holdTO); clearTimeout(tauntTO);
  cancelAnimationFrame(holdRAF);
  stopHB();
  holdRingEl.classList.remove('show');
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

  let inst = pick(INSTS, prevInst);
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
  if (score > bestScore) bestScore = score;
  localStorage.setItem('pb_best', bestScore);
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
  streak++; updateStreak(); if (streak > 1) showCombo(streak);

  const mult   = multOverride !== undefined ? multOverride : calcMult();
  const earned = Math.max(1, mult);
  score += earned;
  if (score > bestScore) bestScore = score;
  localStorage.setItem('pb_best', bestScore);
  updateScoreUI();

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

// Tap / release — touchend (primary handler)
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
  if (t === 'dblclick') {
    dblGuard = true;
    setTimeout(() => { if (!roundEnded && dblGuard) { dblGuard = false; handleWrong(); } }, 320);
    return;
  }
  t === 'click' ? doCorrect(e.changedTouches[0] || e) : handleWrong();
}, { passive: false });

// Double-tap detector (capture phase)
let lastTapTime = 0;
pb.addEventListener('touchend', (e) => {
  if (!gameActive || roundEnded || !curInst || curInst.type !== 'dblclick') return;
  const now = Date.now();
  if (now - lastTapTime < 320) {
    dblGuard = false; doCorrect(e.changedTouches[0] || e); lastTapTime = 0;
  } else {
    lastTapTime = now;
  }
}, { passive: false, capture: true });

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

  const isNew = score > 0 && score >= bestScore;
  if (score > bestScore) { bestScore = score; localStorage.setItem('pb_best', bestScore); }

  goScore.textContent = score;
  goBest.textContent  = bestScore;
  goMsg.textContent   = rand(FAIL_MSGS);
  goRank.textContent  = getRank(score);
  goDied.textContent  = 'Died on: ' + (curInst ? curInst.text : '???');
  goNB.className      = isNew ? 'new-best-badge' : 'new-best-badge hidden';
  scrGO.classList.remove('off');
}

// ══════════════════════════════════════
//  START GAME
// ══════════════════════════════════════
function startGame() {
  getAC();
  INSTS        = isMobile ? INSTS_MOBILE   : INSTS_DESKTOP;
  FRENZY_INSTS = isMobile ? FRENZY_MOBILE  : FRENZY_DESKTOP;

  score = 0; lives = 3; streak = 0; roundN = 0;
  prevInst = null; specialRound = null; isFrenzy = false;
  bgIntensity = 0; corruptLevel = 0; ekgPanic = 0;

  gameActive = true;
  updateScoreUI(); updateLives(); updateStreak();
  scrStart.classList.add('off'); scrGO.classList.add('off');
  tbarEl.style.width = '100%'; tbarEl.className = 'timer-bar';
  frRing.classList.remove('on'); chromaOff(); tauntEl.textContent = '';
  startRound();
}

// ══════════════════════════════════════
//  EVENT LISTENERS
// ══════════════════════════════════════

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
fillTips();
updateScoreUI();
bestSval.textContent = bestScore;
hsNum.textContent    = bestScore;
updateLives();
