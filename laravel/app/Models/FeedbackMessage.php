<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FeedbackMessage extends Model
{
    protected $table = 'feedback_messages';
    protected $primaryKey = 'feedback_message_id';

    protected $fillable = [
        'feedback_id',
        'sender_id',
        'message'
    ];

    public $timestamps = false; // created_at is handled by DB

    public function feedback()
    {
        return $this->belongsTo(Feedback::class, 'feedback_id', 'feedback_id');
    }
}
