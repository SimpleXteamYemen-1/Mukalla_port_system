<?php
$containers = \App\Models\Container::orderBy('id', 'desc')->take(2)->get();
foreach ($containers as $c) {
    echo "ID: " . $c->id . " | Consignee: " . $c->consignee_name . " | Status: " . $c->extraction_status . PHP_EOL;
}
