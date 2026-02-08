import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  toggle: () => void;
  setTheme: (t: Theme) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'dark',

      toggle: () => {
        const next = get().theme === 'dark' ? 'light' : 'dark';
        document.documentElement.classList.toggle('dark', next === 'dark');
        set({ theme: next });
      },

      setTheme: (t) => {
        document.documentElement.classList.toggle('dark', t === 'dark');
        set({ theme: t });
      },
    }),
    { name: 'iot-ids-theme' },
  ),
);

// Initialize theme on load
const stored = localStorage.getItem('iot-ids-theme');
if (stored) {
  const parsed = JSON.parse(stored);
  document.documentElement.classList.toggle('dark', parsed.state?.theme === 'dark');
} else {
  document.documentElement.classList.add('dark');
}
