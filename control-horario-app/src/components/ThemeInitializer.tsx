'use client';

import { useEffect } from 'react';

/**
 * This component applies the saved theme from localStorage on initial page load.
 * It runs before any UI renders to prevent flash of wrong theme.
 */
export function ThemeInitializer() {
    useEffect(() => {
        try {
            const stored = localStorage.getItem('timemaster_settings');
            if (stored) {
                const settings = JSON.parse(stored);
                if (settings?.preferences?.theme === 'dark') {
                    document.documentElement.classList.add('dark');
                } else {
                    document.documentElement.classList.remove('dark');
                }
            }
        } catch (e) {
            console.error('Error loading theme from localStorage:', e);
        }
    }, []);

    return null; // This component renders nothing
}
