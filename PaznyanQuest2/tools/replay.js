// 各ステージの手順(levels.js の sol)を再生して、クリアできるか確かめる(開発用)
//   node tools/replay.js
'use strict';
const path = require('path');
const PQL = require(path.join(__dirname, '../js/logic.js'));
const { STAGES } = require(path.join(__dirname, '../js/levels.js'));
let bad = 0;
for (const def of STAGES) {
  const L = PQL.compile(def), S = PQL.newState(L);
  const moves = (def.sol || '').trim().split(/\s+/).filter(Boolean);
  let i = 0;
  for (; i < moves.length && !S.won; i++) {
    const ev = PQL.step(L, S, moves[i]);
    const msg = ev.find(e => e.t === 'msg' || e.t === 'bump' || e.t === 'jumpFail');
    if (msg) { console.log(`     ${def.id} 手${i + 1} ${moves[i]}: ${JSON.stringify(msg)} @${S.x},${S.y} hold=${S.h}`); }
  }
  if (S.won) console.log(`OK   ${def.id.padEnd(6)} ${i}手`);
  else { bad++; console.log(`NG   ${def.id.padEnd(6)} (手順 ${moves.length}) 位置 ${S.r}:${S.x},${S.y} hold=${S.h} cost=${S.c}`); }
}
process.exit(bad ? 1 : 0);
