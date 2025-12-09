<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Journal extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'date',
        'sections_json',
        'english_text',
        'feedback_overall',
        'feedback_corrections_json',
        'key_phrase_en',
        'key_phrase_ja',
        'key_phrase_reason_ja',
    ];

    protected $casts = [
        'sections_json' => 'array',
        'feedback_corrections_json' => 'array',
    ];

    /**
     * Convert the given value to JSON.
     *
     * 日本語を \uXXXX にエスケープせず、そのまま保存するためにオーバーライド。
     */
    protected function asJson($value, $flags = 0)
    {
        return json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | $flags);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
