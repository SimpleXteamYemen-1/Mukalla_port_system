import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

// Extend window object for Echo
declare global {
    interface Window {
        Pusher: typeof Pusher;
        Echo: any;
    }
}

window.Pusher = Pusher;

export const echo = new Echo({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY || '1st4oap75rtksuokr12y',
    wsHost: import.meta.env.VITE_REVERB_HOST || 'localhost',
    wsPort: import.meta.env.VITE_REVERB_PORT || 8081,
    wssPort: import.meta.env.VITE_REVERB_PORT || 8081,
    forceTLS: false,
    enabledTransports: ['ws', 'wss'],
});
