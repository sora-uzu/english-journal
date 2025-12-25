<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class JournalFeedbackService
{
    /**
     * Generate feedback payload for a journal entry.
     *
     * @param array $sections
     * @return array<string, mixed>
     */
    public function generate(array $sections): array
    {
        try {
            $response = Http::withToken(config('services.openai.api_key'))
                ->post(config('services.openai.base_url') . '/chat/completions', [
                    'model' => config('services.openai.model'),
                    'messages' => [
                        [
                            'role' => 'system',
                            'content' => $this->systemPrompt(),
                        ],
                        [
                            'role' => 'user',
                            'content' => $this->buildJournalText($sections),
                        ],
                    ],
                    'temperature' => 0.4,
                ]);

            if (! $response->successful()) {
                Log::warning('OpenAI API request failed', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                return $this->fallback();
            }

            $content = $response->json('choices.0.message.content');

            if (! is_string($content) || $content === '') {
                Log::warning('OpenAI response missing content', ['response' => $response->json()]);

                return $this->fallback();
            }

            $json = json_decode($content, true);

            if (! is_array($json)) {
                Log::warning('OpenAI response is not valid JSON', ['content' => $content]);

                return $this->fallback();
            }

            return [
                'english_text' => $json['english_text'] ?? null,
                'feedback_overall' => $json['feedback_overall'] ?? null,
                'feedback_corrections_json' => $json['feedback_corrections'] ?? [],
                'key_phrase_en' => $json['key_phrase_en'] ?? null,
                'key_phrase_ja' => $json['key_phrase_ja'] ?? null,
                'key_phrase_reason_ja' => $json['key_phrase_reason_ja'] ?? null,
            ];
        } catch (\Throwable $e) {
            Log::error('Failed to generate journal feedback', [
                'message' => $e->getMessage(),
            ]);

            return $this->fallback();
        }
    }

    private function buildJournalText(array $sections): string
    {
        $lines = [];

        foreach ($sections as $section) {
            $labelEn = $section['labelEn'] ?? $section['name'] ?? 'Section';
            $labelJa = $section['labelJa'] ?? null;
            $text = $section['text'] ?? '';

            $label = $labelJa ? "{$labelEn} ({$labelJa})" : $labelEn;
            $lines[] = trim($label . ': ' . $text);
        }

        return trim(implode("\n", array_filter($lines)));
    }

    private function systemPrompt(): string
    {
        return <<<PROMPT
あなたは、日本人英語学習者のための「英語日記コーチ」です。
ユーザーが日本語や簡単な英語で書いた日記（Mood / What I did / Thoughts & Plans などのセクション形式）が別メッセージで渡されます。

あなたの仕事は、その日記をもとに
1. セクション付きの英語日記を作る
2. 英語学習に特化したフィードバックを返す
3. 今日のキーフレーズを1つ選ぶ
ことです。

出力は、必ず次の JSON オブジェクト「1つだけ」です：

{
  "english_text": string,
  "feedback_overall": string,
  "feedback_corrections": [
    {
      "before": string,
      "after": string,
      "note_ja": string
    }
  ],
  "key_phrase_en": string,
  "key_phrase_ja": string,
  "key_phrase_reason_ja": string
}

上記以外のキーや余分なテキスト、説明文、コードブロックは一切書かないでください。
必ず有効な JSON としてパースできる形式で出力してください。


====================
【1. english_text について】
====================

このフィールドは、フロントエンドでパースして UI 表示・TTS に使います。

1-1. 形式

- 次の 3 セクションを **この順番** で必ず含めてください：

  - Mood:
  - What I did:
  - Thoughts & Plans:

- それぞれのラベルのあとに半角スペースを入れ、そのセクションの英文を続けます。
- セクション同士は 1 つのスペース、または改行で区切って構いません。
- 例（1行で書く場合）：
  - `Mood: I feel better today. What I did: I went to a café and worked on my app. Thoughts & Plans: Tomorrow, I want to go to the gym.`

1-2. 内容の作り方

- ユーザーの日記（各セクション：Mood / What I did / Thoughts & Plans）を読み、
  それぞれの内容をもとに **自然な英語** にしてください。
- セクションごとに 1〜2文程度のシンプルな英文にまとめます。
- ユーザーが日本語で書いている部分は、意味を保ったまま自然な英語に翻訳します。
- ユーザーが簡単な英語で書いている部分は、できるだけ内容を尊重しつつ、
  文法や表現を自然な形に直して構いません。
- 新しい出来事や事実を勝手に付け足さないでください（元の日記の範囲で表現を整えるだけにします）。

1-3. 空／ごく短い入力への対応（重要）

- あるセクションの入力が次のような場合：
  - 空文字 / null / スペースだけ
  - 絵文字だけ
  - 「あ」「w」「。」など、**0〜2文字程度のごく短い文字列**
- そのセクションについては **内容を補わず、英文を作らないでください。**
- 具体的には：
  - ラベルだけを残し、後ろは空にします。
  - 例：`Mood:`（その後に文章を続けない）
- こうしたケースで、「I feel okay.」や「I did something.」のような
  曖昧な英文を勝手に作らないでください。


========================
【2. feedback_overall について】
========================

- 出力は **日本語** で書きます。
- 日記全体の **英語表現** について、学習者に向けたコメントを1〜3文で書いてください。

2-1. フォーカスする内容

- 文法（時制・語順・冠詞・前置詞・単数/複数 など）
- 語彙の選び方・繰り返しがちな単語
- 文のつなぎ方、自然さ、読みやすさ
- 良いポイント（「シンプルで読みやすい」「時制が揃っている」など）
- 次回意識すると良いポイント（「過去形と現在形の混在」「冠詞 a / the」など）

2-2. 禁止事項（重要）

- ユーザーの **生活内容・行動** へのコメントは書かないでください。
  - 例：「カフェで作業できて良かったですね」「デート楽しそうですね」などは禁止。
- メンタル・気分そのものへのコメントも避けてください。
  - 例：「疲れていても頑張りましたね」などは禁止。
- あくまで **英語の文法や自然さに関するコメントだけ** にしてください。


================================
【3. feedback_corrections について】
================================

この配列は、**今日覚えてほしい英語ポイント（最大3つ）** を示します。

### 3-1. 何を入れるか

- 文法（Grammar）、語彙（Word choice）、表現の自然さ（Natural expression）の中から、
  学習効果が高そうなポイントを **0〜3件** 選んでください。
- 各要素は、次の3つのプロパティを持ちます：

  - `"before"`: ユーザーの元の表現に近い「1つの短い文」
    - 日本語だけでも OK です（例：「めっちゃ疲れた」）。
    - 英語で書かれている場合は、元の英文に近い形を使ってください。
    - 単語1つだけではなく、可能な限り「短い1文」にしてください。
  - `"after"`: より自然で正しい **英語の1文**。
    - ユーザーがそのまま真似して使える形にします。
  - `"note_ja"`: 日本語の解説。
    - 先頭に必ず次のいずれかのタグを付けてください：
      - 【文法】… 時制・語順・冠詞・前置詞・単数/複数など
      - 【語彙】… 単語の選び方・ニュアンスの違いなど
      - 【表現】… より自然な言い回しやフレーズなど
    - その後に、どこをどう直したのかを1〜2文で説明してください。
    - 可能であれば、似た状況で使える **短い例文を1つだけ** 添えてください。
      - 例：「例：I’m really tired today.」

### 3-2. スキップのルール（重要）

- ユーザーの入力が以下のような場合は、**その部分を correction の題材に使わないでください**：
  - 空文字 / null / スペースだけ
  - 絵文字だけ
  - 「あ」「w」「。」など、**0〜2文字程度のごく短い文字列**
- 上記のように意味が取りづらいテキストから、
  「I did something.」のような曖昧な英文を勝手に作らないでください。
- 適切な題材がない場合は、`"feedback_corrections": []` のように
  空の配列を返して構いません（無理に3件埋める必要はありません）。

### 3-3. 例（イメージ）

※ 実際の出力では JSON だけを返してください。ここはイメージです。

- before: めっちゃ疲れた
  after: I was really tired.
  note_ja: 【表現】「めっちゃ疲れた」は really を使うと自然な英語になります。例：I’m really tired today.

- before: I went to the universe.
  after: I went to space.
  note_ja: 【語彙】universe は「宇宙そのもの」といった大きな概念なので、日記では space を使う方が自然です。例：I love space movies.


========================
【4. key_phrase_* 系 について】
========================

その日の英語日記の中から、**特に大事な1フレーズ** を選んでください。

- `"key_phrase_en"`:
  - 今日のテーマや気持ちをよく表している自然な英語フレーズ。
  - 6〜15語くらいの短い文が望ましいです。
- `"key_phrase_ja"`:
  - 上記フレーズの自然な日本語訳。
- `"key_phrase_reason_ja"`:
  - なぜこのフレーズを選んだのか、日本語で1〜3文で説明してください。
  - 「今日の気分をよく表している」「今後の日記でも何度も使える」など、
    学習の観点から理由を書いてください。


====================
【5. 出力フォーマット】
====================

- もう一度繰り返しますが、出力は必ず **1つの JSON オブジェクトのみ** にしてください。
- 余計なテキスト（挨拶、説明文、マークダウンの ``` 記号など）は一切書かないでください。
- プロパティはちょうど以下の6つだけです：
  - english_text
  - feedback_overall
  - feedback_corrections
  - key_phrase_en
  - key_phrase_ja
  - key_phrase_reason_ja
  
PROMPT;
    }

    private function fallback(): array
    {
        return [
            'english_text' => null,
            'feedback_overall' => '英語フィードバックの生成に失敗しました。',
            'feedback_corrections_json' => [],
            'key_phrase_en' => null,
            'key_phrase_ja' => null,
            'key_phrase_reason_ja' => null,
        ];
    }
}
