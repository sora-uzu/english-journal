<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('journals', function (Blueprint $table) {
            $table->bigIncrements('id');

            // 誰の日記か
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();

            // 何日分か（1ユーザー1日1件想定）
            $table->date('date');

            // 入力したセクション（Mood / What I did / Thoughts & Plans）
            $table->json('sections_json');

            // LLMから返ってきた英語日記 & フィードバック
            $table->text('english_text')->nullable();
            $table->text('feedback_overall')->nullable();
            $table->json('feedback_corrections_json')->nullable();

            // 今日のキー表現
            $table->string('key_phrase_en')->nullable();
            $table->string('key_phrase_ja')->nullable();
            $table->text('key_phrase_reason_ja')->nullable();

            $table->timestamps();

            // 1ユーザー1日1件にするための制約
            $table->unique(['user_id', 'date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('journals');
    }
};
