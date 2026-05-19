<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\DischargeRequest;
use App\Models\User;

$trader = User::where('email', 'trader@example.com')->first();
echo "Trader: " . ($trader ? $trader->name . " (ID: " . $trader->id . ")" : "NONE") . "\n\n";

$all = DischargeRequest::all();
echo "Total discharge requests in DB: " . $all->count() . "\n\n";

foreach ($all as $r) {
    echo "ID: {$r->id} | batch_id: {$r->batch_id} | trader_id: {$r->trader_id} | vessel_id: {$r->vessel_id} | status: {$r->status}\n";
}

if ($trader) {
    echo "\n--- Requests for this trader (trader_id = {$trader->id}) ---\n";
    $mine = DischargeRequest::where('trader_id', $trader->id)->get();
    echo "Count: " . $mine->count() . "\n";
}
