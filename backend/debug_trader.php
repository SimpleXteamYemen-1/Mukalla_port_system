<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use App\Models\Container;

echo "--- Traders ---\n";
$traders = User::where('role', 'trader')->get();
foreach ($traders as $t) {
    echo "ID: {$t->id}, Name: [{$t->name}], Phone: {$t->phone}\n";
}

echo "\n--- Recent Containers & Vessels ---\n";
$containers = Container::with('vessel')->latest()->take(20)->get();
foreach ($containers as $c) {
    $vessel = $c->vessel;
    $vStatus = $vessel ? $vessel->status : 'NO VESSEL';
    $vName = $vessel ? $vessel->name : 'N/A';
    echo "Container ID: {$c->id}, Consignee: [{$c->consignee_name}], C-Status: {$c->status}, Vessel: [{$vName}], V-Status: [{$vStatus}]\n";
}
