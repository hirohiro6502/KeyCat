// ===== ステージデータ =====
// 文字の意味は js/logic.js の parseTile を参照。
// area: エリア番号 / kind: puzzle(パズル) domino(ドミノ・爽快) tower(封印塔)
// mapPos: ワールドマップ上の位置(マップの 480×270 座標)
(function (root) {
  'use strict';
  const STAGES = [
    // ---------------- エリア1:わくわく草原 ----------------
    {
      id: '1-1', area: 1, kind: 'puzzle', hint: 'h11', mapPos: [56, 152],
      sol: 'R R R A tU A R R R R R R A D D D D R tD A D D D',
      rooms: [{ map: [
        '####################',
        '#......#...........#',
        '#..@...c.....k.....#',
        '#......#...........#',
        '#*.....#####...#####',
        '########   #...#    ',
        '           #.*.#    ',
        '           ##K##    ',
        '           #...#    ',
        '           #.G.#    ',
        '           #####    ',
      ] }],
    },
    {
      id: '1-2', area: 1, kind: 'puzzle', hint: 'h12', mapPos: [100, 116],
      sol: 'D tR A U R R A A R R R R R R R R R R R A R R R R A R R',
      rooms: [{ map: [
        '#########################',
        '#......#_______##########',
        '#......#_______##########',
        '#.@..k.1111111..B.*.KG###',
        '#..b...#_______##########',
        '#*.....#_______##########',
        '#########################',
      ] }],
    },
    {
      id: '1-3', area: 1, kind: 'puzzle', hint: 'h13', mapPos: [146, 148],
      sol: 'R A tU A tR A tU A R R A L L tD A R R A L L tD A tU A R R R R R R A L L L L L L tU A R R R R R R R R tD A L L L L L L L L tD A R R R R R R R R tD A R R R R R R',
      legend: { X: { t: '.', items: 'kc' }, C: { t: '.', items: 'cc' } },
      rooms: [{ map: [
        '###################',
        '#...###############',
        '#.@.X.C...K....D.G#',
        '#*..#######W#######',
        '###################',
      ] }],
    },
    {
      id: 'D1', area: 1, kind: 'domino', hint: 'hD1', mapPos: [190, 106], bg: 'flower',
      sol: 'R R',
      rooms: [{ map: [
        '##########################',
        '#........................#',
        '#.@.dddddddddddddddddd...#',
        '#....................d...#',
        '#..*.*.*.*.*.*.......d...#',
        '#....................d...#',
        '#...dddddddddddddddddd...#',
        '#...d....................#',
        '#...d...*.*.*.*.*.*.*....#',
        '#...d....................#',
        '#...dddddddddddddddddddd!#',
        '##########################',
      ] }],
      startDir: 'R',
    },
    {
      id: '1-4', area: 1, kind: 'puzzle', hint: 'h14', mapPos: [232, 152],
      sol: 'R R R A tU A R R R R R A R R A tD A L L L L L L L tU A R R R R R R R tD A R R R R R R R R R',
      legend: { X: { t: '.', items: 'ik' } },
      rooms: [{ map: [
        '#######################',
        '#.....######.##########',
        '#.@.p.i....X.K.D.....G#',
        '#*....######W##########',
        '#######################',
      ] }],
    },
    {
      id: '1-5', area: 1, kind: 'puzzle', hint: 'h15', mapPos: [276, 114],
      sol: 'R R R R R R J A L D L L L L tD A L tD A R tD A A R R R R R R R R R R R R R R R A R R A R R',
      legend: { E: { t: '=', items: 'k' } },
      rooms: [{ map: [
        '#########################',
        '#...........#############',
        '#.@...s..=E.#############',
        '#...........1111111.B.KG#',
        '#..b........#############',
        '#*..........#############',
        '#########################',
      ] }],
    },
    {
      id: '1-6', area: 1, kind: 'puzzle', hint: 'h16', mapPos: [322, 148],
      sol: 'D tR A R R R U R R R R R R R R R R A R R U R R R R D R R',
      legend: { S: { to: [1, 3, 2] } },
      rooms: [
        { map: [
          '#########################',
          '#....$.#________#.......#',
          '#.@.t..1111$111.K...S..G#',
          '#..k...#________#.......#',
          '#########################',
        ] },
        { bg: 'cave', legend: { U: { to: [0, 21, 2], up: true } }, map: [
          '########################',
          '#.U....................#',
          '#..*.*.*.*.*.*.*.*.*.*.#',
          '#...*.*.*.*.*.*.*.*.*..#',
          '#..*.*.*.*.*.*.*.*.*.*.#',
          '#......................#',
          '#..dddddddddddddddddd!.#',
          '#......................#',
          '########################',
        ] },
      ],
    },
    {
      id: 'T1', area: 1, kind: 'tower', hint: 'hT1', mapPos: [384, 106], bg: 'tower',
      sol: 'R R R R A R R R R D tR A U tR A D tR A U R R R R R R R R R R R D tR J A U R R R R R R tU A tR A tU A A R R R A R R R R A R R R R R R',
      legend: { S: { to: [1, 2, 2] }, E: { t: '=', items: 'k' } },
      rooms: [
        { map: [
          '########################',
          '#......#.......#.......#',
          '#.@..p.i...c...D..s..S.#',
          '#*.....#...W...#.......#',
          '########################',
        ] },
        { legend: { U: { to: [0, 20, 2], up: true } }, map: [
          '#########################',
          '#.U...._.....############',
          '#......1..b..B...K....G##',
          '#..=E.._.....############',
          '#*....._....*############',
          '#########################',
        ] },
      ],
    },
    // ---------------- エリア2:かぜの谷 ----------------
    {
      id: '2-1', area: 2, kind: 'puzzle', hint: 'h21', mapPos: [560, 152], bg: 'valley',
      sol: 'R R D tL A U R R A A R R R R R R R R R R R R A R R R R',
      rooms: [{ map: [
        '########################',
        '#......#<<<<<<<<########',
        '#.@.p..i<<<<<<<<...K..G#',
        '#..k...#<<<<<<<<########',
        '########################',
      ] }],
    },
    {
      id: '2-2', area: 2, kind: 'puzzle', hint: 'h22', mapPos: [612, 112], bg: 'valley',
      sol: 'R R R D tR A U R R tU A L L L L tD A R R R R tU A L D A L L L tD A A U R R R R R R R R R R R R R R R A R R R R',
      rooms: [{ map: [
        '##########################',
        '#......W#<<<<<<<##########',
        '#.@..p...<<<<<<<D..K..G..#',
        '#..c..c.#<<<<<<<##########',
        '#..i..k.##################',
        '##########################',
      ] }],
    },
  ];
  // マップのノード(ステージ以外も含む)
  const MAP_EXTRA = [
    { id: 'T2', area: 2, kind: 'tower', soon: true, mapPos: [700, 106] },
    { id: 'FINAL', area: 3, kind: 'final', soon: true, need: 16, mapPos: [800, 76] },
  ];
  const AREAS = [
    { n: 1, x0: 0, unlock: null },
    { n: 2, x0: 440, unlock: 'T1' },
  ];
  const api = { STAGES, MAP_EXTRA, AREAS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.PQLevels = api;
})(typeof window !== 'undefined' ? window : globalThis);
