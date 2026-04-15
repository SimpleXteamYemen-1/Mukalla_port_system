<?php
$containers = \App\Models\Container::orderBy('id', 'desc')->take(2)->get();
foreach ($containers as $c) {
    echo "ID: " . $c->id;
    // container doesn't save original file name, it relies on frontend to map it. Wait, the response array returned the original file name!
}
