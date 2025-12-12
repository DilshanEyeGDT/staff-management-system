<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Feedback;
use Symfony\Component\HttpFoundation\StreamedResponse;

class FeedbackExportController extends Controller
{
    public function export(Request $request)
    {
        $range = $request->query('range'); // e.g., "2025-01-01,2025-12-12"
        $filters = $request->query('filters'); // e.g., JSON string: {"status":"open","assignee_id":1}

        $query = Feedback::query();

        // Apply date range filter
        if ($range) {
            [$start, $end] = explode(',', $range);
            $query->whereBetween('created_at', [$start, $end]);
        }

        // Apply additional filters
        if ($filters) {
            $filters = json_decode($filters, true);
            if (!empty($filters['status'])) {
                $query->where('status', $filters['status']);
            }
            if (!empty($filters['assignee_id'])) {
                $query->where('assignee_id', $filters['assignee_id']);
            }
            if (!empty($filters['priority'])) {
                $query->where('priority', $filters['priority']);
            }
        }

        // Stream CSV response
        $response = new StreamedResponse(function () use ($query) {
            $handle = fopen('php://output', 'w');

            // Add CSV headers
            fputcsv($handle, [
                'Feedback ID',
                'User ID',
                'Title',
                'Category',
                'Priority',
                'Status',
                'Assignee ID',
                'Created At',
                'Updated At'
            ]);

            // Add data rows
            $query->chunk(100, function ($feedbacks) use ($handle) {
                foreach ($feedbacks as $f) {
                    fputcsv($handle, [
                        $f->feedback_id,
                        $f->user_id,
                        $f->title,
                        $f->category,
                        $f->priority,
                        $f->status,
                        $f->assignee_id,
                        $f->created_at,
                        $f->updated_at
                    ]);
                }
            });

            fclose($handle);
        });

        $filename = 'feedback_' . now()->format('Ymd_His') . '.csv';

        $response->headers->set('Content-Type', 'text/csv');
        $response->headers->set('Content-Disposition', "attachment; filename=\"$filename\"");

        return $response;
    }
}
