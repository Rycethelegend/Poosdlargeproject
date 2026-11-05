export type Theme = 'light' | 'dark';

const THEME_KEY = 'theme';

export function getTheme(): Theme {
    try {
        return localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light';
    }
    catch {
        return 'light';
    }
}

// Light is the default. The choice is remembered on this device.
export function setTheme(theme: Theme): void {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    try {
        localStorage.setItem(THEME_KEY, theme);
    }
    catch {
        // Private browsing can block storage; the theme still applies for this visit
    }
}

export function applySavedTheme(): void {
    document.documentElement.classList.toggle('dark', getTheme() === 'dark');
}
