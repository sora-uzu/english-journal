<?php

use App\Http\Controllers\JournalPresetController;
use App\Http\Controllers\JournalSectionSettingsController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\GuestJournalFeedbackController;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\JournalController;

Route::get('/', function () {
    if (Auth::check()) {
        return redirect()->route('journal.create');
    }

    return Inertia::render('Auth/Landing');
})->name('home');

Route::get('/health', function () {
    return response()->json(['ok' => true], 200);
});

Route::get('/feedback', function () {
    return Inertia::render('Feedback', [
        'entry' => null,
    ]);
})->name('guest.feedback');

Route::get('/dashboard', function () {
    return redirect()->route('journal.create');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::get('/settings/sections', [JournalSectionSettingsController::class, 'edit'])->name('settings.sections.edit');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    Route::put('/settings/sections', [JournalSectionSettingsController::class, 'update'])->name('settings.sections.update');
});

Route::get('/journal', [JournalController::class, 'create'])->name('journal.create');

Route::middleware(['auth'])->group(function () {
    Route::post('/journal', [JournalController::class, 'store'])->name('journal.store');
    Route::post('/journal/guest', [JournalController::class, 'storeGuest'])->name('journal.guest.store');
    Route::get('/journal/history', [JournalController::class, 'history'])->name('journal.history');
    Route::get('/journal/{journal}', [JournalController::class, 'show'])->name('journal.show');
});

Route::prefix('api')->group(function () {
    Route::post('/guest/feedback', [GuestJournalFeedbackController::class, 'store'])
        ->middleware('throttle:20,1')
        ->name('api.guest.feedback');
});

Route::middleware('auth')->prefix('api')->group(function () {
    Route::get('/presets', [JournalPresetController::class, 'index'])->name('api.presets.index');
    Route::post('/presets/custom', [JournalPresetController::class, 'store'])->name('api.presets.custom.store');
    Route::put('/presets/custom', [JournalPresetController::class, 'update'])->name('api.presets.custom.update');
    Route::put('/presets/active', [JournalPresetController::class, 'updateActive'])->name('api.presets.active.update');
});

require __DIR__ . '/auth.php';
