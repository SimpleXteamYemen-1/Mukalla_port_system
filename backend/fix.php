<?php
use Illuminate\Support\Facades\DB;
DB::statement("ALTER TABLE containers MODIFY COLUMN extraction_status ENUM('success', 'extracted', 'incomplete', 'failed', 'pending') DEFAULT 'pending'");
echo "ENUM Updated!";
