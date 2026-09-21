import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../Auth/AuthContext';
import { useTranslation } from 'react-i18next';
import { 
  getAllNotifications, 
  getNotificationStats, 
  NotificationItem,
  NotificationStats 
} from '../../services/notificationService';
import { 
  getCurrentTheme, 
  saveUserThemeSettings, 
  applyTheme,
  ThemeSettings 
} from '../../services/themeService';
import { 
  BellAlertIcon, 
  Cog6ToothIcon,
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon,
  XMarkIcon,
  CheckIcon,
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import { createPortal } from 'react-dom';

interface EnhancedTopNavbarProps {
  toggleSidebar: () => void;
  isSidebarOpen: boolean;
}

const EnhancedTopNavbar: React.FC<EnhancedTopNavbarProps> = ({ toggleSidebar, isSidebarOpen }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // State
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [theme, setTheme] = useState<ThemeSettings>(getCurrentTheme());
  const [openDropdown, setOpenDropdown] = useState<'notifications' | 'theme' | 'profile' | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notificationStats, setNotificationStats] = useState<NotificationStats | null>(null);
  const [showThemeSettings, setShowThemeSettings] = useState(false);
  const [tempThemeSettings, setTempThemeSettings] = useState<ThemeSettings>(theme);

  // Refs
  const notificationsRef = useRef<HTMLDivElement>(null);
  const themeRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Effects
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [user]);

  // Sync theme changes across tabs / components
  useEffect(() => {
    const handleThemeSync = () => {
      setTheme(getCurrentTheme());
    };
    window.addEventListener('ams-theme-change', handleThemeSync);
    window.addEventListener('storage', handleThemeSync);
    return () => {
      window.removeEventListener('ams-theme-change', handleThemeSync);
      window.removeEventListener('storage', handleThemeSync);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!openDropdown) return;

      const refs: Record<string, React.RefObject<HTMLDivElement>> = {
        notifications: notificationsRef,
        theme: themeRef,
        profile: profileRef,
      };

      const currentRef = openDropdown ? refs[openDropdown] : null;
      if (currentRef?.current && !currentRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };

    if (openDropdown) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdown]);

  const fetchNotifications = async () => {
    try {
      const [notifs, stats] = await Promise.all([
        getAllNotifications(),
        getNotificationStats()
      ]);
      setNotifications(notifs);
      setNotificationStats(stats);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullScreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullScreen(false);
      }
    }
  };

  const handleThemeChange = async (newTheme: Partial<ThemeSettings>) => {
    const updatedTheme = { ...theme, ...newTheme };
    setTheme(updatedTheme);
    setTempThemeSettings(updatedTheme);
    applyTheme(updatedTheme);
    
    // Save to backend
    try {
      await saveUserThemeSettings(updatedTheme);
    } catch (error) {
      console.error('Error saving theme settings:', error);
    }
  };

  const handleLogout = async () => {
    setOpenDropdown(null);
    await logout();
    navigate('/login');
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'complaint':
        return <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />;
      case 'contact':
        return <ChatBubbleLeftRightIcon className="w-4 h-4 text-blue-500" />;
      case 'inquiry':
        return <UserGroupIcon className="w-4 h-4 text-green-500" />;
      default:
        return <BellAlertIcon className="w-4 h-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <>
      <div className="w-full flex items-center justify-between px-4 lg:px-6 py-2 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl transition-colors">
        {/* Left Side: Toggle & Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSidebar}
            className="p-2 -ml-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-all focus:outline-none group active:scale-95 border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
            title={isSidebarOpen ? "Compact Sidebar" : "Expand Sidebar"}
          >
            <div className="flex flex-col gap-1 w-4.5">
              <span className={`h-0.5 bg-current rounded-full transition-all duration-300 ${isSidebarOpen ? 'w-2.5' : 'w-4.5'}`}></span>
              <span className="h-0.5 bg-current rounded-full w-4.5"></span>
              <span className={`h-0.5 bg-current rounded-full transition-all duration-300 ${isSidebarOpen ? 'w-3.5' : 'w-4.5'}`}></span>
            </div>
          </button>

          <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800 h-6">
            <span className="text-sm font-heading font-black text-slate-900 dark:text-white tracking-tight uppercase">
              AMS <span className="text-indigo-600 dark:text-indigo-400">HQ</span>
            </span>
            <span className="hidden sm:inline-flex badge-indigo text-[10px] py-0.5 px-2">
              Operational
            </span>
          </div>
        </div>

        {/* Right Side: Icons & Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Full Screen Toggle */}
          <button
            onClick={toggleFullScreen}
            className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors focus:outline-none active:scale-95"
            title={isFullScreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            {isFullScreen ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9h6m-6 6h6m3-12v3m0 0h3m-3 0l3-3m-15 15v-3m0 0h-3m3 0l-3 3m15-3v3m0 0h3m-3 0l3 3m-15-15v3m0 0h-3m3 0l-3-3" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            )}
          </button>

          {/* Direct Quick Theme Toggle Button */}
          <button
            onClick={() => {
              const isCurrentlyDark = document.documentElement.classList.contains('dark');
              handleThemeChange({ themeMode: isCurrentlyDark ? 'light' : 'dark' });
            }}
            className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/80 transition-all focus:outline-none relative active:scale-95 border border-slate-200/50 dark:border-slate-700/60 shadow-sm"
            title={theme.themeMode === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
            aria-label="Toggle theme mode"
          >
            {document.documentElement.classList.contains('dark') || theme.themeMode === 'dark' ? (
              <SunIcon className="w-5 h-5 text-amber-400 hover:text-amber-300 transition-transform duration-300 hover:rotate-45" />
            ) : (
              <MoonIcon className="w-5 h-5 text-indigo-600 hover:text-indigo-500 transition-transform duration-300 hover:-rotate-12" />
            )}
          </button>

          {/* Theme Settings Customizer */}
          <div className="relative" ref={themeRef}>
            <button
              onClick={() => setOpenDropdown(openDropdown === 'theme' ? null : 'theme')}
              className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors focus:outline-none relative active:scale-95"
              title="Theme Settings"
            >
              <Cog6ToothIcon className="w-5 h-5" />
              {theme.themeMode && (
                <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-500"></div>
              )}
            </button>

            {openDropdown === 'theme' && (
              <div className="absolute right-0 mt-2 w-72 glass-card p-0 shadow-2xl z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-xs font-heading font-bold uppercase tracking-wider text-slate-800 dark:text-white">Theme Customizer</h3>
                </div>
                
                <div className="p-4 space-y-4">
                  {/* Theme Mode */}
                  <div>
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2 block">Appearance</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => handleThemeChange({ themeMode: 'light' })}
                        className={`flex flex-col items-center p-2 rounded-xl border text-xs font-medium transition-all ${
                          theme.themeMode === 'light' 
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300' 
                            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <SunIcon className="w-4 h-4 mb-1" />
                        <span>Light</span>
                      </button>
                      <button
                        onClick={() => handleThemeChange({ themeMode: 'dark' })}
                        className={`flex flex-col items-center p-2 rounded-xl border text-xs font-medium transition-all ${
                          theme.themeMode === 'dark' 
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300' 
                            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <MoonIcon className="w-4 h-4 mb-1" />
                        <span>Dark</span>
                      </button>
                      <button
                        onClick={() => handleThemeChange({ themeMode: 'system' })}
                        className={`flex flex-col items-center p-2 rounded-xl border text-xs font-medium transition-all ${
                          theme.themeMode === 'system' 
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300' 
                            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <ComputerDesktopIcon className="w-4 h-4 mb-1" />
                        <span>Auto</span>
                      </button>
                    </div>
                  </div>

                  {/* Primary Color */}
                  <div>
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2 block">Brand Accent</label>
                    <div className="flex gap-2">
                      {['#4F46E5', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'].map((color) => (
                        <button
                          key={color}
                          onClick={() => handleThemeChange({ primaryColor: color })}
                          className={`w-7 h-7 rounded-lg transition-all ${
                            theme.primaryColor === color ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110' : 'opacity-80 hover:opacity-100'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => setShowThemeSettings(true)}
                    className="w-full btn-modern-secondary text-xs py-2 font-semibold"
                  >
                    Advanced Preferences
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Notifications */}
          <div className="relative" ref={notificationsRef}>
            <button
              onClick={() => setOpenDropdown(openDropdown === 'notifications' ? null : 'notifications')}
              className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors focus:outline-none relative active:scale-95"
            >
              <BellAlertIcon className="w-5 h-5" />
              {notificationStats?.unread && notificationStats.unread > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-sm">
                  {notificationStats.unread > 9 ? '9+' : notificationStats.unread}
                </span>
              )}
            </button>

            {openDropdown === 'notifications' && (
              <div className="absolute right-0 mt-2 w-80 glass-card p-0 shadow-2xl z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                  <h3 className="text-xs font-heading font-bold uppercase tracking-wider text-slate-800 dark:text-white">Activity Notifications</h3>
                  {notificationStats && (
                    <span className="badge-indigo text-[10px] py-0.5 px-2">{notificationStats.unread} New</span>
                  )}
                </div>
                
                <div className="max-h-72 overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map((note) => (
                      <Link
                        key={note.id}
                        to={note.link}
                        onClick={() => setOpenDropdown(null)}
                        className="block px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-100 dark:border-slate-800/50 last:border-0"
                      >
                        <div className="flex gap-3">
                          <div className="mt-0.5">
                            {getNotificationIcon(note.type)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight flex-1">
                                {note.title}
                              </p>
                              {note.actionRequired && (
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${getPriorityColor(note.priority)}`}>
                                  Action
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">{note.message}</p>
                            <p className="text-[10px] text-slate-400 mt-1">{note.time}</p>
                          </div>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="p-8 text-center text-slate-400 text-xs font-medium">
                      No new notifications right now
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Profile */}
          <div className="relative pl-2 ml-1 border-l border-slate-200 dark:border-slate-800" ref={profileRef}>
            <button
              onClick={() => setOpenDropdown(openDropdown === 'profile' ? null : 'profile')}
              className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors focus:outline-none active:scale-95"
            >
              <div className="w-8 h-8 rounded-xl overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-heading font-black text-xs flex items-center justify-center shadow-sm">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">{user?.name || 'User'}</p>
                <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold leading-tight mt-0.5">{user?.role_name || 'Staff'}</p>
              </div>
              <svg className={`w-3.5 h-3.5 text-slate-400 transition-transform ${openDropdown === 'profile' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {openDropdown === 'profile' && (
              <div className="absolute right-0 mt-2 w-56 glass-card p-0 shadow-2xl z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                  <p className="text-xs font-bold text-slate-900 dark:text-white">{user?.name || 'User'}</p>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">{user?.email || 'user@example.com'}</p>
                  <span className="badge-indigo text-[9px] mt-2 inline-block">
                    {user?.role_name || 'Staff'}
                  </span>
                </div>

                <div className="p-1.5">
                  <button 
                    onClick={handleLogout} 
                    className="w-full text-left px-3 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg font-semibold flex items-center gap-2 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Advanced Theme Settings Modal */}
      {showThemeSettings && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[10000] p-4">
          <div className="absolute inset-0" onClick={() => setShowThemeSettings(false)}></div>
          <div className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="px-8 py-6 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black tracking-tight uppercase">Advanced Theme Settings</h2>
                  <p className="text-blue-100 text-xs font-bold opacity-90 uppercase tracking-widest mt-1">Customize Your Experience</p>
                </div>
                <button
                  onClick={() => setShowThemeSettings(false)}
                  className="p-2 rounded-xl hover:bg-white/10 transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Font Family */}
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Font Family</label>
                  <select
                    value={theme.fontFamily || 'Inter'}
                    onChange={(e) => setTempThemeSettings({ ...tempThemeSettings, fontFamily: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  >
                    <option value="Inter">Inter</option>
                    <option value="Roboto">Roboto</option>
                    <option value="Open Sans">Open Sans</option>
                    <option value="Lato">Lato</option>
                    <option value="Poppins">Poppins</option>
                  </select>
                </div>

                {/* Custom Primary Color */}
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Custom Primary Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={theme.primaryColor || '#3B82F6'}
                      onChange={(e) => setTempThemeSettings({ ...tempThemeSettings, primaryColor: e.target.value })}
                      className="w-12 h-10 rounded border border-gray-200 dark:border-gray-600"
                    />
                    <input
                      type="text"
                      value={theme.primaryColor || '#3B82F6'}
                      onChange={(e) => setTempThemeSettings({ ...tempThemeSettings, primaryColor: e.target.value })}
                      className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                      placeholder="#3B82F6"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => setShowThemeSettings(false)}
                  className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    await handleThemeChange(tempThemeSettings);
                    setShowThemeSettings(false);
                  }}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Apply Changes
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default EnhancedTopNavbar;
