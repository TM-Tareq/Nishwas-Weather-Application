import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useThemeStore = create(persist(
  (set, get) => ({
    theme: 'dark',
    toggleTheme: () => {
      const next = get().theme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      set({ theme: next });
    },
    initTheme: () => {
      document.documentElement.setAttribute('data-theme', get().theme);
    },
  }),
  { name: 'nishwas-theme' }
));

export default useThemeStore;
