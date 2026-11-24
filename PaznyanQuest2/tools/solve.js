// ステージが解けるかを探索で確かめる(開発用)
//   node tools/solve.js            全ステージ
//   node tools/solve.js 1-3 -v     1つだけ、手順も表示
//
// 歩くだけで行ける範囲を1つの状態にまとめ(倉庫番の解き方と同じ)、
// 「もつ・おく」「ジャンプ」などで盤面が変わるところだけを探索する。
'use strict';
const path = require('path');
const PQL = require(path.join(__dirname, '../js/logic.js'));
const { STAGES } = require(path.join(__dirname, '../js/levels.js'));

const MOVES = ['U', 'D', 'L', 'R'];
// 位置と向き以外の状態
const core = S => { const T = PQL.clone(S); T.x = T.y = 0; T.d = 'U'; return PQL.hash(T); };

function solve(def, limit = 2e6) {
  const L = PQL.compile(def);
  const S0 = PQL.newState(L);
  const seen = new Map();   // マクロ状態のキー → [親キー, 手順]
  // 歩ける範囲を広げる。盤面が変わる移動(マット・階段・スイッチなど)は別の状態として返す
  function region(S) {
    const ck = core(S), pos = new Map([[S.x + ',' + S.y, { S, path: [] }]]);
    const q = [{ S, path: [] }], out = [];
    let win = null;
    while (q.length) {
      const { S: A, path: p } = q.shift();
      for (const m of MOVES) {
        const T = PQL.clone(A), ev = PQL.step(L, T, m);
        if (!PQL.changed(ev)) continue;
        if (T.won) { win = win || p.concat(m); continue; }
        if (core(T) !== ck) { out.push({ S: T, path: p.concat(m) }); continue; }
        const k = T.x + ',' + T.y;
        if (pos.has(k)) continue;
        pos.set(k, { S: T, path: p.concat(m) }); q.push({ S: T, path: p.concat(m) });
      }
    }
    // 降りるのは一方通行なので、行ける範囲そのもの(全部の位置)をキーにする
    const rep = [...pos.keys()].sort().join(';');
    return { key: ck + '#' + rep, pos, out, win };
  }
  const r0 = region(S0);
  seen.set(r0.key, null);
  let q = [{ R: r0 }], n = 0;
  const trace = (k, tail) => { const m = []; while (seen.get(k)) { const [p, a] = seen.get(k); m.unshift(...a); k = p; } return m.concat(tail); };
  while (q.length) {
    const nq = [];
    for (const { R } of q) {
      if (R.win) return { ok: true, moves: trace(R.key, R.win), states: seen.size };
      const next = [...R.out];
      for (const { S, path: p } of R.pos.values()) {
        for (const d of MOVES) {
          for (const a of ['A', 'J']) {
            if (a === 'J' && S.c !== 's') continue;
            const T = PQL.clone(S);
            const pre = S.d === d ? [] : ['t' + d];
            if (pre.length) PQL.step(L, T, pre[0]);
            const ev = PQL.step(L, T, a);
            if (!PQL.changed(ev)) continue;
            next.push({ S: T, path: p.concat(pre, [a]) });
          }
        }
      }
      for (const { S: T, path: p } of next) {
        if (T.won) return { ok: true, moves: trace(R.key, p), states: seen.size };
        const R2 = region(T);
        if (seen.has(R2.key)) continue;
        seen.set(R2.key, [R.key, p]);
        nq.push({ R: R2 });
        if (++n > limit) return { ok: false, states: seen.size, reason: 'limit' };
      }
    }
    q = nq;
  }
  return { ok: false, states: seen.size, reason: 'unsolvable' };
}

const want = process.argv[2] && !process.argv[2].startsWith('-') ? process.argv[2] : null;
const verbose = process.argv.includes('-v');
let bad = 0;
for (const def of STAGES) {
  if (want && def.id !== want) continue;
  const t0 = Date.now();
  const res = solve(def);
  const ms = Date.now() - t0;
  if (res.ok) {
    const acts = res.moves.filter(m => m === 'A' || m === 'J').length;
    console.log(`OK   ${def.id.padEnd(6)} ${String(res.moves.length).padStart(4)} 手 (もつ/おく/ジャンプ ${acts})  ${res.states} 状態  ${ms}ms`);
    if (verbose) console.log('     ' + res.moves.join(' '));
  } else { bad++; console.log(`NG   ${def.id.padEnd(6)} ${res.reason}  ${res.states} 状態  ${ms}ms`); }
}
process.exit(bad ? 1 : 0);
