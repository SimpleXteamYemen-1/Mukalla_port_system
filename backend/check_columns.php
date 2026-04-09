<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$vessels_cols = \Illuminate\Support\Facades\Schema::getColumnListing('vessels');
$containers_cols = \Illuminate\Support\Facades\Schema::getColumnListing('containers');

echo "VESSELS: " . implode(", ", $vessels_cols) . "\n";
echo "CONTAINERS: " . implode(", ", $containers_cols) . "\n";
