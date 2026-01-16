<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GuestEntryAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_can_access_entry_points(): void
    {
        $this->get('/')->assertOk();
        $this->get('/login')->assertOk();
        $this->get('/journal')->assertOk();
    }
}
