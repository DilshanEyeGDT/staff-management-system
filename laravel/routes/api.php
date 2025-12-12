<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\FeedbackController;
use App\Http\Controllers\Api\FeedbackExportController;

// Feedback endpoint
Route::post('/v1/feedback', [FeedbackController::class, 'store']);
Route::get('/v1/feedback', [FeedbackController::class, 'index']);
Route::get('/v1/feedback/{id}', [FeedbackController::class, 'show']);
Route::post('/v1/feedback/{id}/messages', [FeedbackController::class, 'storeMessage']);
Route::patch('/v1/feedback/{id}', [FeedbackController::class, 'update']);
Route::get('/v1/exports/feedback.csv', [FeedbackExportController::class, 'export']);