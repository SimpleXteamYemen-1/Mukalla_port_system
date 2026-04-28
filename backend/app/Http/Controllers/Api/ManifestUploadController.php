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
        // Agents may only upload manifests to their own arrival notifications.
        $vessel = Vessel::where('id', $id)
            ->where('owner_id', $request->user()->id)
            ->firstOrFail();

        $request->validate([
            'manifests' => 'required|array',
            'manifests.*' => 'required|file|mimes:pdf,jpg,jpeg,png|max:10240',
        ]);

        $successfulUploads = [];
        $failedUploads = [];

        foreach ($request->file('manifests') as $file) {
            $path = $file->store('manifests', 'public');
            $absolutePath = Storage::disk('public')->path($path);
            
            $extractionStatus = 'failed';
            $extractionErrors = ['General extraction error'];
            $errorReason = 'General extraction error';
            $extractedData = [];

            try {
                $extractedData = $this->extractionService->extractData($absolutePath, $vessel);
                $validation = $this->extractionService->validateExtraction($extractedData);
                
                // Map 'success' to 'extracted' as per new schema
                $extractionStatus = $validation['status'] === 'success' ? 'extracted' : $validation['status'];
                $extractionErrors = $validation['errors'];
                $errorReason = $validation['error_reason'] ?? null;
            } catch (\Exception $e) {
                Log::error("Extraction failed for {$path}: " . $e->getMessage());
                $extractionErrors = [$e->getMessage()];
                $errorReason = "Unrecognized PDF format or processing error";
            }

            if ($extractionStatus === 'failed' || $extractionStatus === 'incomplete') {
                Storage::disk('public')->delete($path);
                $failedUploads[] = [
                    'file_name' => $file->getClientOriginalName(),
                    'error_reason' => $errorReason,
                    'extraction_errors' => $extractionErrors,
                ];
                continue;
            }

            // Persistence: Automatically save successfully extracted or incomplete valid records
            $container = Container::create([
                'vessel_id' => $vessel->id,
                'manifest_file_path' => $path,
                'port_of_loading' => $extractedData['port_of_loading'] ?? '',
                'arrival_date' => $extractedData['date'] ?? now()->format('Y-m-d'),
                'description_of_goods' => $extractedData['description'] ?? '',
                'storage_type' => $extractedData['storage_type'] ?? 'dry',
                'consignee_name' => $extractedData['consignee_name'] ?? '',
                'consignee_phone' => $extractedData['consignee_phone'] ?? '',
                'trader_user_id' => $extractedData['trader_user_id'] ?? null,
                'status' => 'pending',
                'extraction_status' => $extractionStatus,
                'extraction_errors' => $extractionErrors,
                'error_reason' => $errorReason,
            ]);

            $successfulUploads[] = [
                'id' => $container->id,
                'file_name' => $file->getClientOriginalName(),
                'path' => $path,
                'extraction_status' => $extractionStatus,
                'extraction_errors' => $extractionErrors,
                'error_reason' => $errorReason,
                'container' => $container
            ];
        }

        return response()->json([
            'message' => 'Processing complete.',
            'successful_uploads' => $successfulUploads,
            'failed_uploads' => $failedUploads,
            'results' => $successfulUploads // Fallback for any legacy code expecting 'results'
        ], 200);
    }
}
