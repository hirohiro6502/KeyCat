// ===== 画面の流れ:タイトル → (はじめての時は言語) → セーブ選択 → マップ ⇄ ステージ =====
(function () {
  'use strict';
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const t = (k, v) => I18N.t(k, v);
  const cv = $('#cv'), g = cv.getContext('2d');
  g.imageSmoothingEnabled = false;
  const NATIVE = window.pq2Native || null;   // Electron 版(Steam)で用意される

  I18N.init();

  // ---------- 画面サイズ(16:9 を画面いっぱいに) ----------
  function fit() {
    const vw = innerWidth, vh = innerHeight;
    const w = Math.min(vw, vh * 16 / 9), h = w * 9 / 16;
    const el = $('#game');
    el.style.width = w + 'px'; el.style.height = h + 'px';
    document.documentElement.style.setProperty('--u', (w / 100) + 'px');
    const portrait = vh > vw && matchMedia('(pointer:coarse)').matches;
    $('#rotate').classList.toggle('hide', !portrait);
  }
  addEventListener('resize', fit); fit();

  // ---------- セーブ ----------
  const SAVE = {
    slot: 0, d: null,
    blank: () => ({ v: 1, cleared: {}, chests: {}, gems: 0, lastNode: '1-1', story: false, costSeen: {} }),
    read(i) { try { const d = JSON.parse(localStorage.getItem('pq2_save' + i)); return d && d.v ? d : null; } catch (e) { return null; } },
    load(i) { this.slot = i; this.d = this.read(i) || this.blank(); },
    write() { try { this.d.updated = Date.now(); localStorage.setItem('pq2_save' + this.slot, JSON.stringify(this.d)); } catch (e) {} },
    del(i) { try { localStorage.removeItem('pq2_save' + i); } catch (e) {} },
  };
  const chestKey = (id, r, x, y) => `${id}:${r}:${x},${y}`;

  // ---------- 設定(端末ごと) ----------
  const CFG = { touch: 'auto' };
  try { Object.assign(CFG, JSON.parse(localStorage.getItem('pq2_cfg') || '{}')); } catch (e) {}
  const saveCfg = () => { try { localStorage.setItem('pq2_cfg', JSON.stringify(CFG)); } catch (e) {} };

  // ---------- 文言の反映 ----------
  function applyText() {
    $$('[data-t]').forEach(el => { el.textContent = t(el.dataset.t); });
    $('#tagline').textContent = t('tagline');
    $('#pressStart').textContent = t('pressStart');
    $('#tA').textContent = t('tLift'); $('#tB').textContent = t('tJump'); $('#tX').textContent = t('tUndo'); $('#tR').textContent = t('tReset');
    $('#rotateText').textContent = ['よこむきに\nしてあそんでね', 'Please turn your\ndevice sideways', 'Tournez votre\nappareil', 'Bitte Gerät\nquer halten'][I18N.lang];
    $('#btnQuit').classList.toggle('hide', !NATIVE);
    const logo = 'PUZZ NYAN QUEST';
    const cols = ['#ff5a8a', '#ff8a1f', '#ffd23a', '#7ddf64', '#3dd6c8', '#4aa8ff', '#9b7bff', '#ff7ad9'];
    $('#logo').innerHTML = [...logo].map((c, i) => c === ' ' ? '&nbsp;' : `<span style="--c:${cols[i % 8]};--d:${(i * 0.07).toFixed(2)}s">${c}</span>`).join('') + ` <span class="two" style="--d:1.1s">2</span>`;
    if (scene === 'stage') hudStage();
    if (scene === 'map') hudMap(MAP.current());
  }

  // ---------- メニューの操作(キー・パッド共通) ----------
  const UI = {
    stack: [],
    open(id, opt = {}) {
      const el = $('#' + id);
      el.classList.remove('hide');
      const L = { id, el, opt, idx: 0 };
      this.stack.push(L); this.refresh(L, opt.focus || 0);
      return L;
    },
    refresh(L, idx) {
      L.items = [...L.el.querySelectorAll('.btn')].filter(b => !b.classList.contains('hide') && b.offsetParent !== null && !b.closest('.hide'));
      L.idx = Math.max(0, Math.min(L.items.length - 1, idx ?? L.idx));
      this.paint(L);
    },
    paint(L) { L.items.forEach((b, i) => b.classList.toggle('focus', i === L.idx && IN.lastDevice !== 'touch')); },
    top() { return this.stack[this.stack.length - 1]; },
    close(id) {
      const i = this.stack.findIndex(L => L.id === id);
      if (i < 0) return;
      this.stack[i].el.classList.add('hide');
      this.stack.splice(i, 1);
      const L = this.top(); if (L) this.refresh(L);
    },
    nav(name) {
      const L = this.top(); if (!L) return false;
      if (name === 'up' || name === 'left' && !L.opt.lr) { L.idx = (L.idx + L.items.length - 1) % L.items.length; AU.play('cursor'); this.paint(L); return true; }
      if (name === 'down' || name === 'right' && !L.opt.lr) { L.idx = (L.idx + 1) % L.items.length; AU.play('cursor'); this.paint(L); return true; }
      if ((name === 'left' || name === 'right') && L.opt.lr) { L.opt.lr(L.items[L.idx], name === 'left' ? -1 : 1); return true; }
      if (name === 'a') { const b = L.items[L.idx]; if (b) b.click(); return true; }
      if (name === 'b' || name === 'menu' || name === 'x') { if (L.opt.back) { AU.play('cancel'); L.opt.back(); } return true; }
      return true;
    },
  };

  // ---------- トースト・ヒント ----------
  let toastT = 0;
  function toast(s) { const el = $('#toast'); el.textContent = s; el.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('show'), 1800); }
  function hint(s, sec = 7) { const el = $('#hint'); el.textContent = s; el.classList.remove('fade'); clearTimeout(hint.t); hint.t = setTimeout(() => el.classList.add('fade'), sec * 1000); }

  // ---------- タッチボタンの表示 ----------
  function touchVisible() {
    const want = CFG.touch === 'on' || (CFG.touch === 'auto' && (matchMedia('(pointer:coarse)').matches || IN.lastDevice === 'touch'));
    return want && (scene === 'stage' || scene === 'map') && !UI.top();
  }
  function updTouch() {
    $('#touch').classList.toggle('hide', !touchVisible());
    const inStage = scene === 'stage';
    $('#tB').classList.toggle('hide', !inStage); $('#tX').classList.toggle('hide', !inStage); $('#tR').classList.toggle('hide', !inStage);
    if (inStage) $('#tB').classList.toggle('off', GAME.S && GAME.S.c !== 's');
    $('#tA').textContent = inStage ? t('tLift') : t('play');
  }
  IN.bindTouch($('#pad'), [$('#tA'), $('#tB'), $('#tX'), $('#tR')]);

  // ---------- 場面 ----------
  let scene = 'title', titleReady = false;
  function showOnly(ids) { ['title', 'hud'].forEach(id => $('#' + id).classList.toggle('hide', !ids.includes(id))); }

  // タイトル
  function goTitle() {
    UI.stack.slice().forEach(L => UI.close(L.id));
    scene = 'title'; showOnly(['title']);
    $('#titleMenu').classList.toggle('hide', !titleReady);
    $('#pressStart').classList.toggle('hide', titleReady);
    if (titleReady) UI.open('title', { back: null });
    AU.playBgm('title');
    updTouch();
  }
  function titlePressed() {
    AU.init();
    if (!I18N.chosen) { openLang(true); return; }
    titleReady = true; AU.play('ok'); goTitle();
  }
  $('#game').addEventListener('click', e => { if (scene === 'title' && !titleReady && !UI.top() && !e.target.closest('.btn')) titlePressed(); });
  $('#titleMenu').addEventListener('click', e => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    AU.play('ok');
    if (b.dataset.act === 'start') openSlots();
    if (b.dataset.act === 'settings') openSettings();
    if (b.dataset.act === 'quit') confirmBox(t('confirmQuit'), () => NATIVE && NATIVE.quit());
  });

  // 言語
  function openLang(first) {
    $('#langs').innerHTML = I18N.LANGS.map((l, i) => `<button class="btn ${i === I18N.lang ? 'sel' : ''}" data-l="${i}">${l}</button>`).join('');
    UI.open('langSel', { focus: I18N.lang, back: first ? null : () => UI.close('langSel') });
    $$('#langs .btn').forEach(b => b.onclick = () => {
      I18N.set(+b.dataset.l); AU.play('ok'); applyText(); UI.close('langSel');
      if (first) { titleReady = true; goTitle(); }
      else refreshSettings();
    });
  }

  // セーブ選択
  function openSlots() {
    const total = PQLevels.STAGES.length;
    $('#slotList').innerHTML = [0, 1, 2].map(i => {
      const d = SAVE.read(i);
      const body = d ? `<b>${t('slot')} ${i + 1}</b>${t('clears')} ${Object.keys(d.cleared).length} / ${total}<br><span class="gem">◆ ${d.gems}</span>` : `<b>${t('slot')} ${i + 1}</b>${t('newData')}`;
      return `<div><button class="btn slot" data-slot="${i}">${body}</button>${d ? `<button class="btn small" data-del="${i}">${t('del')}</button>` : ''}</div>`;
    }).join('');
    if (!UI.stack.find(L => L.id === 'slots')) UI.open('slots', { back: () => UI.close('slots') });
    else UI.refresh(UI.top(), 0);
    $$('#slotList [data-slot]').forEach(b => b.onclick = () => {
      AU.play('ok');
      const i = +b.dataset.slot; SAVE.load(i);
      UI.close('slots');
      if (!SAVE.d.story) { SAVE.d.story = true; SAVE.write(); openStory(); } else goMap();
    });
    $$('#slotList [data-del]').forEach(b => b.onclick = () => {
      AU.play('cursor');
      confirmBox(t('delConfirm'), () => { SAVE.del(+b.dataset.del); openSlots(); });
    });
  }
  $('#slots').addEventListener('click', e => { if (e.target.closest('[data-act=back]')) { AU.play('cancel'); UI.close('slots'); } });

  // ストーリー
  function openStory() {
    $('#storyText').textContent = t('story');
    UI.open('story', { back: () => { UI.close('story'); goMap(); } });
  }
  $('#story').addEventListener('click', e => { if (e.target.closest('[data-act=next]')) { AU.play('ok'); UI.close('story'); goMap(); } });

  // マップ
  function goMap() {
    UI.close('title');
    scene = 'map'; showOnly(['hud']);
    $('#mapInfo').classList.remove('hide'); $('#hint').classList.add('fade'); $('#hudCost').classList.add('hide');
    $('#mapTop').classList.remove('hide'); $('#hudName').classList.add('hide');
    MAP.enter(SAVE.d, {
      onSelect: n => { hudMap(n); SAVE.d.lastNode = n.id; },
      onPlay: n => startStage(n.def),
      onToast: toast,
    });
    AU.playBgm('map');
    updGems();
    updTouch();
  }
  function hudMap(n) {
    if (!n) return;
    const sv = SAVE.d;
    $('#miKind').textContent = t('kind_' + n.kind) + (n.kind === 'puzzle' ? '  ' + n.id : '');
    $('#miName').textContent = t('st_' + n.id);
    let stat = '';
    if (!MAP.isOpen(n, sv)) stat = MAP.lockReason(n, sv);
    else {
      stat = sv.cleared[n.id] ? '★ ' + t('cleared') : '☆ ' + t('notCleared');
      if (n.def) {
        let total = 0, got = 0;
        n.def.rooms.forEach((rd, ri) => rd.map.forEach((row, y) => [...row].forEach((ch, x) => { if (ch === '$') { total++; if (sv.chests[chestKey(n.id, ri, x, y)]) got++; } })));
        if (total) stat += `   ${t('chests')} ${got}/${total}`;
        if (n.def.rooms.length > 1 && n.kind !== 'tower') stat += `\n${t('bonusHere')}`;
      }
    }
    $('#miStat').textContent = stat;
    $('#miPlay').textContent = (IN.lastDevice === 'pad' ? 'Ⓐ ' : IN.lastDevice === 'kb' ? 'Z / Enter ' : '') + t('play');
    $('#miPlay').classList.toggle('hide', !MAP.isOpen(n, sv));
    const c = Object.keys(sv.cleared).length;
    $('#mapTop').textContent = `${t('slot')} ${SAVE.slot + 1}   ★ ${c}\n${t('freeOrder')}`;
  }
  $('#miPlay').addEventListener('click', () => MAP.input('a'));
  function updGems() {
    const n = SAVE.d ? SAVE.d.gems + (scene === 'stage' ? GAME.shownGems() : 0) : 0;
    $('#hudGems').textContent = '◆ ' + n;
  }

  // ステージ
  let curDef = null;
  function startStage(def) {
    curDef = def;
    UI.close('title');
    scene = 'stage'; showOnly(['hud']);
    $('#mapInfo').classList.add('hide'); $('#mapTop').classList.add('hide'); $('#hudName').classList.remove('hide'); $('#hudCost').classList.remove('hide');
    GAME.start(def, {
      opened: (r, x, y) => !!SAVE.d.chests[chestKey(def.id, r, x, y)],
      cb: {
        onToast: toast,
        onHud: () => { hudStage(); updTouch(); },
        onChest: e => { SAVE.d.chests[chestKey(def.id, GAME.S.r, e.x, e.y)] = true; SAVE.d.gems += e.n; SAVE.write(); },
        onBank: n => { SAVE.d.gems += n; SAVE.write(); },
        onCostume: c => {
          toast(t('costume', { c: t('cost_' + c) }));
          if (!SAVE.d.costSeen[c]) { SAVE.d.costSeen[c] = true; SAVE.write(); hint(t('cost_' + c) + '\n' + t('costDesc_' + c), 5); }
          hudStage();
        },
        onRoom: () => { AU.playBgm(GAME.disp.r > 0 && def.kind !== 'tower' ? 'bonus' : bgmFor(def)); },
        onClear: () => stageClear(),
      },
    });
    // 宝箱のダイヤはセーブ側で数えるので、状態のダイヤからは引く
    AU.playBgm(bgmFor(def));
    hudStage();
    if (def.hint) hint(t(def.hint), 8);
    updTouch();
  }
  const bgmFor = def => def.kind === 'tower' ? 'tower' : def.kind === 'domino' ? 'bonus' : 'puzzle';
  function hudStage() {
    if (!curDef || !GAME.S) return;
    $('#hudName').textContent = (curDef.kind === 'puzzle' ? curDef.id + '  ' : '') + t('st_' + curDef.id);
    const c = GAME.disp ? GAME.disp.c : 'n';
    const hc = $('#hudCost'); hc.className = c; hc.textContent = t('cost_' + c);
    updGems();
  }
  function leaveStage() { SAVE.d.gems += GAME.S.gems; SAVE.d.lastNode = curDef.id; SAVE.write(); }
  function stageClear() {
    const def = curDef, first = !SAVE.d.cleared[def.id];
    const got = GAME.S.gems;
    SAVE.d.cleared[def.id] = true;
    leaveStage();
    const tower = def.kind === 'tower';
    AU.stopBgm(); AU.play(tower ? 'tower' : 'clear');
    const big = tower ? t('towerClear') : t('stageClear');
    const cols = ['#ff5a8a', '#ff8a1f', '#ffd23a', '#7ddf64', '#3dd6c8', '#4aa8ff', '#9b7bff'];
    $('#clearBig').innerHTML = [...big].map((c, i) => c === ' ' ? '&nbsp;' : `<span style="--c:${cols[i % 7]};--d:${(i * 0.05).toFixed(2)}s">${c}</span>`).join('');
    let sub = `◆ ${t('gemsGot')} +${got}`;
    if (tower && first) sub += '\n' + t('newArea');
    $('#clearSub').textContent = sub;
    $('#hint').classList.add('fade');
    UI.open('clear', { back: null });
    updTouch();
  }
  $('#clear').addEventListener('click', e => { if (e.target.closest('[data-act=ok]')) { AU.play('ok'); UI.close('clear'); goMap(); } });

  // ---------- ポーズメニュー ----------
  function openPause() {
    const items = scene === 'stage'
      ? [['resume', closePause], ['undo', () => { closePause(); GAME.undo(); }], ['reset', () => { closePause(); GAME.reset(); }], ['controls', openControls], ['settings', openSettings],
        ['toMap', () => confirmBox(t('confirmMap'), () => { closePause(); leaveStage(); goMap(); })],
        ['toTitle', () => confirmBox(t('confirmTitle'), () => { closePause(); leaveStage(); goTitle(); })]]
      : [['resume', closePause], ['save', () => { SAVE.write(); toast(t('saved') + '\n' + t('autoSave')); AU.play('ok'); }], ['controls', openControls], ['settings', openSettings],
        ['toTitle', () => confirmBox(t('confirmTitle'), () => { SAVE.write(); closePause(); goTitle(); })]];
    $('#pauseBtns').innerHTML = items.map(([k], i) => `<button class="btn small" data-i="${i}">${t(k)}</button>`).join('');
    $$('#pauseBtns .btn').forEach(b => b.onclick = () => { AU.play('ok'); items[+b.dataset.i][1](); });
    UI.open('pause', { back: closePause });
    updTouch();
  }
  function closePause() { UI.close('pause'); updTouch(); }

  // ---------- 確認 ----------
  let confirmFn = null;
  function confirmBox(text, yes) {
    $('#confirmText').textContent = text; confirmFn = yes;
    UI.open('confirm', { focus: 1, back: () => UI.close('confirm') });
  }
  $('#confirm').addEventListener('click', e => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    UI.close('confirm');
    if (b.dataset.act === 'yes') { AU.play('ok'); const f = confirmFn; confirmFn = null; f && f(); } else AU.play('cancel');
  });

  // ---------- 設定 ----------
  function refreshSettings() {
    const B = k => $(`#settings [data-set=${k}]`);
    B('lang').textContent = '◀ ' + I18N.LANGS[I18N.lang] + ' ▶';
    const bar = v => '◀ ' + '■'.repeat(Math.round(v * 10)) + '□'.repeat(10 - Math.round(v * 10)) + ' ▶';
    B('bgm').textContent = bar(AU.vol.bgm); B('se').textContent = bar(AU.vol.se);
    B('touch').textContent = '◀ ' + t(CFG.touch) + ' ▶';
    B('fs').textContent = isFs() ? t('on') : t('off');
    $('#rowFs').classList.toggle('hide', !(document.fullscreenEnabled || document.webkitFullscreenEnabled || (NATIVE && NATIVE.toggleFullscreen)));
  }
  function changeSetting(b, dir) {
    const k = b.dataset.set; if (!k) return;
    if (k === 'lang') { I18N.set((I18N.lang + dir + 4) % 4); applyText(); }
    if (k === 'bgm' || k === 'se') { const v = Math.round(Math.max(0, Math.min(1, AU.vol[k] + dir * 0.1)) * 10) / 10; AU.setVol(k, dir > 0 && AU.vol[k] >= 1 ? 0 : v); }
    if (k === 'touch') { const o = ['auto', 'on', 'off']; CFG.touch = o[(o.indexOf(CFG.touch) + dir + 3) % 3]; saveCfg(); }
    if (k === 'fs') toggleFs();
    AU.play('cursor');
    refreshSettings();
  }
  function openSettings() {
    refreshSettings();
    UI.open('settings', { back: () => UI.close('settings'), lr: changeSetting });
  }
  $('#settings').addEventListener('click', e => {
    const b = e.target.closest('.btn'); if (!b) return;
    if (b.dataset.act === 'close') { AU.play('cancel'); UI.close('settings'); return; }
    changeSetting(b, 1);
  });
  const isFs = () => !!(document.fullscreenElement || document.webkitFullscreenElement || (NATIVE && NATIVE.isFullscreen && NATIVE.isFullscreen()));
  async function toggleFs() {
    if (NATIVE && NATIVE.toggleFullscreen) { NATIVE.toggleFullscreen(); setTimeout(refreshSettings, 200); return; }
    try {
      if (isFs()) await (document.exitFullscreen || document.webkitExitFullscreen).call(document);
      else {
        const el = document.documentElement, f = el.requestFullscreen || el.webkitRequestFullscreen;
        if (f) await f.call(el, { navigationUI: 'hide' });
        if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(() => {});
      }
    } catch (e) {}
    setTimeout(refreshSettings, 200);
  }
  addEventListener('keydown', e => { if (e.code === 'F11' && !NATIVE) { e.preventDefault(); toggleFs(); } });

  // ---------- 操作説明 ----------
  function openControls() {
    const rows = [
      ['ctlMove', '← ↑ → ↓ / WASD', '十字 / L stick'],
      ['ctlTurn', t('ctlTurnHow'), t('ctlTurnHow')],
      ['ctlLift', 'Z / Space / Enter', 'A'],
      ['ctlJump', 'X / K', 'B'],
      ['ctlUndo', 'U / Backspace', 'X / Y'],
      ['ctlReset', 'R', 'SELECT / VIEW'],
      ['ctlMenu', 'Esc / P', 'START / MENU'],
    ];
    $('#ctlTable').innerHTML = `<tr><th></th><th>${t('keyboard')}</th><th>${t('gamepad')}</th></tr>` + rows.map(([k, a, b]) => `<tr><td>${t(k)}</td><td>${a}</td><td>${b}</td></tr>`).join('');
    UI.open('controls', { back: () => UI.close('controls') });
  }
  $('#controls').addEventListener('click', e => { if (e.target.closest('[data-act=close]')) { AU.play('cancel'); UI.close('controls'); } });

  // メニューボタン
  $('#btnMenu').addEventListener('click', () => { AU.play('ok'); openPause(); });
  // ボタンをタップしたらフォーカスもそこへ
  document.addEventListener('pointerdown', e => {
    AU.init();
    const L = UI.top(); if (!L) return;
    const b = e.target.closest('.btn'); if (!b) return;
    const i = L.items.indexOf(b); if (i >= 0) { L.idx = i; UI.paint(L); }
  });
  // マップをタップ
  cv.addEventListener('pointerdown', e => {
    if (scene !== 'map' || UI.top()) return;
    const r = cv.getBoundingClientRect();
    MAP.click((e.clientX - r.left) / r.width * 480, (e.clientY - r.top) / r.height * 270);
  });

  // ---------- 入力の振り分け ----------
  IN.handler = name => {
    AU.init();
    if (scene === 'title' && !titleReady && !UI.top()) { titlePressed(); return; }
    if (UI.top()) { UI.nav(name); return; }
    if (scene === 'map') { if (name === 'menu' || name === 'b') { AU.play('ok'); openPause(); } else MAP.input(name); return; }
    if (scene === 'stage') { if (name === 'menu') { AU.play('ok'); openPause(); } else GAME.input(name); }
  };

  // ---------- タイトルの絵 ----------
  let tt = 0;
  function drawTitle(dt) {
    tt += dt;
    const W = 480, H = 270, R = ART.rect;
    const sky = g.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#6cc0f0'); sky.addColorStop(0.6, '#bfe8ff'); sky.addColorStop(1, '#e8f8ff');
    g.fillStyle = sky; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 7; i++) { const x = (i * 97 + tt * 8) % (W + 80) - 40, y = 20 + (i * 41) % 90; R(g, x, y, 40, 8, '#fff'); R(g, x + 8, y - 6, 22, 6, '#fff'); }
    // 遠くの封印塔
    R(g, 380, 70, 30, 120, '#8b7a9a'); R(g, 374, 62, 42, 10, '#9a89a8'); R(g, 389, 46, 12, 16, '#9a89a8');
    R(g, 391, 100, 8, 12, Math.sin(tt * 2) > 0 ? '#ffd23a' : '#c98a00');
    R(g, 60, 110, 22, 80, '#8b7a9a'); R(g, 55, 104, 32, 8, '#9a89a8');
    // 丘
    for (let x = 0; x < W; x += 2) { const h = 70 + Math.sin(x * 0.015 + 1) * 14 + Math.sin(x * 0.04) * 6; R(g, x, H - h, 2, h, '#9fd6a0'); }
    // 地面のタイル
    for (let x = 0; x < W; x += 16) for (let y = 206; y < H; y += 16) ART.floor(g, ART.THEME.grass, x, y, x / 16, y / 16);
    // 浮かぶカギ
    ['k', 'b', 'r', 't'].forEach((k, i) => {
      const x = 120 + i * 64, y = 178 + Math.round(Math.sin(tt * 2 + i) * 4);
      R(g, x + 3, 214, 10, 3, 'rgba(0,0,0,.18)');
      ART.item(g, k, x, y, 0, tt);
    });
    // モチが物を積んで歩く(3倍の大きさ)
    const span = 330, p = (tt * 26) % (span * 2), dir = p < span ? 'R' : 'L', x = p < span ? 40 + p : 40 + span * 2 - p;
    const fr = Math.floor(tt * 6) % 2;
    if (!drawTitle.buf) drawTitle.buf = ART.mk(16, 48, () => {});
    const bg = drawTitle.buf.getContext('2d');
    bg.clearRect(0, 0, 16, 48);
    bg.drawImage(ART.catSprite(dir, 'p', fr), 0, 31 - fr);
    ART.held(bg, 'ck', 0, 32 - fr, tt);
    R(g, Math.round(x) + 8, 252, 32, 6, 'rgba(0,0,0,.22)');
    g.drawImage(drawTitle.buf, Math.round(x), 258 - 144, 48, 144);
  }

  function setRes(w, h) {
    if (cv.width === w && cv.height === h) return;
    cv.width = w; cv.height = h; g.imageSmoothingEnabled = false;
  }
  // ---------- ループ ----------
  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    IN.pollPad();
    if (scene !== 'stage') setRes(480, 270);
    if (scene === 'title') drawTitle(dt);
    else if (scene === 'map') { MAP.update(dt); MAP.draw(g); }
    else if (scene === 'stage') {
      if (!UI.top()) GAME.update(dt);
      const [vw, vh] = GAME.viewSize();
      setRes(vw, vh);
      GAME.draw(g);
      updGems();
    }
    requestAnimationFrame(loop);
  }

  // ---------- はじめ ----------
  applyText();
  goTitle();
  requestAnimationFrame(loop);
  // テスト用:URL の #1-3 などでそのステージから(セーブはデータ3)
  if (location.hash.length > 1) {
    const id = decodeURIComponent(location.hash.slice(1));
    const def = PQLevels.STAGES.find(s => s.id === id);
    if (def || id === 'map') { titleReady = true; if (!I18N.chosen) I18N.set(0); applyText(); SAVE.load(2); SAVE.d.story = true; UI.stack.slice().forEach(L => UI.close(L.id)); if (def) startStage(def); else goMap(); }
  }
  window.PQ2 = { SAVE, GAME, MAP, startStage, goMap };
})();
