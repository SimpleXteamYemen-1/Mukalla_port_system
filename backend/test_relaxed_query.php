<?php

use App\Models\Container;
use App\Models\User;
use App\Models\Vessel;
use Illuminate\Support\Facades\DB;

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

// Test inputs
$traderName = ' Test Trader  '; // With whitespace and mixed case
$userNameNormalized = strtolower(trim($traderName));

echo "Normalized User Name: '$userNameNormalized'\n";

$query = Container::whereRaw('LOWER(TRIM(consignee_name)) = ?', [$userNameNormalized])
    ->whereHas('vessel', function ($q) {
        $q->whereIn(DB::raw('LOWER(status)'), ['anchored', 'wharf_assigned', 'wharf assigned']);
    });

echo "SQL Query: " . $query->toSql() . "\n";
echo "Bindings: " . json_encode($query->getBindings()) . "\n";

$results = $query->with(['vessel.wharf', 'arrivalNotification.wharf'])->get();
echo "Found " . $results->count() . " matching containers.\n";

foreach ($results as $c) {
    $wharfName = $c->vessel->wharf->name ?? $c->arrivalNotification->wharf->name ?? 'N/A';
    echo "ID: {$c->id}, Vessel Status: {$c->vessel->status}, Wharf: {$wharfName}\n";
}
