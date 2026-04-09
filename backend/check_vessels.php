<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$vessels = \Illuminate\Support\Facades\DB::select('SELECT id, name, status, type FROM vessels');

$lines = [];
$lines[] = "=== VESSELS ===";
foreach ($vessels as $v) {
    $lines[] = "ID:{$v->id} | Name:{$v->name} | Status:{$v->status} | Type:{$v->type}";
}
$lines[] = "Total: " . count($vessels);
$lines[] = "";

// Check containers table columns
$lines[] = "=== CONTAINERS COLUMNS ===";
try {
    $columns = \Illuminate\Support\Facades\DB::select("SHOW COLUMNS FROM containers");
    foreach ($columns as $col) {
        $lines[] = "{$col->Field} ({$col->Type})";
    }
} catch (\Exception $e) {
    $lines[] = "ERROR: " . $e->getMessage();
}

$content = implode("\n", $lines);
// Write as UTF-8 without BOM
file_put_contents(__DIR__ . '/db_report.md', $content);
