// ===== 音(BGM と効果音はすべて Web Audio で合成。外部の音ファイルは使わない) =====
(function (root) {
  'use strict';
  let ac = null, master = null, bgmBus = null, seBus = null, noiseBuf = null;
  const vol = { bgm: 0.7, se: 0.8 };
  try {
    const v = JSON.parse(localStorage.getItem('pq2_vol') || 'null');
    if (v) { vol.bgm = +v.bgm; vol.se = +v.se; }
  } catch (e) {}

  function init() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
    master = ac.createGain(); master.gain.value = 0.9;
    const comp = ac.createDynamicsCompressor(); comp.threshold.value = -12; comp.ratio.value = 4;
    master.connect(comp); comp.connect(ac.destination);
    bgmBus = ac.createGain(); bgmBus.gain.value = vol.bgm * 0.55; bgmBus.connect(master);
    seBus = ac.createGain(); seBus.gain.value = vol.se; seBus.connect(master);
    noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    if (want) { const w = want; want = null; playBgm(w); }
  }
  function setVol(kind, v) {
    vol[kind] = v;
    try { localStorage.setItem('pq2_vol', JSON.stringify(vol)); } catch (e) {}
    if (kind === 'bgm' && bgmBus) bgmBus.gain.value = v * 0.55;
    if (kind === 'se' && seBus) seBus.gain.value = v;
  }
  document.addEventListener('visibilitychange', () => { if (ac) document.hidden ? ac.suspend() : ac.resume(); });

  // ---------- 音符 ----------
  const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  function freq(n) {
    const m = /^([A-G])([#b]?)(\d)$/.exec(n); if (!m) return 0;
    const semi = NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (+m[3] + 1) * 12;
    return 440 * Math.pow(2, (semi - 69) / 12);
  }

  // 1音を鳴らす
  function tone(out, t, f, dur, type, v, opt = {}) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (opt.slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, opt.slide), t + dur);
    if (opt.vib) { const l = ac.createOscillator(), lg = ac.createGain(); l.frequency.value = opt.vib; lg.gain.value = f * 0.03; l.connect(lg); lg.connect(o.frequency); l.start(t); l.stop(t + dur + 0.05); }
    const a = opt.a ?? 0.005, rel = opt.rel ?? 0.06;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + a);
    if (opt.sus === false) g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    else { g.gain.setValueAtTime(v, t + Math.max(a, dur - rel)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); }
    o.connect(g); g.connect(out); o.start(t); o.stop(t + dur + 0.02);
  }
  function noise(out, t, dur, v, filt = 3000, type = 'bandpass', slide) {
    const s = ac.createBufferSource(), g = ac.createGain(), f = ac.createBiquadFilter();
    s.buffer = noiseBuf; f.type = type; f.frequency.setValueAtTime(filt, t);
    if (slide) f.frequency.exponentialRampToValueAtTime(slide, t + dur);
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(out); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
  }

  // ---------- BGM ----------
  // 1トークン = 8分音符。'-' はのばす、'.' は休み。ドラムは k(キック) s(スネア) h(ハイハット)
  const bars = (...b) => b.join(' ');
  const SONGS = {
    title: { bpm: 132, tracks: [
      { type: 'square', v: 0.11, n: bars('E5 - G5 - C6 - B5 A5', 'G5 - E5 - D5 - - -', 'F5 - A5 - D6 - C6 B5', 'A5 - G5 - E5 - - -', 'E5 - G5 - C6 - D6 E6', 'D6 - C6 - A5 - G5 -', 'F5 E5 D5 - G5 - B4 -', 'C5 - - - . . . .') },
      { type: 'square', v: 0.04, n: bars('C5 E5 G5 E5 C5 E5 G5 E5', 'B4 D5 G5 D5 B4 D5 G5 D5', 'A4 C5 F5 C5 A4 C5 F5 C5', 'G4 C5 E5 C5 G4 C5 E5 C5', 'A4 C5 E5 C5 A4 C5 E5 C5', 'F4 A4 C5 A4 F4 A4 C5 A4', 'G4 B4 D5 B4 G4 B4 D5 B4', 'C5 E5 G5 E5 C5 . . .') },
      { type: 'triangle', v: 0.32, n: bars('C3 . C3 . G2 . C3 .', 'G2 . G2 . D3 . G2 .', 'F2 . F3 . F2 . F3 .', 'C3 . C3 . E3 . C3 .', 'A2 . A3 . A2 . A3 .', 'F2 . F3 . F2 . F3 .', 'G2 . G3 . G2 . G3 .', 'C3 . G2 . C3 . . .') },
      { drum: true, v: 0.5, n: 'k . h . s . h . k . h k s . h h' },
    ] },
    map: { bpm: 112, tracks: [
      { type: 'square', v: 0.1, n: bars('G4 - B4 - D5 - B4 -', 'C5 - E5 - D5 - - -', 'B4 - G4 - A4 - B4 -', 'A4 - - - . . . .', 'G4 - B4 - D5 - G5 -', 'E5 - D5 - C5 - B4 -', 'A4 - C5 - B4 - A4 -', 'G4 - - - . . . .') },
      { type: 'triangle', v: 0.3, n: bars('G2 . D3 . G2 . D3 .', 'C3 . G3 . D3 . A2 .', 'G2 . D3 . E2 . B2 .', 'D2 . A2 . D2 . F#2 .', 'G2 . D3 . G2 . D3 .', 'C3 . G2 . C3 . G2 .', 'D3 . A2 . D3 . A2 .', 'G2 . D3 . G2 . . .') },
      { drum: true, v: 0.4, n: 'k . h h s . h . k . h h s . h h' },
    ] },
    puzzle: { bpm: 96, tracks: [
      { type: 'square', v: 0.075, duty: true, n: bars('A4 - - C5 - - D5 -', 'C5 - A4 - G4 - - -', 'F4 - - A4 - - C5 -', 'D5 - - - - - . .', 'A4 - - C5 - - F5 -', 'E5 - D5 - C5 - - -', 'D5 - C5 - A4 - G4 -', 'F4 - - - - - . .') },
      { type: 'triangle', v: 0.1, n: bars('F4 A4 C5 A4 F4 A4 C5 A4', 'E4 G4 C5 G4 E4 G4 C5 G4', 'D4 F4 A4 F4 D4 F4 A4 F4', 'G4 Bb4 D5 Bb4 G4 Bb4 D5 Bb4', 'F4 A4 C5 A4 F4 A4 C5 A4', 'A4 C5 E5 C5 A4 C5 E5 C5', 'Bb4 D5 F5 D5 Bb4 D5 F5 D5', 'C5 E5 G5 E5 C5 . . .') },
      { type: 'triangle', v: 0.3, n: bars('F2 . . F3 . . C3 .', 'C3 . . C3 . . G2 .', 'D2 . . D3 . . A2 .', 'G2 . . G3 . . D3 .', 'F2 . . F3 . . C3 .', 'A2 . . A3 . . E3 .', 'Bb2 . . Bb3 . . F3 .', 'C3 . . C3 . . . .') },
      { drum: true, v: 0.25, n: 'k . . h . . h . k . . h s . h .' },
    ] },
    bonus: { bpm: 150, tracks: [
      { type: 'square', v: 0.09, n: bars('C5 E5 G5 C6 G5 E5 C5 E5', 'D5 F5 A5 D6 A5 F5 D5 F5', 'E5 G5 B5 E6 B5 G5 E5 G5', 'F5 A5 C6 F6 C6 A5 G5 -', 'C6 - G5 - E5 - G5 -', 'A5 - F5 - D5 - F5 -', 'G5 - E5 - D5 - B4 -', 'C5 - E5 - C5 - . .') },
      { type: 'triangle', v: 0.32, n: bars('C3 . C3 . G2 . C3 .', 'D3 . D3 . A2 . D3 .', 'E3 . E3 . B2 . E3 .', 'F3 . F3 . G3 . G3 .', 'C3 . C3 . G2 . C3 .', 'F3 . F3 . C3 . F3 .', 'G3 . G3 . D3 . G2 .', 'C3 . G2 . C3 . . .') },
      { drum: true, v: 0.5, n: 'k h s h k h s h k h s h k k s h' },
    ] },
    tower: { bpm: 100, tracks: [
      { type: 'square', v: 0.085, n: bars('A4 - - - C5 - B4 -', 'A4 - E4 - - - - -', 'F4 - - - A4 - G#4 -', 'E4 - - - - - - -', 'A4 - B4 - C5 - D5 -', 'E5 - - - D5 - C5 -', 'B4 - G#4 - E4 - B4 -', 'A4 - - - - - . .') },
      { type: 'triangle', v: 0.09, n: bars('E5 . A4 . E5 . A4 .', 'E5 . A4 . E5 . A4 .', 'C5 . F4 . C5 . F4 .', 'B4 . E4 . B4 . G#4 .', 'E5 . A4 . E5 . A4 .', 'G5 . C5 . G5 . C5 .', 'B4 . E4 . B4 . G#4 .', 'A4 . E4 . A4 . . .') },
      { type: 'triangle', v: 0.32, n: bars('A2 . E3 . A2 . E3 .', 'A2 . E3 . A2 . E3 .', 'F2 . C3 . F2 . C3 .', 'E2 . B2 . E2 . G#2 .', 'A2 . E3 . A2 . E3 .', 'C3 . G3 . C3 . G3 .', 'E2 . B2 . E2 . G#2 .', 'A2 . E3 . A2 . . .') },
      { drum: true, v: 0.35, n: 'k . . . s . . h k . k . s . h h' },
    ] },
  };
  let cur = null, curName = null, want = null, timer = null;
  function playBgm(name) {
    if (curName === name && cur) return;
    stopBgm();
    if (!ac) { want = name; return; }
    const song = SONGS[name]; if (!song) return;
    const out = ac.createGain(); out.gain.value = 0.0001; out.connect(bgmBus);
    out.gain.exponentialRampToValueAtTime(1, ac.currentTime + 0.4);
    const tracks = song.tracks.map(tr => ({ ...tr, toks: tr.n.split(/\s+/) }));
    const st = 60 / song.bpm / 2;
    cur = { out, tracks, st, step: 0, next: ac.currentTime + 0.08 };
    curName = name;
    timer = setInterval(sched, 25); sched();
  }
  function sched() {
    if (!cur || !ac) return;
    while (cur.next < ac.currentTime + 0.15) {
      const t = cur.next;
      for (const tr of cur.tracks) {
        const tok = tr.toks[cur.step % tr.toks.length];
        if (tr.drum) {
          if (tok === 'k') { tone(cur.out, t, 150, 0.12, 'sine', tr.v * 1.4, { slide: 45, sus: false }); }
          else if (tok === 's') noise(cur.out, t, 0.12, tr.v * 0.5, 1800);
          else if (tok === 'h') noise(cur.out, t, 0.04, tr.v * 0.25, 8000, 'highpass');
          continue;
        }
        if (tok === '.' || tok === '-') continue;
        let len = 1; while (tr.toks[(cur.step + len) % tr.toks.length] === '-' && len < 16) len++;
        const f = freq(tok);
        if (f) tone(cur.out, t, f, len * cur.st * 0.95, tr.type, tr.v, { a: 0.01, rel: 0.05, vib: len >= 3 && tr.type === 'square' ? 5.5 : 0 });
      }
      cur.step++; cur.next += cur.st;
    }
  }
  function stopBgm() {
    want = null;
    if (timer) clearInterval(timer); timer = null;
    if (cur && ac) { const o = cur.out; o.gain.cancelScheduledValues(ac.currentTime); o.gain.setTargetAtTime(0.0001, ac.currentTime, 0.08); setTimeout(() => o.disconnect(), 600); }
    cur = null; curName = null;
  }

  // ---------- 効果音 ----------
  const SE = {
    step: t => tone(seBus, t, 520, 0.035, 'triangle', 0.05, { sus: false }),
    bump: t => tone(seBus, t, 110, 0.09, 'square', 0.08, { slide: 70, sus: false }),
    lift: t => { tone(seBus, t, 330, 0.12, 'square', 0.1, { slide: 760 }); tone(seBus, t + 0.05, 660, 0.06, 'triangle', 0.08, { sus: false }); },
    put: t => { tone(seBus, t, 520, 0.08, 'square', 0.09, { slide: 260 }); noise(seBus, t + 0.06, 0.07, 0.25, 500, 'lowpass'); },
    unlock: t => { ['C6', 'E6', 'G6', 'C7'].forEach((n, i) => tone(seBus, t + i * 0.06, freq(n), 0.14, 'square', 0.09, { sus: false })); tone(seBus, t + 0.26, freq('E7'), 0.3, 'triangle', 0.08, { sus: false }); },
    jump: t => tone(seBus, t, 280, 0.16, 'square', 0.09, { slide: 900 }),
    land: t => noise(seBus, t, 0.08, 0.3, 400, 'lowpass'),
    gem: t => { tone(seBus, t, freq('B6'), 0.05, 'square', 0.07, { sus: false }); tone(seBus, t + 0.05, freq('E7'), 0.12, 'square', 0.07, { sus: false }); },
    domino: (t, i = 0) => {
      const sc = [0, 2, 4, 7, 9]; const n = 60 + sc[i % 5] + 12 * Math.floor((i % 15) / 5);
      tone(seBus, t, 440 * Math.pow(2, (n - 69) / 12), 0.06, 'triangle', 0.12, { sus: false });
      noise(seBus, t, 0.03, 0.15, 3500);
    },
    bell: t => { [1, 2.01, 3.03].forEach((m, i) => tone(seBus, t, 784 * m, 1.6 - i * 0.4, 'sine', 0.14 / (i + 1), { sus: false })); [0, 0.12, 0.24, 0.36].forEach((d, i) => tone(seBus, t + 0.4 + d, freq(['C6', 'E6', 'G6', 'C7'][i]), 0.2, 'square', 0.06, { sus: false })); },
    costume: t => { ['C5', 'G5', 'C6', 'E6', 'G6'].forEach((n, i) => tone(seBus, t + i * 0.045, freq(n), 0.1, 'square', 0.07, { sus: false })); noise(seBus, t, 0.35, 0.12, 6000, 'highpass'); },
    chest: t => { ['G5', 'C6', 'E6', 'G6'].forEach((n, i) => tone(seBus, t + i * 0.08, freq(n), 0.16, 'square', 0.09, { sus: false })); tone(seBus, t + 0.34, freq('C7'), 0.4, 'triangle', 0.1, { sus: false }); },
    error: t => tone(seBus, t, 140, 0.18, 'square', 0.08, { vib: 18 }),
    cursor: t => tone(seBus, t, 880, 0.035, 'square', 0.05, { sus: false }),
    ok: t => { tone(seBus, t, 660, 0.05, 'square', 0.07, { sus: false }); tone(seBus, t + 0.05, 990, 0.08, 'square', 0.07, { sus: false }); },
    cancel: t => { tone(seBus, t, 600, 0.05, 'square', 0.06, { sus: false }); tone(seBus, t + 0.05, 400, 0.08, 'square', 0.06, { sus: false }); },
    wind: t => noise(seBus, t, 0.3, 0.2, 600, 'bandpass', 2400),
    door: t => { noise(seBus, t, 0.2, 0.25, 300, 'lowpass'); tone(seBus, t, 180, 0.15, 'square', 0.06, { slide: 360 }); },
    stair: t => { ['G5', 'E5', 'C5', 'G4'].forEach((n, i) => tone(seBus, t + i * 0.07, freq(n), 0.1, 'triangle', 0.12, { sus: false })); },
    stairUp: t => { ['G4', 'C5', 'E5', 'G5'].forEach((n, i) => tone(seBus, t + i * 0.07, freq(n), 0.1, 'triangle', 0.12, { sus: false })); },
    undo: t => tone(seBus, t, 700, 0.1, 'triangle', 0.08, { slide: 350 }),
    clear: t => {
      const mel = [['C5', 0, .12], ['E5', .12, .12], ['G5', .24, .12], ['C6', .36, .3], ['A5', .7, .12], ['B5', .82, .12], ['C6', .94, .7]];
      mel.forEach(([n, d, l]) => { tone(seBus, t + d, freq(n), l, 'square', 0.1); tone(seBus, t + d, freq(n) / 2, l, 'triangle', 0.15); });
    },
    tower: t => {
      const mel = [['A4', 0, .15], ['C5', .15, .15], ['E5', .3, .15], ['A5', .45, .4], ['G5', .9, .15], ['F5', 1.05, .15], ['E5', 1.2, .15], ['D5', 1.35, .15], ['E5', 1.5, .9]];
      mel.forEach(([n, d, l]) => { tone(seBus, t + d, freq(n), l, 'square', 0.1); tone(seBus, t + d, freq(n) / 2, l, 'triangle', 0.15); });
    },
  };
  function play(name, delay = 0, arg) {
    if (!ac || !SE[name]) return;
    SE[name](ac.currentTime + 0.005 + delay, arg);
  }
  root.AU = { init, play, playBgm, stopBgm, setVol, vol, get ready() { return !!ac; } };
})(window);
