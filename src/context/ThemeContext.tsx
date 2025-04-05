"use client";

// Контекст управления темой приложения
// Изменения:
// - Темная тема по умолчанию
// - Синхронизация с localStorage
// - Обработка событий storage для синхронизации между вкладками

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';

/**
 * Контекст для управления темой приложения
 */
interface ThemeContextType {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextType>({} as ThemeContextType);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      const initialTheme = (savedTheme === 'light' || savedTheme === 'dark') 
        ? savedTheme 
        : 'dark';
      setTheme(initialTheme);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (typeof window !== 'undefined') {
      document.documentElement.classList.toggle('dark', theme === 'dark');
    }
    
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'theme') {
        setTheme(e.newValue === 'light' ? 'light' : 'dark');
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [theme]);

  // Переключение темы с сохранением в localStorage
  // Обновляет состояние темы и синхронизирует с localStorage
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', newTheme);
    setTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
