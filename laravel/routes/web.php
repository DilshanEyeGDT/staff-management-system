<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// Health check endpoint
Route::get('/healthz', function () {
    return response()->json([
        'status' => 'ok',
        'message' => 'Service is running',
        'timestamp' => now()
    ]);
});