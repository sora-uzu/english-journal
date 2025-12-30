<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Route;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class AuthenticatedSessionController extends Controller
{
    /**
     * Display the login view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => session('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): SymfonyResponse
    {
        $sessionIdBefore = $request->session()->getId();
        $isInertia = $request->header('X-Inertia') !== null;

        Log::info('auth.login.start', [
            'email' => $request->input('email'),
            'ip' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'session_id' => $sessionIdBefore,
            'inertia' => $isInertia,
        ]);

        try {
            $request->authenticate();
        } catch (ValidationException $exception) {
            Log::warning('auth.login.failed', [
                'email' => $request->input('email'),
                'ip' => $request->ip(),
                'session_id' => $sessionIdBefore,
                'errors' => $exception->errors(),
                'inertia' => $isInertia,
            ]);

            throw $exception;
        }

        $request->session()->regenerate();

        $sessionIdAfter = $request->session()->getId();
        $redirect = redirect()->intended(route('journal.create', absolute: false));
        $targetUrl = $redirect->getTargetUrl();

        Log::info('auth.login.success', [
            'user_id' => $request->user()?->id,
            'session_id_before' => $sessionIdBefore,
            'session_id_after' => $sessionIdAfter,
            'intended' => $targetUrl,
            'inertia' => $isInertia,
        ]);

        if ($isInertia) {
            return Inertia::location($targetUrl);
        }

        return $redirect;
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        return redirect('/');
    }
}
