// ===== ワールドマップ =====
// ステージの順番は自由。エリアは前のエリアの封印塔をクリアすると開く。
// さいごの塔はクリアしたステージ数で開く。
(function (root) {
  'use strict';
  const W = 480, H = 270, WORLD = 880;
  const M = { nodes: [], sel: 0, cam: 0, cat: null, t: 0, save: null, cb: {} };

  M.build = function () {
    const { STAGES, MAP_EXTRA } = PQLevels;
    M.nodes = [...STAGES.map(s => ({ id: s.id, area: s.area, kind: s.kind, pos: s.mapPos, def: s })), ...MAP_EXTRA.map(e => ({ ...e, pos: e.mapPos }))]
      .sort((a, b) => a.pos[0] - b.pos[0]);
  };
  M.isOpen = function (n, save) {
    if (n.soon) return false;
    if (n.area === 1) return true;
    const area = PQLevels.AREAS.find(a => a.n === n.area);
    return !area || !area.unlock || !!save.cleared[area.unlock];
  };
  M.lockReason = function (n, save) {
    if (n.kind === 'final') {
      const c = Object.keys(save.cleared).length;
      return I18N.t('needClears', { n: Math.max(0, n.need - c) }) + '\n(' + I18N.t('soon') + ')';
    }
    if (n.soon) return I18N.t('soon');
    return I18N.t('towerLock');
  };
  M.enter = function (save, cb) {
    M.save = save; M.cb = cb || {};
    if (!M.nodes.length) M.build();
    const i = M.nodes.findIndex(n => n.id === save.lastNode);
    M.sel = i >= 0 ? i : 0;
    const p = M.nodes[M.sel].pos;
    M.cat = { x: p[0], y: p[1], tx: p[0], ty: p[1], d: 'D' };
    M.cam = clampCam(p[0] - W / 2);
    M.cb.onSelect && M.cb.onSelect(M.nodes[M.sel]);
  };
  const clampCam = x => Math.max(0, Math.min(WORLD - W, x));
  M.current = () => M.nodes[M.sel];

  M.input = function (name) {
    if (['left', 'right', 'up', 'down'].includes(name)) {
      const cur = M.nodes[M.sel];
      const dx = { left: -1, right: 1, up: 0, down: 0 }[name], dy = { left: 0, right: 0, up: -1, down: 1 }[name];
      // その方向にあるいちばん近いノード
      let best = -1, bd = 1e9;
      M.nodes.forEach((n, i) => {
        if (i === M.sel) return;
        const vx = n.pos[0] - cur.pos[0], vy = n.pos[1] - cur.pos[1];
        const along = vx * dx + vy * dy; if (along <= 0) return;
        const side = Math.abs(vx * dy) + Math.abs(vy * dx);
        const score = along + side * 2.2;
        if (score < bd) { bd = score; best = i; }
      });
      if (best < 0 && (name === 'up' || name === 'down')) best = M.sel + (name === 'up' ? 1 : -1);
      if (best >= 0 && best < M.nodes.length) {
        M.sel = best; const p = M.nodes[best].pos;
        M.cat.tx = p[0]; M.cat.ty = p[1];
        M.cat.d = Math.abs(p[0] - M.cat.x) > Math.abs(p[1] - M.cat.y) ? (p[0] > M.cat.x ? 'R' : 'L') : (p[1] > M.cat.y ? 'D' : 'U');
        AU.play('cursor');
        M.cb.onSelect && M.cb.onSelect(M.nodes[best]);
      }
      return;
    }
    if (name === 'a') {
      const n = M.nodes[M.sel];
      if (!M.isOpen(n, M.save)) { AU.play('error'); M.cb.onToast && M.cb.onToast(M.lockReason(n, M.save)); return; }
      AU.play('ok');
      M.cb.onPlay && M.cb.onPlay(n);
    }
  };
  // マウス・タッチでノードを選ぶ
  M.click = function (gx, gy) {
    const wx = gx + M.cam;
    let hit = -1;
    M.nodes.forEach((n, i) => { if (Math.hypot(n.pos[0] - wx, n.pos[1] - 6 - gy) < 16) hit = i; });
    if (hit < 0) return;
    if (hit === M.sel) M.input('a');
    else { M.sel = hit; const p = M.nodes[hit].pos; M.cat.tx = p[0]; M.cat.ty = p[1]; AU.play('cursor'); M.cb.onSelect && M.cb.onSelect(M.nodes[hit]); }
  };

  M.update = function (dt) {
    M.t += dt;
    const c = M.cat; if (!c) return;
    const dx = c.tx - c.x, dy = c.ty - c.y, d = Math.hypot(dx, dy), sp = 260 * dt;
    if (d > sp) { c.x += dx / d * sp; c.y += dy / d * sp; c.moving = true; } else { c.x = c.tx; c.y = c.ty; c.moving = false; }
    const want = clampCam(c.x - W / 2);
    M.cam += (want - M.cam) * Math.min(1, dt * 6);
  };

  const R = ART.rect;
  M.draw = function (g) {
    const t = M.t, cam = Math.round(M.cam), save = M.save;
    g.save(); g.translate(-cam, 0);
    // 空
    const sky = g.createLinearGradient(0, 0, 0, 80);
    sky.addColorStop(0, '#7cc8f2'); sky.addColorStop(1, '#c9ecff');
    g.fillStyle = sky; g.fillRect(cam, 0, W, 80);
    // 雲
    for (let i = 0; i < 9; i++) { const x = (i * 131 + t * 5) % (WORLD + 100) - 50, y = 10 + (i * 37) % 34; R(g, x, y, 34, 7, '#fff'); R(g, x + 6, y - 5, 20, 5, '#fff'); R(g, x + 3, y + 7, 28, 2, '#dff3ff'); }
    // 遠くの山
    for (let x = 0; x < WORLD; x += 2) { const h = 30 + Math.sin(x * 0.02) * 12 + Math.sin(x * 0.053) * 8; R(g, x, 80 - h, 2, h, x < 440 ? '#9fd6a0' : x < 760 ? '#e8c9a0' : '#9a8fc0'); }
    // 地面
    R(g, 0, 70, 440, 200, '#86d462'); R(g, 440, 70, 320, 200, '#e3c47e'); R(g, 760, 70, 120, 200, '#6e5d92');
    for (let x = 0; x < WORLD; x += 16) for (let y = 72; y < H; y += 16) {
      const h = (x * 7 + y * 13) % 11;
      if (h === 0) R(g, x + 5, y + 4, 1, 2, x < 440 ? '#a5e67c' : x < 760 ? '#f0d898' : '#8a78b0');
      if (h === 3 && x < 440) { R(g, x + 8, y + 8, 3, 1, '#ff8fc8'); R(g, x + 9, y + 7, 1, 3, '#ff8fc8'); R(g, x + 9, y + 8, 1, 1, '#fff07a'); }
    }
    // 木
    [[20, 84], [210, 80], [300, 176], [26, 170], [170, 180], [410, 84], [380, 170], [120, 186]].forEach(([x, y]) => tree(g, x, y));
    // 谷の岩と風
    [[470, 86], [520, 176], [660, 170], [720, 84]].forEach(([x, y]) => rock(g, x, y));
    for (let i = 0; i < 6; i++) { const y = 96 + i * 14, x = 450 + ((t * 60 + i * 70) % 300); R(g, x, y, 14, 1, 'rgba(255,255,255,.7)'); }
    // さいごの塔(遠景)
    R(g, 820, 10, 26, 70, '#4a3b6b'); R(g, 816, 4, 34, 8, '#57487a');
    R(g, 829, 30, 8, 10, Math.sin(t * 2) > 0 ? '#ffd23a' : '#c98a00');
    // エリアの名前
    areaLabel(g, 14, 62, I18N.t('area1'), '#2c6b37');
    areaLabel(g, 452, 62, I18N.t('area2'), '#7e4f2e');
    areaLabel(g, 770, 62, I18N.t('area3'), '#2e2447');
    // 道
    const ns = M.nodes;
    g.fillStyle = '#f5e6c0';
    for (let i = 0; i + 1 < ns.length; i++) {
      const [x0, y0] = ns[i].pos, [x1, y1] = ns[i + 1].pos, n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 7);
      for (let k = 1; k < n; k++) { const x = x0 + (x1 - x0) * k / n, y = y0 + (y1 - y0) * k / n; g.fillRect(Math.round(x) - 2, Math.round(y) - 1, 4, 3); }
    }
    // ノード
    ns.forEach((n, i) => drawNode(g, n, i === M.sel, t, save));
    // ネコ
    const c = M.cat;
    if (c) {
      const fr = c.moving ? Math.floor(t * 10) % 2 : 0;
      R(g, Math.round(c.x) - 5, Math.round(c.y) - 2, 10, 3, 'rgba(0,0,0,.25)');
      g.drawImage(ART.catSprite(c.moving ? c.d : 'D', 'n', fr), Math.round(c.x) - 8, Math.round(c.y) - 30 + (c.moving ? -fr : Math.round(Math.sin(t * 4))));
    }
    g.restore();
  };
  function areaLabel(g, x, y, s, col) {
    g.font = 'bold 10px sans-serif'; g.textBaseline = 'middle';
    const w = g.measureText(s).width + 12;
    R(g, x, y - 7, w, 14, 'rgba(255,255,255,.85)'); R(g, x, y + 7, w, 1, col);
    g.fillStyle = col; g.fillText(s, x + 6, y + 1);
  }
  function tree(g, x, y) { R(g, x - 2, y - 4, 4, 8, '#6b4a2a'); R(g, x - 9, y - 18, 18, 14, '#2f8a3e'); R(g, x - 6, y - 23, 12, 6, '#3fa04c'); R(g, x - 5, y - 16, 4, 3, '#55b860'); }
  function rock(g, x, y) { R(g, x - 10, y - 8, 20, 10, '#a06a40'); R(g, x - 7, y - 12, 14, 5, '#b8804e'); R(g, x - 4, y - 10, 5, 2, '#d09a68'); }
  function drawNode(g, n, sel, t, save) {
    const [x, y] = n.pos, open = M.isOpen(n, save), cl = !!save.cleared[n.id];
    const b = sel ? Math.round(Math.sin(t * 6) * 1) : 0;
    R(g, x - 9, y - 1, 18, 4, 'rgba(0,0,0,.2)');
    if (n.kind === 'tower' || n.kind === 'final') {
      const big = n.kind === 'final';
      const c1 = !open ? '#8c8c9c' : cl ? '#ffd23a' : '#8b7a9a', c2 = !open ? '#6c6c7c' : cl ? '#c98a00' : '#5d4f6e';
      R(g, x - 7, y - 26 - (big ? 6 : 0), 14, 26 + (big ? 6 : 0), c2); R(g, x - 6, y - 25 - (big ? 6 : 0), 12, 24 + (big ? 6 : 0), c1);
      R(g, x - 9, y - 30 - (big ? 6 : 0), 18, 5, c2); R(g, x - 3, y - 36 - (big ? 6 : 0), 6, 6, c2);
      R(g, x - 2, y - 18, 4, 6, '#2b2030'); R(g, x - 2, y - 7, 4, 7, '#2b2030');
    } else if (n.kind === 'domino') {
      const col = !open ? '#8c8c9c' : cl ? '#ffd23a' : '#ff6f91';
      R(g, x - 9, y - 9, 18, 10, '#2b2030'); R(g, x - 8, y - 8, 16, 8, col);
      for (let k = 0; k < 3; k++) { R(g, x - 7 + k * 5, y - 20 + (k === 1 ? 0 : 2), 4, 12, '#2b2030'); R(g, x - 6 + k * 5, y - 19 + (k === 1 ? 0 : 2), 2, 10, '#fffaf0'); }
    } else {
      const col = !open ? '#8c8c9c' : cl ? '#ffd23a' : '#ffffff';
      R(g, x - 9, y - 8, 18, 9, '#3b2b33'); R(g, x - 8, y - 9, 16, 9, col); R(g, x - 8, y - 1, 16, 2, cl ? '#c98a00' : '#b8b2cc');
      g.font = 'bold 8px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#3b2b33';
      g.fillText(n.id, x, y - 4); g.textAlign = 'left';
    }
    if (!open) { R(g, x + 4, y - 16, 8, 6, '#5d5870'); R(g, x + 5, y - 20, 6, 4, '#5d5870'); R(g, x + 6, y - 19, 4, 3, '#8c8c9c'); }
    if (cl) { R(g, x + 6, y - 14, 3, 3, '#fff'); R(g, x + 9, y - 17, 2, 3, '#fff'); }
    if (sel) {
      g.fillStyle = `rgba(255,255,255,${0.6 + 0.4 * Math.sin(t * 8)})`;
      const yy = y + 5 + b;
      g.fillRect(x - 12, yy, 4, 1); g.fillRect(x + 8, yy, 4, 1); g.fillRect(x - 12, yy - 3, 1, 3); g.fillRect(x + 11, yy - 3, 1, 3);
    }
  }
  M.toWorld = gx => gx + M.cam;
  root.MAP = M;
})(window);
