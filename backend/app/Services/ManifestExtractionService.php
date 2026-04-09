<?php

namespace App\Services;

class ManifestExtractionService
{
    /**
     * Required fields that OCR must extract for a manifest to be considered complete.
     */
    private const REQUIRED_FIELDS = [
        'port_of_loading',
        'date',
        'description',
        'consignee_name',
        'consignee_phone',
    ];

    /**
     * Placeholder OCR/Extraction logic for Manifest PDFs/Images.
     * Currently returns a simulated array of extracted data.
     */
    public function extractData($filePath)
    {
        // TODO: Integrate actual OCR package (e.g., thiagoalessio/tesseract_ocr or AWS Textract)
        // For now, simulate OCR results
        $simulatedDescription = 'Pallets of imported frozen fish and chicken';

        return [
            'port_of_loading' => 'Jebel Ali Port',
            'date' => now()->format('Y-m-d'),
            'description' => $simulatedDescription,
            'consignee_name' => 'Mukalla Trading Co.',
            'consignee_phone' => '+967712345678',
            'storage_type' => $this->categorizeGoods($simulatedDescription),
        ];
    }

    /**
     * Validates the extracted data against required fields.
     * Returns an array with 'status' ('success' | 'incomplete' | 'failed')
     * and 'errors' (list of missing/empty field names).
     */
    public function validateExtraction(array $extractedData): array
    {
        $missingFields = [];

        foreach (self::REQUIRED_FIELDS as $field) {
            if (!isset($extractedData[$field]) || trim((string) $extractedData[$field]) === '') {
                $missingFields[] = $field;
            }
        }

        if (empty($missingFields)) {
            return [
                'status' => 'success',
                'errors' => null,
            ];
        }

        // If ALL required fields are missing, it's a full failure (OCR likely returned nothing)
        if (count($missingFields) === count(self::REQUIRED_FIELDS)) {
            return [
                'status' => 'failed',
                'errors' => $missingFields,
            ];
        }

        // Partial extraction — some fields are missing
        return [
            'status' => 'incomplete',
            'errors' => $missingFields,
        ];
    }

    /**
     * Categorizes goods based on keyword matching in their description.
     */
    public function categorizeGoods($description)
    {
        $description = strtolower($description);

        $frozenKeywords = ['meat', 'ice', '-18c', 'fish', 'chicken'];
        foreach ($frozenKeywords as $keyword) {
            if (strpos($description, $keyword) !== false) {
                return 'frozen';
            }
        }

        $chemicalKeywords = ['acid', 'fertilizer', 'toxin'];
        foreach ($chemicalKeywords as $keyword) {
            if (strpos($description, $keyword) !== false) {
                return 'chemical';
            }
        }

        return 'dry';
    }
}
