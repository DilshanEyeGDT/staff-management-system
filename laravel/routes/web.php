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

//s3 testing route
use Illuminate\Support\Facades\Storage;

Route::get('/s3-test', function() {
    $fileName = 'test-s3.txt';
    Storage::disk('s3')->put($fileName, 'Hello from Laravel S3!');
    $url = Storage::disk('s3')->url($fileName);
    return response()->json(['message' => 'File uploaded!', 'url' => $url]);
});
