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
        'date' => 'date',
        'sections_json' => 'array',
        'feedback_corrections_json' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
