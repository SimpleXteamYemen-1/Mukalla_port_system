<?php
$containers = \App\Models\Container::orderBy('id', 'desc')->take(2)->get();
foreach ($containers as $c) {
    echo "ID " . $c->id . ": " . basename($c->manifest_file_path) . PHP_EOL;
}
