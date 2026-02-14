<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);


use App\Http\Controllers\Api\AgentController;
use App\Http\Controllers\Api\PortOfficerController;
use App\Http\Controllers\Api\WharfController;
use App\Http\Controllers\Api\TraderController;
use App\Http\Controllers\Api\ExecutiveController;

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // Agent Routes
    Route::group(['middleware' => ['role:agent']], function () {
        Route::post('/agent/vessels', [AgentController::class, 'submitArrival']);
        Route::get('/agent/vessels/check-imo/{imo}', [AgentController::class, 'checkIMO']);
        Route::get('/agent/vessels', [AgentController::class, 'getVessels']);
        Route::post('/agent/manifests', [AgentController::class, 'uploadManifest']);
        Route::get('/agent/manifests', [AgentController::class, 'getManifests']);
        Route::post('/agent/anchorage', [AgentController::class, 'submitAnchorageRequest']);
        Route::get('/agent/anchorage', [AgentController::class, 'getAnchorageRequests']);
        Route::get('/agent/stats', [AgentController::class, 'getDashboardStats']);
        Route::get('/agent/tracker', [AgentController::class, 'getTrackerData']);
    });

    // Port Officer Routes
    Route::group(['middleware' => ['role:officer']], function () {
        Route::get('/officer/dashboard', [PortOfficerController::class, 'getDashboardStats']);
        Route::get('/officer/vessels', [PortOfficerController::class, 'getVessels']);
        Route::post('/officer/vessels/{id}/approve', [PortOfficerController::class, 'approveArrival']);
        Route::post('/officer/vessels/{id}/berth', [PortOfficerController::class, 'assignBerth']);
        Route::delete('/officer/vessels/{id}/berth', [PortOfficerController::class, 'releaseBerth']); // Release berth
        Route::post('/officer/clearance', [PortOfficerController::class, 'issueClearance']);
        Route::get('/officer/clearances', [PortOfficerController::class, 'getClearances']);
        Route::get('/officer/logs', [PortOfficerController::class, 'getLogs']);
        Route::get('/officer/wharves', [PortOfficerController::class, 'getWharves']);
    });

    // Wharf Routes
    Route::group(['middleware' => ['role:wharf']], function () {
        Route::get('/wharf/wharves', [WharfController::class, 'getWharves']);
        Route::get('/wharf/wharves', [WharfController::class, 'getWharves']);
        Route::patch('/wharf/wharves/{id}', [WharfController::class, 'updateWharfStatus']);
        Route::get('/wharf/dashboard', [WharfController::class, 'getDashboardStats']);
        Route::get('/wharf/containers', [WharfController::class, 'getContainers']);
        Route::put('/wharf/{id}/status', [WharfController::class, 'updateWharfStatus']);
        Route::post('/wharf/assign-container', [WharfController::class, 'assignContainer']);
        Route::post('/wharf/containers/{id}/log', [WharfController::class, 'logContainerOperation']);
        Route::get('/wharf/containers', [WharfController::class, 'getContainers']);
    });

    // Trader Routes
    Route::group(['middleware' => ['role:trader']], function () {
        Route::get('/trader/dashboard', [TraderController::class, 'getDashboardStats']);
        Route::get('/trader/containers', [TraderController::class, 'getContainers']);
        Route::post('/trader/discharge-request', [TraderController::class, 'requestDischarge']);
        Route::get('/trader/discharge-requests', [TraderController::class, 'getDischargeRequests']);
    });

    // Executive Routes
    Route::group(['middleware' => ['role:executive']], function () {
        Route::get('/executive/logs', [ExecutiveController::class, 'getLogs']);
        Route::get('/executive/reports', [ExecutiveController::class, 'getReports']);
        Route::get('/executive/dashboard', [ExecutiveController::class, 'getDashboardStats']);
        Route::get('/executive/approvals', [ExecutiveController::class, 'getPendingApprovals']);
        Route::get('/executive/anchorage/requests', [ExecutiveController::class, 'getAnchorageRequests']);
        Route::post('/executive/anchorage/{id}/approve', [ExecutiveController::class, 'approveAnchorage']);
        Route::post('/executive/anchorage/{id}/reject', [ExecutiveController::class, 'rejectAnchorage']);
        Route::get('/executive/decisions', [ExecutiveController::class, 'getRecentDecisions']);
    });
});

