// Ses: tarayıcının ses motoruyla (Web Audio) üretilen efektler ve hafif arka plan müziği. Ses dosyası gerekmez.
(function (root) {
  'use strict';
  const OG = root.OG;
  const PREFS_KEY = 'optimizeGun.prefs';

  // Oyuncu tercihleri
  OG.prefs = { sfx: true, music: false, forecast: true, speed: 1 };
  try { Object.assign(OG.prefs, JSON.parse(localStorage.getItem(PREFS_KEY)) || {}); } catch (e) { /* varsayılanlar */ }
  OG.savePrefs = function () {
    try { localStorage.setItem(PREFS_KEY, JSON.stringify(OG.prefs)); } catch (e) { /* yoksay */ }
  };

  let ctx = null;
  let master = null;
  function ensure() {
    if (!ctx) {
      const AC = root.AudioContext || root.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.5;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  OG.audioUnlock = ensure;

  function tone(freq, dur, { type = 'sine', vol = 0.3, at = 0, slide = 0, attack = 0.005 } = {}) {
    const c = ensure();
    if (!c) return;
    const t = c.currentTime + at;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq * slide), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(master);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  function noise(dur, { vol = 0.2, at = 0, freq = 1200 } = {}) {
    const c = ensure();
    if (!c) return;
    const t = c.currentTime + at;
    const buf = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const src = c.createBufferSource();
    src.buffer = buf;
    const f = c.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = freq;
    const g = c.createGain();
    g.gain.value = vol;
    src.connect(f).connect(g).connect(master);
    src.start(t);
  }

  const SFX = {
    click: () => tone(660, 0.05, { type: 'square', vol: 0.05 }),
    select: () => tone(880, 0.07, { type: 'triangle', vol: 0.15, slide: 1.3 }),
    place: () => { tone(520, 0.09, { type: 'triangle', vol: 0.25, slide: 1.6 }); tone(880, 0.1, { vol: 0.12, at: 0.05 }); },
    remove: () => tone(440, 0.15, { type: 'triangle', vol: 0.18, slide: 0.5 }),
    error: () => { tone(190, 0.1, { type: 'square', vol: 0.08 }); tone(150, 0.14, { type: 'square', vol: 0.08, at: 0.09 }); },
    shuffle: () => { noise(0.12, { vol: 0.25, freq: 3000 }); noise(0.12, { vol: 0.25, freq: 2500, at: 0.1 }); noise(0.12, { vol: 0.25, freq: 3500, at: 0.2 }); },
    coin: (pts = 20) => {
      const base = 660 + Math.min(pts, 80) * 6;
      tone(base, 0.07, { type: 'square', vol: 0.07 });
      tone(base * 1.5, 0.18, { type: 'square', vol: 0.07, at: 0.06 });
    },
    fail: () => tone(320, 0.4, { type: 'sawtooth', vol: 0.09, slide: 0.4 }),
    cancel: () => { noise(0.1, { vol: 0.2, freq: 500 }); tone(260, 0.2, { type: 'triangle', vol: 0.12, slide: 0.6 }); },
    event: () => [784, 988, 1175, 1568].forEach((f, i) => tone(f, 0.28, { vol: 0.14, at: i * 0.07 })),
    rare: () => [1046, 1318, 1568, 2093, 1568, 2093].forEach((f, i) => tone(f, 0.3, { type: 'triangle', vol: 0.12, at: i * 0.07 })),
    star: (i = 0) => { tone([1046, 1318, 1568][i] || 1568, 0.35, { type: 'triangle', vol: 0.18 }); tone(([1046, 1318, 1568][i] || 1568) * 2, 0.2, { vol: 0.06, at: 0.02 }); },
    fanfare: () => [523, 659, 784, 1046, 784, 1046].forEach((f, i) => tone(f, i === 5 ? 0.6 : 0.2, { type: 'triangle', vol: 0.18, at: i * 0.11 })),
    sad: () => [392, 349, 311].forEach((f, i) => tone(f, 0.35, { type: 'triangle', vol: 0.12, at: i * 0.2 })),
    sleep: () => [659, 523, 392].forEach((f, i) => tone(f, 0.45, { vol: 0.12, at: i * 0.2 })),
    start: () => [523, 784].forEach((f, i) => tone(f, 0.18, { type: 'triangle', vol: 0.16, at: i * 0.1 })),
    unlock: () => [784, 1046, 1318, 1568].forEach((f, i) => tone(f, 0.22, { type: 'square', vol: 0.06, at: i * 0.06 })),
  };
  OG.sfx = function (name, arg) {
    if (!OG.prefs.sfx || !SFX[name]) return;
    try { SFX[name](arg); } catch (e) { /* ses kullanılamıyor */ }
  };

  // ---------- Müzik: yavaş akorlar + seyrek pentatonik melodi ----------
  const CHORDS = [[261.6, 329.6, 392], [220, 261.6, 329.6], [174.6, 220, 261.6], [196, 246.9, 293.7]];
  const MELODY = [523.3, 587.3, 659.3, 784, 880, 1046.5];
  let bar = 0;
  let timer = null;
  function playBar() {
    if (!ensure()) return;
    const ch = CHORDS[bar % CHORDS.length];
    tone(ch[0] / 2, 2.4, { vol: 0.05, attack: 0.08 });
    ch.forEach((f) => tone(f, 2.4, { vol: 0.025, attack: 0.5 }));
    for (let k = 0; k < 2; k++) {
      if (Math.random() < 0.7) tone(MELODY[Math.floor(Math.random() * MELODY.length)], 0.6, { type: 'triangle', vol: 0.02, at: 0.3 + k * 0.9 + Math.random() * 0.3, attack: 0.02 });
    }
    bar++;
  }
  OG.music = {
    start() {
      if (timer || !OG.prefs.music) return;
      playBar();
      timer = setInterval(playBar, 2200);
    },
    stop() {
      clearInterval(timer);
      timer = null;
    },
  };
})(window);
