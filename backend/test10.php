<?php
$containers = \App\Models\Container::orderBy('id', 'desc')->take(10)->get();
foreach ($containers as $c) {
    echo "ID: " . $c->id . " | Path: " . $c->manifest_file_path . " | Size: " . (file_exists(storage_path('app/public/' . $c->manifest_file_path)) ? filesize(storage_path('app/public/' . $c->manifest_file_path)) : 'DELETED') . " | Status: " . $c->extraction_status . " | Created: " . $c->created_at . PHP_EOL;
}
