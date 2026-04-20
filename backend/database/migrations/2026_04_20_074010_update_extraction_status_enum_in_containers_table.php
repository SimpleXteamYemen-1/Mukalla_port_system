<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::statement("ALTER TABLE containers MODIFY COLUMN extraction_status ENUM('success', 'extracted', 'incomplete', 'failed') DEFAULT 'failed'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("ALTER TABLE containers MODIFY COLUMN extraction_status ENUM('success', 'incomplete', 'failed') DEFAULT 'failed'");
    }
};
