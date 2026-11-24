// ===== ドット絵(すべてコードで描く新規の絵) =====
// 画面は 480×270 ドット、1マス 16 ドット、高さ1段 = 8 ドット。
(function (root) {
  'use strict';
  const TS = 16, LH = 8;

  // ---------- 主人公「モチ」(16×16) ----------
  // o 輪郭 w 体 g 影 p 耳・ほお n 鼻 e 目 h 目の光 a コスチュームの色 y 第2色 q ゴーグル
  const CAT = {
    D: [
      '..o..........o..',
      '.opo........opo.',
      '.oppoooooooopp o',
      'owwwwwwwwwwwwwwo',
      'owwwwwwwwwwwwwwo',
      'owwwhewwwwhewwwo',
      'owwweewwwweewwwo',
      'owppwwwnnwwwppwo',
      'owwwwwowwowwwwwo',
      '.owwwwwwwwwwwwo.',
      '..oaaaaaaaaaao..',
      '...owwwaawwwo...',
      '..owwwwwwwwwwo..',
      '...owwwwwwwwo...',
      '...owwoooowwo...',
      '...oooo..oooo...',
    ],
    U: [
      '..o..........o..',
      '.ogo........ogo.',
      '.oggoooooooogg o',
      'owwwwwwwwwwwwwwo',
      'owwwwwwwwwwwwwwo',
      'owwwwwggggwwwwwo',
      'owwwwwwggwwwwwwo',
      'owwwwwwwwwwwwwwo',
      'owwwwwwwwwwwwwwo',
      '.owwwwwwwwwwwwo.',
      '..oaaaaaaaaaao..',
      '...owwwaawwwoo..',
      '..owwwwwwwwwowo.',
      '...owwwwwwwwoo..',
      '...owwoooowwo...',
      '...oooo..oooo...',
    ],
    R: [
      '................',
      '.....o....o.....',
      '....opo..opo....',
      '...oppooooppo...',
      '..owwwwwwwwwwo..',
      '..owwwwwwwwwwwo.',
      '..owwwwwwwhewwo.',
      '..owwwwwwweewwo.',
      '..owwwwwwwwppwno',
      '..owwwwwwwwwwwo.',
      '...oaaaaaaaaao..',
      'oo..owwwwwwwo...',
      'owo.owwwwwwwo...',
      '.owoowwwwwwwo...',
      '..oowwoooowwo...',
      '....ooo..ooo....',
    ],
  };
  const COST_COL = {
    n: { a: '#e8484f', y: '#ffd23a' },
    p: { a: '#ff8a1f', y: '#ffd23a' },
    s: { a: '#3d8bff', y: '#9fe3ff' },
  };
  const PAL = { o: '#3b2b33', w: '#fff6e8', g: '#e8d6c2', p: '#ff9fb3', n: '#ff6f91', e: '#2b2030', h: '#ffffff' };
  const cache = {};
  function mk(w, h, fn) { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d')); return c; }
  function catSprite(dir, cost, frame) {
    const key = dir + cost + frame;
    if (cache[key]) return cache[key];
    const flip = dir === 'L', rows = CAT[flip ? 'R' : dir];
    const col = Object.assign({}, PAL, COST_COL[cost]);
    return cache[key] = mk(16, 17, g => {
      rows.forEach((r, y) => {
        for (let x = 0; x < 16; x++) {
          let ch = r[x];
          if (ch === ' ') ch = 'o';
          if (ch === '.' || !col[ch]) continue;
          // 歩きのコマ:足を入れかえる
          if (frame === 1 && y === 15) ch = r[x + (x < 8 ? 1 : -1)] || '.';
          if (ch === '.' || !col[ch]) continue;
          g.fillStyle = col[ch];
          g.fillRect(flip ? 15 - x : x, y + 1, 1, 1);
        }
      });
      // コスチュームの飾り
      const px = (x, y, c) => { g.fillStyle = c; g.fillRect(flip ? 15 - x : x, y + 1, 1, 1); };
      if (cost === 'p') {
        // ヘルメット
        const top = dir === 'R' || dir === 'L' ? 3 : 2;
        for (let x = 3; x <= 12; x++) px(x, top, '#ffd23a');
        for (let x = 4; x <= 11; x++) px(x, top - 1, '#ffd23a');
        for (let x = 5; x <= 10; x++) px(x, top - 2, '#ffe680');
        for (let x = 2; x <= 13; x++) px(x, top + 1, '#c98a00');
        if (dir === 'D') { px(7, top - 1, '#ff8a1f'); px(8, top - 1, '#ff8a1f'); }
      }
      if (cost === 's') {
        // ゴーグルとマント
        if (dir === 'D') { [[4, 3], [5, 3], [10, 3], [11, 3]].forEach(([x, y]) => px(x, y, '#9fe3ff')); [[3, 3], [6, 3], [9, 3], [12, 3], [7, 3], [8, 3]].forEach(([x, y]) => px(x, y, '#2b4a8a')); }
        if (dir === 'R' || dir === 'L') { px(10, 4, '#9fe3ff'); px(11, 4, '#9fe3ff'); px(9, 4, '#2b4a8a'); px(12, 4, '#2b4a8a'); for (let x = 3; x < 9; x++) px(x, 4, '#2b4a8a'); }
        if (dir === 'U') { for (let x = 2; x <= 13; x++) px(x, 4, '#2b4a8a'); for (let y = 11; y <= 14; y++) for (let x = 4; x <= 11; x++) px(x, y, y === 14 ? '#2b6ad0' : '#3d8bff'); }
      }
    });
  }

  // ---------- 色 ----------
  const KEYCOL = { k: ['#ffd23a', '#c98a00', '#fff3a8'], b: ['#4aa8ff', '#1f5fbf', '#bfe4ff'], r: ['#ff5a5a', '#b02a3a', '#ffc0c0'], t: ['#ff9be0', '#b0379a', '#fff0fb'] };
  const THEME = {
    grass: { f1: '#86d462', f2: '#78c757', tuft: '#a5e67c', wallTop: '#3f9a48', wallTop2: '#4fae55', wallFront: '#2c6b37', wallLine: '#24572d', voidA: '#5fb3e6', voidB: '#78c4ef', pit: '#1d1830' },
    flower: { f1: '#8edb6a', f2: '#80cf5e', tuft: '#ffd0ea', wallTop: '#3f9a48', wallTop2: '#4fae55', wallFront: '#2c6b37', wallLine: '#24572d', voidA: '#ffcfa8', voidB: '#ffdcbf', pit: '#1d1830' },
    cave: { f1: '#6e5d92', f2: '#645387', tuft: '#8a78b0', wallTop: '#4a3b6b', wallTop2: '#57487a', wallFront: '#2e2447', wallLine: '#231a38', voidA: '#140f24', voidB: '#1a1430', pit: '#0b0816' },
    tower: { f1: '#c9b890', f2: '#bba982', tuft: '#d9caa4', wallTop: '#8b7a9a', wallTop2: '#9a89a8', wallFront: '#5d4f6e', wallLine: '#4a3d5a', voidA: '#3b3060', voidB: '#463a70', pit: '#1d1830' },
    valley: { f1: '#e3c47e', f2: '#d8b870', tuft: '#f0d898', wallTop: '#b0784a', wallTop2: '#c08656', wallFront: '#7e4f2e', wallLine: '#6a4026', voidA: '#9fd3f0', voidB: '#b6def3', pit: '#2a1c14' },
  };

  // ---------- 基本の図形 ----------
  function rect(g, x, y, w, h, c) { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), w, h); }
  // 箱(上の面+前の面)。x,y はマスの左上、lv は下の高さ(段)、hpx は箱の高さ(ドット)
  function box(g, x, y, lv, hpx, top, front, line) {
    const bot = y + TS - lv * LH;          // 前の面の下端
    rect(g, x, bot - hpx, TS, hpx, front);
    rect(g, x, bot - hpx - TS, TS, TS, top);
    if (line) { rect(g, x, bot - hpx - 1, TS, 1, line); }
  }

  // ---------- 床 ----------
  function floor(g, th, x, y, gx, gy, kind) {
    const c = (gx + gy) % 2 ? th.f1 : th.f2;
    rect(g, x, y, TS, TS, c);
    const hsh = (gx * 73856093) ^ (gy * 19349663);
    if (kind !== 'plain' && (hsh & 7) === 0) { rect(g, x + 4 + (hsh >> 4 & 7), y + 5 + (hsh >> 8 & 5), 1, 2, th.tuft); rect(g, x + 5 + (hsh >> 4 & 7), y + 6 + (hsh >> 8 & 5), 1, 1, th.tuft); }
    if (th === THEME.flower && (hsh & 15) === 3) { const fx = x + 3 + (hsh >> 5 & 7), fy = y + 4 + (hsh >> 9 & 7); rect(g, fx, fy, 3, 1, '#ff8fc8'); rect(g, fx + 1, fy - 1, 1, 3, '#ff8fc8'); rect(g, fx + 1, fy, 1, 1, '#fff07a'); }
  }
  function pit(g, th, x, y, above) {
    rect(g, x, y, TS, TS, th.pit);
    if (!above) { rect(g, x, y, TS, 4, '#000'); rect(g, x, y + 4, TS, 2, '#2b2440'); }
  }
  function sealHidden(g, x, y, c, t) {
    const col = KEYCOL[c][0];
    g.globalAlpha = 0.25 + 0.12 * Math.sin(t * 3 + x * 0.3);
    for (let i = 0; i < TS; i += 4) { rect(g, x + i, y + 1, 2, 1, col); rect(g, x + i + 2, y + TS - 2, 2, 1, col); rect(g, x + 1, y + i + 2, 1, 2, col); rect(g, x + TS - 2, y + i, 1, 2, col); }
    g.globalAlpha = 1;
  }
  function sealShown(g, x, y, c, t) {
    const [c0, c1, c2] = KEYCOL[c];
    rect(g, x, y, TS, TS, c1);
    rect(g, x + 1, y + 1, TS - 2, TS - 2, c0);
    g.globalAlpha = 0.5 + 0.3 * Math.sin(t * 4 + x * 0.2);
    rect(g, x + 4, y + 7, 8, 2, c2); rect(g, x + 7, y + 4, 2, 8, c2);
    g.globalAlpha = 1;
    rect(g, x, y + TS, TS, 3, c1);
  }
  function wind(g, th, x, y, gx, gy, d, t) {
    floor(g, th, x, y, gx, gy, 'plain');
    g.globalAlpha = 0.18; rect(g, x, y, TS, TS, '#ffffff'); g.globalAlpha = 1;
    const ph = (t * 40) % TS;
    g.fillStyle = 'rgba(255,255,255,.85)';
    for (let k = 0; k < 2; k++) {
      let p = (ph + k * 8) % TS;
      if (d === 'L' || d === 'U') p = TS - 1 - p;
      const o = k ? 4 : 10;
      if (d === 'L' || d === 'R') g.fillRect(x + p - 2, y + o, 5, 1); else g.fillRect(x + o, y + p - 2, 1, 5);
    }
    // 矢印
    g.fillStyle = 'rgba(255,255,255,.55)';
    const cx = x + 8, cy = y + 8;
    const A = { R: [[2, 0], [0, -2], [0, 2], [1, -1], [1, 1]], L: [[-2, 0], [0, -2], [0, 2], [-1, -1], [-1, 1]], U: [[0, -2], [-2, 0], [2, 0], [-1, -1], [1, -1]], D: [[0, 2], [-2, 0], [2, 0], [-1, 1], [1, 1]] }[d];
    A.forEach(([dx, dy]) => g.fillRect(cx + dx, cy + dy, 1, 1));
  }
  function mat(g, x, y, c, t) {
    const col = { p: ['#ff8a1f', '#b85a00'], s: ['#3d8bff', '#1f4fa8'], n: ['#ff6f91', '#b03a5a'] }[c];
    rect(g, x + 2, y + 3, 12, 11, col[1]); rect(g, x + 3, y + 2, 10, 11, col[0]);
    rect(g, x + 4, y + 3, 8, 9, col[1]);
    rect(g, x + 5, y + 4, 6, 7, col[0]);
    // 印
    g.fillStyle = '#fff';
    if (c === 'p') { g.fillRect(x + 6, y + 6, 4, 3); g.fillRect(x + 7, y + 5, 2, 1); }
    if (c === 's') { g.fillRect(x + 6, y + 7, 4, 1); g.fillRect(x + 5, y + 6, 1, 1); g.fillRect(x + 10, y + 6, 1, 1); g.fillRect(x + 7, y + 6, 2, 1); }
    if (c === 'n') { g.fillRect(x + 7, y + 6, 2, 3); }
    if (Math.sin(t * 5 + x) > 0.8) rect(g, x + 12, y + 2, 1, 1, '#fff');
  }
  function plate(g, x, y, on, w2, t) {
    if (w2) {
      rect(g, x + 1, y + 1, 14, 14, '#5d5870'); rect(g, x + 2, y + 2 + (on ? 1 : 0), 12, 11, on ? '#ffd23a' : '#b8b2cc');
      g.fillStyle = on ? '#c98a00' : '#5d5870';
      g.fillRect(x + 5, y + 5 + (on ? 1 : 0), 6, 2); g.fillRect(x + 5, y + 9 + (on ? 1 : 0), 6, 2);
    } else {
      rect(g, x + 2, y + 2, 12, 12, '#5d5870'); rect(g, x + 3, y + 3 + (on ? 1 : 0), 10, 9, on ? '#7dff8a' : '#ff6f6f');
      rect(g, x + 4, y + 4 + (on ? 1 : 0), 4, 2, 'rgba(255,255,255,.6)');
    }
  }
  function stair(g, x, y, up) {
    rect(g, x, y, TS, TS, '#2a2238');
    for (let i = 0; i < 4; i++) rect(g, x + 1, y + (up ? 12 - i * 4 : i * 4) , 14, 3, ['#7a6a90', '#655780', '#504470', '#3c3260'][up ? 3 - i : i]);
    if (up) { g.fillStyle = '#fff'; g.fillRect(x + 7, y + 2, 2, 1); g.fillRect(x + 6, y + 3, 4, 1); }
  }
  function goal(g, x, y, t) {
    const b = Math.sin(t * 3) * 1.5;
    rect(g, x + 3, y + 11, 10, 3, 'rgba(0,0,0,.2)');
    rect(g, x + 4, y - 10, 1, 22, '#6b4a2a');
    const wv = Math.sin(t * 6);
    g.fillStyle = '#ff5a8a';
    for (let i = 0; i < 9; i++) g.fillRect(x + 5 + i, y - 10 + Math.round(Math.sin(t * 6 + i * 0.6) * 1), 1, 7 - Math.floor(i / 3));
    rect(g, x + 7, y - 8 + Math.round(wv), 2, 2, '#fff');
    for (let i = 0; i < 3; i++) { const a = t * 2 + i * 2.1; rect(g, x + 8 + Math.cos(a) * 7, y + 2 + Math.sin(a) * 3 + b, 1, 1, '#fff7a0'); }
  }
  function gem(g, x, y, t, s = 1) {
    const b = Math.round(Math.sin(t * 4 + x * 0.1) * 1.5);
    const cx = x + 8, cy = y + 6 + b;
    rect(g, x + 5, y + 12, 6, 2, 'rgba(0,0,0,.18)');
    g.fillStyle = '#2bb8d9'; g.fillRect(cx - 3, cy - 1, 7, 2); g.fillRect(cx - 2, cy + 1, 5, 1); g.fillRect(cx - 1, cy + 2, 3, 1); g.fillRect(cx, cy + 3, 1, 1);
    g.fillStyle = '#8ff0ff'; g.fillRect(cx - 2, cy - 2, 5, 1); g.fillRect(cx - 2, cy - 1, 2, 1);
    g.fillStyle = '#fff'; g.fillRect(cx - 1, cy - 2, 1, 1);
    if (Math.sin(t * 6 + x) > 0.85) { g.fillRect(cx + 4, cy - 4, 1, 3); g.fillRect(cx + 3, cy - 3, 3, 1); }
  }

  // ---------- 立体物 ----------
  function wall(g, th, x, y, gx, gy, below) {
    const hp = 10;
    rect(g, x, y + TS - hp, TS, hp, th.wallFront);
    rect(g, x, y + TS - hp + 3, TS, 1, th.wallLine); rect(g, x, y + TS - hp + 7, TS, 1, th.wallLine);
    rect(g, x + ((gx * 5) % 8) + 2, y + TS - hp + 4, 1, 3, th.wallLine);
    rect(g, x, y - hp, TS, TS, th.wallTop);
    const hsh = (gx * 31 + gy * 17) & 3;
    rect(g, x + 2 + hsh, y - hp + 3, 4, 3, th.wallTop2); rect(g, x + 9 - hsh, y - hp + 9, 4, 3, th.wallTop2);
    if (below) rect(g, x, y + TS - hp - 1, TS, 1, th.wallLine);
  }
  function block(g, x, y, h) {
    const hp = h * LH;
    rect(g, x, y + TS - hp, TS, hp, '#a3875a');
    for (let i = 0; i < h; i++) rect(g, x, y + TS - (i + 1) * LH, TS, 1, '#8a6f45');
    rect(g, x, y - hp, TS, TS, '#e3cf9c'); rect(g, x + 1, y - hp + 1, TS - 2, TS - 2, '#d9c38c');
    rect(g, x + 1, y - hp + 1, TS - 2, 1, '#f2e4bc');
  }
  function lockBlock(g, x, y, c, t) {
    const [c0, c1, c2] = KEYCOL[c];
    const hp = 12;
    rect(g, x, y + TS - hp, TS, hp, '#6b5f7a');
    rect(g, x + 4, y + TS - hp + 2, 8, 8, c1); rect(g, x + 5, y + TS - hp + 3, 6, 6, c0);
    rect(g, x + 7, y + TS - hp + 4, 2, 2, '#2b2030'); rect(g, x + 7, y + TS - hp + 6, 2, 2, '#2b2030');
    rect(g, x, y - hp, TS, TS, '#8d82a0'); rect(g, x + 2, y - hp + 2, 12, 12, c1); rect(g, x + 3, y - hp + 3, 10, 10, c0);
    rect(g, x + 4, y - hp + 4, 3, 2, c2);
    // 鍵穴
    rect(g, x + 7, y - hp + 5, 2, 3, '#2b2030'); rect(g, x + 6, y - hp + 6, 4, 1, '#2b2030'); rect(g, x + 7, y - hp + 8, 2, 3, '#2b2030');
  }
  function lockOpen(g, x, y, c) {
    const [c0, c1] = KEYCOL[c];
    rect(g, x + 1, y + 1, 14, 14, c1); rect(g, x + 3, y + 3, 10, 10, c0);
    rect(g, x + 7, y + 5, 2, 6, c1);
  }
  function door(g, x, y, open) {
    if (open) { rect(g, x, y + 2, TS, 12, '#4a3d5a'); rect(g, x + 1, y + 3, 14, 10, '#6b5f7a'); return; }
    const hp = 14;
    rect(g, x, y + TS - hp, TS, hp, '#5d4f6e');
    for (let i = 1; i < TS; i += 4) rect(g, x + i, y + TS - hp, 2, hp, '#9a8fb0');
    rect(g, x, y - hp, TS, TS, '#7a6c8f');
    for (let i = 1; i < TS; i += 4) rect(g, x + i, y - hp + 2, 2, 12, '#a99ec0');
  }
  function chest(g, x, y, open, t) {
    rect(g, x + 2, y + 12, 12, 3, 'rgba(0,0,0,.25)');
    rect(g, x + 1, y + 3, 14, 10, '#7a3e12'); rect(g, x + 2, y + 4, 12, 8, '#b8642a');
    rect(g, x + 1, y + 7, 14, 1, '#ffd23a'); rect(g, x + 7, y + 6, 2, 3, '#ffd23a');
    if (open) {
      rect(g, x + 1, y - 3, 14, 6, '#7a3e12'); rect(g, x + 2, y - 2, 12, 4, '#4a250a');
      g.globalAlpha = 0.6 + 0.3 * Math.sin(t * 5); rect(g, x + 4, y - 6, 8, 3, '#fff7a0'); g.globalAlpha = 1;
    } else {
      rect(g, x + 1, y - 1, 14, 5, '#9a4f1c'); rect(g, x + 2, y, 12, 3, '#c87436'); rect(g, x + 1, y + 3, 14, 1, '#5a2e0c');
    }
  }
  function domino(g, x, y, fallen, tilt, d) {
    if (fallen) {
      const horiz = d === 'L' || d === 'R';
      rect(g, x + (horiz ? 1 : 4), y + (horiz ? 5 : 1), horiz ? 14 : 8, horiz ? 7 : 13, '#2b2030');
      rect(g, x + (horiz ? 2 : 5), y + (horiz ? 6 : 2), horiz ? 12 : 6, horiz ? 5 : 11, '#fffaf0');
      rect(g, x + 7, y + 7, 2, 2, '#2b2030');
      return;
    }
    const k = tilt || 0;
    const dx = Math.round((d === 'R' ? 1 : d === 'L' ? -1 : 0) * k * 8), dy = Math.round((d === 'D' ? 1 : d === 'U' ? -1 : 0) * k * 6 + k * 6);
    rect(g, x + 4, y + 13, 8, 2, 'rgba(0,0,0,.2)');
    rect(g, x + 5 + dx, y - 8 + dy, 6, 22 - dy, '#2b2030');
    rect(g, x + 6 + dx, y - 7 + dy, 4, 20 - dy, '#fffaf0');
    rect(g, x + 6 + dx, y + 2 + Math.round(dy / 2), 4, 1, '#2b2030');
    rect(g, x + 7 + dx, y - 4 + dy, 2, 2, '#e8484f'); rect(g, x + 7 + dx, y + 6, 2, 2, '#3d8bff');
  }
  function bell(g, x, y, rung, t) {
    const sw = rung ? Math.sin(t * 14) * Math.max(0, 1 - (t % 999)) : 0;
    rect(g, x + 2, y + 12, 12, 3, 'rgba(0,0,0,.25)');
    rect(g, x + 2, y - 10, 1, 24, '#6b4a2a'); rect(g, x + 13, y - 10, 1, 24, '#6b4a2a'); rect(g, x + 2, y - 11, 12, 2, '#8a6236');
    const ox = Math.round(Math.sin(t * 12) * (rung ? 1 : 0));
    rect(g, x + 5 + ox, y - 7, 6, 2, '#c98a00'); rect(g, x + 4 + ox, y - 5, 8, 8, '#ffd23a'); rect(g, x + 3 + ox, y + 2, 10, 2, '#c98a00');
    rect(g, x + 5 + ox, y - 4, 2, 4, '#fff3a8'); rect(g, x + 7 + ox, y + 4, 2, 2, '#6b4a2a');
  }

  // ---------- 物 ----------
  // 物を1つ描く。x,y はマスの左上の画面位置、lv は置かれている段
  function item(g, ch, x, y, lv, t) {
    const by = y + TS - lv * LH;   // この物の下端
    if (ch === 'c') {
      rect(g, x + 1, by - 8, 14, 8, '#9a5a24'); rect(g, x + 1, by - 8, 14, 1, '#6e3e14');
      rect(g, x + 2, by - 7, 1, 6, '#c27a3a'); rect(g, x + 13, by - 7, 1, 6, '#c27a3a'); rect(g, x + 1, by - 5, 14, 1, '#6e3e14');
      rect(g, x + 1, by - 20, 14, 12, '#d08a46'); rect(g, x + 2, by - 19, 12, 10, '#e5a25c');
      rect(g, x + 2, by - 15, 12, 2, '#b86f30'); rect(g, x + 7, by - 19, 2, 10, '#b86f30');
      return;
    }
    if (ch === 'i') {
      const cx = x + 8, cy = by - 9;
      g.fillStyle = '#1c1a26'; circ(g, cx, cy, 7);
      g.fillStyle = '#4a4860'; circ(g, cx, cy, 6);
      g.fillStyle = '#6e6c88'; circ(g, cx - 2, cy - 2, 3);
      rect(g, cx - 3, cy - 4, 2, 2, '#c8c6e0');
      return;
    }
    // カギ(色つきの台に乗ったカギ)
    const [c0, c1, c2] = KEYCOL[ch];
    rect(g, x + 2, by - 6, 12, 6, '#5d4f6e'); rect(g, x + 2, by - 6, 12, 1, '#3b2b33');
    rect(g, x + 2, by - 18, 12, 12, '#8d82a0'); rect(g, x + 3, by - 17, 10, 10, '#a99ec0');
    // カギの形(横向き)
    const ky = by - 15;
    rect(g, x + 3, ky, 5, 5, c1); rect(g, x + 4, ky + 1, 3, 3, c0); rect(g, x + 5, ky + 2, 1, 1, '#a99ec0');
    rect(g, x + 8, ky + 2, 5, 2, c1); rect(g, x + 8, ky + 2, 5, 1, c0);
    rect(g, x + 11, ky + 4, 1, 2, c1); rect(g, x + 9, ky + 4, 1, 2, c1);
    rect(g, x + 4, ky + 1, 1, 1, c2);
    if (ch === 't') { rect(g, x + 5, ky + 2, 1, 1, '#8ff0ff'); if (Math.sin(t * 6) > 0.6) rect(g, x + 13, ky - 1, 1, 1, '#fff'); }
  }
  function circ(g, cx, cy, r) { for (let y = -r; y <= r; y++) { const w = Math.round(Math.sqrt(r * r - y * y)); g.fillRect(cx - w, cy + y, w * 2 + 1, 1); } }
  // 手に持った物(頭の上)。x,y はネコの描画位置(左上)
  function held(g, s, x, y, t) {
    for (let i = 0; i < s.length; i++) item(g, s[i], x, y - 15 - i * LH, 0, t);
  }

  // ---------- 小さいアイコン(HUD 用) ----------
  function iconGem(g, x, y) {
    g.fillStyle = '#2bb8d9'; g.fillRect(x, y + 2, 9, 2); g.fillRect(x + 1, y + 4, 7, 1); g.fillRect(x + 2, y + 5, 5, 1); g.fillRect(x + 3, y + 6, 3, 1); g.fillRect(x + 4, y + 7, 1, 1);
    g.fillStyle = '#8ff0ff'; g.fillRect(x + 1, y + 1, 7, 1); g.fillRect(x + 2, y, 5, 1);
  }

  root.ART = { TS, LH, THEME, KEYCOL, catSprite, floor, pit, sealHidden, sealShown, wind, mat, plate, stair, goal, gem, wall, block, lockBlock, lockOpen, door, chest, domino, bell, item, held, rect, circ, iconGem, mk };
})(window);
