import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../Auth/AuthContext';
import { useTranslation } from 'react-i18next';
import { getContactMessages, getInvestorInquiries, ContactMessage, InvestorInquiry, request, BACKEND_URL } from '../../services/apiService';
import { FaLock, FaShieldAlt, FaInfoCircle, FaExclamationTriangle } from 'react-icons/fa';
import { createPortal } from 'react-dom';

interface TopNavbarProps {
  toggleSidebar: () => void;
  isSidebarOpen: boolean;
}

// Unified Notification Type for display
interface NotificationItem {
  id: string | number;
  type: 'contact' | 'inquiry';
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  link: string;
}

const TopNavbar: React.FC<TopNavbarProps> = ({ toggleSidebar, isSidebarOpen }) => {
  const { t, i18n } = useTranslation();
  const [isFullScreen, setIsFullScreen] = useState(false);

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
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // --- State ---
  type Theme = 'light' | 'dark';
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      return (localStorage.getItem('lms_theme') as Theme) || 'dark';
    }
    return 'dark';
  });

  type OpenDropdownType = 'notifications' | 'apps' | 'profile' | 'language' | null;
  const [openDropdown, setOpenDropdown] = useState<OpenDropdownType>(null);
  const languageRef = useRef<HTMLDivElement>(null);

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Change Password State
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // --- Refs ---
  const notificationsRef = useRef<HTMLDivElement>(null);
  const appsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // --- Effects ---
  useEffect(() => {
    if (typeof document === 'undefined' || typeof window === 'undefined' || !window.matchMedia) return;
    const root = document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = (selectedTheme: Theme) => {
      if (selectedTheme === 'dark') {
        root.classList.add('dark');
        document.body.classList.add('dark');
      } else {
        root.classList.remove('dark');
        document.body.classList.remove('dark');
      }
      root.setAttribute('data-bs-theme', selectedTheme);
    };

    applyTheme(theme);
    localStorage.setItem('lms_theme', theme);
  }, [theme]);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!openDropdown) return;

      const refs: Record<string, React.RefObject<HTMLDivElement>> = {
        notifications: notificationsRef,
        apps: appsRef,
        profile: profileRef,
        language: languageRef,
      };

      const currentRef = openDropdown ? refs[openDropdown] : null;
      if (currentRef?.current && !currentRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };

    if (openDropdown) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdown]);

  // Fetch Notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        // Fetch raw data - silently catch 403 errors for unauthorized endpoints
        const [contactMsgs, inquiries] = await Promise.all([
          getContactMessages().catch((err) => {
            // Silently ignore 403 (permission denied) errors
            if (err.response?.status === 403) return [];
            console.error("Error fetching contact messages:", err);
            return [];
          }),
          getInvestorInquiries().catch((err) => {
            // Silently ignore 403 (permission denied) errors
            if (err.response?.status === 403) return [];
            console.error("Error fetching investor inquiries:", err);
            return [];
          })
        ]);

        // Process Contact Messages
        const contactNotifs: NotificationItem[] = (contactMsgs as ContactMessage[])
          .filter(msg => msg.status === 'new')
          .map(msg => ({
            id: `contact-${msg.id}`,
            type: 'contact',
            title: `New Message from ${msg.name}`,
            message: msg.message.substring(0, 40) + '...',
            time: new Date(msg.created_at).toLocaleString(),
            isRead: false,
            link: '/interaction/contact-messages'
          }));

        // Process Investor Inquiries
        const inquiryNotifs: NotificationItem[] = (inquiries as InvestorInquiry[])
          .filter(inq => inq.status === 'pending')
          .map(inq => ({
            id: `inquiry-${inq.id}`,
            type: 'inquiry',
            title: `New Inquiry from ${inq.organization || inq.full_name}`,
            message: `Interest: ${inq.area_of_interest || 'General'}`,
            time: new Date(inq.created_at).toLocaleString(),
            isRead: false,
            link: '/interaction/investor-inquiries'
          }));

        // Combine and sort by newest first
        const combined = [...contactNotifs, ...inquiryNotifs].sort((a, b) =>
          new Date(b.time).getTime() - new Date(a.time).getTime()
        );

        setNotifications(combined);
        setUnreadCount(combined.length);

      } catch (error) {
        // Only log unexpected errors
        console.error("Unexpected error fetching notifications:", error);
      }
    };

    if (user) {
      fetchNotifications();
      // Optional: Poll every minute
      const interval = setInterval(fetchNotifications, 60000);
      return () => clearInterval(interval);
    }
  }, [user]);


  // --- Handlers ---

  const toggleDropdown = (dropdown: OpenDropdownType) => {
    setOpenDropdown(prev => (prev === dropdown ? null : dropdown));
  };

  const closeDropdown = () => setOpenDropdown(null);

  const handleLogout = async () => {
    closeDropdown();
    await logout();
    navigate('/login');
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('All fields are required');
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      setPasswordError('Password must be at least 8 characters and include uppercase, lowercase, numbers, and special characters (@$!%*?&).');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordError('New password must be different from current password');
      return;
    }

    setIsChangingPassword(true);

    try {
      await request('/change-password', {
        method: 'POST',
        data: {
          userId: user?.user_id,
          currentPassword: currentPassword,
          newPassword: newPassword
        }
      });

      setPasswordSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setShowChangePasswordModal(false);
        setPasswordSuccess('');
      }, 2000);

    } catch (error: any) {
      setPasswordError(error.message || 'Network error. Please try again.');
      // If error, do not clear success and others.
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="w-full flex items-center justify-between px-4 lg:px-6 py-1">
      {/* --- Left Side: Toggle & Text --- */}
      <div className="flex items-center gap-3">
        {/* Compact Toggle Button (Sidebar) */}
        <button
          onClick={toggleSidebar}
          className="p-2 -ml-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition-all focus:outline-none group active:scale-95"
          title={
            isSidebarOpen ? "Compact Mode" : "Expand Mode"}
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

        {/* Brand Text */}
        <div className="flex items-center gap-2 pl-2 border-l border-gray-200 dark:border-gray-700 h-6">
          <span className="text-sm font-black text-gray-800 dark:text-white tracking-tighter uppercase whitespace-nowrap">
            BMS <span className="text-blue-600">WEBSITE</span>
          </span>
        </div>
      </div>

      {/* --- Right Side: Icons & Profile --- */}
      <div className="flex items-center gap-2 sm:gap-4">

        {/* Full Screen Toggle */}
        <div className="relative">
          <button
            onClick={toggleFullScreen}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors focus:outline-none relative active:scale-95"
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
        </div>

        {/* Theme Toggle */}
        <div className="relative">
          <button
            onClick={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors focus:outline-none relative"
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? (
              <svg className="w-5 h-5 transition-transform hover:rotate-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 transition-transform hover:-rotate-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
        </div>

        {/* Language Switcher */}
        <div className="relative" ref={languageRef}>
          <button
            onClick={() => toggleDropdown('language')}
            className="flex items-center gap-2 p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors focus:outline-none"
            title="Change Language"
          >
            <svg className="w-5 h-5 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 11.37 9.198 15.158 6.412 17M11 13a4.5 4.5 0 01-1.412-1.412 4.5 4.5 0 011.412-1.412" />
            </svg>
            <span className="text-[10px] font-black uppercase tracking-widest bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-600">
              {i18n.language === 'am' ? 'አማ' : 'EN'}
            </span>
          </button>

          {openDropdown === 'language' && (
            <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 z-[100] py-2 animate-scale-in">
              <button
                onClick={() => {
                   i18n.changeLanguage('en');
                   setOpenDropdown(null);
                }}
                className={`w-full text-left px-4 py-2.5 text-xs flex items-center justify-between font-bold tracking-tight ${i18n.language === 'en' ? 'text-blue-600 bg-blue-50/50 dark:bg-blue-900/20' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
              >
                English
                {i18n.language === 'en' && <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>}
              </button>
              <button
                onClick={() => {
                   i18n.changeLanguage('am');
                   setOpenDropdown(null);
                }}
                className={`w-full text-left px-4 py-2.5 text-xs flex items-center justify-between font-bold tracking-tight ${i18n.language === 'am' ? 'text-blue-600 bg-blue-50/50 dark:bg-blue-900/20' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
              >
                አማርኛ
                {i18n.language === 'am' && <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>}
              </button>
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="relative" ref={notificationsRef}>
          <button
            onClick={() => toggleDropdown('notifications')}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors focus:outline-none relative"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center border-2 border-white dark:border-gray-800">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {openDropdown === 'notifications' && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 z-50 overflow-hidden animate-fade-in-down">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
                <h3 className="text-sm font-semibold text-gray-800 dark:text-white">Notifications</h3>
                <span className="text-xs text-gray-500">{unreadCount} New</span>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map(note => (
                    <Link
                      key={note.id}
                      to={note.link}
                      onClick={closeDropdown}
                      className="block px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border-b border-gray-50 dark:border-gray-700/50 last:border-0 relative group"
                    >
                      <div className="flex gap-3">
                        <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${note.type === 'contact' ? 'bg-blue-500' : 'bg-green-500'}`}></div>
                        <div>
                          <p className="text-sm text-gray-800 dark:text-gray-200 font-medium leading-snug">{note.title}</p>
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
            onClick={() => toggleDropdown('profile')}
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
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 z-50 py-2 animate-fade-in-down">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 mb-2">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{user?.name || 'User'}</p>
                <p className="text-xs text-gray-500 truncate mb-1.5" title={user?.email}>{user?.email || 'user@example.com'}</p>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                  {user?.role_name || 'Role'}
                </span>
              </div>

              {/* Your Profile link removed per user request */}

              <button
                onClick={() => {
                  setShowChangePasswordModal(true);
                  closeDropdown();
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                  Change Password
                </div>
              </button>

              <div className="border-t border-gray-100 dark:border-gray-700 my-2"></div>

              <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 font-medium">
                Sign out
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Change Password Modal - Rendered via Portal to ensure full center on any layout */}
      {showChangePasswordModal && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[10000] p-4 animate-fade-in overflow-y-auto">
          {/* Transparent Backdrop Click Area */}
          <div className="absolute inset-0" onClick={() => {
            setShowChangePasswordModal(false);
            setPasswordError('');
            setPasswordSuccess('');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
          }}></div>

          <div className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-md transform transition-all animate-scale-in border border-gray-200 dark:border-gray-700 overflow-hidden my-auto">
            {/* Header */}
            <div className="px-8 py-6 bg-gradient-to-r from-blue-600 to-indigo-700 text-white relative">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 shadow-inner">
                  <FaShieldAlt className="text-2xl text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-black tracking-tight uppercase">Security Protocol</h2>
                  <p className="text-blue-100 text-xs font-bold opacity-90 uppercase tracking-widest">Update Transmission Key</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowChangePasswordModal(false);
                  setPasswordError('');
                  setPasswordSuccess('');
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
                className="absolute top-6 right-6 p-2 rounded-xl hover:bg-white/10 transition-colors text-white/80 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Security Instruction */}
            <div className="px-8 pt-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-2xl p-4 flex gap-3">
                <FaInfoCircle className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[11px] font-black text-blue-800 dark:text-blue-300 uppercase tracking-tight mb-1">Mandatory Security Update</p>
                  <p className="text-[10px] text-blue-600 dark:text-blue-400 font-medium leading-relaxed uppercase">Password must be at least 8 characters long and contain a mix of letters, numbers, and professional characters.</p>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleChangePassword} className="p-8 space-y-5">
              {/* Current Password */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-500 dark:text-gray-400 tracking-widest ml-1">
                  <FaLock className="text-blue-500" /> Current Authorization
                </label>
                <div className="relative group">
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full pl-4 pr-10 py-3.5 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-bold text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                    placeholder="Enter current password"
                    required
                  />
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-500 dark:text-gray-400 tracking-widest ml-1">
                  <FaLock className="text-indigo-500" /> New Secured Key
                </label>
                <div className="relative group">
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-4 pr-10 py-3.5 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-bold text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none"
                    placeholder="Minimal 8 characters"
                    required
                  />
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-500 dark:text-gray-400 tracking-widest ml-1">
                  <FaShieldAlt className="text-green-500" /> Verify Key Transmission
                </label>
                <div className="relative group">
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-4 pr-10 py-3.5 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-bold text-sm focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all outline-none"
                    placeholder="Retype new password"
                    required
                  />
                </div>
              </div>

              {/* Error Message */}
              {passwordError && (
                <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl animate-shake">
                  <FaExclamationTriangle className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                  <p className="text-[10px] font-black text-red-700 dark:text-red-400 uppercase leading-snug">{passwordError}</p>
                </div>
              )}

              {/* Success Message */}
              {passwordSuccess && (
                <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl animate-fade-in">
                  <FaShieldAlt className="text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                  <p className="text-[10px] font-black text-green-700 dark:text-green-400 uppercase leading-snug">{passwordSuccess}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowChangePasswordModal(false);
                    setPasswordError('');
                    setPasswordSuccess('');
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                  className="flex-1 py-4 px-4 rounded-2xl border-2 border-gray-100 dark:border-gray-700 text-gray-600 dark:text-gray-400 font-black uppercase text-[11px] tracking-widest hover:bg-gray-50 dark:hover:bg-gray-700 transition-all active:scale-95"
                >
                  Terminate
                </button>
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="flex-[1.5] py-4 px-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 text-white font-black uppercase text-[11px] tracking-widest shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  {isChangingPassword ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Updating...
                    </span>
                  ) : (
                    'Finalize Update'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default TopNavbar;