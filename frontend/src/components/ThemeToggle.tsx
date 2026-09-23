import React, { useEffect, useState } from 'react';
import { 
  SunIcon, 
  MoonIcon, 
  ComputerDesktopIcon,
  CheckIcon 
} from '@heroicons/react/24/outline';
import { 
  getCurrentTheme, 
  applyTheme, 
  saveUserThemeSettings, 
  ThemeSettings 
} from '../services/themeService';
import { useAuth } from './Auth/AuthContext';

interface ThemeToggleProps {
  variant?: 'segmented' | 'dropdown' | 'icon-button';
  className?: string;
  showLabels?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  variant = 'segmented', 
  className = '',
  showLabels = false
}) => {
  const { isAuthenticated } = useAuth();
  const [theme, setTheme] = useState<ThemeSettings>(getCurrentTheme());
  const [isOpen, setIsOpen] = useState(false);
  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>('dark');

  // Sync state on mount and on external theme updates
  useEffect(() => {
    const syncTheme = () => {
      const current = getCurrentTheme();
      setTheme(current);
      const isDark = current.themeMode === 'dark' || 
        (current.themeMode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      setEffectiveTheme(isDark ? 'dark' : 'light');
    };

    syncTheme();

    window.addEventListener('ams-theme-change', syncTheme);
    window.addEventListener('storage', syncTheme);

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = () => {
      const current = getCurrentTheme();
      if (current.themeMode === 'system') {
        applyTheme(current);
        syncTheme();
      }
    };
    mediaQuery.addEventListener('change', handleSystemChange);

    return () => {
      window.removeEventListener('ams-theme-change', syncTheme);
      window.removeEventListener('storage', syncTheme);
      mediaQuery.removeEventListener('change', handleSystemChange);
    };
  }, []);

  const handleSelectMode = async (mode: 'light' | 'dark' | 'system') => {
    const updated: ThemeSettings = { ...theme, themeMode: mode };
    setTheme(updated);
    applyTheme(updated);
    setIsOpen(false);
    // Only attempt backend sync if user is logged in
    if (isAuthenticated) {
      try {
        await saveUserThemeSettings(updated);
      } catch {
        // Non-critical background sync
      }
    }
  };

  const currentMode = theme.themeMode || 'system';

  // Segmented control (Default for topbar)
  if (variant === 'segmented') {
    return (
      <div 
        className={`inline-flex items-center p-1 rounded-2xl bg-slate-200/80 dark:bg-slate-950/90 border border-slate-300/80 dark:border-slate-800 shadow-inner backdrop-blur-xl transition-all duration-300 ${className}`}
        role="group"
        aria-label="Theme mode switcher"
      >
        {/* Light ("White") Option */}
        <button
          type="button"
          onClick={() => handleSelectMode('light')}
          className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-300 ${
            currentMode === 'light'
              ? 'bg-white text-amber-600 shadow-md shadow-amber-500/15 ring-1 ring-amber-400/50 dark:bg-amber-400/15 dark:text-amber-300 dark:ring-amber-400/40 scale-[1.03]'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5'
          }`}
          title="Light (White) Theme"
          aria-pressed={currentMode === 'light'}
        >
          <SunIcon className={`w-4 h-4 transition-transform duration-500 ${currentMode === 'light' ? 'rotate-90 text-amber-500 filter drop-shadow-[0_0_4px_rgba(245,158,11,0.5)]' : ''}`} />
          {showLabels ? (
            <span>White</span>
          ) : (
            <span className="hidden sm:inline">Light</span>
          )}
          {currentMode === 'light' && (
            <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-3.5 h-0.5 bg-amber-500 rounded-full shadow-[0_0_6px_rgba(245,158,11,0.8)]" />
          )}
        </button>

        {/* System Option */}
        <button
          type="button"
          onClick={() => handleSelectMode('system')}
          className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-300 ${
            currentMode === 'system'
              ? 'bg-white text-blue-600 shadow-md shadow-blue-500/15 ring-1 ring-blue-400/50 dark:bg-slate-900 dark:text-blue-300 dark:shadow-[0_0_15px_rgba(59,130,246,0.3)] dark:ring-1 dark:ring-blue-400/50 scale-[1.03]'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5'
          }`}
          title="System Theme Auto"
          aria-pressed={currentMode === 'system'}
        >
          <ComputerDesktopIcon className={`w-4 h-4 transition-transform duration-300 ${currentMode === 'system' ? 'text-blue-500 dark:text-blue-400 filter drop-shadow-[0_0_4px_rgba(59,130,246,0.5)]' : ''}`} />
          {showLabels ? (
            <span>System</span>
          ) : (
            <span className="hidden sm:inline">System</span>
          )}
          {currentMode === 'system' && (
            <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-3.5 h-0.5 bg-blue-500 rounded-full shadow-[0_0_6px_rgba(59,130,246,0.8)]" />
          )}
        </button>

        {/* Dark Option */}
        <button
          type="button"
          onClick={() => handleSelectMode('dark')}
          className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-300 ${
            currentMode === 'dark'
              ? 'bg-slate-900 text-indigo-300 shadow-md shadow-indigo-500/25 ring-1 ring-indigo-400/50 dark:bg-slate-900 dark:text-indigo-300 dark:shadow-[0_0_15px_rgba(99,102,241,0.35)] dark:ring-1 dark:ring-indigo-400/60 scale-[1.03]'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5'
          }`}
          title="Dark Theme"
          aria-pressed={currentMode === 'dark'}
        >
          <MoonIcon className={`w-4 h-4 transition-transform duration-500 ${currentMode === 'dark' ? '-rotate-12 text-indigo-400 filter drop-shadow-[0_0_5px_rgba(129,140,248,0.7)]' : ''}`} />
          {showLabels ? (
            <span>Dark</span>
          ) : (
            <span className="hidden sm:inline">Dark</span>
          )}
          {currentMode === 'dark' && (
            <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-3.5 h-0.5 bg-indigo-500 rounded-full shadow-[0_0_6px_rgba(99,102,241,0.8)]" />
          )}
        </button>
      </div>
    );
  }

  // Dropdown or Icon Button variant
  return (
    <div className={`relative inline-block text-left ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-2.5 rounded-2xl text-slate-700 dark:text-slate-300 bg-white/95 dark:bg-slate-900/90 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300/80 dark:border-slate-800 shadow-sm backdrop-blur-xl transition-all duration-200 active:scale-95 flex items-center gap-2"
        title={`Current theme: ${currentMode} (${effectiveTheme})`}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        {effectiveTheme === 'dark' ? (
          <MoonIcon className="w-4 h-4 text-indigo-400 filter drop-shadow-[0_0_4px_rgba(129,140,248,0.5)]" />
        ) : (
          <SunIcon className="w-4 h-4 text-amber-500 filter drop-shadow-[0_0_4px_rgba(245,158,11,0.4)]" />
        )}
        {showLabels && (
          <span className="text-xs font-bold capitalize">{currentMode}</span>
        )}
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)} 
          />
          <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xl z-50 p-2 animate-fade-in text-slate-800 dark:text-slate-200">
            <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800/80 mb-1.5">
              Theme Mode
            </div>

            <button
              onClick={() => handleSelectMode('light')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                currentMode === 'light'
                  ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-400/40 shadow-sm'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-500">
                  <SunIcon className="w-4 h-4" />
                </div>
                <span>White / Light</span>
              </div>
              {currentMode === 'light' && <CheckIcon className="w-4 h-4 text-amber-600" />}
            </button>

            <button
              onClick={() => handleSelectMode('dark')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                currentMode === 'dark'
                  ? 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/40 shadow-sm'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <MoonIcon className="w-4 h-4" />
                </div>
                <span>Dark Mode</span>
              </div>
              {currentMode === 'dark' && <CheckIcon className="w-4 h-4 text-indigo-400" />}
            </button>

            <button
              onClick={() => handleSelectMode('system')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                currentMode === 'system'
                  ? 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/40 shadow-sm'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-500 dark:text-blue-400">
                  <ComputerDesktopIcon className="w-4 h-4" />
                </div>
                <span>System Auto</span>
              </div>
              {currentMode === 'system' && <CheckIcon className="w-4 h-4 text-blue-500" />}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ThemeToggle;
