// ===== ゲームのルール(画面に依存しない純粋なロジック) =====
// ブラウザでは window.PQL、Node(tools/solve.js)では module.exports で使う。
//
// 盤面は1マス単位。高さの概念があり、
//   マスの高さ = 地形の高さ(床0 / ブロック1 / 高ブロック2)+ 積んである物の数
// ネコはいまの高さ以下のマスへは歩いて移動できる(降りるのは自由、登るのはジャンプだけ)。
//
// 物(アイテム)は1文字で表し、マスごとに「下→上」の文字列で積み上げを持つ(最大2段)。
//   k=黄カギ b=青カギ r=赤カギ t=宝カギ c=木箱 i=鉄球(重い)
(function (root) {
  'use strict';

  const DIR = { U: [0, -1], D: [0, 1], L: [-1, 0], R: [1, 0] };
  const ITEM = {
    k: { w: 1, key: 'k' }, b: { w: 1, key: 'b' }, r: { w: 1, key: 'r' }, t: { w: 1, key: 't' },
    c: { w: 2 }, i: { w: 2, heavy: true },
  };
  const MAX_STACK = 2;
  // コスチューム:n=ふつう p=パワーニャン s=スカイニャン
  const COST = {
    n: { cap: 2, heavy: false, jump: false },
    p: { cap: 4, heavy: true, jump: false },
    s: { cap: 2, heavy: false, jump: true },
  };
  // フラグのビット
  const F_OPEN = 1;   // カギ穴が開いた / 扉が開いている / ドミノが倒れた / ベルが鳴った / 宝箱を開けた
  const F_GEM = 2;    // ダイヤを取った

  // ---------- ステージの読み込み ----------
  // 地形の文字
  //  # 壁   . 床   (空白) 何もない   _ 穴   = ブロック(高さ1)   H 高ブロック(高さ2)
  //  K B R カギ穴(黄・青・赤)   1 2 3 封印床(黄・青・赤のカギを持つ間だけ見える)
  //  $ 宝箱(宝カギを持つ間だけ見える)   p s n 着替えマット(パワー・スカイ・ふつう)
  //  + スイッチ床(物かネコ)   W 重さ床(物を2つ積むと反応)   D 扉(部屋のスイッチが全部入ると開く)
  //  < > ^ v 風(その向きにネコを飛ばす。鉄球を持っていると平気)
  //  G ゴール   d ドミノ   ! ベル(ドミノが当たると鳴る)   * ダイヤ   @ スタート
  //  k b r t c i 物(床の上に置いてある)
  //  そのほかの文字はステージごとの legend で定義する({t:'地形文字', items:'物', start:true, to:[部屋,x,y]})
  const SEAL_COLOR = { 1: 'k', 2: 'b', 3: 'r' };
  const LOCK_COLOR = { K: 'k', B: 'b', R: 'r' };
  const MAT_COST = { p: 'p', s: 's', n: 'n' };
  const WIND_DIR = { '<': 'L', '>': 'R', '^': 'U', v: 'D' };

  function parseTile(ch) {
    if (ch === '#') return { k: 'wall' };
    if (ch === ' ') return { k: 'void' };
    if (ch === '.') return { k: 'floor' };
    if (ch === '_') return { k: 'pit' };
    if (ch === '=') return { k: 'block', h: 1 };
    if (ch === 'H') return { k: 'block', h: 2 };
    if (LOCK_COLOR[ch]) return { k: 'lock', c: LOCK_COLOR[ch] };
    if (SEAL_COLOR[ch]) return { k: 'seal', c: SEAL_COLOR[ch] };
    if (ch === '$') return { k: 'chest' };
    if (MAT_COST[ch] && 'psn'.includes(ch)) return { k: 'mat', c: MAT_COST[ch] };
    if (ch === '+') return { k: 'plate' };
    if (ch === 'W') return { k: 'wplate' };
    if (ch === 'D') return { k: 'door' };
    if (WIND_DIR[ch]) return { k: 'wind', d: WIND_DIR[ch] };
    if (ch === 'G') return { k: 'goal' };
    if (ch === 'd') return { k: 'domino' };
    if (ch === '!') return { k: 'bell' };
    if (ch === '*') return { k: 'floor', gem: true };
    if (ch === '@') return { k: 'floor', start: true };
    return null;
  }

  function compile(def) {
    const L = { id: def.id, kind: def.kind || 'puzzle', rooms: [], start: null };
    def.rooms.forEach((rd, ri) => {
      const rows = rd.map, h = rows.length, w = Math.max(...rows.map(r => r.length));
      const room = { w, h, tiles: [], items0: [], plates: 0, bg: rd.bg || def.bg || 'grass', name: rd.name };
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const ch = rows[y][x] === undefined ? ' ' : rows[y][x];
        let tile, items = '';
        const lg = (rd.legend && rd.legend[ch]) || (def.legend && def.legend[ch]);
        if (lg) {
          tile = Object.assign({}, parseTile(lg.t || '.'));
          if (lg.items) items = lg.items;
          if (lg.start) tile.start = true;
          if (lg.to) { tile = { k: 'stair', to: lg.to, up: !!lg.up }; }
          if (lg.gem) tile.gem = true;
        } else if ('kbrtci'.includes(ch) && ch !== ' ') {
          tile = { k: 'floor' }; items = ch;
        } else {
          tile = parseTile(ch);
          if (!tile) throw new Error(`stage ${def.id} room ${ri}: unknown char '${ch}' at ${x},${y}`);
        }
        if (tile.start) L.start = { r: ri, x, y, d: def.startDir || 'D' };
        if (tile.k === 'plate' || tile.k === 'wplate') room.plates++;
        room.tiles.push(tile); room.items0.push(items);
      }
      L.rooms.push(room);
    });
    if (!L.start) throw new Error('no start in ' + def.id);
    return L;
  }

  // ---------- 状態 ----------
  function newState(L, opened) {
    const S = {
      r: L.start.r, x: L.start.x, y: L.start.y, d: L.start.d, c: 'n', h: '',
      rooms: L.rooms.map((rm, ri) => {
        const f = new Array(rm.w * rm.h).fill(0);
        if (opened) rm.tiles.forEach((t, i) => { if (t.k === 'chest' && opened(ri, i % rm.w, (i / rm.w) | 0)) f[i] |= F_OPEN; });
        return { it: rm.items0.slice(), f };
      }),
      gems: 0, won: false,
    };
    return S;
  }
  function clone(S) {
    return { r: S.r, x: S.x, y: S.y, d: S.d, c: S.c, h: S.h, gems: S.gems, won: S.won,
      rooms: S.rooms.map(rm => ({ it: rm.it.slice(), f: rm.f.slice() })) };
  }
  // 解の探索用(ダイヤと宝箱以外)
  function hash(S) {
    let s = S.r + ',' + S.x + ',' + S.y + ',' + S.d + S.c + S.h;
    for (const rm of S.rooms) {
      s += '|';
      const it = rm.it, f = rm.f;
      for (let i = 0; i < it.length; i++) {
        if (it[i]) s += i + it[i];
        if (f[i] & F_OPEN) s += i + 'o';
      }
    }
    return s;
  }

  // ---------- 盤面の問い合わせ ----------
  const VOID = { k: 'void' };
  function tileAt(L, r, x, y) {
    const rm = L.rooms[r];
    if (x < 0 || y < 0 || x >= rm.w || y >= rm.h) return VOID;
    return rm.tiles[y * rm.w + x];
  }
  const idx = (L, r, x, y) => y * L.rooms[r].w + x;
  const inside = (L, r, x, y) => x >= 0 && y >= 0 && x < L.rooms[r].w && y < L.rooms[r].h;
  function itemsAt(L, S, r, x, y) { return inside(L, r, x, y) ? S.rooms[r].it[idx(L, r, x, y)] : ''; }
  function flagAt(L, S, r, x, y) { return inside(L, r, x, y) ? S.rooms[r].f[idx(L, r, x, y)] : 0; }
  const holdsKey = (S, c) => S.h.includes(c);
  // その状態で見えるか(封印床・宝箱)
  function visible(t, S) {
    if (t.k === 'seal') return holdsKey(S, t.c);
    if (t.k === 'chest') return holdsKey(S, 't');
    return true;
  }
  const baseH = t => (t.k === 'block' ? t.h : 0);
  // 'solid' = ぶつかる / 'pit' = 落ちる(入れない) / 'ok'
  function kindOf(L, S, r, x, y) {
    const t = tileAt(L, r, x, y), f = flagAt(L, S, r, x, y);
    switch (t.k) {
      case 'wall': case 'void': case 'bell': return 'solid';
      case 'pit': return 'pit';
      case 'seal': return visible(t, S) ? 'ok' : 'pit';
      case 'chest': return visible(t, S) ? 'solid' : 'ok';
      case 'lock': case 'door': return f & F_OPEN ? 'ok' : 'solid';
      case 'domino': return f & F_OPEN ? 'ok' : 'solid';
      default: return 'ok';
    }
  }
  function heightAt(L, S, r, x, y) { return baseH(tileAt(L, r, x, y)) + itemsAt(L, S, r, x, y).length; }
  function playerH(L, S) { return heightAt(L, S, S.r, S.x, S.y); }
  // 物を置けるマスか
  function acceptsItems(L, S, r, x, y) {
    const t = tileAt(L, r, x, y), f = flagAt(L, S, r, x, y);
    switch (t.k) {
      case 'floor': case 'plate': case 'wplate': case 'wind': case 'block': return true;
      case 'lock': case 'door': return !!(f & F_OPEN);
      case 'chest': return !visible(t, S) ? false : false;
      default: return false;
    }
  }
  const weightOf = s => [...s].reduce((a, ch) => a + ITEM[ch].w, 0);
  const canCarry = (S, s) => {
    const cs = COST[S.c];
    if (!cs.heavy && [...s].some(ch => ITEM[ch].heavy)) return false;
    return weightOf(s) <= cs.cap;
  };

  // ---------- スイッチと扉 ----------
  function plateActive(L, S, r, i) {
    const t = L.rooms[r].tiles[i], it = S.rooms[r].it[i];
    const w = L.rooms[r].w, px = i % w, py = (i / w) | 0;
    if (t.k === 'plate') return it.length >= 1 || (S.r === r && S.x === px && S.y === py);
    if (t.k === 'wplate') return it.length >= 2;
    return false;
  }
  function updateDoors(L, S, r, ev) {
    const rm = L.rooms[r], st = S.rooms[r];
    if (!rm.plates) return;
    let all = true;
    rm.tiles.forEach((t, i) => { if ((t.k === 'plate' || t.k === 'wplate') && !plateActive(L, S, r, i)) all = false; });
    rm.tiles.forEach((t, i) => {
      if (t.k !== 'door') return;
      const was = !!(st.f[i] & F_OPEN);
      const px = i % rm.w, py = (i / rm.w) | 0;
      const occ = st.it[i].length > 0 || (S.r === r && S.x === px && S.y === py);
      const now = all || (was && occ);
      if (now !== was) {
        st.f[i] = now ? st.f[i] | F_OPEN : st.f[i] & ~F_OPEN;
        ev.push({ t: now ? 'doorOpen' : 'doorClose', x: px, y: py });
      }
    });
  }

  // ---------- マスに入ったとき ----------
  function enter(L, S, ev) {
    const t = tileAt(L, S.r, S.x, S.y), i = idx(L, S.r, S.x, S.y), st = S.rooms[S.r];
    if (t.gem && !(st.f[i] & F_GEM)) { st.f[i] |= F_GEM; S.gems++; ev.push({ t: 'gem', x: S.x, y: S.y, n: 1 }); }
    if (t.k === 'mat' && S.c !== t.c) {
      const old = S.c; S.c = t.c;
      if (!canCarry(S, S.h)) { S.c = old; ev.push({ t: 'msg', m: 'matHeavy' }); }
      else ev.push({ t: 'costume', c: t.c, x: S.x, y: S.y });
    }
    if (t.k === 'goal') { S.won = true; ev.push({ t: 'goal' }); }
    if (t.k === 'stair') {
      const [r2, x2, y2] = t.to;
      ev.push({ t: 'stair', from: S.r, to: r2, up: t.up });
      S.r = r2; S.x = x2; S.y = y2;
      enter(L, S, ev);
    }
  }

  // 風:鉄球を持っていなければ、風の向きに飛ばされる
  function wind(L, S, ev) {
    for (let n = 0; n < 64; n++) {
      const t = tileAt(L, S.r, S.x, S.y);
      if (t.k !== 'wind' || S.h.includes('i')) return;
      const [dx, dy] = DIR[t.d], nx = S.x + dx, ny = S.y + dy;
      if (kindOf(L, S, S.r, nx, ny) !== 'ok' || heightAt(L, S, S.r, nx, ny) > playerH(L, S)) {
        if (n === 0) ev.push({ t: 'windStop' });
        return;
      }
      ev.push({ t: 'wind', x0: S.x, y0: S.y, x: nx, y: ny, h0: playerH(L, S), h1: heightAt(L, S, S.r, nx, ny), d: t.d });
      S.x = nx; S.y = ny;
      enter(L, S, ev);
      if (S.won) return;
    }
  }

  // ドミノ:押したところから連鎖して倒れる(同時に枝分かれもする)
  function dominoChain(L, S, x0, y0, dir, ev) {
    const r = S.r, st = S.rooms[r], seq = [];
    let q = [[x0, y0, dir, 0]];
    st.f[idx(L, r, x0, y0)] |= F_OPEN;
    let bell = null;
    while (q.length) {
      const nq = [];
      for (const [x, y, d, tm] of q) {
        seq.push({ x, y, d, tm });
        S.gems++;
        for (const nd of ['U', 'D', 'L', 'R']) {
          const [dx, dy] = DIR[nd], nx = x + dx, ny = y + dy;
          const t = tileAt(L, r, nx, ny);
          if (t.k === 'domino' && !(flagAt(L, S, r, nx, ny) & F_OPEN)) {
            st.f[idx(L, r, nx, ny)] |= F_OPEN; nq.push([nx, ny, nd, tm + 1]);
          } else if (t.k === 'bell' && !(flagAt(L, S, r, nx, ny) & F_OPEN) && !bell) {
            st.f[idx(L, r, nx, ny)] |= F_OPEN; bell = { x: nx, y: ny, tm: tm + 1 };
          }
        }
      }
      q = nq;
    }
    ev.push({ t: 'domino', seq });
    if (bell) {
      S.gems += 20;
      ev.push({ t: 'bell', x: bell.x, y: bell.y, tm: bell.tm, n: 20 });
      if (L.kind === 'domino') { S.won = true; ev.push({ t: 'goal', delay: bell.tm }); }
    }
  }

  // ---------- 操作 ----------
  function turn(L, S, d) { S.d = d; return [{ t: 'turn', d }]; }

  function move(L, S, d) {
    const ev = [];
    S.d = d;
    const [dx, dy] = DIR[d], nx = S.x + dx, ny = S.y + dy;
    const k = kindOf(L, S, S.r, nx, ny), t = tileAt(L, S.r, nx, ny);
    if (t.k === 'domino' && k === 'solid') {
      dominoChain(L, S, nx, ny, d, ev);
      updateDoors(L, S, S.r, ev);
      return ev;
    }
    if (k !== 'ok') { ev.push({ t: 'bump', d, why: k }); return ev; }
    const h0 = playerH(L, S), h1 = heightAt(L, S, S.r, nx, ny);
    if (h1 > h0) { ev.push({ t: 'bump', d, why: 'high' }); return ev; }
    const r0 = S.r;
    ev.push({ t: 'move', x0: S.x, y0: S.y, x: nx, y: ny, h0, h1 });
    S.x = nx; S.y = ny;
    enter(L, S, ev);
    if (!S.won) wind(L, S, ev);
    updateDoors(L, S, S.r, ev);
    if (S.r !== r0) updateDoors(L, S, r0, ev);
    return ev;
  }

  // 前のマス
  const front = S => { const [dx, dy] = DIR[S.d]; return [S.x + dx, S.y + dy]; };

  // もちあげる / おく / はめる / あける
  function act(L, S) {
    const ev = [];
    const [fx, fy] = front(S);
    const r = S.r, t = tileAt(L, r, fx, fy), st = S.rooms[r];
    const ph = playerH(L, S);
    const fk = kindOf(L, S, r, fx, fy);
    if (!S.h) {
      // --- もちあげる ---
      if (fk !== 'ok') { ev.push({ t: 'nothing' }); return ev; }
      const i = idx(L, r, fx, fy), s = st.it[i];
      if (!s) { ev.push({ t: 'nothing' }); return ev; }
      const base = baseH(t);
      if (ph < base) { ev.push({ t: 'msg', m: 'tooHigh' }); return ev; }
      let take, rest;
      if (ph > base) { take = s.slice(-1); rest = s.slice(0, -1); }       // 上から:いちばん上だけ
      else if (canCarry(S, s)) { take = s; rest = ''; }                   // 同じ高さ:まとめて持てるなら全部
      else { take = s[0]; rest = s.slice(1); }                            // 持てないなら下だけ抜く
      if (!canCarry(S, take)) { ev.push({ t: 'msg', m: [...take].some(ch => ITEM[ch].heavy) ? 'heavy' : 'tooMuch' }); return ev; }
      st.it[i] = rest; S.h = take;
      ev.push({ t: 'lift', x: fx, y: fy, items: take, from: ph > base ? 'top' : (rest ? 'bottom' : 'all'), rest });
      updateDoors(L, S, r, ev);
      wind(L, S, ev);
      return ev;
    }
    // --- 持っているとき ---
    const top = S.h.slice(-1);
    // 宝箱をあける
    if (t.k === 'chest' && visible(t, S) && !(flagAt(L, S, r, fx, fy) & F_OPEN)) {
      st.f[idx(L, r, fx, fy)] |= F_OPEN;
      ev.push({ t: 'chest', x: fx, y: fy, n: 30 });
      return ev;
    }
    // カギ穴にはめる
    if (t.k === 'lock' && !(flagAt(L, S, r, fx, fy) & F_OPEN)) {
      if (ITEM[top].key !== t.c) { ev.push({ t: 'msg', m: ITEM[top].key ? 'wrongKey' : 'notKey' }); return ev; }
      const nh = S.h.slice(0, -1);
      if (!seatSafe(L, S, nh)) { ev.push({ t: 'msg', m: 'sealFall' }); return ev; }
      S.h = nh; st.f[idx(L, r, fx, fy)] |= F_OPEN;
      ev.push({ t: 'unlock', x: fx, y: fy, c: t.c });
      return ev;
    }
    // おく(いちばん上の1つ)
    if (fk !== 'ok' || !acceptsItems(L, S, r, fx, fy)) { ev.push({ t: 'msg', m: fk === 'pit' ? 'cantPutPit' : 'cantPut' }); return ev; }
    const i = idx(L, r, fx, fy), s = st.it[i];
    if (s.length >= MAX_STACK) { ev.push({ t: 'msg', m: 'stackFull' }); return ev; }
    if (baseH(t) + s.length > ph + 1) { ev.push({ t: 'msg', m: 'tooHigh' }); return ev; }
    const nh = S.h.slice(0, -1);
    if (!seatSafe(L, S, nh)) { ev.push({ t: 'msg', m: 'sealFall' }); return ev; }
    S.h = nh; st.it[i] = s + top;
    ev.push({ t: 'put', x: fx, y: fy, item: top, level: baseH(t) + s.length });
    updateDoors(L, S, r, ev);
    wind(L, S, ev);
    return ev;
  }
  // 封印床の上で、そのカギを手放すと落ちてしまう
  function seatSafe(L, S, nh) {
    const t = tileAt(L, S.r, S.x, S.y);
    return !(t.k === 'seal' && !nh.includes(t.c));
  }

  // ジャンプ(スカイニャンだけ。何か持っているとできない)
  function jump(L, S) {
    const ev = [];
    if (!COST[S.c].jump) { ev.push({ t: 'msg', m: 'needSky' }); return ev; }
    if (S.h) { ev.push({ t: 'msg', m: 'cantJumpHold' }); return ev; }
    const [dx, dy] = DIR[S.d], ph = playerH(L, S);
    let nx = S.x + dx, ny = S.y + dy;
    let k = kindOf(L, S, S.r, nx, ny);
    if (k === 'pit') {
      // 1マスの穴を飛びこえる
      const x2 = nx + dx, y2 = ny + dy;
      if (kindOf(L, S, S.r, x2, y2) === 'ok' && heightAt(L, S, S.r, x2, y2) <= ph) { nx = x2; ny = y2; k = 'ok'; }
    }
    if (k !== 'ok' || heightAt(L, S, S.r, nx, ny) > ph + 1) { ev.push({ t: 'jumpFail', d: S.d }); return ev; }
    const r0 = S.r;
    ev.push({ t: 'jump', x0: S.x, y0: S.y, x: nx, y: ny, h0: ph, h1: heightAt(L, S, S.r, nx, ny) });
    S.x = nx; S.y = ny;
    enter(L, S, ev);
    if (!S.won) wind(L, S, ev);
    updateDoors(L, S, S.r, ev);
    if (S.r !== r0) updateDoors(L, S, r0, ev);
    return ev;
  }

  // a: 'U' 'D' 'L' 'R'(向いて進む) / 'tU' など(向くだけ) / 'A'(もつ・おく) / 'J'(ジャンプ)
  function step(L, S, a) {
    if (S.won) return [];
    if (a === 'A') return act(L, S);
    if (a === 'J') return jump(L, S);
    if (a[0] === 't') return turn(L, S, a[1]);
    return move(L, S, a);
  }
  // 状態が変わったか(元に戻す用)
  const changed = ev => ev.some(e => !['nothing', 'msg', 'bump', 'jumpFail', 'windStop'].includes(e.t));

  const api = { DIR, ITEM, COST, F_OPEN, F_GEM, MAX_STACK, compile, newState, clone, hash, step, changed,
    tileAt, itemsAt, flagAt, heightAt, playerH, kindOf, visible, baseH, idx, front, plateActive, canCarry };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.PQL = api;
})(typeof window !== 'undefined' ? window : globalThis);
