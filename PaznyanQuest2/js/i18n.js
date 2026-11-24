// ===== 文言(日本語 / English / Français / Deutsch) =====
// 画面に出す文字は、読みやすい区切りで \n を入れる(CSS で white-space: pre-line)。
(function (root) {
  'use strict';
  const LANGS = ['日本語', 'English', 'Français', 'Deutsch'];
  const T = {
    // ---- タイトル ----
    titleJa: ['パズにゃんクエスト２', 'PUZZ NYAN QUEST 2', 'PUZZ NYAN QUEST 2', 'PUZZ NYAN QUEST 2'],
    tagline: ['〜 もちあげネコと\nふういんの塔 〜', '~ The Lifting Cat\nand the Sealed Towers ~', '~ Le chat porteur\net les tours scellées ~', '~ Die Hebekatze\nund die versiegelten Türme ~'],
    pressStart: ['タップ / クリック /\nボタンで スタート', 'Tap / click /\npress a button', 'Touchez / cliquez /\nappuyez sur un bouton', 'Tippen / klicken /\nTaste drücken'],
    start: ['はじめる', 'START', 'JOUER', 'START'],
    settings: ['せってい', 'SETTINGS', 'OPTIONS', 'OPTIONEN'],
    quitGame: ['ゲームを やめる', 'QUIT GAME', 'QUITTER', 'BEENDEN'],
    chooseLang: ['ことばを えらんでね', 'Choose your language', 'Choisissez la langue', 'Wähle deine Sprache'],
    langNote: ['あとから「せってい」で\nかえられます', 'You can change it later\nin Settings', 'Modifiable plus tard\ndans les Options', 'Später in den Optionen\nänderbar'],
    // ---- セーブ ----
    slotTitle: ['セーブデータ', 'SAVE DATA', 'SAUVEGARDES', 'SPIELSTÄNDE'],
    slot: ['データ', 'FILE', 'FICHIER', 'DATEI'],
    newData: ['あたらしく はじめる', 'NEW GAME', 'NOUVELLE PARTIE', 'NEUES SPIEL'],
    clears: ['クリア', 'Cleared', 'Finies', 'Geschafft'],
    del: ['けす', 'DELETE', 'EFFACER', 'LÖSCHEN'],
    delConfirm: ['このデータを\nけしますか?', 'Delete\nthis file?', 'Effacer\nce fichier ?', 'Diesen Spielstand\nlöschen?'],
    yes: ['はい', 'YES', 'OUI', 'JA'],
    no: ['いいえ', 'NO', 'NON', 'NEIN'],
    back: ['もどる', 'BACK', 'RETOUR', 'ZURÜCK'],
    ok: ['OK', 'OK', 'OK', 'OK'],
    // ---- ストーリー ----
    story: [
      'ここは ふういんの塔が\nそびえる ふしぎな くに。\n\nもちあげるのが だいすきな\nネコの「モチ」は、\n塔の ふういんを とくため\n旅に 出た!',
      'In a strange land\nof sealed towers...\n\nMochi, a cat who loves\nlifting things,\nsets out to break\nthe towers\' seals!',
      'Dans un étrange pays\nde tours scellées...\n\nMochi, un chat qui adore\nsoulever les objets,\npart briser\nles sceaux des tours !',
      'In einem seltsamen Land\nversiegelter Türme...\n\nMochi, eine Katze,\ndie gern Dinge hebt,\nzieht los, um die Siegel\nzu brechen!',
    ],
    tapNext: ['つぎへ ▶', 'NEXT ▶', 'SUITE ▶', 'WEITER ▶'],
    // ---- マップ ----
    area1: ['わくわく草原', 'Wiggle Meadow', 'Prairie Frétillante', 'Wackelwiese'],
    area2: ['かぜの谷', 'Windy Valley', 'Vallée Venteuse', 'Windtal'],
    area3: ['さいごの塔', 'The Last Tower', 'La Dernière Tour', 'Der letzte Turm'],
    kind_puzzle: ['パズル', 'PUZZLE', 'ÉNIGME', 'RÄTSEL'],
    kind_domino: ['ドミノ広場', 'DOMINO PARK', 'PARC DOMINO', 'DOMINO-PARK'],
    kind_tower: ['ふういんの塔', 'SEALED TOWER', 'TOUR SCELLÉE', 'SIEGELTURM'],
    kind_final: ['さいごの塔', 'LAST TOWER', 'DERNIÈRE TOUR', 'LETZTER TURM'],
    cleared: ['クリア!', 'CLEARED!', 'RÉUSSI !', 'GESCHAFFT!'],
    notCleared: ['まだ', 'Not yet', 'Pas encore', 'Noch nicht'],
    chests: ['宝箱', 'Chests', 'Coffres', 'Truhen'],
    bonusHere: ['ボーナスエリアあり', 'Has a bonus area', 'Zone bonus', 'Bonusbereich'],
    soon: ['じゅんびちゅう', 'Coming soon', 'Bientôt', 'Demnächst'],
    needClears: ['あと {n} ステージ\nクリアで ひらく', 'Clear {n} more\nstages to open', 'Encore {n} étapes\npour ouvrir', 'Noch {n} Level\nzum Öffnen'],
    towerLock: ['前のエリアの\nふういんの塔を クリアで ひらく', 'Clear the previous\nSealed Tower to open', 'Finissez la tour scellée\nprécédente', 'Schaffe den vorigen\nSiegelturm'],
    play: ['あそぶ', 'PLAY', 'JOUER', 'SPIELEN'],
    freeOrder: ['どのステージからでも あそべるよ!', 'Play the stages in any order!', 'Jouez dans l\'ordre que vous voulez !', 'Spiele die Level in beliebiger Reihenfolge!'],
    // ---- ポーズ ----
    pause: ['メニュー', 'MENU', 'MENU', 'MENÜ'],
    resume: ['つづける', 'RESUME', 'REPRENDRE', 'WEITER'],
    undo: ['1手 もどす', 'UNDO', 'ANNULER', 'RÜCKGÄNGIG'],
    reset: ['やりなおす', 'RESTART', 'RECOMMENCER', 'NEUSTART'],
    toMap: ['マップへ もどる', 'BACK TO MAP', 'RETOUR CARTE', 'ZUR KARTE'],
    toTitle: ['タイトルへ もどる', 'BACK TO TITLE', 'RETOUR TITRE', 'ZUM TITEL'],
    save: ['セーブする', 'SAVE', 'SAUVEGARDER', 'SPEICHERN'],
    saved: ['セーブしました', 'Saved', 'Sauvegardé', 'Gespeichert'],
    autoSave: ['クリアや宝箱は\n自動で セーブされます', 'Clears and chests\nare saved automatically', 'Les victoires et coffres\nsont sauvegardés auto.', 'Erfolge und Truhen\nwerden automatisch gespeichert'],
    confirmTitle: ['タイトルに もどりますか?', 'Return to the title?', 'Revenir au titre ?', 'Zurück zum Titel?'],
    confirmMap: ['マップに もどりますか?', 'Return to the map?', 'Revenir à la carte ?', 'Zurück zur Karte?'],
    confirmQuit: ['ゲームを やめますか?', 'Quit the game?', 'Quitter le jeu ?', 'Spiel beenden?'],
    controls: ['そうさ', 'CONTROLS', 'COMMANDES', 'STEUERUNG'],
    // ---- 設定 ----
    lang: ['ことば', 'Language', 'Langue', 'Sprache'],
    bgm: ['BGM', 'Music', 'Musique', 'Musik'],
    se: ['こうかおん', 'Sound FX', 'Effets', 'Effekte'],
    fullscreen: ['ぜんがめん', 'Fullscreen', 'Plein écran', 'Vollbild'],
    touchPad: ['タッチボタン', 'Touch buttons', 'Boutons tactiles', 'Touch-Tasten'],
    auto: ['じどう', 'Auto', 'Auto', 'Auto'],
    on: ['ON', 'ON', 'OUI', 'AN'],
    off: ['OFF', 'OFF', 'NON', 'AUS'],
    close: ['とじる', 'CLOSE', 'FERMER', 'SCHLIESSEN'],
    // ---- 操作説明 ----
    ctlMove: ['いどう', 'Move', 'Bouger', 'Laufen'],
    ctlTurn: ['むきだけ かえる', 'Turn only', 'Tourner sur place', 'Nur drehen'],
    ctlLift: ['もつ / おく / はめる', 'Lift / put / insert', 'Porter / poser / insérer', 'Heben / ablegen / einsetzen'],
    ctlJump: ['ジャンプ(スカイニャン)', 'Jump (Sky Nyan)', 'Sauter (Sky Nyan)', 'Springen (Sky Nyan)'],
    ctlUndo: ['1手 もどす', 'Undo', 'Annuler', 'Rückgängig'],
    ctlReset: ['やりなおす', 'Restart', 'Recommencer', 'Neustart'],
    ctlMenu: ['メニュー', 'Menu', 'Menu', 'Menü'],
    ctlTurnHow: ['ちょんと おす', 'Tap briefly', 'Appui bref', 'Kurz tippen'],
    keyboard: ['キーボード', 'Keyboard', 'Clavier', 'Tastatur'],
    gamepad: ['コントローラー', 'Controller', 'Manette', 'Controller'],
    // ---- タッチボタン ----
    tLift: ['もつ', 'LIFT', 'PORTER', 'HEBEN'],
    tJump: ['ジャンプ', 'JUMP', 'SAUT', 'SPRUNG'],
    tUndo: ['もどす', 'UNDO', 'ANNUL.', 'ZURÜCK'],
    tReset: ['やりなおし', 'RESET', 'RESET', 'RESET'],
    // ---- コスチューム ----
    cost_n: ['ふつう', 'Normal', 'Normal', 'Normal'],
    cost_p: ['パワーニャン', 'Power Nyan', 'Power Nyan', 'Power Nyan'],
    cost_s: ['スカイニャン', 'Sky Nyan', 'Sky Nyan', 'Sky Nyan'],
    costDesc_n: ['かるい物を 2つまで もてる', 'Carries 2 light things', 'Porte 2 objets légers', 'Trägt 2 leichte Dinge'],
    costDesc_p: ['おもい物も 2だん まとめて もてる!', 'Lifts heavy things,\neven 2 at once!', 'Soulève le lourd,\nmême 2 à la fois !', 'Hebt Schweres,\nsogar 2 auf einmal!'],
    costDesc_s: ['ジャンプで 物の上に のれる!', 'Jumps onto things!', 'Saute sur les objets !', 'Springt auf Dinge!'],
    // ---- ゲーム中のメッセージ ----
    heavy: ['おもくて もてない!\n(パワーニャンなら もてる)', 'Too heavy!\n(Power Nyan can lift it)', 'Trop lourd !\n(Power Nyan peut le porter)', 'Zu schwer!\n(Power Nyan schafft das)'],
    tooMuch: ['いっぱいで もてない!', 'Your paws are full!', 'Les pattes sont pleines !', 'Die Pfoten sind voll!'],
    tooHigh: ['たかくて とどかない!', 'Too high to reach!', 'Trop haut !', 'Zu hoch!'],
    cantPut: ['そこには おけない', 'Can\'t put it there', 'Impossible de poser ici', 'Hier geht das nicht'],
    cantPutPit: ['あなには おけない!', 'Not into a pit!', 'Pas dans un trou !', 'Nicht in ein Loch!'],
    stackFull: ['2だんまでしか\nつめない!', 'Stacks are\n2 high at most!', 'Piles de\n2 maximum !', 'Höchstens\n2 übereinander!'],
    wrongKey: ['いろが ちがう!', 'Wrong color!', 'Mauvaise couleur !', 'Falsche Farbe!'],
    notKey: ['カギじゃないと\nはまらない', 'Only keys\nfit in there', 'Seules les clés\nvont là', 'Da passen nur\nSchlüssel'],
    sealFall: ['てばなすと\n足もとが きえちゃう!', 'Let go and\nthe floor vanishes!', 'Lâchez-la et\nle sol disparaît !', 'Loslassen und\nder Boden verschwindet!'],
    needSky: ['ジャンプは\nスカイニャンだけ!', 'Only Sky Nyan\ncan jump!', 'Seul Sky Nyan\npeut sauter !', 'Nur Sky Nyan\nkann springen!'],
    cantJumpHold: ['もったままでは\nジャンプできない!', 'Can\'t jump\nwhile carrying!', 'Impossible de sauter\nen portant !', 'Mit Last kein\nSprung möglich!'],
    matHeavy: ['おもい物を もったまま\nきがえられない!', 'Can\'t change while\ncarrying heavy things!', 'Pas de changement\nen portant du lourd !', 'Kein Umziehen\nmit schwerer Last!'],
    costume: ['{c} に へんしん!', 'Changed into {c}!', 'Transformé en {c} !', 'Verwandelt: {c}!'],
    chest: ['宝箱! ダイヤ +{n}', 'Chest! Diamonds +{n}', 'Coffre ! Diamants +{n}', 'Truhe! Diamanten +{n}'],
    bell: ['カラーン! ダイヤ +{n}', 'Ding-dong! Diamonds +{n}', 'Ding-dong ! Diamants +{n}', 'Ding-dong! Diamanten +{n}'],
    toBonus: ['ボーナスエリア!\nダイヤ とりほうだい', 'Bonus area!\nGrab all the diamonds', 'Zone bonus !\nDiamants à volonté', 'Bonusbereich!\nDiamanten satt'],
    noUndo: ['もう もどせない', 'Nothing to undo', 'Rien à annuler', 'Nichts rückgängig'],
    // ---- クリア ----
    stageClear: ['STAGE CLEAR!', 'STAGE CLEAR!', 'ÉTAPE RÉUSSIE !', 'LEVEL GESCHAFFT!'],
    towerClear: ['ふういんを といた!', 'SEAL BROKEN!', 'SCEAU BRISÉ !', 'SIEGEL GEBROCHEN!'],
    newArea: ['あたらしい エリアが\nひらいた!', 'A new area\nhas opened!', 'Une nouvelle zone\ns\'est ouverte !', 'Ein neues Gebiet\nist offen!'],
    gemsGot: ['ダイヤ', 'Diamonds', 'Diamants', 'Diamanten'],
    // ---- ステージ名 ----
    'st_1-1': ['もちあげてみよう', 'Lift It Up', 'Soulève-le', 'Heb es hoch'],
    'st_1-2': ['ふういんの床', 'The Sealed Floor', 'Le sol scellé', 'Der Siegelboden'],
    'st_1-3': ['下から ぬきとれ', 'Pull From Below', 'Tire par en dessous', 'Von unten ziehen'],
    'st_D1': ['ドミノ広場', 'Domino Park', 'Parc Domino', 'Domino-Park'],
    'st_1-4': ['パワーニャン', 'Power Nyan', 'Power Nyan', 'Power Nyan'],
    'st_1-5': ['スカイニャン', 'Sky Nyan', 'Sky Nyan', 'Sky Nyan'],
    'st_1-6': ['宝カギと ひみつの階段', 'The Treasure Key', 'La clé au trésor', 'Der Schatzschlüssel'],
    'st_T1': ['草原の ふういんの塔', 'Meadow Sealed Tower', 'Tour scellée de la prairie', 'Siegelturm der Wiese'],
    'st_2-1': ['かぜに まけるな', 'Brave the Wind', 'Face au vent', 'Gegen den Wind'],
    'st_2-2': ['おもさ床と 風のみち', 'Weight and Wind', 'Poids et vent', 'Gewicht und Wind'],
    'st_T2': ['谷の ふういんの塔', 'Valley Sealed Tower', 'Tour scellée de la vallée', 'Siegelturm des Tals'],
    'st_FINAL': ['さいごの塔', 'The Last Tower', 'La Dernière Tour', 'Der letzte Turm'],
    // ---- ヒント ----
    h11: ['もつボタンで 物を\nもちあげる・おく!\n木箱を どかして\nカギを カギ穴へ', 'Use LIFT to pick up\nand put down things!\nMove the crate and put\nthe key in the keyhole', 'PORTER pour soulever\net poser les objets !\nDéplacez la caisse et mettez\nla clé dans la serrure', 'Mit HEBEN aufheben\nund ablegen!\nKiste weg, Schlüssel\nins Schloss'],
    h12: ['黄色のカギを もつ間だけ\n黄色の ふういん床が 見える!\nカギは かさねれば\n2つ まとめて はこべる', 'The yellow sealed floor\nappears only while you\nhold a yellow key!\nStack keys to carry two', 'Le sol scellé jaune n\'apparaît\nque si vous tenez\nune clé jaune !\nEmpilez les clés pour en porter deux', 'Der gelbe Siegelboden\nerscheint nur mit\ngelbem Schlüssel!\nStaple Schlüssel, um zwei zu tragen'],
    h13: ['地面からは 2だんの\n下の物を ぬきとれる。\nおもさ床は\n2つ つむと 反応!', 'From the ground you pull out\nthe BOTTOM of a stack.\nWeight plates need\n2 things stacked!', 'Depuis le sol, on tire\nl\'objet du DESSOUS.\nLes plaques de poids\nveulent 2 objets empilés !', 'Vom Boden ziehst du das\nUNTERE Teil heraus.\nGewichtsplatten brauchen\n2 gestapelte Dinge!'],
    hD1: ['ドミノを おして\nいっきに たおそう!\nベルまで とどけ!', 'Push the domino\nand knock them all down!\nReach the bell!', 'Poussez le domino\net faites tout tomber !\nJusqu\'à la cloche !', 'Schubs den Domino\nund wirf alle um!\nBis zur Glocke!'],
    h14: ['パワーニャンの マットで へんしん!\nおもい鉄球も、2だん まとめても\nもてる', 'Step on the mat to become Power Nyan!\nLift heavy iron balls,\neven 2 things at once', 'Marchez sur le tapis : Power Nyan !\nIl porte les boulets,\nmême 2 objets à la fois', 'Auf die Matte: Power Nyan!\nHebt Eisenkugeln,\nsogar 2 Dinge auf einmal'],
    h15: ['スカイニャンは ジャンプで\nブロックや 物に のれる。\nでも 何か もっていると\nとべない!', 'Sky Nyan can JUMP onto\nblocks and things.\nBut not while\ncarrying anything!', 'Sky Nyan SAUTE sur\nles blocs et objets.\nMais pas en\nportant quelque chose !', 'Sky Nyan SPRINGT auf\nBlöcke und Dinge.\nAber nicht mit\nLast!'],
    h16: ['宝カギを もつと\nかくれた 宝箱が あらわれる!\nかいだんの 下には…?', 'Hold the treasure key\nand hidden chests appear!\nAnd down the stairs...?', 'Tenez la clé au trésor :\nles coffres cachés apparaissent !\nEt en bas de l\'escalier... ?', 'Mit dem Schatzschlüssel\nerscheinen Truhen!\nUnd unten an der Treppe...?'],
    hT1: ['ふういんの塔!\nマットで きがえる\nタイミングが カギ', 'A Sealed Tower!\nWhen you change costume\nis the key', 'Une tour scellée !\nLe moment où l\'on se change\nest la clé', 'Ein Siegelturm!\nWann du dich umziehst,\nist entscheidend'],
    h21: ['風で とばされる!\nおもい 鉄球を もっていれば\nへっちゃら', 'The wind blows you away!\nHolding a heavy iron ball\nkeeps you grounded', 'Le vent vous emporte !\nUn boulet lourd\nvous garde au sol', 'Der Wind pustet dich weg!\nMit einer Eisenkugel\nbleibst du stehen'],
    h22: ['おもさ床で 扉を ひらき\n鉄球と カギを もって\n風のみちを すすめ!', 'Open the door with the plate,\nthen carry the ball and key\nthrough the wind!', 'Ouvrez la porte avec la plaque,\npuis traversez le vent\navec boulet et clé !', 'Öffne die Tür per Platte,\ndann mit Kugel und Schlüssel\ndurch den Wind!'],
  };
  const I18N = {
    LANGS, T, lang: 0, chosen: false,
    init() {
      try {
        const v = localStorage.getItem('pq2_lang');
        if (v !== null) { this.lang = Math.max(0, Math.min(3, +v || 0)); this.chosen = true; }
      } catch (e) {}
      document.documentElement.lang = ['ja', 'en', 'fr', 'de'][this.lang];
    },
    set(l) {
      this.lang = l; this.chosen = true;
      try { localStorage.setItem('pq2_lang', String(l)); } catch (e) {}
      document.documentElement.lang = ['ja', 'en', 'fr', 'de'][l];
    },
    t(key, vars) {
      const r = T[key];
      let s = r ? (r[this.lang] ?? r[0]) : key;
      if (vars) for (const k in vars) s = s.split('{' + k + '}').join(vars[k]);
      return s;
    },
  };
  root.I18N = I18N;
})(window);
