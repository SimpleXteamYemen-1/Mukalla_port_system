<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Vessel;
use App\Models\User;
use App\Models\Wharf;
use Illuminate\Support\Facades\DB;

class VesselSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Disable foreign key checks to safely truncate
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');

        // Delete all related records to ensure a fresh, clean slate
        DB::table('discharge_requests')->truncate();
        DB::table('containers')->truncate();
        DB::table('cargo_manifests')->truncate();
        DB::table('port_clearances')->truncate();
        DB::table('anchorage_requests')->truncate();
        DB::table('vessels')->truncate();

        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        // Get the test agent user
        $agent = User::where('email', 'agent@example.com')->first();
        if (!$agent) {
            $agent = User::first(); // Fallback
        }

        if (!$agent) {
            $this->command->error('No agent or fallback user found in the database. Please seed users first.');
            return;
        }

        // Get all available wharves to randomly assign
        $wharves = Wharf::all();

        $ships = [
            [
                'name' => 'MSC Gülsün',
                'imo_number' => '9839430',
                'flag' => 'Panama',
            ],
            [
                'name' => 'HMM Algeciras',
                'imo_number' => '9863297',
                'flag' => 'Panama',
            ],
            [
                'name' => 'Ever Ace',
                'imo_number' => '9893890',
                'flag' => 'Panama',
            ],
            [
                'name' => 'Ever Given',
                'imo_number' => '9811000',
                'flag' => 'Panama',
            ],
            [
                'name' => 'MSC Irina',
                'imo_number' => '9968095',
                'flag' => 'Liberia',
            ],
            [
                'name' => 'OOCL Hong Kong',
                'imo_number' => '9776171',
                'flag' => 'Hong Kong',
            ],
            [
                'name' => 'CMA CGM Jacques Saadé',
                'imo_number' => '9839179',
                'flag' => 'Malta',
            ],
            [
                'name' => 'Madrid Maersk',
                'imo_number' => '9778791',
                'flag' => 'Denmark',
            ],
            [
                'name' => 'MOL Triumph',
                'imo_number' => '9769271',
                'flag' => 'Marshall Islands',
            ],
            [
                'name' => 'ONE Innovation',
                'imo_number' => '9897468',
                'flag' => 'Japan',
            ],
            [
                'name' => 'COSCO Shipping Universe',
                'imo_number' => '9795622',
                'flag' => 'Hong Kong',
            ],
            [
                'name' => 'CMA CGM Antoine de Saint Exupery',
                'imo_number' => '9776418',
                'flag' => 'France',
            ],
            [
                'name' => 'MSC Tessa',
                'imo_number' => '9964908',
                'flag' => 'Liberia',
            ],
            [
                'name' => 'Ever Alot',
                'imo_number' => '9893931',
                'flag' => 'Panama',
            ],
            [
                'name' => 'Hyundai Courage',
                'imo_number' => '9458262',
                'flag' => 'South Korea',
            ],
            [
                'name' => 'Maersk Mc-Kinney Moller',
                'imo_number' => '9619907',
                'flag' => 'Denmark',
            ],
            [
                'name' => 'CSCL Globe',
                'imo_number' => '9695121',
                'flag' => 'Hong Kong',
            ],
            [
                'name' => 'APL Fullerton',
                'imo_number' => '9632208',
                'flag' => 'Singapore',
            ],
            [
                'name' => 'Xin Los Angeles',
                'imo_number' => '9732307',
                'flag' => 'Hong Kong',
            ],
            [
                'name' => 'YM Wellhead',
                'imo_number' => '9694608',
                'flag' => 'Taiwan',
            ],
        ];

        $statuses = ['awaiting', 'approved', 'wharf_assigned', 'departed'];

        foreach ($ships as $index => $shipData) {
            // Distribute statuses across the 20 ships
            // index 0-4: awaiting
            // index 5-9: approved
            // index 10-14: wharf_assigned
            // index 15-19: departed
            $status = $statuses[intdiv($index, 5)];

            $wharfId = null;
            if ($status === 'wharf_assigned' && $wharves->count() > 0) {
                $wharfId = $wharves->random()->id;
            }

            // Generate realistic dates
            $eta = now()->addDays(rand(-10, 10));
            $etd = (clone $eta)->addDays(rand(2, 5));

            Vessel::create([
                'name' => $shipData['name'],
                'imo_number' => $shipData['imo_number'],
                'flag' => $shipData['flag'],
                'type' => 'container',
                'owner_id' => $agent->id,
                'status' => $status,
                'expected_containers' => rand(1500, 24000),
                'eta' => $eta,
                'etd' => $etd,
                'current_wharf_id' => $wharfId,
                'purpose' => 'discharge',
                'cargo' => 'containers',
                'priority' => rand(1, 10) > 8, // 20% chance of being high priority
                'priority_reason' => 'Perishable goods / High value cargo',
            ]);
        }

        $this->command->info('Successfully seeded 20 real container vessels.');
    }
}
