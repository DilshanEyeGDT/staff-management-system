<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\FeedbackController;

// Feedback endpoint
Route::post('/v1/feedback', [FeedbackController::class, 'store']);
Route::get('/v1/feedback', [FeedbackController::class, 'index']);