<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class CreateAgentGmailUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Find existing agent role or create if somehow missing (though should exist)
        $role = Role::firstOrCreate(['name' => 'agent']);

        // Create or update user
        $user = User::updateOrCreate(
            ['email' => 'agent@gmail.com'],
            [
                'name' => 'Agent Gmail',
                'password' => Hash::make('password'),
                'role' => 'agent',
                'verified' => true,
            ]
        );

        $user->assignRole($role);
    }
}
