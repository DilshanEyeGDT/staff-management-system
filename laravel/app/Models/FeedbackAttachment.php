<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FeedbackAttachment extends Model
{

    protected $table = 'feedback_attachments';
    protected $primaryKey = 'feedback_attachment_id';

    protected $fillable = [
        'feedback_id',
        'feedback_message_id',
        'file_name',
        's3_key',
        'file_type'
    ];

    public $timestamps = false;   // ✅ FIXED

    public function feedback()
    {
        return $this->belongsTo(Feedback::class, 'feedback_id', 'feedback_id');
    }
}
