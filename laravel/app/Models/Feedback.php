<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Feedback extends Model
{

    protected $table = 'feedback';
    protected $primaryKey = 'feedback_id';

    protected $fillable = [
        'user_id',
        'title',
        'category',
        'priority',
        'status',
        'assignee_id'
    ];

    public $timestamps = true;

    public function attachments()
    {
        return $this->hasMany(FeedbackAttachment::class, 'feedback_id', 'feedback_id');
    }

    public function messages()
    {
        return $this->hasMany(FeedbackMessage::class, 'feedback_id', 'feedback_id')
                    ->orderBy('created_at', 'asc'); // optional: oldest first
    }

}
