<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\FeedbackController;
use App\Http\Controllers\Api\FeedbackExportController;

// Feedback endpoints
Route::post('/v1/feedback', [FeedbackController::class, 'store']);
Route::get('/v1/feedback', [FeedbackController::class, 'index']);
Route::get('/v1/feedback/{id}', [FeedbackController::class, 'show']);
Route::post('/v1/feedback/{id}/messages', [FeedbackController::class, 'storeMessage']);
Route::patch('/v1/feedback/{id}', [FeedbackController::class, 'update']);
Route::get('/v1/exports/feedback.csv', [FeedbackExportController::class, 'export']);

// Users endpoint
use Illuminate\Support\Facades\DB;

Route::get('/v1/users', function () {
    $users = DB::table('users')
        ->select('id', 'display_name')
        ->orderBy('display_name', 'asc')
        ->get();

    return response()->json([
        'success' => true,
        'data' => $users
    ]);
});
