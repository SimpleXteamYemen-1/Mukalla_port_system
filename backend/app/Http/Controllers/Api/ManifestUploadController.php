<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Vessel; // The model driving Arrival Notifications internally
use App\Models\Container;
use App\Services\ManifestExtractionService;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class ManifestUploadController extends Controller
{
    protected $extractionService;

    public function __construct(ManifestExtractionService $extractionService)
    {
        $this->extractionService = $extractionService;
    }

    public function upload(Request $request, $id)
    {
        // Require the vessels record to exist representing the Arrival Notification
        $vessel = Vessel::findOrFail($id);

        $request->validate([
            'manifests' => 'required|array',
            'manifests.*' => 'required|file', // Could strictly type mimes:pdf,jpg,png here
        ]);

        $createdContainers = [];

        foreach ($request->file('manifests') as $file) {
            $path = $file->store('manifests', 'public');
            $absolutePath = Storage::disk('public')->path($path);
            
            $extractionStatus = 'failed';
            $extractionErrors = ['General extraction error'];
            $extractedData = [];

            try {
                $extractedData = $this->extractionService->extractData($absolutePath);
                $validation = $this->extractionService->validateExtraction($extractedData);
                $extractionStatus = $validation['status'];
                $extractionErrors = $validation['errors'];
            } catch (\Exception $e) {
                Log::error("Extraction failed for {$path}: " . $e->getMessage());
                $extractionErrors = [$e->getMessage()];
            }

            // Persistence: Always save the record so the Agent can manage it
            $container = Container::create([
                'vessel_id' => $vessel->id,
                'manifest_file_path' => $path,
                'port_of_loading' => $extractedData['port_of_loading'] ?? '',
                'arrival_date' => $extractedData['date'] ?? now()->format('Y-m-d'),
                'description_of_goods' => $extractedData['description'] ?? '',
                'storage_type' => $extractedData['storage_type'] ?? 'dry',
                'consignee_name' => $extractedData['consignee_name'] ?? '',
                'consignee_phone' => $extractedData['consignee_phone'] ?? '',
                'trader_user_id' => null,
                'status' => 'pending',
                'extraction_status' => $extractionStatus,
                'extraction_errors' => $extractionErrors,
            ]);

            $createdContainers[] = [
                'id' => $container->id,
                'file_name' => $file->getClientOriginalName(),
                'path' => $path,
                'extraction_status' => $extractionStatus,
                'extraction_errors' => $extractionErrors,
                'container' => $container
            ];
        }

        return response()->json([
            'message' => count($createdContainers) . ' manifest(s) processed.',
            'results' => $createdContainers
        ], 200);
    }
}
