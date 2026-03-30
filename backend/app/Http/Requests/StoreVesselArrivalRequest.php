<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreVesselArrivalRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'imo_number' => 'required|string|regex:/^IMO\d{7}$/|unique:vessels,imo_number',
            'name' => 'required|string|max:255',
            'type' => 'required|string|in:container,bulk,tanker,ro-ro,general',
            'flag' => 'nullable|string|max:100',
            'eta' => 'required|date|after_or_equal:today',
            'purpose' => 'required|string',
            'cargo' => 'nullable|string',
            'priority' => 'required|string|in:Low,Medium,High',
            'priority_reason' => 'nullable|required_if:priority,Medium|string|min:20',
            'priority_document' => 'nullable|required_if:priority,High|file|mimes:pdf,jpeg,jpg|max:10240',
        ];
    }
}
