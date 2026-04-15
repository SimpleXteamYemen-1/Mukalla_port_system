<?php
$containers = \App\Models\Container::orderBy('id', 'desc')->take(5)->get();
foreach ($containers as $c) {
    echo "ID: {$c->id} | PATH: {$c->manifest_file_path} | STATUS: {$c->extraction_status} | REASON: {$c->error_reason}" . PHP_EOL;
}
echo "END_DB_DUMP";
