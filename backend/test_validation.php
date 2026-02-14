<?php

error_reporting(E_ALL);
ini_set('display_errors', 1);

use App\Models\Vessel;
use App\Models\AnchorageRequest;
use App\Models\User;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

function testArrivalValidation($data) {
    echo "Testing Arrival Validation for IMO: " . $data['imo_number'] . "...\n";
    $rules = [
        'imo_number' => 'required|string|size:9',
        'name' => 'required|string',
        'type' => 'required|string',
        'flag' => 'nullable|string',
        'eta' => 'required|date|after_or_equal:now',
    ];

    $validator = Validator::make($data, $rules);
    
    if ($validator->fails()) {
        echo "Validation Failed (as expected for bad data): " . implode(', ', $validator->errors()->all()) . "\n";
    } else {
        echo "Initial Validation Passed.\n";

        // Simulate passedValidation logic
        $vessel = Vessel::where('imo_number', $data['imo_number'])
            ->where('status', 'awaiting')
            ->first();

        if ($vessel) {
            echo "Business Rule Caught: A pending arrival notice already exists for this ship.\n";
        } else {
            echo "Business Rule Passed (no pending arrival).\n";
        }
    }
}

function testAnchorageValidation($data) {
    echo "\nTesting Anchorage Validation for Vessel ID: " . $data['vessel_id'] . "...\n";
    $rules = [
        'vessel_id' => 'required|exists:vessels,id',
        'duration' => 'required|string',
        'reason' => 'required|string',
        'location' => 'nullable|string',
        'docking_time' => 'required|date|after_or_equal:now',
    ];

    $validator = Validator::make($data, $rules);

    if ($validator->fails()) {
        echo "Validation Failed (as expected for bad data): " . implode(', ', $validator->errors()->all()) . "\n";
    } else {
        echo "Initial Validation Passed.\n";

        // Simulate passedValidation logic
        $pendingRequest = AnchorageRequest::where('vessel_id', $data['vessel_id'])
            ->where('status', 'pending')
            ->first();

        if ($pendingRequest) {
            echo "Business Rule Caught: An Agent cannot submit a new Docking Request if one is still Pending.\n";
        } else {
            echo "Business Rule Passed (no pending request).\n";
        }
    }
}

// 1. Test Past Date
testArrivalValidation([
    'imo_number' => '123456789',
    'name' => 'Test Ship',
    'type' => 'Cargo',
    'flag' => 'Panama',
    'eta' => '2020-01-01 12:00:00'
]);

// 2. Test Duplicate Pending Arrival
$vessel = Vessel::updateOrCreate(
    ['imo_number' => '999999999'],
    ['name' => 'Awaiting Ship', 'type' => 'Cargo', 'owner_id' => 1, 'status' => 'awaiting', 'eta' => '2027-01-01 12:00:00']
);

testArrivalValidation([
    'imo_number' => '999999999',
    'name' => 'Awaiting Ship',
    'type' => 'Cargo',
    'flag' => 'Panama',
    'eta' => '2027-02-01 12:00:00'
]);

// 3. Test Duplicate Pending Anchorage
$vessel->update(['status' => 'approved']);
AnchorageRequest::updateOrCreate(
    ['vessel_id' => $vessel->id, 'agent_id' => 1, 'status' => 'pending'],
    ['duration' => '24h', 'reason' => 'Initial', 'docking_time' => '2027-01-01 12:00:00']
);

testAnchorageValidation([
    'vessel_id' => $vessel->id,
    'duration' => '48h',
    'reason' => 'Another Test',
    'docking_time' => '2027-03-01 12:00:00'
]);

echo "\nVerification Done.\n";
