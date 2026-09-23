import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaHome, FaCut, FaSignInAlt, FaUserPlus, FaBars, FaTimes, FaUser, FaSignOutAlt, FaArrowLeft
} from 'react-icons/fa';
import { useAuth } from '../components/Auth/AuthContext';
import ThemeToggle from '../components/ThemeToggle';

interface PublicLayoutProps {
  children: React.ReactNode;
}

const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, logout } = useAuth();
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { label: 'Home', path: '/', icon: <FaHome /> },
    { label: 'Our Services', path: '/services', icon: <FaCut /> },
  ];

  const handleNavClick = (path: string) => {
    navigate(path);
  };

  const handleLogoutClick = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090d16] text-slate-800 dark:text-slate-100 font-sans relative overflow-hidden flex flex-col transition-colors duration-300">
      
      {/* PROFESSIONAL MOVABLE GRADIENT BACKGROUND */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Animated ambient blob 1 */}
        <motion.div 
          animate={{
            x: [0, 80, -40, 0],
            y: [0, -90, 50, 0],
            scale: [1, 1.2, 0.9, 1]
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-blue-500/10 dark:bg-blue-500/15 blur-[120px]"
        />
        
        {/* Animated ambient blob 2 */}
        <motion.div 
          animate={{
            x: [0, -100, 60, 0],
            y: [0, 80, -90, 0],
            scale: [1, 0.85, 1.15, 1]
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-1/2 left-1/3 w-[500px] h-[500px] rounded-full bg-purple-500/5 dark:bg-purple-500/10 blur-[150px]"
        />

        {/* Animated ambient blob 3 */}
        <motion.div 
          animate={{
            x: [0, 50, -80, 0],
            y: [0, 100, -50, 0],
            scale: [1, 1.1, 0.9, 1]
          }}
          transition={{
            duration: 22,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-indigo-500/10 dark:bg-indigo-500/15 blur-[120px]"
        />
        
        {/* Ambient Grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-40 dark:opacity-30" />
      </div>

      {/* STICKY TOPBAR NAVIGATION */}
      <nav className="sticky top-0 z-50 bg-white/85 dark:bg-slate-950/80 border-b border-slate-200/80 dark:border-slate-800/80 backdrop-blur-xl shadow-sm dark:shadow-lg transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            
            {/* Logo Brand & Back Navigation */}
            <div className="flex items-center gap-2 sm:gap-3">
              {location.pathname !== '/' && (
                <button
                  onClick={() => navigate(-1)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all shadow-sm active:scale-95"
                  title="Go back to previous page"
                  aria-label="Back"
                >
                  <FaArrowLeft />
                  <span className="hidden sm:inline">Back</span>
                </button>
              )}

              <Link to="/" className="flex items-center gap-3 decoration-none group">
                <div className="bg-gradient-to-br from-indigo-600 via-indigo-600 to-blue-600 p-2.5 rounded-2xl shadow-lg shadow-indigo-500/25 text-white group-hover:scale-105 transition-transform duration-300">
                  <FaCut className="text-xl" />
                </div>
                <div className="flex flex-col">
                  <span className="font-heading font-black text-base text-slate-900 dark:text-white tracking-wider leading-none uppercase">
                    BarberShop <span className="text-indigo-600 dark:text-indigo-400">Pro</span>
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block uppercase tracking-widest font-semibold">
                    Management Platform
                  </span>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden lg:flex items-center gap-2">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <button
                    key={item.label}
                    onClick={() => handleNavClick(item.path)}
                    className={`
                      flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200
                      ${isActive 
                        ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-500/20 shadow-sm' 
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/50 border border-transparent'
                      }
                    `}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Desktop Right Side: Theme Toggle + Auth Buttons */}
            <div className="hidden lg:flex items-center gap-3">
              {/* System / Dark / Light Theme Toggle */}
              <div className="pr-1">
                <ThemeToggle variant="segmented" />
              </div>

              <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />

              {isAuthenticated ? (
                <>
                  <button
                    onClick={() => handleNavClick('/dashboard/overview')}
                    className={`
                      flex items-center gap-2 px-4.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200
                      ${location.pathname.startsWith('/dashboard') 
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                        : 'text-slate-700 dark:text-slate-300 bg-slate-100/80 dark:bg-slate-800/40 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/30'
                      }
                    `}
                  >
                    <FaUser className="text-xs" />
                    <span>My Dashboard</span>
                  </button>
                  <button
                    onClick={handleLogoutClick}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-rose-600 dark:text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-600 border border-rose-500/20 hover:border-transparent transition-all duration-200"
                  >
                    <FaSignOutAlt className="text-xs" />
                    <span>Sign Out</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => handleNavClick('/login')}
                    className={`
                      flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200
                      ${location.pathname === '/login' 
                        ? 'bg-indigo-50 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20' 
                        : 'text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/50'
                      }
                    `}
                  >
                    <FaSignInAlt className="text-xs" />
                    <span>Sign In</span>
                  </button>
                  <button
                    onClick={() => handleNavClick('/register')}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 via-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold rounded-xl shadow-md shadow-indigo-500/25 hover:shadow-lg hover:shadow-indigo-500/35 hover:scale-[1.02] active:scale-[0.98] transition-all text-sm uppercase tracking-wider"
                  >
                    <FaUserPlus />
                    <span>Register</span>
                  </button>
                </>
              )}
            </div>

            {/* Mobile Actions: Theme Toggle & Hamburger */}
            <div className="flex items-center gap-2 lg:hidden">
              <ThemeToggle variant="dropdown" />
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/30 rounded-xl transition-all duration-200"
                aria-label="Toggle navigation menu"
              >
                {isMobileMenuOpen ? <FaTimes size={18} /> : <FaBars size={18} />}
              </button>
            </div>

          </div>
        </div>

        {/* Mobile Dropdown Menu with Framer Motion */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="lg:hidden bg-white/95 dark:bg-slate-950/95 border-b border-slate-200 dark:border-slate-800 backdrop-blur-xl"
            >
              <div className="px-4 pt-4 pb-6 space-y-3">
                {/* Mobile Appearance Switcher */}
                <div className="pb-3 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Appearance</span>
                  <ThemeToggle variant="segmented" showLabels={true} />
                </div>

                {navItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <button
                      key={item.label}
                      onClick={() => {
                        handleNavClick(item.path);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`
                        w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all
                        ${isActive 
                          ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md' 
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900/60'
                        }
                      `}
                    >
                      <span className="text-base">{item.icon}</span>
                      <span>{item.label}</span>
                    </button>
                  );
                })}
                
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800/60 space-y-2.5">
                  {isAuthenticated ? (
                    <>
                      <button
                        onClick={() => {
                          handleNavClick('/dashboard/overview');
                          setIsMobileMenuOpen(false);
                        }}
                        className={`
                          w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all
                          ${location.pathname.startsWith('/dashboard') 
                            ? 'bg-indigo-600 text-white' 
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900/60'
                          }
                        `}
                      >
                        <FaUser className="text-base text-slate-400" />
                        <span>My Dashboard</span>
                      </button>
                      <button
                        onClick={() => {
                          handleLogoutClick();
                          setIsMobileMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all"
                      >
                        <FaSignOutAlt className="text-base text-rose-500" />
                        <span>Sign Out</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          handleNavClick('/login');
                          setIsMobileMenuOpen(false);
                        }}
                        className={`
                          w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all
                          ${location.pathname === '/login' 
                            ? 'bg-indigo-600 text-white' 
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900/60'
                          }
                        `}
                      >
                        <FaSignInAlt className="text-base text-slate-400" />
                        <span>Sign In</span>
                      </button>
                      <button
                        onClick={() => {
                          handleNavClick('/register');
                          setIsMobileMenuOpen(false);
                        }}
                        className="w-full flex items-center justify-center gap-2.5 py-3.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold rounded-xl shadow-md text-sm uppercase tracking-wider"
                      >
                        <FaUserPlus />
                        <span>Register</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* SCROLLABLE MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto flex flex-col min-w-0 bg-transparent scrollbar-thin">
        {/* Actual Page Render Component */}
        <div className="flex-1 p-4 md:p-8 lg:p-10 max-w-7xl w-full mx-auto animate-fade-in relative z-10">
          {children}
        </div>

        {/* SHARED PROFESSIONAL COPYRIGHT FOOTER */}
        <footer className="border-t border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-950/60 backdrop-blur-md py-6 text-center text-xs text-slate-500 dark:text-slate-400 w-full mt-auto relative z-10 transition-colors duration-300">
          <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <FaCut className="text-indigo-600 dark:text-indigo-400" />
              <span>© 2026 BarberShop Pro. Precision grooming & appointment management.</span>
            </div>
            <div className="flex gap-4">
              <Link to="/" className="text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-slate-200 decoration-none transition-colors">Privacy Policy</Link>
              <Link to="/" className="text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-slate-200 decoration-none transition-colors">Terms of Service</Link>
              <a
                href="http://192.168.1.130:5005/complaint-form"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-slate-200 decoration-none transition-colors"
              >
                Feedback & Support
              </a>
            </div>
          </div>
        </footer>
      </main>

    </div>
  );
};

export default PublicLayout;
