// ===== 入力(キーボード・コントローラー・タッチ) =====
// ボタンの名前:
//   up down left right  方向
//   a      もつ・おく / 決定
//   b      ジャンプ / (メニューでは)もどる
//   x      1手もどす
//   reset  やりなおす
//   menu   メニュー
(function (root) {
  'use strict';
  const IN = {
    handler: null,        // (name) => void  押した瞬間
    held: [],             // 押している方向(最後に押したものが末尾)
    lastDevice: 'kb',     // kb / pad / touch
  };
  const DIRS = ['up', 'down', 'left', 'right'];
  function press(name, src) {
    if (DIRS.includes(name)) {
      const id = name + ':' + src;
      if (IN.held.includes(id)) return;
      IN.held.push(id);
    }
    if (IN.handler) IN.handler(name);
  }
  function release(name, src) {
    const i = IN.held.indexOf(name + ':' + src);
    if (i >= 0) IN.held.splice(i, 1);
  }
  IN.dir = () => { const h = IN.held[IN.held.length - 1]; return h ? h.split(':')[0] : null; };
  IN.isHeld = d => IN.held.some(h => h.startsWith(d + ':'));
  IN.clear = () => { IN.held.length = 0; };

  // ---------- キーボード ----------
  const KEY = {
    ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
    KeyZ: 'a', KeyJ: 'a', Space: 'a', Enter: 'a', NumpadEnter: 'a',
    KeyX: 'b', KeyK: 'b',
    KeyU: 'x', Backspace: 'x', KeyC: 'x',
    KeyR: 'reset',
    Escape: 'menu', KeyP: 'menu', Tab: 'menu',
  };
  addEventListener('keydown', e => {
    const n = KEY[e.code];
    if (!n) return;
    e.preventDefault();
    IN.lastDevice = 'kb';
    if (e.repeat) return;
    press(n, 'kb');
  });
  addEventListener('keyup', e => { const n = KEY[e.code]; if (n) release(n, 'kb'); });
  addEventListener('blur', IN.clear);

  // ---------- コントローラー(標準配置) ----------
  // A=もつ B=ジャンプ/もどる X=1手もどす Y=1手もどす SELECT(BACK)=やりなおす START=メニュー
  let prev = {};
  IN.pollPad = function () {
    const pads = navigator.getGamepads ? [...navigator.getGamepads()].filter(Boolean) : [];
    const now = {};
    for (const gp of pads) {
      const b = i => gp.buttons[i] && gp.buttons[i].pressed;
      const ax = gp.axes[0] || 0, ay = gp.axes[1] || 0;
      const set = (k, v) => { if (v) now[k] = true; };
      set('up', b(12) || ay < -0.5); set('down', b(13) || ay > 0.5); set('left', b(14) || ax < -0.5); set('right', b(15) || ax > 0.5);
      set('a', b(0)); set('b', b(1)); set('x', b(2) || b(3)); set('reset', b(8)); set('menu', b(9));
    }
    for (const k of Object.keys(now)) if (!prev[k]) { IN.lastDevice = 'pad'; press(k, 'pad'); }
    for (const k of Object.keys(prev)) if (!now[k]) release(k, 'pad');
    prev = now;
  };
  IN.hasPad = () => navigator.getGamepads && [...navigator.getGamepads()].some(Boolean);

  // ---------- タッチ ----------
  // 十字キー:触れている位置で方向を決める(指をすべらせて方向を変えられる)
  IN.bindTouch = function (pad, buttons) {
    const active = new Map();
    const dirOf = (e) => {
      const r = pad.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      if (Math.hypot(dx, dy) < r.width * 0.12) return null;
      return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
    };
    const upd = (id, d) => {
      const old = active.get(id);
      if (old === d) return;
      if (old) release(old, 'touch' + id);
      active.set(id, d);
      if (d) { press(d, 'touch' + id); pad.dataset.dir = d; } else pad.dataset.dir = '';
    };
    pad.addEventListener('pointerdown', e => { e.preventDefault(); IN.lastDevice = 'touch'; pad.setPointerCapture(e.pointerId); upd(e.pointerId, dirOf(e)); });
    pad.addEventListener('pointermove', e => { if (active.has(e.pointerId)) upd(e.pointerId, dirOf(e)); });
    const end = e => { if (!active.has(e.pointerId)) return; upd(e.pointerId, null); active.delete(e.pointerId); pad.dataset.dir = ''; };
    pad.addEventListener('pointerup', end); pad.addEventListener('pointercancel', end);
    for (const el of buttons) {
      el.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); IN.lastDevice = 'touch'; el.classList.add('on'); press(el.dataset.btn, 'touch'); });
      const off = () => { el.classList.remove('on'); release(el.dataset.btn, 'touch'); };
      el.addEventListener('pointerup', off); el.addEventListener('pointercancel', off); el.addEventListener('pointerleave', off);
    }
  };
  addEventListener('touchstart', () => { IN.lastDevice = 'touch'; }, { passive: true });

  root.IN = IN;
})(window);
