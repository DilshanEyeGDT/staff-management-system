<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FeedbackAudit extends Model
{
    protected $table = 'feedback_audit';
    protected $primaryKey = 'feedback_audit_id';

    protected $fillable = [
        'feedback_id',
        'changed_by',
        'change_type',
        'old_value',
        'new_value'
    ];

    public $timestamps = false; // Using created_at manually

    public function feedback()
    {
        return $this->belongsTo(\App\Models\Feedback::class, 'feedback_id', 'feedback_id');
    }
}
