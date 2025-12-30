# Quiet English Journal（仮）

> 1日3分で続く、ひとり用の静かな英語日記アプリ。

Quiet English Journal は、プレッシャーなく英語日記を続けるための小さなWebアプリです。

- 日本語でも英語でも、自由に日記を書ける
- 日記を自然な **英語ジャーナル** に書き直してくれる
- シンプルなフィードバックと、**その日だけのキーフレーズ1つ**を返してくれる
- タイムラインやコミュニティ機能は入れず、**静かでミニマルなUI** を目指す

---

## コンセプト

- 「**1日3分で完結する英語日記**」
- 「**日本語でも書けるから、気持ちを優先できる**」
- 「**ごほうび通知や経験値ではなく、静かな自己対話の場**」

他の英語日記アプリで感じた課題：

- 機能が多すぎてごちゃつく
- 日記と関係ないゲーミフィケーションが鬱陶しい
- フィードバックがなくて、どこが良くてどこを直せばいいか分からない

このアプリでは、

- 入力体験をできるだけシンプルに
- フィードバックは「全体コメント＋具体例＋キーフレーズ1つ」に絞る
- コミュニティやSNS要素は入れない

という思想で設計しています。

---

## 機能（MVP）

### ✏️ 日記入力

- 1日1本の日記を、「3つのセクション」で書く：
  - **How I feel / 今日の気分**  
    今日の気分・コンディション
  - **What happened / 今日のこと**  
    何があったか・印象に残った出来事
  - **Tomorrow / 明日のこと**  
    明日のこと

- 入力は **日本語・英語どちらでもOK**  
  → 気分が乗らない日は全部日本語でもよいし、混ざっていてもよい。

---

### 🤖 AIフィードバック（LLM）

バックエンドから LLM（OpenAI API）を呼び出し、固定プロンプトで以下の形式のレスポンスを受け取ります：

- `english_text`  
  → 日記全体を自然な **英語ジャーナル** に書き直したテキスト
- `feedback_overall`  
  → 全体に対する短いフィードバック（ニュアンス・構成など）
- `feedback_corrections[]`  
  → 修正例のリスト（before / after / 日本語コメント）
- `key_phrase_en` / `key_phrase_ja` / `key_phrase_reason_ja`  
  → その日覚えておきたいキーフレーズ1つと、その理由（日本語）

この仕様はアプリ内で固定し、「毎日同じフォーマット」で返ってくる前提で設計しています。

---

### 📅 履歴（History）

※ 現時点ではWIP

- 直近の日記一覧（`日付 + スニペット`）を表示
- 「Check your past journals」から過去の日記にアクセス
- カレンダーUIで「書いた日」だけマークするようなシンプルな見せ方を検討中

---

## 技術スタック

### Backend

- Laravel 11
- Laravel Breeze（Inertia + 認証）
- SQLite（ローカル開発）

### Frontend

- Inertia.js
- React 18
- TypeScript
- Tailwind CSS
- Vite

### AI

- OpenAI API（Chat系エンドポイント）
- プロンプトは以下の情報を返すように固定：
  - `english_text`
  - `feedback_overall`
  - `feedback_corrections[]`
  - `key_phrase_en / key_phrase_ja / key_phrase_reason_ja`

---

## Keepalive の設定（Render スリープ回避）

Render の Web Service が無アクセスでスリープしないように、GitHub Actions から `/health` を 10 分おきに叩きます。

1. GitHub リポジトリ → Settings → Secrets and variables → Actions → Variables を開く
2. `HEALTH_URL` を追加し、値に `https://english-journal.onrender.com/health` を設定
3. Actions タブで `Keep Render Awake` が成功していることを確認

# Quiet English Journal

> 1日3分で続く、ひとり用の静かな英語日記。

**Quiet English Journal** は、プレッシャーなく英語日記を続けるためのミニマルなWebアプリです。

- 🇯🇵🇬🇧 日本語でも英語でもOK（混ざってもOK）
- 🤖 書いた内容を「自然な英語ジャーナル」に整えて返す
- 🧠 フィードバックは英語学習にフォーカス（例文・ニュアンス・キーフレーズ1つ）
- 🔊 生成した英文は読み上げ（Listen）で確認できる
- 📅 Historyはカレンダーで「書いた日」が一目でわかる
- 🧘‍♂️ ゲーミフィケーション/コミュニティは入れない（静かに続ける）

---

## コンセプト

- **「1日3分で完結する英語日記」**
- **「日本語でも書けるから、気持ちを優先できる」**
- **「ごほうび通知や経験値ではなく、静かな自己対話の場」**

よくある英語日記アプリのつらさ：

- 機能が多すぎて迷う
- まっさら英語入力のプレッシャーがある
- ゲーミフィケーションが鬱陶しい
- フィードバックが薄くて学びにならない

このアプリでは、

- 入力体験をできるだけシンプルに
- フィードバックは「例文 + ニュアンス + キーフレーズ1つ」に絞る
- 静かでミニマル、iOSっぽい“ガラス感”のUI

という思想で設計しています。

---

## 画面

- **New Journal**：今日の日記を書く
- **Feedback**：AIフィードバック（英文 / 修正 / キーフレーズ / Listen）
- **History**：カレンダーで過去の日記を振り返る

---

## 機能（現状）

### ✏️ 日記入力

- 1日1本の日記を「3つのセクション」で書く
  - **How I feel / 今日の気分**：今日の気分・コンディション
  - **What happened / 今日のこと**：何があったか・出来事
  - **Tomorrow / 明日のこと**：明日のこと

- 入力は **日本語・英語どちらでもOK**

### 🤖 AIフィードバック（LLM）

バックエンドで OpenAI API を呼び出し、固定プロンプトで以下を生成します：

- `english_text`：日記全体を自然な英語ジャーナルに整形
- `feedback_overall`：英語学習に寄せた短い総評
- `feedback_corrections[]`：修正例（before/after は基本「文単位」）
- `key_phrase_en / key_phrase_ja / key_phrase_reason_ja`：その日覚えるキーフレーズ1つ + 理由

※ 0〜2文字などの入力は学習として意味が薄いので、セクション単位でフィードバック対象から除外します。

### 🔊 読み上げ（TTS）

- 生成した `english_text` を音声で再生（セクションタイトルは読まない）

### 📅 History（カレンダー）

- 月カレンダーで「書いた日」を表示
- 書いていない日は押せない（誤タップ防止）
- 月内のキーフレーズをピックアップ表示（見返しやすさ重視）

---

## デモ / 本番環境

- Render でホスティングして運用しています。
- Freeプランはスリープすることがあるため、`/health` を GitHub Actions で定期的に叩いて起こします。

---

## 技術スタック

### Backend

- Laravel（Breeze + Inertia 認証）
- OpenAI API 連携（フィードバック生成）

### Frontend

- Inertia.js
- React
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

DB（SQLite例）：

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

## 方針（v1）

- まずは「自分と友達が気持ちよく使える」ことを最優先
- 機能は増やしすぎない（静かさを守る）
- 学習効果は「キーフレーズ1つ + 例文 + ニュアンス」で積み上げる

---

## ライセンス

Private（現時点）
