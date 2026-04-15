<?php
$result = DB::select("SHOW COLUMNS FROM vessels LIKE 'status'")[0]->Type;
echo "Vessel status enum: " . $result . PHP_EOL;
