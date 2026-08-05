/* app.js — 训练器逻辑（数据 / 池生成 / 鼓机 / 会话）。
   依赖：先加载 i18n.js（提供 loadJSON、I18n）与 svg/chordRenderer.js */

'use strict';

/* ---------- 内嵌数据回退（file:// 下 fetch 会被 CORS 拦截） ---------- */

var OPEN_CHORD_FALLBACK = {
  chords: [
    { name: "C",     shape: "Open", frets: [-1, 3, 2, 0, 1, 0], fingers: [0, 3, 2, 0, 1, 0] },
    { name: "Cadd9", shape: "Open", frets: [-1, 3, 2, 0, 3, 3], fingers: [0, 2, 1, 0, 3, 4] },
    { name: "A",     shape: "Open", frets: [0, 0, 2, 2, 2, 0],   fingers: [0, 0, 1, 2, 3, 0] },
    { name: "Am",    shape: "Open", frets: [-1, 0, 2, 2, 1, 0],  fingers: [0, 0, 2, 3, 1, 0] },
    { name: "A7",    shape: "Open", frets: [-1, 0, 2, 0, 2, 0],  fingers: [0, 0, 1, 0, 2, 0] },
    { name: "Asus2", shape: "Open", frets: [-1, 0, 2, 2, 0, 0],  fingers: [0, 0, 2, 3, 0, 0] },
    { name: "D",     shape: "Open", frets: [-1, -1, 0, 2, 3, 2], fingers: [0, 0, 0, 1, 3, 2] },
    { name: "Dm",    shape: "Open", frets: [-1, -1, 0, 2, 3, 1], fingers: [0, 0, 0, 2, 3, 1] },
    { name: "D7",    shape: "Open", frets: [-1, -1, 0, 2, 1, 2], fingers: [0, 0, 0, 3, 1, 2] },
    { name: "Dsus2", shape: "Open", frets: [-1, -1, 0, 2, 3, 0], fingers: [0, 0, 0, 1, 2, 0] },
    { name: "E",     shape: "Open", frets: [0, 2, 2, 1, 0, 0],   fingers: [0, 2, 3, 1, 0, 0] },
    { name: "Em",    shape: "Open", frets: [0, 2, 2, 0, 0, 0],   fingers: [0, 2, 3, 0, 0, 0] },
    { name: "E7",    shape: "Open", frets: [0, 2, 0, 1, 0, 0],   fingers: [0, 2, 0, 1, 0, 0] },
    { name: "Em7",   shape: "Open", frets: [0, 2, 0, 0, 0, 0],   fingers: [0, 2, 0, 0, 0, 0] },
    { name: "G",     shape: "Open", frets: [3, 2, 0, 0, 0, 3],   fingers: [2, 1, 0, 0, 0, 3] },
    { name: "G7",    shape: "Open", frets: [3, 2, 0, 0, 0, 1],   fingers: [2, 1, 0, 0, 0, 3] },
    { name: "F",     shape: "Open", frets: [1, 3, 3, 2, 1, 1],   fingers: [1, 3, 4, 2, 1, 1] },
    { name: "Fmaj7", shape: "Open", frets: [-1, 3, 2, 2, 1, 0],  fingers: [0, 3, 2, 4, 1, 0] },
    { name: "B7",    shape: "Open", frets: [-1, 2, 1, 2, 0, 2],  fingers: [0, 2, 1, 3, 0, 4] },
    { name: "Bm",    shape: "Open", frets: [-1, 2, 4, 4, 3, 2],  fingers: [0, 1, 3, 4, 2, 1] }
  ]
};

var CAGED_FALLBACK = {
  shapes: [
    { id: "E",   quality: "Major", rootString: 6, barre: { from: 6, to: 1 }, template: [0, 2, 2, 1, 0, 0] },
    { id: "A",   quality: "Major", rootString: 5, barre: { from: 5, to: 1 }, template: [-1, 0, 2, 2, 2, 0] },
    { id: "D",   quality: "Major", rootString: 4, barre: { from: 4, to: 1 }, template: [-1, -1, 0, 2, 3, 2] },
    { id: "C",   quality: "Major", rootString: 5, template: [-1, 0, -1, -3, -2, -3] },
    { id: "G",   quality: "Major", rootString: 6, template: [0, -1, -3, -3, -3, 0] },

    { id: "Em",  quality: "Minor", rootString: 6, barre: { from: 6, to: 1 }, template: [0, 2, 2, 0, 0, 0] },
    { id: "Am",  quality: "Minor", rootString: 5, barre: { from: 5, to: 1 }, template: [-1, 0, 2, 2, 1, 0] },
    { id: "Dm",  quality: "Minor", rootString: 4, barre: { from: 4, to: 1 }, template: [-1, -1, 0, 2, 3, 1] },

    { id: "Em7", quality: "m7", rootString: 6, barre: { from: 6, to: 1 }, template: [0, 2, 0, 0, 0, 0] },
    { id: "Am7", quality: "m7", rootString: 5, barre: { from: 5, to: 1 }, template: [-1, 0, 2, 0, 1, 0] },
    { id: "Dm7", quality: "m7", rootString: 4, barre: { from: 4, to: 1 }, template: [-1, -1, 0, 2, 1, 1] },

    { id: "Emaj7", quality: "Maj7", rootString: 6, barre: { from: 6, to: 1 }, template: [0, 2, 1, 1, 0, 0] },
    { id: "Amaj7", quality: "Maj7", rootString: 5, barre: { from: 5, to: 1 }, template: [-1, 0, 2, 1, 2, 0] },
    { id: "Dmaj7", quality: "Maj7", rootString: 4, barre: { from: 4, to: 1 }, template: [-1, -1, 0, 2, 2, 2] },
    { id: "Cmaj7", quality: "Maj7", rootString: 5, template: [-1, 0, -1, -3, -3, -3] },
    { id: "Gmaj7", quality: "Maj7", rootString: 6, template: [0, -1, -3, -3, -3, -1] },

    { id: "E7",  quality: "7", rootString: 6, barre: { from: 6, to: 1 }, template: [0, 2, 0, 1, 0, 0] },
    { id: "A7",  quality: "7", rootString: 5, barre: { from: 5, to: 1 }, template: [-1, 0, 2, 0, 2, 0] },
    { id: "D7",  quality: "7", rootString: 4, barre: { from: 4, to: 1 }, template: [-1, -1, 0, 2, 1, 2] },
    { id: "C7",  quality: "7", rootString: 5, template: [-1, 0, -1, 0, -2, -3] },
    { id: "G7",  quality: "7", rootString: 6, template: [0, -1, -3, -3, -3, -2] },

    { id: "E5",  quality: "5", rootString: 6, template: [0, 2, 2, -1, -1, -1] },
    { id: "A5",  quality: "5", rootString: 5, template: [-1, 0, 2, 2, -1, -1] },
    { id: "D5",  quality: "5", rootString: 4, template: [-1, -1, 0, 2, 3, -1] }
  ]
};

/* ---------- 小工具 ---------- */

function randInt(n) { return Math.floor(Math.random() * n); }

function shuffle(arr) {
  for (var i = arr.length - 1; i > 0; i--) {
    var j = randInt(i + 1);
    var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
  }
  return arr;
}

/* ---------- CAGED 移调 ---------- */

var NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
// 空弦音（吉他弦号 6..1 → 半音，C=0）
var OPEN_STRING_NOTE = { 6: 4, 5: 9, 4: 2, 3: 7, 2: 11, 1: 4 };

// 保证所有非闷音绝对品位 ∈ [1,12] 的 rootFret 范围
function rootFretRange(shape) {
  var lo = 1, hi = 12;
  for (var i = 0; i < shape.template.length; i++) {
    var v = shape.template[i];
    if (v === -1) continue;
    lo = Math.max(lo, 1 - v);
    hi = Math.min(hi, 12 - v);
  }
  return lo <= hi ? { lo: lo, hi: hi } : null;
}

var QUALITIES = ['Major', 'Minor', 'm7', 'Maj7', '7', '5'];

// 和弦名后缀：Major 用全称（随语言变化），其余用通用符号
function qualitySuffix(q) {
  if (q === 'Major') return ' ' + I18n.t('chord.majorSuffix');
  if (q === 'Minor') return 'm';
  return q; // m7 / Maj7 / 7 / 5
}

function transposeShape(shape, rootFret) {
  var frets = shape.template.map(function (v) { return v === -1 ? -1 : v + rootFret; });
  var note = (OPEN_STRING_NOTE[shape.rootString] + rootFret) % 12;
  return {
    chord: NOTE_NAMES[note],
    quality: shape.quality,
    shape: shape.id,
    rootString: shape.rootString,
    rootFret: rootFret,
    frets: frets,
    barre: shape.barre || null,
    key: NOTE_NAMES[note] + '|' + shape.quality + '|' + shape.id + '|' + rootFret
  };
}

/* ---------- 训练池 ---------- */

function makePool(settings, openData, cagedData) {
  if (settings.mode === 'open') {
    return shuffle(openData.chords.slice(0))
      .slice(0, settings.chordCount)
      .map(function (c) { c.key = c.name; return c; });
  }

  var seen = {}, pool = [], guard = 0;
  while (pool.length < settings.chordCount && guard++ < 500) {
    var quality = QUALITIES[randInt(QUALITIES.length)];
    var candidates = cagedData.shapes.filter(function (s) { return s.quality === quality; });
    if (!candidates.length) continue;
    var shape = candidates[randInt(candidates.length)];
    var range = rootFretRange(shape);
    if (!range) continue;
    var rootFret = range.lo + randInt(range.hi - range.lo + 1);
    var c = transposeShape(shape, rootFret);
    if (seen[c.key]) continue;
    seen[c.key] = true;
    pool.push(c);
  }
  return pool;
}

function pickNext(pool, current) {
  var others = pool.filter(function (c) { return c.key !== current.key; });
  if (!others.length) return current;
  return others[randInt(others.length)];
}

/* ---------- 鼓机（Web Audio 合成） ---------- */

var DrumMachine = {
  ctx: null, master: null, noiseBuf: null, timer: null,
  nextTime: 0, step: 0, bpm: 120, running: false, onBar: null,

  start: function (bpm, onBar) {
    if (!this.ctx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AC();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    if (!this.master) {
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.85;
      this.master.connect(this.ctx.destination);
    }
    this.ensureNoise();
    this.bpm = bpm;
    this.onBar = onBar;
    if (!this.running) {
      this.step = 0;
      this.nextTime = this.ctx.currentTime + 0.06;
      this.running = true;
    }
    if (this.timer) clearInterval(this.timer);
    var self = this;
    this.timer = setInterval(function () { self.tick(); }, 25);
  },

  stop: function () {
    this.running = false;
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  },

  tick: function () {
    var spb = 60 / this.bpm / 4; // 每个 16 分音符的秒数
    while (this.nextTime < this.ctx.currentTime + 0.10) {
      this.scheduleStep(this.step, this.nextTime);
      this.nextTime += spb;
      this.step = (this.step + 1) % 16;
      if (this.step === 0 && this.onBar) this.onBar();
    }
  },

  scheduleStep: function (s, t) {
    if (s === 0 || s === 8) this.kick(t);
    if (s === 4 || s === 12) this.snare(t);
    if (s % 2 === 0) this.hat(t, s === 0 || s === 4 || s === 8 || s === 12);
  },

  ensureNoise: function () {
    if (this.noiseBuf) return;
    var len = this.ctx.sampleRate * 2;
    var buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.noiseBuf = buf;
  },

  kick: function (t) {
    var o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(150, t);
    o.frequency.exponentialRampToValueAtTime(50, t + 0.10);
    g.gain.setValueAtTime(1.0, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    o.connect(g); g.connect(this.master);
    o.start(t); o.stop(t + 0.30);
  },

  snare: function (t) {
    var s = this.ctx.createBufferSource(), bp = this.ctx.createBiquadFilter(), g = this.ctx.createGain();
    s.buffer = this.noiseBuf;
    bp.type = 'bandpass'; bp.frequency.value = 1800; bp.Q.value = 1;
    g.gain.setValueAtTime(0.9, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    s.connect(bp); bp.connect(g); g.connect(this.master);
    s.start(t); s.stop(t + 0.20);
  },

  hat: function (t, acc) {
    var s = this.ctx.createBufferSource(), hp = this.ctx.createBiquadFilter(), g = this.ctx.createGain();
    s.buffer = this.noiseBuf;
    hp.type = 'highpass'; hp.frequency.value = 7000;
    g.gain.setValueAtTime(acc ? 0.4 : 0.25, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + (acc ? 0.08 : 0.05));
    s.connect(hp); hp.connect(g); g.connect(this.master);
    s.start(t); s.stop(t + 0.10);
  }
};

/* ---------- 会话 ---------- */

var Session = {
  settings: { mode: 'open', chordCount: 4, bpm: 80, measuresPerChord: 1, durationMin: 5 },
  openData: null, cagedData: null,
  pool: [], current: null, next: null,
  barCount: 0,
  startedAt: 0, pausedTotal: 0, pausedAt: 0, ticker: null,
  running: false, paused: false, done: false,

  start: function () {
    this.readSettings();
    var pool = makePool(this.settings, this.openData, this.cagedData);
    if (!pool.length) { alert(I18n.t('error.emptyPool')); return; }
    this.pool = pool;
    this.current = pool[0];
    this.next = pickNext(pool, this.current);
    this.barCount = 0;
    this.startedAt = performance.now();
    this.pausedTotal = 0;
    this.done = false;
    this.running = true;
    this.paused = false;

    this.renderTraining();
    this.showScreen('training');
    this.setPauseLabel('train.pause');
    document.getElementById('done-banner').classList.add('hidden');
    document.getElementById('btn-pause').classList.remove('hidden');

    DrumMachine.start(this.settings.bpm, function () { Session.onBar(); });
    this.ticker = setInterval(function () { Session.tick(); }, 200);
  },

  onBar: function () {
    if (!this.running || this.paused || this.done) return;
    this.barCount++;
    var m = this.settings.measuresPerChord;
    if (this.barCount > 1 && (this.barCount - 1) % m === 0) this.advanceChord();
  },

  advanceChord: function () {
    this.current = this.next;
    this.next = pickNext(this.pool, this.current);
    this.renderTraining();
  },

  tick: function () {
    if (this.done) return;
    var total = this.settings.durationMin * 60000;
    var elapsed = performance.now() - this.startedAt - this.pausedTotal;
    var remaining = total - elapsed;
    if (remaining <= 0) { this.renderTime(0); this.finish(); return; }
    this.renderTime(remaining);
  },

  togglePause: function () {
    if (this.done) return;
    if (!this.paused) {
      this.paused = true;
      this.pausedAt = performance.now();
      DrumMachine.stop();
      clearInterval(this.ticker);
      this.ticker = null;
      this.setPauseLabel('train.resume');
    } else {
      this.pausedTotal += performance.now() - this.pausedAt;
      this.paused = false;
      this.barCount = 0; // 鼓机相位重置到小节起点，重记小节数
      DrumMachine.start(this.settings.bpm, function () { Session.onBar(); });
      this.ticker = setInterval(function () { Session.tick(); }, 200);
      this.setPauseLabel('train.pause');
    }
  },

  finish: function () {
    this.running = false;
    this.done = true;
    DrumMachine.stop();
    if (this.ticker) clearInterval(this.ticker);
    this.ticker = null;
    document.getElementById('btn-pause').classList.add('hidden');
    document.getElementById('done-banner').classList.remove('hidden');
  },

  stop: function () {
    this.running = false;
    this.done = false;
    DrumMachine.stop();
    if (this.ticker) clearInterval(this.ticker);
    this.ticker = null;
    this.paused = false;
    this.showScreen('settings');
  },

  readSettings: function () {
    var mode = document.querySelector('input[name="mode"]:checked').value;
    var measures = parseInt(document.querySelector('input[name="measures"]:checked').value, 10);
    var duration = parseInt(document.querySelector('input[name="duration"]:checked').value, 10);
    this.settings = {
      mode: mode,
      chordCount: parseInt(document.getElementById('chord-count').value, 10),
      bpm: parseInt(document.getElementById('bpm').value, 10),
      measuresPerChord: measures,
      durationMin: duration
    };
  },

  chordDisplay: function (c) {
    if (c.quality) {
      return {
        name: c.chord + qualitySuffix(c.quality),
        shape: c.quality === '5' ? I18n.t('chord.power') : c.shape + ' ' + I18n.t('chord.shapeSuffix'),
        frets: c.frets,
        rootString: c.rootString,
        barre: c.barre,
        rootFret: c.rootFret
      };
    }
    return { name: c.name, shape: '', frets: c.frets, fingers: c.fingers };
  },

  renderTraining: function () {
    var label = document.getElementById('train-mode-label');
    label.textContent = this.settings.mode === 'open' ? 'Open Chords' : 'CAGED';

    this.renderChord('current', this.current);
    this.renderChord('next', this.next);
    this.renderTime(this.settings.durationMin * 60000);
  },

  renderChord: function (which, c) {
    var d = this.chordDisplay(c);
    document.getElementById(which + '-name').textContent = d.name;
    document.getElementById(which + '-shape').textContent = d.shape;
    document.getElementById(which + '-diagram').innerHTML =
      window.chordRenderer.render({ name: d.name, frets: d.frets, fingers: d.fingers, rootString: d.rootString, barre: d.barre, rootFret: d.rootFret });
  },

  renderTime: function (ms) {
    var total = Math.max(0, Math.round(ms / 1000));
    var m = Math.floor(total / 60);
    var s = total % 60;
    document.getElementById('remaining-time').textContent =
      (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  },

  setPauseLabel: function (key) {
    document.getElementById('btn-pause').textContent = I18n.t(key);
  },

  showScreen: function (name) {
    document.getElementById('settings-screen').classList.toggle('active', name === 'settings');
    document.getElementById('training-screen').classList.toggle('active', name === 'training');
  }
};

/* ---------- 事件绑定 ---------- */

function bindSettings() {
  var count = document.getElementById('chord-count');
  var bpm = document.getElementById('bpm');
  var countVal = document.getElementById('chord-count-val');
  var bpmVal = document.getElementById('bpm-val');

  function syncCount() { countVal.textContent = count.value; }
  function syncBpm() { bpmVal.textContent = bpm.value; }

  count.addEventListener('input', syncCount);
  bpm.addEventListener('input', syncBpm);
}

function bindActions() {
  document.getElementById('btn-start').addEventListener('click', function () { Session.start(); });
  document.getElementById('btn-stop').addEventListener('click', function () { Session.stop(); });
  document.getElementById('btn-pause').addEventListener('click', function () { Session.togglePause(); });
  document.getElementById('btn-done-return').addEventListener('click', function () { Session.stop(); });
}

/* ---------- 启动 ---------- */

I18n.load(I18n.initialLocale())
  .then(function () {
    I18n.apply();
    I18n.initSwitcher('lang-select', function () {
      if (Session.running && !Session.done) {
        Session.renderTraining();
        Session.setPauseLabel(Session.paused ? 'train.resume' : 'train.pause');
      }
    });
    return Promise.all([
      loadJSON('data/open_chords.json', OPEN_CHORD_FALLBACK),
      loadJSON('data/caged.json', CAGED_FALLBACK)
    ]);
  })
  .then(function (results) {
    Session.openData = results[0];
    Session.cagedData = results[1];
    bindSettings();
    bindActions();
  });
