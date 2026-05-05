<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Container;
use App\Models\User;

$user = User::where('role', 'trader')->first(); // Assuming first trader for debug
if (!$user) {
    echo "No trader found\n";
    exit;
}

echo "Trader: " . $user->name . " (" . $user->email . ")\n";

$containers = Container::where(function ($query) use ($user) {
        $query->where('trader_user_id', $user->id)
              ->orWhere('consignee_phone', $user->phone);
    })->with('vessel')->get();

echo "Count: " . $containers->count() . "\n";

foreach ($containers as $c) {
    echo "ID: " . $c->id . " | Vessel: " . ($c->vessel->name ?? 'N/A') . " | Status: '" . $c->status . "'\n";
}
