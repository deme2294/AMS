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
      <div className="w-full flex items-center justify-between px-4 lg:px-6 py-1">
        {/* Left Side: Toggle & Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSidebar}
            className="p-2 -ml-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition-all focus:outline-none group active:scale-95"
            title={isSidebarOpen ? "Compact Mode" : "Expand Mode"}
          >
            <div className="flex items-center gap-2">
              <div className="flex flex-col gap-1 w-5">
                <span className={`h-0.5 bg-current transition-all duration-300 ${isSidebarOpen ? 'w-2' : 'w-5'}`}></span>
                <span className="h-0.5 bg-current w-5"></span>
                <span className={`h-0.5 bg-current transition-all duration-300 ${isSidebarOpen ? 'w-3' : 'w-5'}`}></span>
              </div>
              <span className="hidden sm:block text-xs font-bold uppercase tracking-widest text-gray-400 group-hover:text-blue-600 transition-colors">
                Compact
              </span>
            </div>
          </button>

          <div className="flex items-center gap-2 pl-2 border-l border-gray-200 dark:border-gray-700 h-6">
            <span className="text-sm font-black text-gray-800 dark:text-white tracking-tighter uppercase whitespace-nowrap">
              BMS <span className="text-blue-600">WEBSITE</span>
            </span>
          </div>
        </div>

        {/* Right Side: Icons & Profile */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Full Screen Toggle */}
          <button
            onClick={toggleFullScreen}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors focus:outline-none active:scale-95"
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

          {/* Theme Settings */}
          <div className="relative" ref={themeRef}>
            <button
              onClick={() => setOpenDropdown(openDropdown === 'theme' ? null : 'theme')}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors focus:outline-none relative"
              title="Theme Settings"
            >
              <Cog6ToothIcon className="w-5 h-5" />
              {theme.themeMode && (
                <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-blue-500"></div>
              )}
            </button>

            {openDropdown === 'theme' && (
              <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-white">Theme Settings</h3>
                </div>
                
                <div className="p-4 space-y-4">
                  {/* Theme Mode */}
                  <div>
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 block">Theme Mode</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => handleThemeChange({ themeMode: 'light' })}
                        className={`flex flex-col items-center p-2 rounded-lg border transition-all ${
                          theme.themeMode === 'light' 
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                            : 'border-gray-200 dark:border-gray-600'
                        }`}
                      >
                        <SunIcon className="w-4 h-4 mb-1" />
                        <span className="text-xs">Light</span>
                      </button>
                      <button
                        onClick={() => handleThemeChange({ themeMode: 'dark' })}
                        className={`flex flex-col items-center p-2 rounded-lg border transition-all ${
                          theme.themeMode === 'dark' 
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                            : 'border-gray-200 dark:border-gray-600'
                        }`}
                      >
                        <MoonIcon className="w-4 h-4 mb-1" />
                        <span className="text-xs">Dark</span>
                      </button>
                      <button
                        onClick={() => handleThemeChange({ themeMode: 'system' })}
                        className={`flex flex-col items-center p-2 rounded-lg border transition-all ${
                          theme.themeMode === 'system' 
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                            : 'border-gray-200 dark:border-gray-600'
                        }`}
                      >
                        <ComputerDesktopIcon className="w-4 h-4 mb-1" />
                        <span className="text-xs">System</span>
                      </button>
                    </div>
                  </div>

                  {/* Primary Color */}
                  <div>
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 block">Primary Color</label>
                    <div className="flex gap-2">
                      {['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'].map((color) => (
                        <button
                          key={color}
                          onClick={() => handleThemeChange({ primaryColor: color })}
                          className={`w-8 h-8 rounded-lg border-2 transition-all ${
                            theme.primaryColor === color ? 'border-gray-900 dark:border-white' : 'border-gray-200 dark:border-gray-600'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Density */}
                  <div>
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 block">Density</label>
                    <select
                      value={theme.density || 'comfortable'}
                      onChange={(e) => handleThemeChange({ density: e.target.value as any })}
                      className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    >
                      <option value="compact">Compact</option>
                      <option value="comfortable">Comfortable</option>
                      <option value="spacious">Spacious</option>
                    </select>
                  </div>

                  <button
                    onClick={() => setShowThemeSettings(true)}
                    className="w-full px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Advanced Settings
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Notifications */}
          <div className="relative" ref={notificationsRef}>
            <button
              onClick={() => setOpenDropdown(openDropdown === 'notifications' ? null : 'notifications')}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors focus:outline-none relative"
            >
              <BellAlertIcon className="w-5 h-5" />
              {notificationStats?.unread && notificationStats.unread > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center border-2 border-white dark:border-gray-800">
                  {notificationStats.unread > 9 ? '9+' : notificationStats.unread}
                </span>
              )}
            </button>

            {openDropdown === 'notifications' && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-white">Notifications</h3>
                  {notificationStats && (
                    <span className="text-xs text-gray-500">{notificationStats.unread} New</span>
                  )}
                </div>
                
                <div className="max-h-72 overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map((note) => (
                      <Link
                        key={note.id}
                        to={note.link}
                        onClick={() => setOpenDropdown(null)}
                        className="block px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border-b border-gray-50 dark:border-gray-700/50 last:border-0"
                      >
                        <div className="flex gap-3">
                          <div className="mt-1">
                            {getNotificationIcon(note.type)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm text-gray-800 dark:text-gray-200 font-medium leading-snug flex-1">
                                {note.title}
                              </p>
                              {note.actionRequired && (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${getPriorityColor(note.priority)}`}>
                                  Action
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{note.message}</p>
                            <p className="text-[10px] text-gray-400 mt-1">{note.time}</p>
                          </div>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="p-6 text-center text-gray-500 dark:text-gray-400 text-sm">
                      No new notifications
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Profile */}
          <div className="relative pl-2 ml-2 border-l border-gray-200 dark:border-gray-700" ref={profileRef}>
            <button
              onClick={() => setOpenDropdown(openDropdown === 'profile' ? null : 'profile')}
              className="flex items-center gap-2 focus:outline-none"
            >
              <div className="w-8 h-8 md:w-9 md:h-9 rounded-full overflow-hidden border-2 border-gray-200 dark:border-gray-600 ring-2 ring-transparent hover:ring-blue-100 dark:hover:ring-blue-900 transition-all flex items-center justify-center bg-gray-100">
                {user?.name ? (
                  <span className="text-sm font-bold text-gray-600">{user.name.charAt(0).toUpperCase()}</span>
                ) : (
                  <img src="/assets/img/team/3-thumb.jpg" alt="User" className="w-full h-full object-cover" />
                )}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-200 leading-tight">{user?.name || 'User'}</p>
                <p className="text-[10px] text-blue-600 dark:text-blue-400 font-medium leading-tight mt-0.5">{user?.role_name || 'Role'}</p>
              </div>
              <svg className={`w-4 h-4 text-gray-400 transition-transform ${openDropdown === 'profile' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {openDropdown === 'profile' && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 z-50 py-2">
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 mb-2">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{user?.name || 'User'}</p>
                  <p className="text-xs text-gray-500 truncate mb-1.5">{user?.email || 'user@example.com'}</p>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                    {user?.role_name || 'Role'}
                  </span>
                </div>

                <div className="border-t border-gray-100 dark:border-gray-700 my-2"></div>

                <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 font-medium">
                  Sign out
                </button>
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
