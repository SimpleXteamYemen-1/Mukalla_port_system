<?php
echo "Vessels schema: " . implode(", ", \Schema::getColumnListing('vessels')) . PHP_EOL;
echo "Arrival schema: " . implode(", ", \Schema::getColumnListing('arrival_notifications')) . PHP_EOL;
echo "Container schema: " . implode(", ", \Schema::getColumnListing('containers')) . PHP_EOL;
