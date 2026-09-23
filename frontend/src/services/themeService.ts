import { request } from './apiService';

export interface ThemeSettings {
  themeMode?: 'light' | 'dark' | 'system';
  primaryColor?: string;
  fontFamily?: string;
  density?: 'compact' | 'comfortable' | 'spacious';
  logoPreview?: string;
}

export interface SystemSettings extends ThemeSettings {
  id?: number;
  created_at?: string;
  updated_at?: string;
}

// Get system settings from backend
export const getSystemSettings = async (): Promise<SystemSettings> => {
  try {
    const response = await request<{ success: boolean; data: SystemSettings }>('/settings', {
      method: 'GET',
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching system settings:', error);
    return {};
  }
};

// Get user theme preferences
export const getUserThemeSettings = async (): Promise<ThemeSettings> => {
  try {
    const response = await request<{ success: boolean; settings: ThemeSettings }>('/settings/user-theme', {
      method: 'GET',
    });
    return response.settings;
  } catch (error: any) {
    // 401 Unauthorized is expected for guests / unauthenticated users
    if (error?.response?.status !== 401) {
      console.warn('Non-critical: User theme settings fetch skipped:', error?.message);
    }
    return {};
  }
};

// Save user theme preferences to backend
export const saveUserThemeSettings = async (settings: ThemeSettings): Promise<boolean> => {
  try {
    await request('/settings/user-theme', {
      method: 'POST',
      data: settings,
    });
    return true;
  } catch (error: any) {
    // 401 Unauthorized is normal for guests; preference is already saved in localStorage
    if (error?.response?.status !== 401) {
      console.warn('Non-critical: User theme settings sync skipped:', error?.message);
    }
    return false;
  }
};

// Update system settings (admin only)
export const updateSystemSettings = async (settings: SystemSettings): Promise<boolean> => {
  try {
    await request('/settings', {
      method: 'PUT',
      data: settings,
    });
    return true;
  } catch (error) {
    console.error('Error updating system settings:', error);
    return false;
  }
};

// Apply theme to DOM
export const applyTheme = (settings: ThemeSettings) => {
  const root = document.documentElement;
  const body = document.body;

  // Apply theme mode
  if (settings.themeMode) {
    const isDark = settings.themeMode === 'dark' || 
                   (settings.themeMode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    const effectiveTheme = isDark ? 'dark' : 'light';
    
    if (isDark) {
      root.classList.add('dark');
      body.classList.add('dark');
    } else {
      root.classList.remove('dark');
      body.classList.remove('dark');
    }
    
    root.setAttribute('data-bs-theme', effectiveTheme);
    root.setAttribute('data-theme', effectiveTheme);
    root.setAttribute('data-theme-mode', settings.themeMode);
    body.setAttribute('data-bs-theme', effectiveTheme);
    body.setAttribute('data-theme', effectiveTheme);
    localStorage.setItem('lms_theme', settings.themeMode);

    // Broadcast theme change to active React components and listeners
    try {
      window.dispatchEvent(new CustomEvent('ams-theme-change', {
        detail: { isDark, effectiveTheme, themeMode: settings.themeMode, settings }
      }));
      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      // Ignore if event dispatch is unsupported
    }
  }

  // Register system color-scheme change listener once
  if (typeof window !== 'undefined' && !(window as any)._ams_theme_media_listener) {
    (window as any)._ams_theme_media_listener = true;
    try {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', () => {
        const current = getCurrentTheme();
        if (current.themeMode === 'system') {
          applyTheme(current);
        }
      });
    } catch (e) {
      // Legacy fallback
    }
  }

  // Apply primary color
  if (settings.primaryColor) {
    root.style.setProperty('--primary-color', settings.primaryColor);
    localStorage.setItem('lms_color', settings.primaryColor);
  }

  // Apply font family
  if (settings.fontFamily) {
    root.style.setProperty('--font-family', settings.fontFamily);
    localStorage.setItem('lms_font', settings.fontFamily);
  }

  // Apply density
  if (settings.density) {
    root.setAttribute('data-density', settings.density);
    localStorage.setItem('lms_density', settings.density);
  }

  // Apply logo preview
  if (settings.logoPreview) {
    localStorage.setItem('lms_logo_preview', settings.logoPreview);
  }
};

// Get current theme from localStorage
export const getCurrentTheme = (): ThemeSettings => {
  return {
    themeMode: (localStorage.getItem('lms_theme') as 'light' | 'dark' | 'system') || 'system',
    primaryColor: localStorage.getItem('lms_color') || undefined,
    fontFamily: localStorage.getItem('lms_font') || undefined,
    density: (localStorage.getItem('lms_density') as 'compact' | 'comfortable' | 'spacious') || undefined,
    logoPreview: localStorage.getItem('lms_logo_preview') || undefined,
  };
};

// Initialize theme from backend and localStorage
export const initializeTheme = async (isAuthenticated: boolean = false) => {
  try {
    // First apply saved local theme for immediate feedback
    const localTheme = getCurrentTheme();
    applyTheme(localTheme);

    // Then fetch and apply backend settings (global logo, appearance)
    const systemSettings = await getSystemSettings();
    if (systemSettings && Object.keys(systemSettings).length > 0) {
      applyTheme(systemSettings);
    }

    // Only fetch user-specific settings if authenticated
    if (isAuthenticated) {
      const userSettings = await getUserThemeSettings();
      if (userSettings && Object.keys(userSettings).length > 0) {
        applyTheme(userSettings);
      }
    }
  } catch (error) {
    console.error('Error initializing theme:', error);
  }
};
