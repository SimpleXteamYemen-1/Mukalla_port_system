<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Spatie\Permission\Models\Role;

class SyncLegacyRolesToSpatieSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Fetch all users that have a value in the plain 'role' column
        $users = User::whereNotNull('role')->get();

        foreach ($users as $user) {
            $legacyRole = strtolower(trim($user->role));

            if ($legacyRole) {
                // Ensure the Spatie role exists
                $spatieRole = Role::firstOrCreate(['name' => $legacyRole]);

                // If the user doesn't have the role via Spatie yet, assign it
                if (!$user->hasRole($legacyRole)) {
                    $user->assignRole($legacyRole);
                    $this->command->info("Assigned Spatie role '{$legacyRole}' to user ID {$user->id}");
                }
            }
        }
        
        $this->command->info("Legacy roles sync complete.");
    }
}
