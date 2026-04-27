import { createContext, useContext, useState } from 'react';

const ThemeContext = createContext();

export const lightTheme = {
    dark: false,
    bg: '#f0f4f0',
    card: '#ffffff',
    header: '#1a5c35',
    text: '#222222',
    textSub: '#666666',
    textLight: '#999999',
    border: '#e0e0e0',
    green: '#1a5c35',
    greenLight: '#e8f5e9',
    greenText: '#2e7d32',
    inputBg: '#f9f9f9',
    statCard: '#ffffff',
    tabBar: '#ffffff',
    tabBarBorder: '#e0e0e0',
};

export const darkTheme = {
    dark: true,
    bg: '#1c1c1e',
    card: '#2c2c2e',
    header: '#0d3320',
    text: '#f0f0f0',
    textSub: '#ababab',
    textLight: '#777777',
    border: '#3a3a3c',
    green: '#4caf50',
    greenLight: '#1a2e1a',
    greenText: '#81c784',
    inputBg: '#3a3a3c',
    statCard: '#2c2c2e',
    tabBar: '#1c1c1e',
    tabBarBorder: '#3a3a3c',
};

export function ThemeProvider({ children }) {
    const [isDark, setIsDark] = useState(false);
    const theme = isDark ? darkTheme : lightTheme;

    function toggleTheme() {
        setIsDark(prev => !prev);
    }

    return (
        <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}