import { createContext, useContext, useState, useEffect } from 'react';
import * as api from '../api/index.js';

const VALID_THEMES = ['orange', 'ocean', 'emerald', 'violet', 'rose'];

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
    // Read saved theme from localStorage — falls back to 'orange'
    const [theme, setThemeState] = useState(() => {
        const saved = localStorage.getItem('theme');
        return VALID_THEMES.includes(saved) ? saved : 'orange';
    });

    // Apply data-theme attribute to <html> immediately on mount and on change
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    const setTheme = async (key, saveToDb = true) => {
        if (!VALID_THEMES.includes(key)) return;
        setThemeState(key);
        localStorage.setItem('theme', key);
        document.documentElement.setAttribute('data-theme', key);

        if (saveToDb) {
            try {
                await api.updateProfile({ theme: key });
            } catch {
                // Non-critical — theme is already applied locally
            }
        }
    };

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
