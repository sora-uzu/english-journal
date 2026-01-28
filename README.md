# English Journal

> 3分で続けられる、静かな英語日記アプリ。

**English Journal** は、プレッシャーなく英語日記を続けるためのミニマルなWebアプリです。  
日本語・英語どちらでも書けて、内容は自然な英語日記として整えられます。

---

## こんな人に

- 英語日記を始めたいがハードルが高い
- きれいな英文を作りたいが学習負荷は抑えたい
- 静かな習慣化を重視したい

---

## できること（要約）

- 🇯🇵🇬🇧 日本語/英語どちらでもOK（混在可）
- 🧩 セクション構成はプリセット or カスタム
- 🤖 自然な英語ジャーナルに整形 + 学習フィードバック
- 🔊 読み上げ（TTS）
- 📅 履歴はカレンダー表示（ログイン時）
- 📤 Notion向けMarkdownコピー/ダウンロード
- 👤 ゲスト利用OK
- 📱 ホーム画面に追加して「アプリ化」できる（PWA）

---

## 使い方（3ステップ）

1. **書く**：日本語でもOK
2. **整える**：自然な英語に自動整形
3. **学ぶ**：修正例・キーフレーズで軽く復習

---

## スマホでアプリのように使える（PWA）

インストール不要で、ブラウザから **ホーム画面に追加** すれば  \nアイコンをタップするだけでアプリのように起動できます。  

---

# For Developers

## 技術スタック

- Backend: Laravel 11 / Breeze（Inertia + 認証）
- Frontend: Inertia.js / React 18 / TypeScript / Tailwind CSS / Vite
- DB: ローカルはSQLite、本番（Render）はPostgreSQL

---

## 開発（ローカル）

```bash
composer install
npm install
cp .env.example .env
php artisan key:generate
```

```bash
touch database/database.sqlite
php artisan migrate
php artisan serve
npm run dev
```

`.env` の最低限:

- `OPENAI_API_KEY`
- `OPENAI_MODEL`（任意、デフォルト: `gpt-4o-mini`）
- `OPENAI_BASE_URL`（任意、デフォルト: `https://api.openai.com/v1`）

---

## デプロイ（Render）メモ

- Render の Environment に `.env` 相当を設定
- `OPENAI_API_KEY` が未設定だとフィードバック生成が失敗
- 本番は `SESSION_DRIVER=database` 推奨 → `php artisan migrate --force`

---

## Keepalive（Render スリープ回避）

現在は **UptimeRobot のみ** で `/health` を定期監視しています。  
GitHub Actions の `Keep Render Awake` ワークフローは **無効化** しています。

---

## ライセンス

Private（現時点）
