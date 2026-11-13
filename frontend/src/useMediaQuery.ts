import { useCallback, useSyncExternalStore } from 'react';

// True while the screen matches the CSS media query
export function useMediaQuery(query: string): boolean {
    const subscribe = useCallback((onChange: () => void) => {
        const list = window.matchMedia(query);
        list.addEventListener('change', onChange);
        return () => list.removeEventListener('change', onChange);
    }, [query]);

    return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, () => false);
}

// Phones in portrait or landscape
export const SMALL_SCREEN = '(max-width: 767px), (max-height: 500px)';
