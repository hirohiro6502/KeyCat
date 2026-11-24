# パズにゃんクエスト２ 〜もちあげネコと ふういんの塔〜

「持ち上げる」がテーマのパズルゲーム。HTML / JavaScript だけで動きます(ビルド不要・外部素材なし)。

- PC:全画面 16:9。キーボード・コントローラー対応。Steam 向けは Electron で包む(`electron/`)。
- スマホ:横画面。画面の十字キーとボタンで遊べる(デバッグ・iPhone でのお試し用)。
- 言語:日本語 / English / Français / Deutsch(選んだ言語は記憶)。

## 遊び方

`index.html` をブラウザで開くだけで遊べます(サーバー不要)。

| 操作 | キーボード | コントローラー | スマホ |
|---|---|---|---|
| いどう | 矢印 / WASD | 十字 / 左スティック | 十字キー |
| むきだけ変える | ちょんと押す | ちょんと押す | ちょんと押す |
| もつ・おく・はめる | Z / Space / Enter | A | もつ |
| ジャンプ(スカイニャン) | X / K | B | ジャンプ |
| 1手もどす | U / Backspace | X / Y | もどす |
| やりなおす | R | SELECT | やりなおし |
| メニュー | Esc / P | START | ☰ |

## Steam 版(Electron)

```
npm install
npm start            # 試しに起動
npm run dist:win     # Windows 用のフォルダを作る(dist/)
```

## 開発

- 仕様・方針:[docs/DEV_MEMO.md](docs/DEV_MEMO.md)
- 全ステージが解けるかの確認:`node tools/replay.js`(手順の再生)、`node tools/solve.js 1-1 -v`(探索)
- テスト用:URL の末尾に `#1-3` などを付けると、そのステージから始まる(データ3を使用)。`#map` でマップから。
