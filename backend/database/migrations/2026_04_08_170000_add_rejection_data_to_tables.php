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
        // Add rejection_reason to vessels
        Schema::table('vessels', function (Blueprint $table) {
            $table->text('rejection_reason')->nullable()->after('status');
        });

        // Modify containers status enum to include rejected_by_executive
        // Note: Changing ENUMs in Laravel/MySQL can be tricky. We'll use a raw statement for reliability.
        DB::statement("ALTER TABLE containers MODIFY COLUMN status ENUM('pending', 'in_wharf', 'cleared', 'rejected_by_executive') DEFAULT 'pending'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('vessels', function (Blueprint $table) {
            $table->dropColumn('rejection_reason');
        });

        DB::statement("ALTER TABLE containers MODIFY COLUMN status ENUM('pending', 'in_wharf', 'cleared') DEFAULT 'pending'");
    }
};
