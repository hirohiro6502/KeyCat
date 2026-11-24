// ===== ステージを遊ぶ画面(描画・アニメーション・1手もどす) =====
(function (root) {
  'use strict';
  const { TS, LH } = ART;
  let W = 480, H = 270, TOP = 22;
  const DIRN = { up: 'U', down: 'D', left: 'L', right: 'R' };

  const G = {
    def: null, L: null, S: null, hist: [],
    disp: null,            // 表示中のネコ {r,x,y,h,d,c}
    q: [], cur: null,      // アニメーションの列
    parts: [], pops: [],   // 粒子と文字
    fall: {},              // ドミノが倒れる時刻 'r:i' → {t, d}
    bellAt: {},            // ベルが鳴った時刻
    delayedGems: [],       // あとで数えるダイヤ [{t,n}]
    fade: 0, shake: 0, now: 0,
    holdDir: null, holdT: 0, turned: false, buffered: null,
    hintT: 0, done: false,
    cb: {},                // onClear(gems) onToast(text) onHud()
  };

  G.start = function (def, opts) {
    G.def = def; G.L = PQL.compile(def);
    G.opened = opts.opened || (() => false);
    G.S = PQL.newState(G.L, G.opened);
    G.cb = opts.cb || {};
    G.hist = []; G.q = []; G.cur = null; G.parts = []; G.pops = []; G.fall = {}; G.bellAt = {}; G.delayedGems = [];
    G.done = false; G.fade = 1; G.buffered = null; G.holdDir = null;
    G.syncDisp();
    G.hintT = 8;
    G.theme = ART.THEME[def.bg || 'grass'];
  };
  G.syncDisp = function () {
    const S = G.S;
    G.disp = { r: S.r, x: S.x, y: S.y, h: PQL.playerH(G.L, S), d: S.d, c: S.c, walk: 0, jump: 0, nudge: null };
    G.handHidden = 0; G.tileHide = null;
  };
  G.busy = () => !!G.cur || G.q.length > 0;

  // ---------- 入力 ----------
  G.input = function (name) {
    if (G.done) return;
    if (name === 'x') return G.undo();
    if (name === 'reset') return G.reset();
    if (DIRN[name]) {
      G.holdDir = name; G.holdT = 0; G.turned = false;
      const d = DIRN[name];
      if (G.busy()) { G.buffered = d; return; }
      if (G.S.d !== d) { G.doStep('t' + d); G.turned = true; }
      else G.doStep(d);
      return;
    }
    if (name === 'a' || name === 'b') {
      const a = name === 'a' ? 'A' : 'J';
      if (G.busy()) { G.buffered = a; return; }
      G.doStep(a);
    }
  };
  // 押しっぱなし:向きを変えたあと少し押し続けると歩き出す
  G.updateHold = function (dt) {
    const d = IN.dir();
    if (!d || !DIRN[d]) { G.holdDir = null; return; }
    if (d !== G.holdDir) { G.holdDir = d; G.holdT = 0; G.turned = G.S.d !== DIRN[d]; if (!G.busy() && G.turned) G.doStep('t' + DIRN[d]); }
    G.holdT += dt;
    if (G.busy() || G.done) return;
    if (G.turned && G.holdT < 0.13) return;
    G.doStep(DIRN[d]);
  };

  G.doStep = function (a) {
    const before = PQL.clone(G.S);
    const ev = PQL.step(G.L, G.S, a);
    if (PQL.changed(ev) && a[0] !== 't') { G.hist.push(before); if (G.hist.length > 400) G.hist.shift(); }
    G.handle(ev);
  };

  G.undo = function () {
    if (!G.hist.length) { G.cb.onToast && G.cb.onToast(I18N.t('noUndo')); AU.play('error'); return; }
    G.S = G.hist.pop();
    // 宝箱はセーブ済みなので開いたまま
    G.S.rooms.forEach((rm, ri) => { const room = G.L.rooms[ri]; room.tiles.forEach((t, i) => { if (t.k === 'chest' && G.opened(ri, i % room.w, (i / room.w) | 0)) rm.f[i] |= PQL.F_OPEN; }); });
    G.q = []; G.cur = null; G.buffered = null;
    G.fall = {}; G.delayedGems = [];
    G.syncDisp();
    AU.play('undo');
    G.cb.onHud && G.cb.onHud();
  };
  G.reset = function () {
    if (G.cb.onBank) G.cb.onBank(G.S.gems);
    G.start(G.def, { opened: G.opened, cb: G.cb });
    AU.play('cancel');
    G.cb.onHud && G.cb.onHud();
  };

  // ---------- できごと → アニメーション ----------
  function tilePos(x, y) { return [G.ox + x * TS, G.oy + y * TS]; }
  G.handle = function (ev) {
    for (const e of ev) {
      switch (e.t) {
        case 'turn': G.disp.d = e.d; break;
        case 'move':
          G.q.push({ k: 'move', dur: 0.1, e, start() { G.disp.d = G.S.d; AU.play('step'); } }); break;
        case 'wind':
          G.q.push({ k: 'move', dur: 0.075, e, wind: true, start() { AU.play('wind'); } }); break;
        case 'jump':
          G.q.push({ k: 'jump', dur: 0.24, e, start() { AU.play('jump'); }, end() { AU.play('land'); burst(e.x, e.y, e.h1, '#ffffff', 6); } }); break;
        case 'bump':
          G.q.push({ k: 'nudge', dur: 0.09, d: e.d, start() { AU.play('bump'); } }); break;
        case 'jumpFail':
          G.q.push({ k: 'hop', dur: 0.16, start() { AU.play('bump'); } }); break;
        case 'lift':
          G.q.push({ k: 'lift', dur: 0.13, e, start() { AU.play('lift'); } }); break;
        case 'put':
          G.q.push({ k: 'put', dur: 0.12, e, start() { AU.play('put'); }, end() { burst(e.x, e.y, e.level + 1, '#ffffff', 4); } }); break;
        case 'unlock':
          G.q.push({ k: 'wait', dur: 0.22, start() { AU.play('unlock'); burst(e.x, e.y, 1, ART.KEYCOL[e.c][0], 26, 1.6); G.shake = 0.15; } }); break;
        case 'chest':
          G.q.push({ k: 'wait', dur: 0.3, start() { AU.play('chest'); burst(e.x, e.y, 1, '#ffd23a', 30, 1.4); for (let i = 0; i < 12; i++) gemPop(e.x, e.y, i * 0.03); G.cb.onChest && G.cb.onChest(e); G.cb.onToast && G.cb.onToast(I18N.t('chest', { n: e.n })); } }); break;
        case 'gem': gemPop(e.x, e.y, 0.06); AU.play('gem', 0.06); break;
        case 'costume':
          G.q.push({ k: 'wait', dur: 0.2, start() { G.disp.c = e.c; AU.play('costume'); burst(e.x, e.y, 0, '#ffffff', 22, 1.2); G.cb.onCostume && G.cb.onCostume(e.c); } }); break;
        case 'msg':
          G.q.push({ k: 'wait', dur: 0.05, start() { AU.play('error'); G.cb.onToast && G.cb.onToast(I18N.t(e.m)); G.disp.shakeT = 0.2; } }); break;
        case 'doorOpen': case 'doorClose': AU.play('door'); break;
        case 'stair':
          G.q.push({ k: 'stair', dur: 0.36, e, start() { AU.play(e.up ? 'stairUp' : 'stair'); } }); break;
        case 'domino': {
          const t0 = G.now;
          e.seq.forEach((s, i) => {
            const key = G.S.r + ':' + PQL.idx(G.L, G.S.r, s.x, s.y);
            G.fall[key] = { t: t0 + s.tm * 0.065, d: s.d };
            G.delayedGems.push({ t: t0 + s.tm * 0.065 + 0.1, n: 1 });
            setTimeoutGame(s.tm * 0.065, () => { AU.play('domino', 0, s.tm); gemPop(s.x, s.y, 0, true); });
          });
          break;
        }
        case 'bell': {
          const t0 = G.now + e.tm * 0.065;
          G.bellAt[G.S.r + ':' + PQL.idx(G.L, G.S.r, e.x, e.y)] = t0;
          G.delayedGems.push({ t: t0, n: e.n });
          setTimeoutGame(e.tm * 0.065, () => { AU.play('bell'); G.shake = 0.3; burst(e.x, e.y, 2, '#ffd23a', 40, 2); for (let i = 0; i < 20; i++) gemPop(e.x, e.y, i * 0.04, true); G.cb.onToast && G.cb.onToast(I18N.t('bell', { n: e.n })); });
          break;
        }
        case 'goal': {
          const delay = e.delay !== undefined ? e.delay * 0.065 + 1.6 : 0.25;
          G.q.push({ k: 'wait', dur: delay, start() { G.done = true; }, end() { G.cb.onClear && G.cb.onClear(); } });
          break;
        }
      }
    }
    G.cb.onHud && G.cb.onHud();
  };
  const timers = [];
  function setTimeoutGame(sec, fn) { timers.push({ t: G.now + sec, fn }); }

  // ---------- 粒子 ----------
  function burst(x, y, lv, col, n, sp = 1) {
    const [px, py] = tilePos(x, y);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = (20 + Math.random() * 60) * sp;
      G.parts.push({ x: px + 8, y: py + 8 - lv * LH, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 30, life: 0.5 + Math.random() * 0.4, col, g: 120 });
    }
  }
  function gemPop(x, y, delay, small) {
    const [px, py] = tilePos(x, y);
    G.pops.push({ x: px + 8 + (Math.random() - 0.5) * (small ? 4 : 10), y: py, vy: -60 - Math.random() * 40, vx: (Math.random() - 0.5) * 40, t: -delay, life: 0.7 });
  }

  // ---------- 更新 ----------
  G.update = function (dt) {
    G.now += dt;
    for (let i = timers.length - 1; i >= 0; i--) if (timers[i].t <= G.now) { const f = timers[i].fn; timers.splice(i, 1); f(); }
    if (G.fade > 0) G.fade = Math.max(0, G.fade - dt * 3);
    if (G.shake > 0) G.shake -= dt;
    if (G.disp.shakeT > 0) G.disp.shakeT -= dt;
    if (G.hintT > 0) G.hintT -= dt;
    // アニメーションの列
    if (!G.cur && G.q.length) { G.cur = G.q.shift(); G.cur.t = 0; G.cur.start && G.cur.start(); }
    if (G.cur) {
      const c = G.cur; c.t += dt;
      const p = Math.min(1, c.t / c.dur);
      const D = G.disp;
      if (c.k === 'move' || c.k === 'jump') {
        const e = c.e;
        D.fx = e.x0 + (e.x - e.x0) * p; D.fy = e.y0 + (e.y - e.y0) * p;
        D.fh = c.k === 'jump' ? e.h0 + (e.h1 - e.h0) * p : (p < 0.5 ? e.h0 : e.h1);
        if (c.k === 'move' && e.h1 < e.h0) D.fh = e.h0 + (e.h1 - e.h0) * Math.max(0, (p - 0.4) / 0.6);
        D.jump = c.k === 'jump' ? Math.sin(Math.PI * p) * 14 : 0;
        D.walk += dt;
        if (p >= 1) { D.x = e.x; D.y = e.y; D.h = e.h1; D.fx = D.fy = D.fh = undefined; D.jump = 0; }
      }
      if (c.k === 'nudge') D.nudge = { d: c.d, p };
      if (c.k === 'hop') D.jump = Math.sin(Math.PI * p) * 4;
      if (c.k === 'lift') { G.handHidden = 1; G.fly = { from: 'tile', e: c.e, p }; }
      if (c.k === 'put') { G.tileHide = { x: c.e.x, y: c.e.y, level: c.e.level }; G.fly = { from: 'hand', e: c.e, p }; }
      if (c.k === 'stair') { G.fade = Math.sin(Math.PI * p); if (p >= 0.5 && D.r !== G.S.r) { D.r = G.S.r; D.x = G.S.x; D.y = G.S.y; D.h = PQL.playerH(G.L, G.S); if (!c.e.up) G.cb.onToast && G.cb.onToast(I18N.t('toBonus')); G.cb.onRoom && G.cb.onRoom(); } }
      if (p >= 1) {
        c.end && c.end();
        D.nudge = null; G.fly = null; G.handHidden = 0; G.tileHide = null;
        if (c.k === 'hop') D.jump = 0;
        G.cur = null;
        if (!G.q.length) {
          // 表示を状態に合わせる
          const S = G.S; D.r = S.r; D.x = S.x; D.y = S.y; D.h = PQL.playerH(G.L, S); D.d = S.d; D.c = S.c;
          if (G.buffered && !G.done) { const b = G.buffered; G.buffered = null; if (b === 'A' || b === 'J') G.doStep(b); else if (G.S.d !== b) G.doStep('t' + b); else G.doStep(b); }
        }
      }
    }
    if (!G.done) G.updateHold(dt);
    // 粒子
    for (const p of G.parts) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.g * dt; p.life -= dt; }
    G.parts = G.parts.filter(p => p.life > 0);
    for (const p of G.pops) { p.t += dt; if (p.t > 0) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 160 * dt; } }
    G.pops = G.pops.filter(p => p.t < p.life);
  };
  G.shownGems = function () {
    let n = G.S.gems;
    for (const d of G.delayedGems) if (d.t > G.now) n -= d.n;
    return n;
  };

  // ---------- 描画 ----------
  // 部屋の大きさに合わせて、表示する広さ(ドット)を決める
  G.viewSize = function () {
    const room = G.L.rooms[G.disp.r];
    const rw = room.w * TS, rh = room.h * TS + 12;
    let vw = Math.ceil(Math.max(rw + 24, ((rh + 18) / 0.9) * 16 / 9));
    vw = Math.max(256, Math.min(480, vw)); vw += vw % 2;
    return [vw, Math.round(vw * 9 / 16)];
  };
  G.draw = function (g) {
    [W, H] = [g.canvas.width, g.canvas.height]; TOP = Math.round(H * 0.08);
    const L = G.L, S = G.S, D = G.disp, th = G.theme, t = G.now;
    const r = D.r, room = L.rooms[r], st = S.rooms[r];
    const rth = ART.THEME[room.bg] || th;
    // 部屋の位置
    const rw = room.w * TS, rh = room.h * TS;
    G.ox = Math.round((W - rw) / 2); G.oy = Math.round(TOP + 8 + (H - TOP - 8 - rh) / 2);
    if (rw > W) G.ox = Math.round(Math.min(0, Math.max(W - rw, W / 2 - (D.fx ?? D.x) * TS - 8)));
    if (rh > H - TOP) G.oy = Math.round(Math.min(TOP + 8, Math.max(H - rh, H / 2 - (D.fy ?? D.y) * TS)));
    let sx = 0, sy = 0;
    if (G.shake > 0) { sx = (Math.random() - 0.5) * 4; sy = (Math.random() - 0.5) * 4; }
    g.save(); g.translate(sx, sy);
    // 背景
    g.fillStyle = rth.voidA; g.fillRect(-4, -4, W + 8, H + 8);
    g.fillStyle = rth.voidB;
    for (let i = 0; i < 14; i++) { const bx = ((i * 97 + t * 6) % (W + 80)) - 40, by = (i * 53) % H; g.fillRect(Math.round(bx), by, 22, 5); g.fillRect(Math.round(bx) + 5, by - 3, 12, 3); }
    const ox = G.ox, oy = G.oy;
    // 1) 地面
    for (let y = 0; y < room.h; y++) for (let x = 0; x < room.w; x++) {
      const i = y * room.w + x, tl = room.tiles[i], f = st.f[i], px = ox + x * TS, py = oy + y * TS;
      switch (tl.k) {
        case 'void': case 'wall': break;
        case 'pit': ART.pit(g, rth, px, py, y > 0 && room.tiles[i - room.w].k === 'pit'); break;
        case 'seal': ART.pit(g, rth, px, py, y > 0 && ['pit', 'seal'].includes(room.tiles[i - room.w].k));
          if (PQL.visible(tl, S)) ART.sealShown(g, px, py, tl.c, t); else ART.sealHidden(g, px, py, tl.c, t); break;
        case 'wind': ART.wind(g, rth, px, py, x, y, tl.d, t); break;
        case 'mat': ART.floor(g, rth, px, py, x, y); ART.mat(g, px, py, tl.c, t); break;
        case 'plate': case 'wplate': ART.floor(g, rth, px, py, x, y, 'plain'); ART.plate(g, px, py, PQL.plateActive(L, S, r, i), tl.k === 'wplate', t); break;
        case 'stair': ART.floor(g, rth, px, py, x, y); ART.stair(g, px, py, tl.up); break;
        case 'lock': if (f & 1) { ART.floor(g, rth, px, py, x, y, 'plain'); ART.lockOpen(g, px, py, tl.c); } break;
        case 'door': if (f & 1) ART.door(g, px, py, true); break;
        case 'block': break;
        default: ART.floor(g, rth, px, py, x, y);
      }
      if (tl.k === 'chest' && !PQL.visible(tl, S) && !(f & 1)) {
        ART.floor(g, rth, px, py, x, y);
        if (Math.sin(t * 3 + x * 2) > 0.7) { g.fillStyle = 'rgba(255,240,160,.8)'; g.fillRect(px + 7, py + 6, 1, 3); g.fillRect(px + 6, py + 7, 3, 1); }
      }
      if (tl.k === 'chest' && (f & 1) && !PQL.visible(tl, S)) ART.floor(g, rth, px, py, x, y);
    }
    // 前のマスの目印
    const showFront = !G.busy() && !G.done;
    const [fx, fy] = PQL.front(S);
    // 2) 立体物とネコ(上の行から順に)
    const pRow = D.fy !== undefined ? Math.max(Math.ceil(D.fy - 0.001), D.y) : D.y;
    for (let y = 0; y < room.h; y++) {
      for (let x = 0; x < room.w; x++) {
        const i = y * room.w + x, tl = room.tiles[i], f = st.f[i], px = ox + x * TS, py = oy + y * TS;
        switch (tl.k) {
          case 'wall': ART.wall(g, rth, px, py, x, y, y + 1 < room.h && room.tiles[i + room.w].k === 'wall'); break;
          case 'block': ART.block(g, px, py, tl.h); break;
          case 'lock': if (!(f & 1)) ART.lockBlock(g, px, py, tl.c, t); break;
          case 'door': if (!(f & 1)) ART.door(g, px, py, false); break;
          case 'chest': if (PQL.visible(tl, S)) { ART.floor(g, rth, px, py, x, y); ART.chest(g, px, py, f & 1, t); } break;
          case 'goal': ART.goal(g, px, py, t); break;
          case 'bell': ART.floor(g, rth, px, py, x, y); { const bt = G.bellAt[r + ':' + i]; ART.bell(g, px, py, bt !== undefined && G.now >= bt && G.now - bt < 1.5, t); } break;
          case 'domino': {
            ART.floor(g, rth, px, py, x, y);
            const fl = G.fall[r + ':' + i];
            if (!(f & 1)) ART.domino(g, px, py, false, 0, 'R');
            else if (!fl) ART.domino(g, px, py, true, 0, 'R');
            else if (G.now < fl.t) ART.domino(g, px, py, false, 0, fl.d);
            else if (G.now < fl.t + 0.12) ART.domino(g, px, py, false, (G.now - fl.t) / 0.12, fl.d);
            else ART.domino(g, px, py, true, 0, fl.d);
            break;
          }
        }
        if (tl.gem && !(f & 2)) ART.gem(g, px, py - PQL.baseH(tl) * LH, t);
        // 積んである物
        const s = st.it[i], base = PQL.baseH(tl);
        for (let k = 0; k < s.length; k++) {
          if (G.tileHide && G.tileHide.x === x && G.tileHide.y === y && G.tileHide.level === base + k) continue;
          if (k === 0) { g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(px + 2, py + 12 - base * LH, 12, 3); }
          ART.item(g, s[k], px, py, base + k, t);
        }
        if (showFront && x === fx && y === fy && D.r === S.r) drawFront(g, px, py, PQL.heightAt(L, S, r, x, y), t);
      }
      if (y === pRow && D.r === r) drawCat(g, t);
    }
    // 飛んでいる物
    if (G.fly) drawFly(g, t);
    // 粒子
    for (const p of G.parts) { g.globalAlpha = Math.min(1, p.life * 2); g.fillStyle = p.col; g.fillRect(Math.round(p.x), Math.round(p.y), 2, 2); }
    g.globalAlpha = 1;
    for (const p of G.pops) if (p.t > 0) { g.globalAlpha = Math.min(1, (p.life - p.t) * 3); ART.gem(g, Math.round(p.x) - 8, Math.round(p.y) - 6, 0); }
    g.globalAlpha = 1;
    g.restore();
    if (G.fade > 0) { g.fillStyle = `rgba(10,8,20,${G.fade})`; g.fillRect(0, 0, W, H); }
  };
  function drawFront(g, px, py, h, t) {
    const y = py - h * LH, a = 0.55 + 0.35 * Math.sin(t * 6);
    g.fillStyle = `rgba(255,255,255,${a})`;
    const c = [[0, 0, 4, 1], [0, 0, 1, 4], [12, 0, 4, 1], [15, 0, 1, 4], [0, 15, 4, 1], [0, 12, 1, 4], [12, 15, 4, 1], [15, 12, 1, 4]];
    for (const [a1, b1, w1, h1] of c) g.fillRect(px + a1, y + b1, w1, h1);
  }
  function catPos() {
    const D = G.disp;
    const x = D.fx ?? D.x, y = D.fy ?? D.y, h = D.fh ?? D.h;
    let px = G.ox + x * TS, py = G.oy + y * TS - h * LH - 4 - (D.jump || 0);
    if (D.nudge) { const [dx, dy] = PQL.DIR[D.nudge.d]; const k = Math.sin(Math.PI * D.nudge.p) * 2; px += dx * k; py += dy * k; }
    if (D.shakeT > 0) px += Math.round(Math.sin(D.shakeT * 60) * 1.5);
    return [Math.round(px), Math.round(py), h];
  }
  function drawCat(g, t) {
    const D = G.disp;
    const [px, py, h] = catPos();
    const sy = G.oy + (D.fy ?? D.y) * TS - h * LH;
    g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(px + 3, Math.round(sy) + 12 - (D.jump ? 0 : 0), 10, 3);
    const moving = G.cur && (G.cur.k === 'move');
    const frame = moving ? (Math.floor(G.cur.t / 0.05) % 2) : (Math.sin(t * 2.2) > 0.92 ? 0 : 0);
    const bob = moving ? (frame ? -1 : 0) : Math.round(Math.sin(t * 3) * 0.5);
    const spr = ART.catSprite(D.d, D.c, frame);
    g.drawImage(spr, px, py + bob - 1);
    // 持っている物
    if (G.S.h && !G.handHidden && D.r === G.S.r) ART.held(g, heldNow(), px, py + bob, t);
    else if (G.handHidden && G.fly && G.fly.from === 'tile') {
      // 持ち上げ中:前から持っていた物だけ表示
    }
  }
  function heldNow() { return G.S.h; }
  function drawFly(g, t) {
    const f = G.fly, e = f.e, [cx, cy] = catPos();
    const [tx, ty] = tilePos(e.x, e.y);
    const p = f.p, ease = 1 - Math.pow(1 - p, 2);
    if (f.from === 'tile') {
      const items = e.items, n = items.length;
      const lv0 = (G.S.rooms[G.S.r].it[PQL.idx(G.L, G.S.r, e.x, e.y)].length) + PQL.baseH(PQL.tileAt(G.L, G.S.r, e.x, e.y));
      const fromLv = e.from === 'bottom' ? PQL.baseH(PQL.tileAt(G.L, G.S.r, e.x, e.y)) : lv0;
      // 元から手に持っていた物は無い(手が空のときだけ持ち上げられる)
      for (let k = 0; k < n; k++) {
        const sx = tx, sy = ty - (fromLv + k) * LH;
        const ex = cx, ey = cy - 15 - k * LH;
        const x = sx + (ex - sx) * ease, y = sy + (ey - sy) * ease - Math.sin(Math.PI * p) * 8;
        ART.item(g, items[k], Math.round(x), Math.round(y), 0, t);
      }
    } else {
      const h = G.S.h;
      const sx = cx, sy = cy - 15 - h.length * LH;
      const ex = tx, ey = ty - e.level * LH;
      const x = sx + (ex - sx) * ease, y = sy + (ey - sy) * ease - Math.sin(Math.PI * p) * 6;
      ART.item(g, e.item, Math.round(x), Math.round(y), 0, t);
    }
  }

  root.GAME = G;
})(window);
