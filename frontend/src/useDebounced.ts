import { useEffect, useState } from 'react';

// Returns value once it has stopped changing for delayMs. Search bars use this
// so each keypress doesn't fire its own request.
export function useDebounced<T>(value: T, delayMs = 250): T {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delayMs);
        return () => clearTimeout(timer);
    }, [value, delayMs]);
    return debounced;
}
