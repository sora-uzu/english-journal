# English Journal

> 3分で続けられる、静かな英語日記アプリ。

**English Journal** は、プレッシャーなく英語日記を続けるためのミニマルなWebアプリです。

- 🇯🇵🇬🇧 日本語でも英語でもOK（混ざってもOK）
- 🧩 セクション構成はプリセット or カスタムで切り替え
- 🤖 書いた内容を「自然な英語ジャーナル」に整えて返す
- 🧠 学習フィードバック（修正例 + キーフレーズ1つ）
- 🔊 生成した英文は読み上げ（Listen）で確認できる
- 📅 Historyはカレンダーで「書いた日」が一目でわかる
- 📤 Notion向けMarkdownをコピー/ダウンロードできる
- 🧘‍♂️ ゲーミフィケーション/コミュニティは入れない（静かに続ける）

---

## コンセプト

- **「1日3分で完結する英語日記」**
- **「日本語でも書けるから、気持ちを優先できる」**
- **「ごほうび通知や経験値ではなく、静かな自己対話の場」**

---

## 機能（現状）

### ✏️ 日記入力

- 1日1件（日付で上書き保存）
- セクション構成はプリセットから選択
  - Simple / Classic / Daily Log
  - Custom（1〜5セクション、英語タイトル必須）
- 入力は日本語・英語どちらでもOK（混在可）
- 各セクションは最大500文字

### 🧩 セクション設定

- Settings → Sections からプリセットを切り替え
- Custom preset は作成/編集可能
- 1〜5セクションまで、順序も変更可能

### 🤖 AIフィードバック（OpenAI）

バックエンドで OpenAI Chat Completions を呼び出し、以下の形式で返します：

- `english_text`：セクション付きの自然な英語日記
- `feedback_overall`：英語学習に寄せた総評（日本語）
- `feedback_corrections[]`：修正例（before / after / note_ja）
- `key_phrase_en / key_phrase_ja / key_phrase_reason_ja`：今日のキーフレーズ1つ

補足：

- 0〜2文字の入力は「内容なし」とみなし、英文生成対象から除外
- 全セクションが短すぎる場合はフィードバックをスキップ

### 🔊 読み上げ（TTS）

- `english_text` を SpeechSynthesis（en-US）で再生
- セクション見出しは読まない

### 📅 History（カレンダー）

- 月カレンダーで「書いた日」を表示
- その月のキーフレーズを最大3件ピックアップ

### 📤 エクスポート

- Notion向けMarkdownをコピー
- `.md` ファイルをダウンロード

---

## 技術スタック

### Backend

- Laravel 11
- Laravel Breeze（Inertia + 認証）
- OpenAI API 連携

### Frontend

- Inertia.js
- React 18
- TypeScript
- Tailwind CSS
- Vite

### DB

- ローカル開発：SQLite
- 本番（Render）：PostgreSQL

---

## 開発（ローカル）

### 1) 依存関係

```bash
composer install
npm install
```

### 2) .env

```bash
cp .env.example .env
php artisan key:generate
```

最低限設定：

- `OPENAI_API_KEY`（AIフィードバック用）
- `OPENAI_MODEL`（任意、デフォルト: `gpt-4o-mini`）
- `OPENAI_BASE_URL`（任意、デフォルト: `https://api.openai.com/v1`）

DB（SQLite例）：

```bash
touch database/database.sqlite
```

```env
DB_CONNECTION=sqlite
DB_DATABASE=/absolute/path/to/database.sqlite
```

### 3) マイグレーション

```bash
php artisan migrate
```

### 4) 起動

```bash
php artisan serve
npm run dev
```

---

## Git hooks（ローカル）

コミット時は軽めのテスト、プッシュ時はフルテストを自動実行します。
チーム共有のために `.git/hooks` は使わず、`core.hooksPath` で `.githooks` を参照します。

### セットアップ

```bash
bash scripts/setup-hooks.sh
```

### 実行内容

- pre-commit: `php artisan test --testsuite=Unit` + `npm run test:js:run`
- pre-push: `php artisan test` + `npm run test:js:run`

---

## デプロイ（Render）メモ

- Render の Environment に `.env` 相当を設定（リポジトリに `.env` は push しない）
- `OPENAI_API_KEY` を設定し忘れると、英語フィードバック生成が失敗します

---

## Keepalive（Render スリープ回避）

GitHub Actions から `/health` を定期的に叩きます。

1. GitHub リポジトリ → Settings → Secrets and variables → Actions → Variables
2. `HEALTH_URL` に `https://<your-app>.onrender.com/health` を設定
3. Actions の `Keep Render Awake` が成功していることを確認

---

## ライセンス

Private（現時点）
