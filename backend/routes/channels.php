<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('port-operations', function ($user) {
    // Only operational reviewers should receive live arrival notifications.
    return $user->hasAnyRole(['officer', 'executive']);
});
