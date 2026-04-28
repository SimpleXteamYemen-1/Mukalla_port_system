<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Log as AuditLog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class AdminController extends Controller
{
    // -------------------------------------------------------------------------
    // GET /admin/users
    // Paginated list with filters: role, status, search (name/email)
    // -------------------------------------------------------------------------
    public function index(Request $request)
    {
        $request->validate([
            'role'     => ['nullable', Rule::in(['trader', 'agent', 'executive', 'officer', 'wharf'])],
            'status'   => ['nullable', Rule::in(['pending', 'active', 'rejected', 'suspended'])],
            'search'   => 'nullable|string|max:100',
            'per_page' => 'nullable|integer|min:5|max:100',
            'trashed'  => 'nullable|boolean',
        ]);

        $query = User::query();

        // Include soft-deleted if requested
        if ($request->boolean('trashed')) {
            $query->onlyTrashed();
        }

        // Filters
        if ($request->filled('role')) {
            $query->where('role', $request->role);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $term = '%' . $request->search . '%';
            $query->where(function ($q) use ($term) {
                $q->where('name', 'like', $term)
                  ->orWhere('email', 'like', $term);
            });
        }

        $users = $query
            ->orderByDesc('created_at')
            ->paginate($request->input('per_page', 15));

        return response()->json($users);
    }

    // -------------------------------------------------------------------------
    // POST /admin/users
    // Direct creation — bypasses approval, sets status = active.
    // -------------------------------------------------------------------------
    public function store(Request $request)
    {
        $request->validate([
            'name'         => 'required|string|max:255',
            'email'        => 'required|email|unique:users,email',
            'role'         => ['required', Rule::in(['trader', 'agent', 'executive', 'officer', 'wharf'])],
            'organization' => 'nullable|string|max:255',
            'password'     => 'nullable|string|min:8|confirmed',
        ]);

        // If no password supplied, generate a random one and send a reset link.
        $rawPassword    = $request->filled('password')
            ? $request->password
            : Str::random(16);
        $sendResetLink  = ! $request->filled('password');

        $user = User::create([
            'name'         => $request->name,
            'email'        => $request->email,
            'password'     => Hash::make($rawPassword),
            'role'         => $request->role,
            'organization' => $request->organization,
            'status'       => User::STATUS_ACTIVE,   // bypass approval
        ]);

        // Assign Spatie role so middleware gates work
        $user->syncRoles([$request->role]);

        $passwordResetSent = false;
        $passwordResetWarning = null;

        // Send "Set your password" link when no password was provided.
        if ($sendResetLink) {
            $resetStatus = Password::sendResetLink(['email' => $user->email]);
            $passwordResetSent = $resetStatus === Password::RESET_LINK_SENT;

            if (! $passwordResetSent) {
                Log::warning('Admin-created user password reset link could not be sent.', [
                    'user_id' => $user->id,
                    'email' => $user->email,
                    'status' => $resetStatus,
                ]);

                $passwordResetWarning = 'User was created, but the password reset email could not be sent.';
            }
        }

        $this->auditAdminAction($request, 'admin_user_created', "Created {$user->role} account for {$user->email}.");

        return response()->json([
            'message'         => 'User created successfully.',
            'user'            => $user,
            'password_reset'  => $passwordResetSent,
            'password_reset_warning' => $passwordResetWarning,
        ], 201);
    }

    // -------------------------------------------------------------------------
    // PUT/PATCH /admin/users/{id}
    // Update details, role, status. Revoke tokens on suspend.
    // -------------------------------------------------------------------------
    public function update(Request $request, int $id)
    {
        $user = User::withTrashed()->findOrFail($id);
        $isSelfUpdate = (int) $request->user()->id === (int) $user->id;

        $request->validate([
            'name'             => 'sometimes|required|string|max:255',
            'email'            => ['sometimes', 'required', 'email', Rule::unique('users', 'email')->ignore($id)],
            'role'             => ['sometimes', 'required', Rule::in(['trader', 'agent', 'executive', 'officer', 'wharf'])],
            'organization'     => 'nullable|string|max:255',
            'status'           => ['sometimes', 'required', Rule::in(['pending', 'active', 'rejected', 'suspended'])],
            'rejection_reason' => 'nullable|string|max:500',
            'phone'            => 'nullable|string|max:30',
        ]);

        if ($isSelfUpdate && $request->input('status') === User::STATUS_SUSPENDED) {
            return response()->json([
                'message' => 'You cannot suspend your own account.',
                'errors' => [
                    'status' => ['You cannot suspend your own account.'],
                ],
            ], 422);
        }

        if ($isSelfUpdate && $request->has('role') && $request->input('role') !== $user->role) {
            return response()->json([
                'message' => 'You cannot change your own role.',
                'errors' => [
                    'role' => ['You cannot change your own role.'],
                ],
            ], 422);
        }

        $oldStatus = $user->status;

        $user->fill($request->only([
            'name', 'email', 'role', 'organization',
            'status', 'rejection_reason', 'phone',
        ]));

        $user->save();

        // Sync Spatie role if role was changed
        if ($request->has('role')) {
            $user->syncRoles([$request->role]);
        }

        // Immediately revoke all active tokens when account is suspended
        $newStatus = $user->status;
        if ($newStatus === User::STATUS_SUSPENDED && $oldStatus !== User::STATUS_SUSPENDED) {
            $user->tokens()->delete();
        }

        $this->auditAdminAction($request, 'admin_user_updated', "Updated account {$user->email}.");

        return response()->json([
            'message'          => 'User updated successfully.',
            'user'             => $user->fresh(),
            'tokens_revoked'   => ($newStatus === User::STATUS_SUSPENDED && $oldStatus !== User::STATUS_SUSPENDED),
        ]);
    }

    // -------------------------------------------------------------------------
    // DELETE /admin/users/{id}
    // Soft-delete only. Revokes tokens. Preserves relational history.
    // -------------------------------------------------------------------------
    public function destroy(Request $request, int $id)
    {
        $user = User::findOrFail($id);               // 404 if already soft-deleted

        if ((int) $request->user()->id === (int) $user->id) {
            return response()->json([
                'message' => 'You cannot delete your own account.',
            ], 422);
        }

        // Revoke all active sessions before soft-deleting
        $user->tokens()->delete();

        $user->delete();                             // SoftDeletes → sets deleted_at
        $this->auditAdminAction($request, 'admin_user_deleted', "Deactivated account {$user->email}.");

        return response()->json([
            'message' => 'User account deactivated. All sessions have been revoked.',
        ]);
    }

    // -------------------------------------------------------------------------
    // POST /admin/users/{id}/restore
    // Restore a soft-deleted account.
    // -------------------------------------------------------------------------
    public function restore(Request $request, int $id)
    {
        $user = User::onlyTrashed()->findOrFail($id);
        $user->restore();
        $this->auditAdminAction($request, 'admin_user_restored', "Restored account {$user->email}.");

        return response()->json([
            'message' => 'User account restored.',
            'user'    => $user->fresh(),
        ]);
    }

    private function auditAdminAction(Request $request, string $action, string $details): void
    {
        try {
            AuditLog::create([
                'user_id' => $request->user()->id,
                'action' => $action,
                'details' => $details,
            ]);
        } catch (\Throwable $e) {
            Log::warning('Admin audit log could not be written.', [
                'action' => $action,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
