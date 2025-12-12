<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Feedback;
use App\Models\FeedbackAttachment;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class FeedbackController extends Controller
{
    public function store(Request $request)
    {
        // Validate request
        $request->validate([
            'user_id' => 'required|integer|exists:users,id',
            'title' => 'required|string|max:255',
            'category' => 'required|string|max:50',
            'priority' => 'nullable|string|max:20',
            'assignee_id' => 'nullable|integer|exists:users,id',

            'attachments' => 'nullable|array',
            'attachments.*.file_name' => 'required|string|max:255',
            'attachments.*.file_type' => 'required|string|max:50'
        ]);

        // Create feedback
        $feedback = Feedback::create([
            'user_id'       => $request->user_id,
            'title'         => $request->title,
            'category'      => $request->category,
            'priority'      => $request->priority ?? 'medium',
            'status'        => 'open',
            'assignee_id'   => $request->assignee_id ?? null
        ]);

        // Refresh to load defaults (status, timestamps)
        $feedback->refresh();

        $uploadedFiles = [];

        // Handle attachments
        if ($request->has('attachments')) 
        {
            $disk = Storage::disk('s3');

            foreach ($request->attachments as $file) 
            {
                $uniqueName = Str::uuid() . '-' . $file['file_name'];

                // Create temporary upload URL (client uploads directly)
                $presignedUrl = $disk->temporaryUrl(
                    $uniqueName,
                    now()->addMinutes(10)
                );

                // Save metadata
                $attachment = FeedbackAttachment::create([
                    'feedback_id' => $feedback->feedback_id,
                    'file_name' => $file['file_name'],
                    's3_key' => $uniqueName,
                    'file_type' => $file['file_type'],
                ]);

                $uploadedFiles[] = [
                    'attachment_id' => $attachment->feedback_attachment_id,
                    'file_name' => $file['file_name'],
                    'presigned_url' => $presignedUrl
                ];
            }
        }

        // Response
        return response()->json([
            'feedback_id' => $feedback->feedback_id,
            'title'       => $feedback->title,
            'category'    => $feedback->category,
            'priority'    => $feedback->priority,
            'status'      => $feedback->status,
            'assignee_id' => $feedback->assignee_id,
            'attachments' => $uploadedFiles
        ], 201);
    }

    public function index(Request $request)
{
    // Validation for query parameters
    $request->validate([
        'status' => 'nullable|string|max:20',
        'assignee' => 'nullable|integer|exists:users,id',
        'page' => 'nullable|integer|min:1',
        'size' => 'nullable|integer|min:1|max:100',
    ]);

    $query = Feedback::query();

    // Apply filters if provided
    if ($request->filled('status')) {
        $query->where('status', $request->status);
    }

    if ($request->filled('assignee')) {
        $query->where('assignee_id', $request->assignee);
    }

    // Pagination
    $page = $request->input('page', 1);
    $size = $request->input('size', 10);

    $feedbacks = $query->with('attachments')
        ->orderBy('created_at', 'desc')
        ->paginate($size, ['*'], 'page', $page);

    return response()->json($feedbacks);
}

}
