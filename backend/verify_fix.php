<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Container;
use App\Models\User;
use Illuminate\Support\Facades\DB;

// Simulate the trader user
$trader = User::where('name', 'Test Trader')->first();
if (!$trader) {
    die("Trader 'Test Trader' not found in database.\n");
}

$userName = strtolower(trim($trader->name));
echo "Testing for Trader: '{$trader->name}' (Normalized: '$userName')\n";

$containers = Container::whereRaw('LOWER(TRIM(consignee_name)) = ?', [$userName])
    ->whereHas('vessel', function ($q) {
        $q->whereIn(DB::raw('LOWER(status)'), [
            'anchored', 
            'wharf_assigned', 
            'wharf assigned', 
            'approved', 
            'scheduled', 
            'docked'
        ]);
    })
    ->with(['vessel.wharf', 'arrivalNotification'])
    ->get();

echo "Matched Containers count: " . $containers->count() . "\n";
foreach ($containers as $c) {
    echo "ID: {$c->id}, Vessel: [{$c->vessel->name}], Vessel Status: [{$c->vessel->status}]\n";
}
