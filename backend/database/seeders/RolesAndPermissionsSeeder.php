<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\PermissionRegistrar;

class RolesAndPermissionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // create permissions
        Permission::create(['name' => 'submit_arrival']);
        Permission::create(['name' => 'approve_arrival']);
        Permission::create(['name' => 'manage_wharves']);
        Permission::create(['name' => 'request_discharge']);
        Permission::create(['name' => 'view_reports']);

        // create roles and assign existing permissions
        $agentRole = Role::create(['name' => 'agent']);
        $agentRole->givePermissionTo('submit_arrival');

        $officerRole = Role::create(['name' => 'officer']);
        $officerRole->givePermissionTo(['approve_arrival', 'view_reports']);

        $wharfRole = Role::create(['name' => 'wharf']);
        $wharfRole->givePermissionTo(['manage_wharves', 'view_reports']);

        $traderRole = Role::create(['name' => 'trader']);
        $traderRole->givePermissionTo('request_discharge');

        $executiveRole = Role::create(['name' => 'executive']);
        $executiveRole->givePermissionTo(['view_reports']);

        // Create test users
        $user = User::factory()->create([
            'name' => 'Test Agent',
            'email' => 'agent@example.com',
            'role' => 'agent',
            'verified' => true,
            'password' => Hash::make('password'),
        ]);
        $user->assignRole($agentRole);

        $user = User::factory()->create([
            'name' => 'Test Officer',
            'email' => 'officer@example.com',
            'role' => 'officer',
            'verified' => true,
            'password' => Hash::make('password'),
        ]);
        $user->assignRole($officerRole);

        $user = User::factory()->create([
            'name' => 'Test Wharf Manager',
            'email' => 'wharf@example.com',
            'role' => 'wharf',
            'verified' => true,
            'password' => Hash::make('password'),
        ]);
        $user->assignRole($wharfRole);

        $user = User::factory()->create([
            'name' => 'Test Trader',
            'email' => 'trader@example.com',
            'role' => 'trader',
            'verified' => true,
            'password' => Hash::make('password'),
        ]);
        $user->assignRole($traderRole);

        $user = User::factory()->create([
            'name' => 'Test Executive',
            'email' => 'executive@example.com',
            'role' => 'executive',
            'verified' => true,
            'password' => Hash::make('password'),
        ]);
        $user->assignRole($executiveRole);
    }
}
