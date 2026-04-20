<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\ForgotPasswordController;

Route::get('/', function () {
    return redirect('http://localhost:3000');
});

Route::get('forget-password', [ForgotPasswordController::class, 'showLinkRequestForm'])->name('password.request');
Route::post('forget-password', [ForgotPasswordController::class, 'sendResetLinkEmail'])->name('password.email');

Route::get('reset-password/{token}', function ($token) {
    return view('auth.reset-password', ['token' => $token]);
})->name('password.reset');


// مسار استقبال البيانات الجديدة وتحديثها في قاعدة البيانات
Route::post('reset-password', [ForgotPasswordController::class, 'updatePassword'])->name('password.update');


