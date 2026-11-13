import { useEffect, useSyncExternalStore } from 'react';

function subscribe(onChange: () => void) {
    window.addEventListener('online', onChange);
    window.addEventListener('offline', onChange);
    return () => {
        window.removeEventListener('online', onChange);
        window.removeEventListener('offline', onChange);
    };
}

export function useOnline(): boolean {
    return useSyncExternalStore(subscribe, () => navigator.onLine, () => true);
}

// Runs the callback whenever the connection comes back
export function useOnReconnect(callback: () => void): void {
    useEffect(() => {
        window.addEventListener('online', callback);
        return () => window.removeEventListener('online', callback);
    }, [callback]);
}
