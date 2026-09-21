import React, { useState, FormEvent, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../Auth/AuthContext';
import validator from 'validator';
import axios from 'axios';
import { BACKEND_URL } from '../../services/apiService';
import {
    EyeIcon,
    EyeSlashIcon,
    LockClosedIcon,
    UserIcon,
    ShieldCheckIcon,
    ExclamationTriangleIcon,
    ArrowRightIcon,
    KeyIcon,
    EnvelopeIcon,
    DevicePhoneMobileIcon,
    CpuChipIcon,
    CloudIcon,
    WifiIcon,
    SparklesIcon,
    ClockIcon
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ShieldCheckIcon as ShieldSolidIcon,
    LockClosedIcon as LockSolidIcon,
    CheckCircleIcon as CheckSolidIcon,
    ExclamationTriangleIcon as WarningSolidIcon
} from '@heroicons/react/24/solid';
import ParticleBackground from '../ParticleBackground';

const MAX_ATTEMPTS = 5;
const ATTEMPT_COUNT_KEY = 'login_attempt_count';
const LAST_ATTEMPT_TIME_KEY = 'last_login_attempt';
const ATTEMPT_RESET_TIME = 1 * 60 * 1000; // 15 minutes
// Unified API Base URL construction consistent with the rest of the app
const API_BASE_URL = `${BACKEND_URL}/api`;


const LoginPage: React.FC = () => {
    // Form state
    const [userName, setUserName] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [rememberMe, setRememberMe] = useState(false);

    // Refs to force-clear input values
    const usernameRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);

    // Forgot password modal state
    const [showForgotModal, setShowForgotModal] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [forgotMsg, setForgotMsg] = useState<string | null>(null);
    const [forgotLoading, setForgotLoading] = useState(false);
    const [forgotStep, setForgotStep] = useState<'email' | 'otp'>('email');
    const [isRedeemingOnly, setIsRedeemingOnly] = useState(false);

    // Security state
    const [attemptCount, setAttemptCount] = useState(0);
    const [lockMessage, setLockMessage] = useState<string | null>(null);
    const [isAccountLocked, setIsAccountLocked] = useState(false);
    const [sessionConflict, setSessionConflict] = useState(false);
    const [sessionData, setSessionData] = useState<any>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // UI state
    const [isFormFocused, setIsFormFocused] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());

    const { login } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    // Handle both string and object 'from' state
    const fromState = location.state?.from;
    let from = typeof fromState === 'string' ? fromState : (fromState?.pathname || "/dashboard/overview");

    // Update time every second for dynamic display
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Handle success message from registration and pre-fill email
    useEffect(() => {
        const msg = location.state?.message;
        const email = location.state?.email;
        if (msg) {
            setSuccessMessage(msg);
        }
        if (email) {
            setUserName(email);
            if (usernameRef.current) usernameRef.current.value = email;
        }
    }, [location.state]);

    // Clear form fields on mount to prevent browser auto-fill
    useEffect(() => {
        setPassword('');
        setError(null);
        // Force clear input values via refs
        if (passwordRef.current) passwordRef.current.value = '';
    }, []);

    // Clear fields when page becomes visible (handles back button navigation)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                setUserName('');
                setPassword('');
                if (usernameRef.current) usernameRef.current.value = '';
                if (passwordRef.current) passwordRef.current.value = '';
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, []);

    // Initialize attempt count from localStorage
    useEffect(() => {
        const storedAttemptCount = localStorage.getItem(ATTEMPT_COUNT_KEY);
        const lastAttemptTime = localStorage.getItem(LAST_ATTEMPT_TIME_KEY);

        if (storedAttemptCount && lastAttemptTime) {
            const timeSinceLastAttempt = Date.now() - parseInt(lastAttemptTime);

            if (timeSinceLastAttempt > ATTEMPT_RESET_TIME) {
                localStorage.removeItem(ATTEMPT_COUNT_KEY);
                localStorage.removeItem(LAST_ATTEMPT_TIME_KEY);
                setAttemptCount(0);
            } else {
                const count = parseInt(storedAttemptCount);
                setAttemptCount(count);

                if (count >= MAX_ATTEMPTS) {
                    setIsAccountLocked(true);
                    setLockMessage(`Access restricted due to security policy. Please use the redemption code.`);
                } else {
                    const remainingAttempts = MAX_ATTEMPTS - count;
                    setLockMessage(`Security Warning: ${count} of ${MAX_ATTEMPTS} attempts used. ${remainingAttempts} attempt(s) remaining.`);
                }
            }
        }
    }, []);

    const isPasswordStrong = (pwd: string) => {
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        return passwordRegex.test(pwd);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isLoading) return;

        setIsLoading(true);
        if (isAccountLocked) {
            setError("Account is temporarily locked due to too many failed attempts.");
            setIsLoading(false); // Ensure loading state is reset
            return;
        }
        setError(null);

        // Allow username or email, so less strict validation here on username format unless it's strictly email
        if (!userName) {
            setError("Username/Email is required.");
            setIsLoading(false); // Ensure loading state is reset
            return;
        }

        try {
            const result = await login({
                user_name: userName,
                pass: password,
                forceLogout: false
            });

            console.log("[AUTH] Login Result:", result);

            if (result.success) {
                setAttemptCount(0);
                setLockMessage(null);
                setError(null);
                setIsAccountLocked(false);
                setSessionConflict(false);
                // Security: Clear all possible sensitive keys from storage
                localStorage.removeItem(ATTEMPT_COUNT_KEY);
                localStorage.removeItem(LAST_ATTEMPT_TIME_KEY);
                localStorage.removeItem('user');
                // Clear username and password fields for security
                setUserName('');
                setPassword('');
                if (usernameRef.current) usernameRef.current.value = '';
                if (passwordRef.current) passwordRef.current.value = '';

                navigate(from, { replace: true });
            } else {
                // Handle different types of login failures
                if (result.conflict) {
                    setSessionConflict(true);
                    setSessionData(result.session);
                    setError("Another session is active. Please choose an option below.");
                } else if (result.locked) {
                    setIsAccountLocked(true);
                    setLockMessage(result.message || "Account is temporarily locked.");
                } else {
                    const errorMessage = result.message || "Invalid username or password.";
                    setError(errorMessage);

                    // Update local attempt count
                    const newAttemptCount = attemptCount + 1;
                    setAttemptCount(newAttemptCount);
                    localStorage.setItem(ATTEMPT_COUNT_KEY, newAttemptCount.toString());
                    localStorage.setItem(LAST_ATTEMPT_TIME_KEY, Date.now().toString());

                    if (newAttemptCount >= MAX_ATTEMPTS) {
                        setIsAccountLocked(true);
                        setLockMessage(`Maximum login attempts reached (${MAX_ATTEMPTS}). Account temporarily locked. Please try again later.`);
                    } else {
                        const remainingAttempts = MAX_ATTEMPTS - newAttemptCount;
                        setLockMessage(`Login attempt ${newAttemptCount} of ${MAX_ATTEMPTS}. ${remainingAttempts} attempt(s) remaining before account lock.`);
                    }
                }
            }
        } catch (loginError) {
            console.error('Login error:', loginError);
            setError("An unexpected error occurred. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleForgotRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        setForgotMsg(null);
        setForgotLoading(true);

        if (!forgotEmail) {
            setForgotMsg('Please enter your email or username.');
            setForgotLoading(false);
            return;
        }

        try {
            const endpoint = isRedeemingOnly ? 'resend-redemption' : 'forgot-password';
            const res = await axios.post(`${API_BASE_URL}/${endpoint}`, {
                email: forgotEmail
            }, {
                withCredentials: true
            });

            if (res.data) {
                setForgotMsg(isRedeemingOnly ? 'A new unlock code has been sent.' : 'OTP sent to your email. Please check your inbox.');
                setForgotStep('otp');
            }
        } catch (err: any) {
            const errorData = err.response?.data;
            setForgotMsg(errorData?.message || errorData?.error || "Network error: Failed to send OTP.");
        }
        setForgotLoading(false);
    };

    const handleRedeemOnly = async (e: React.FormEvent) => {
        e.preventDefault();
        setForgotMsg(null);
        setForgotLoading(true);

        try {
            const res = await axios.post(`${API_BASE_URL}/redeem-account`, {
                email: forgotEmail,
                code: otp
            }, {
                withCredentials: true
            });

            if (res.data) {
                setForgotMsg('Account unlocked successfully! You can now log in.');
                setIsAccountLocked(false);
                setAttemptCount(0);
                setLockMessage(null);
                localStorage.removeItem(ATTEMPT_COUNT_KEY);
                localStorage.removeItem(LAST_ATTEMPT_TIME_KEY);

                setTimeout(() => {
                    setShowForgotModal(false);
                    setForgotStep('email');
                    setForgotEmail('');
                    setOtp('');
                    setIsRedeemingOnly(false);
                    setForgotMsg(null);
                }, 2000);
            }
        } catch (err: any) {
            const errorData = err.response?.data;
            setForgotMsg(errorData?.message || errorData?.error || "Error: Failed to unlock.");
        }
        setForgotLoading(false);
    };

    const handleForgotReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setForgotMsg(null);
        setForgotLoading(true);

        if (!validator.isLength(otp, { min: 4, max: 8 })) {
            setForgotMsg('Invalid OTP format.');
            setForgotLoading(false);
            return;
        }
        if (!isPasswordStrong(newPassword)) {
            setForgotMsg('New password must be strong (8+ chars, uppercase, lowercase, number, symbol).');
            setForgotLoading(false);
            return;
        }

        try {
            const res = await axios.post(`${API_BASE_URL}/reset-password`, {
                email: forgotEmail,
                code: otp,
                newPassword: newPassword
            }, {
                withCredentials: true
            });

            if (res.data) {
                setForgotMsg('Success! Your password has been changed. You can now log in.');
                // Clear local lock states
                setIsAccountLocked(false);
                setAttemptCount(0);
                setLockMessage(null);
                localStorage.removeItem(ATTEMPT_COUNT_KEY);
                localStorage.removeItem(LAST_ATTEMPT_TIME_KEY);

                setTimeout(() => {
                    setShowForgotModal(false);
                    setForgotStep('email');
                    setForgotEmail('');
                    setOtp('');
                    setNewPassword('');
                    setForgotMsg(null);
                }, 2000);
            }
        } catch (err: any) {
            const errorData = err.response?.data;
            setForgotMsg(errorData?.message || errorData?.error || "Network error: Failed to reset password.");
        }
        setForgotLoading(false);
    };

    const handleForceLogin = async () => {
        setError(null);
        setIsLoading(true);
        try {
            const result = await login({
                user_name: userName,
                pass: password,
                forceLogout: true
            });

            if (result.success) {
                setSessionConflict(false);
                navigate(from, { replace: true });
            } else {
                setError(result.message || "Force logout failed.");
            }
        } catch (error) {
            setError("An unexpected error occurred during force logout.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setUserName(e.target.value);
        if (error) setError(null);
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPassword(e.target.value);
        if (error) setError(null);
    };

    return (
        <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4 lg:p-6 bg-slate-950">
            {/* Premium Animated Background with Tech Particles */}
            <div className="absolute inset-0 z-0">
                {/* Advanced Tech Particles (tsparticles) */}
                <ParticleBackground className="absolute inset-0" id="login-particles" />

                {/* Atmospheric Glows */}
                <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-indigo-600/15 rounded-full blur-[140px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] bg-purple-600/15 rounded-full blur-[140px] animate-pulse delay-1000"></div>
                <div className="absolute top-[30%] right-[20%] w-[25%] h-[25%] bg-cyan-500/10 rounded-full blur-[100px]"></div>

                {/* Mesh Grid */}
                <div className="absolute inset-0 opacity-[0.04]" style={{
                    backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                    backgroundSize: '40px 40px'
                }}></div>
            </div>

            {/* Main Content */}
            <div className="relative z-10 w-full max-w-[1600px] h-full flex flex-col lg:flex-row items-center justify-center py-4 lg:py-8">
                {/* Left Side - Branding & Info */}
                <div className="hidden lg:flex lg:w-[58%] flex-col justify-center pl-4 xl:pl-12 pr-6 h-full">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                        className="mb-4 text-left"
                    >
                        <div className="flex flex-col mb-4">
                            <div>
                                <h1 className="text-4xl xl:text-5xl font-black tracking-tight text-white mb-2 leading-[1.05] font-display">
                                    ADVANCED
                                    <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-sky-300 to-teal-300">
                                        SALON MANAGEMENT
                                    </span>
                                </h1>
                                <div className="h-1 w-20 bg-gradient-to-r from-indigo-500 to-sky-400 rounded-full mb-3"></div>
                                <p className="text-indigo-200/70 font-semibold text-xs uppercase tracking-[0.25em]">AMS Enterprise Operational Suite</p>
                            </div>
                        </div>

                        <p className="text-sm xl:text-base text-slate-300 mb-6 leading-relaxed max-w-md">
                            Streamline bookings, optimize customer queues, manage staff schedules, and deliver high-precision salon services with effortless control.
                        </p>
                    </motion.div>

                    {/* Feature Highlights */}
                    <div className="space-y-4">
                        <div className="flex items-center space-x-4 group">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                                <ShieldSolidIcon className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="text-white font-semibold text-sm">Enterprise Security</h3>
                                <p className="text-slate-400 text-xs">Multi-layer authentication & encryption</p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-4 group">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                                <CloudIcon className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="text-white font-semibold text-sm">Cloud-Native Platform</h3>
                                <p className="text-slate-400 text-xs">Scalable infrastructure & real-time sync</p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-4 group">
                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                                <CpuChipIcon className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="text-white font-semibold text-sm">Analytics</h3>
                                <p className="text-slate-400 text-xs">Intelligent insights </p>
                            </div>
                        </div>
                    </div>

                    {/* System Status */}
                    <div className="mt-4 p-3 xl:p-4 bg-slate-800/30 backdrop-blur-sm rounded-xl border border-slate-700/30 max-w-lg">
                        <div className="flex items-center justify-between mb-1 xl:mb-2">
                            <h4 className="text-white font-semibold flex items-center text-xs xl:text-sm">
                                <WifiIcon className="w-3 h-3 xl:w-4 xl:h-4 mr-2 text-green-400" />
                                System Status
                            </h4>
                            <div className="flex items-center space-x-2">
                                <div className="w-1.5 h-1.5 xl:w-2 xl:h-2 bg-green-400 rounded-full animate-pulse"></div>
                                <span className="text-green-400 text-xs xl:text-sm font-medium">Online</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-1 xl:gap-4 text-[10px] xl:text-xs">
                            <div className="flex justify-between">
                                <span className="text-slate-400">Uptime:</span>
                                <span className="text-white font-mono">99.9%</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Response:</span>
                                <span className="text-white font-mono">12ms</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Users:</span>
                                <span className="text-white font-mono"></span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Load:</span>
                                <span className="text-white font-mono">23%</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side - Login Form */}
                <div className="w-full lg:w-[40%] flex items-center justify-center px-4 py-2 h-full">
                    <div className="w-full max-w-sm">
                        {/* Login Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className={`bg-slate-900/85 backdrop-blur-2xl border border-slate-800/90 rounded-3xl shadow-2xl p-8 transition-all duration-300 ${isFormFocused ? 'border-indigo-500/50 shadow-indigo-500/10' : ''}`}
                        >
                            {/* Header */}
                            <div className="text-center mb-7">
                                <h1 className="text-2xl xl:text-3xl font-bold text-white tracking-tight mb-1">
                                    Welcome Back
                                </h1>
                                <p className="text-slate-400 text-sm">Sign in to your AMS management account</p>
                                <div className="mt-3 py-1 px-3.5 bg-indigo-500/10 rounded-full inline-flex items-center border border-indigo-500/25">
                                    <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest flex items-center">
                                        <SparklesIcon className="w-3 h-3 mr-1.5 text-indigo-400" />
                                        AMS Secure Gateway
                                    </span>
                                </div>
                            </div>

                            {/* Success Message from Registration */}
                            {successMessage && (
                                <div className="mb-6 p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl backdrop-blur-sm">
                                    <div className="flex items-center space-x-3">
                                        <CheckSolidIcon className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                                        <div>
                                            <p className="text-emerald-300 font-semibold text-sm">Success</p>
                                            <p className="text-emerald-200/90 text-xs mt-0.5">{successMessage}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Error Messages */}
                            {error && (
                                <div className="mb-6 p-4 bg-rose-950/40 border border-rose-500/40 rounded-2xl backdrop-blur-sm">
                                    <div className="flex items-center space-x-3">
                                        <WarningSolidIcon className="w-5 h-5 text-rose-400 flex-shrink-0" />
                                        <div>
                                            <p className="text-rose-300 font-semibold text-sm">Login Failed</p>
                                            <p className="text-rose-200/90 text-xs mt-0.5">{error}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Lock Warning */}
                            {lockMessage && (
                                <div className={`mb-6 p-4 rounded-2xl backdrop-blur-sm border ${lockMessage.toLowerCase().includes("locked") ||
                                    lockMessage.toLowerCase().includes("maximum") ||
                                    isAccountLocked
                                    ? "bg-rose-950/40 border-rose-500/40"
                                    : "bg-amber-950/40 border-amber-500/40"
                                    }`}>
                                    <div className="flex items-center space-x-3">
                                        {isAccountLocked ? (
                                            <LockSolidIcon className="w-5 h-5 text-rose-400 flex-shrink-0" />
                                        ) : (
                                            <ExclamationTriangleIcon className="w-5 h-5 text-amber-400 flex-shrink-0" />
                                        )}
                                        <div>
                                            <p className={`font-semibold text-sm ${isAccountLocked ? 'text-rose-300' : 'text-amber-300'}`}>
                                                {isAccountLocked ? "Account Locked" : "Security Warning"}
                                            </p>
                                            <p className={`text-xs mt-0.5 ${isAccountLocked ? 'text-rose-200/90' : 'text-amber-200/90'}`}>
                                                {lockMessage}
                                            </p>
                                            {isAccountLocked && (
                                                <div className="mt-4 pt-4 border-t border-rose-500/20">
                                                    <p className="text-[11px] text-rose-300 mb-3 font-semibold uppercase tracking-wider">
                                                        Redemption Required
                                                    </p>
                                                    <div className="flex flex-col space-y-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setIsRedeemingOnly(true);
                                                                setForgotStep('email');
                                                                setShowForgotModal(true);
                                                                setForgotEmail(userName);
                                                                setForgotMsg(null);
                                                            }}
                                                            className="w-full py-2.5 bg-gradient-to-r from-rose-600 to-orange-600 text-white text-xs font-bold rounded-xl shadow-lg hover:shadow-rose-500/20 transition-all flex items-center justify-center space-x-2"
                                                        >
                                                            <EnvelopeIcon className="w-4 h-4" />
                                                            <span>Request New Redemption Code</span>
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setIsRedeemingOnly(true);
                                                                setForgotStep('otp');
                                                                setShowForgotModal(true);
                                                                setForgotEmail(userName);
                                                                setForgotMsg("Enter the 6-digit redemption code from your email.");
                                                            }}
                                                            className="w-full py-2.5 bg-slate-800/60 border border-rose-500/30 text-rose-300 text-xs font-bold rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center space-x-2"
                                                        >
                                                            <CheckSolidIcon className="w-4 h-4" />
                                                            <span>Already Have a Code? Unlock Now</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Login Form */}
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Username Field */}
                                <div>
                                    <label htmlFor="username" className="block text-xs font-semibold text-slate-300 mb-1.5">
                                        Username or Email Address
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                            <UserIcon className="h-4 w-4 text-slate-400" />
                                        </div>
                                        <input
                                            ref={usernameRef}
                                            id="username"
                                            type="text"
                                            name="fake-username-field"
                                            autoComplete="off"
                                            value={userName}
                                            onChange={handleUsernameChange}
                                            onFocus={() => setIsFormFocused(true)}
                                            onBlur={() => setIsFormFocused(false)}
                                            required
                                            disabled={isLoading || isAccountLocked}
                                            className="w-full pl-10 pr-3.5 py-3 bg-slate-950/70 border border-slate-700/80 focus:border-indigo-500 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                            placeholder="Enter your username or email"
                                        />
                                    </div>
                                </div>

                                {/* Password Field */}
                                <div>
                                    <label htmlFor="password" className="block text-xs font-semibold text-slate-300 mb-1.5">
                                        Password
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                            <LockClosedIcon className="h-4 w-4 text-slate-400" />
                                        </div>
                                        <input
                                            ref={passwordRef}
                                            id="password"
                                            name="fake-password-field"
                                            type={showPassword ? "text" : "password"}
                                            autoComplete="off"
                                            value={password}
                                            onChange={handlePasswordChange}
                                            onFocus={() => setIsFormFocused(true)}
                                            onBlur={() => setIsFormFocused(false)}
                                            required
                                            disabled={isLoading || isAccountLocked}
                                            className="w-full pl-10 pr-10 py-3 bg-slate-950/70 border border-slate-700/80 focus:border-indigo-500 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                            placeholder="Enter your password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white transition-colors duration-200"
                                            disabled={isLoading || isAccountLocked}
                                        >
                                            {showPassword ? (
                                                <EyeSlashIcon className="h-4 w-4" />
                                            ) : (
                                                <EyeIcon className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Remember Me & Forgot Password */}
                                <div className="flex items-center justify-between pt-1">
                                    <label className="flex items-center space-x-2 cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            checked={rememberMe}
                                            onChange={(e) => setRememberMe(e.target.checked)}
                                            disabled={isLoading || isAccountLocked}
                                            className="w-4 h-4 text-indigo-600 bg-slate-950 border-slate-700 rounded focus:ring-indigo-500/20 focus:ring-2 disabled:opacity-50 accent-indigo-600 cursor-pointer"
                                        />
                                        <span className="text-xs text-slate-300">Remember me</span>
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsRedeemingOnly(false);
                                            setShowForgotModal(true);
                                        }}
                                        className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-semibold"
                                    >
                                        Forgot password?
                                    </button>
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={isLoading || isAccountLocked}
                                    className={`w-full py-3.5 px-6 rounded-xl font-semibold text-white transition-all duration-200 active:scale-[0.98] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm flex items-center justify-center space-x-2 ${isAccountLocked
                                        ? 'bg-gradient-to-r from-rose-600 to-red-700 shadow-rose-600/30'
                                        : 'bg-gradient-to-r from-indigo-600 via-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 shadow-indigo-600/30 hover:shadow-indigo-600/40 hover:-translate-y-0.5'
                                        }`}
                                >
                                    {isLoading ? (
                                        <div className="flex items-center justify-center space-x-2">
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            <span>Authenticating...</span>
                                        </div>
                                    ) : isAccountLocked ? (
                                        <div className="flex items-center justify-center space-x-2">
                                            <LockSolidIcon className="w-4 h-4" />
                                            <span>Account Locked</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center space-x-2">
                                            <span>Sign In to AMS</span>
                                            <ArrowRightIcon className="w-4 h-4" />
                                        </div>
                                    )}
                                </button>
                            </form>

                            {/* Security Notice */}
                            <div className="mt-4 p-3 bg-slate-800/30 rounded-xl border border-slate-700/50">
                                <div className="flex items-center space-x-2 mb-1">
                                    <ShieldCheckIcon className="w-3 h-3 text-green-400" />
                                    <span className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider">Security Notice</span>
                                </div>
                                <p className="text-[10px] text-slate-400 leading-relaxed">
                                    This is a secure enterprise system. All activities are monitored and logged.
                                </p>
                            </div>
                        </motion.div>

                        {/* Footer */}
                        <div className="text-center mt-4 text-slate-400 text-xs">
                            <p>© 2026 My Salon Management System</p>
                        </div>
                    </div>

                    {/* Forgot Password Modal */}
                    {
                        showForgotModal && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
                                <div className="w-full max-w-md bg-slate-900/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-slate-800 overflow-hidden">
                                    {/* Modal Header */}
                                    <div className="p-6 border-b border-slate-800">
                                        <div className="flex items-center justify-between mb-5">
                                            <div className="flex items-center space-x-3">
                                                <div className={`p-2.5 rounded-xl ${isRedeemingOnly ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20' : 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20'}`}>
                                                    {isRedeemingOnly ? <ShieldCheckIcon className="w-5 h-5 text-amber-400" /> : <KeyIcon className="w-5 h-5 text-indigo-400" />}
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-bold text-white">
                                                        {isRedeemingOnly ? 'Account Redemption' : 'Password Recovery'}
                                                    </h3>
                                                    <p className="text-xs text-slate-400">
                                                        {isRedeemingOnly ? 'Secure account unlocking process' : 'Secure account recovery process'}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    setShowForgotModal(false);
                                                    setForgotStep('email');
                                                    setForgotMsg(null);
                                                    setIsRedeemingOnly(false);
                                                }}
                                                className="w-8 h-8 rounded-xl bg-slate-800/60 hover:bg-slate-700/80 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                                            >
                                                ✕
                                            </button>
                                        </div>

                                        <div className={`p-4 rounded-2xl border ${isRedeemingOnly ? 'bg-amber-950/20 border-amber-500/20' : 'bg-indigo-950/20 border-indigo-500/20'} relative overflow-hidden group`}>
                                            <h4 className={`text-xs font-bold uppercase tracking-wider mb-1.5 ${isRedeemingOnly ? 'text-amber-400' : 'text-indigo-400'}`}>
                                                {isRedeemingOnly ? 'UNLOCK ACCOUNT' : 'RECOVER ACCOUNT'}
                                            </h4>
                                            <p className="text-xs text-slate-300 leading-relaxed relative z-10">
                                                {isRedeemingOnly
                                                    ? "Your account is temporarily locked. Enter the redemption code sent to your email to restore access. No password change is required."
                                                    : "Enter your email address and we'll send you a 6-digit verification code to reset your account password."}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Modal Body */}
                                    <div className="p-6">

                                        {forgotMsg && (
                                            <div className={`mb-4 p-3.5 rounded-xl border ${forgotMsg.toLowerCase().includes('successful')
                                                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                                                : 'bg-indigo-950/40 border-indigo-500/40 text-indigo-300'
                                                }`}>
                                                <div className="flex items-center space-x-2.5">
                                                    {(forgotMsg as string).toLowerCase().includes('successful') ? (
                                                        <CheckSolidIcon className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                                    ) : (
                                                        <EnvelopeIcon className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                                                    )}
                                                    <p className="text-xs">
                                                        {forgotMsg}
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {forgotStep === 'email' && (
                                            <form onSubmit={handleForgotRequest} className="space-y-4">
                                                <div>
                                                    <label htmlFor="forgot-email" className="block text-xs font-semibold text-slate-300 mb-1.5">
                                                        Email Address
                                                    </label>
                                                    <div className="relative">
                                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                                            <EnvelopeIcon className="h-4 w-4 text-slate-400" />
                                                        </div>
                                                        <input
                                                            id="forgot-email"
                                                            type="email"
                                                            value={forgotEmail}
                                                            onChange={(e) => setForgotEmail(e.target.value)}
                                                            required
                                                            disabled={forgotLoading}
                                                            className="w-full pl-10 pr-3.5 py-3 bg-slate-950/70 border border-slate-700/80 focus:border-indigo-500 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 transition-all disabled:opacity-50 text-sm"
                                                            placeholder="Enter your registered email"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex flex-col space-y-3 pt-1">
                                                    <button
                                                        type="submit"
                                                        disabled={forgotLoading}
                                                        className={`w-full py-3 px-6 bg-gradient-to-r ${isRedeemingOnly ? 'from-amber-600 to-orange-600 shadow-amber-600/30' : 'from-indigo-600 via-indigo-600 to-blue-600 shadow-indigo-600/30'} hover:opacity-95 text-white font-semibold rounded-xl transition-all duration-200 active:scale-[0.98] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm`}
                                                    >
                                                        {forgotLoading ? (
                                                            <div className="flex items-center justify-center space-x-2">
                                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                                <span>Sending Code...</span>
                                                            </div>
                                                        ) : (
                                                            isRedeemingOnly ? 'Send Unlock Code' : 'Send Recovery Code'
                                                        )}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            if (!forgotEmail) {
                                                                setForgotMsg("Please enter your email first.");
                                                                return;
                                                            }
                                                            setForgotStep('otp');
                                                            setForgotMsg("Use the code from the security alert email.");
                                                        }}
                                                        className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors py-1 text-center font-medium"
                                                    >
                                                        Already have a code from system alert?
                                                    </button>
                                                </div>
                                            </form>
                                        )}

                                        {forgotStep === 'otp' && (
                                            <form onSubmit={isRedeemingOnly ? handleRedeemOnly : handleForgotReset} className="space-y-4">
                                                <div>
                                                    <label htmlFor="otp" className="block text-xs font-semibold text-slate-300 mb-1.5">
                                                        {isRedeemingOnly ? 'Redemption Code' : 'Verification Code'}
                                                    </label>
                                                    <div className="relative">
                                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                                            <DevicePhoneMobileIcon className="h-4 w-4 text-slate-400" />
                                                        </div>
                                                        <input
                                                            id="otp"
                                                            type="text"
                                                            value={otp}
                                                            onChange={(e) => setOtp(e.target.value)}
                                                            required
                                                            disabled={forgotLoading}
                                                            className="w-full pl-10 pr-3.5 py-3 bg-slate-950/70 border border-slate-700/80 focus:border-indigo-500 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 transition-all disabled:opacity-50 text-sm tracking-widest font-mono text-center"
                                                            placeholder="Enter 6-digit code"
                                                            maxLength={6}
                                                        />
                                                    </div>
                                                </div>

                                                {!isRedeemingOnly && (
                                                    <div>
                                                        <label htmlFor="new-password" className="block text-xs font-semibold text-slate-300 mb-1.5">
                                                            New Password
                                                        </label>
                                                        <div className="relative">
                                                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                                                <LockClosedIcon className="h-4 w-4 text-slate-400" />
                                                            </div>
                                                            <input
                                                                id="new-password"
                                                                type="password"
                                                                value={newPassword}
                                                                onChange={(e) => setNewPassword(e.target.value)}
                                                                required
                                                                disabled={forgotLoading}
                                                                className="w-full pl-10 pr-3.5 py-3 bg-slate-950/70 border border-slate-700/80 focus:border-indigo-500 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 transition-all disabled:opacity-50 text-sm"
                                                                placeholder="Enter new secure password"
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                <button
                                                    type="submit"
                                                    disabled={forgotLoading}
                                                    className={`w-full py-3 px-6 bg-gradient-to-r ${isRedeemingOnly ? 'from-amber-600 to-orange-600' : 'from-emerald-600 to-teal-600'} text-white font-semibold rounded-xl transition-all duration-200 active:scale-[0.98] shadow-lg shadow-black/30 disabled:opacity-50 disabled:cursor-not-allowed text-sm`}
                                                >
                                                    {forgotLoading ? (
                                                        <div className="flex items-center justify-center space-x-2">
                                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                            <span>{isRedeemingOnly ? 'Unblocking...' : 'Resetting...'}</span>
                                                        </div>
                                                    ) : (
                                                        isRedeemingOnly ? 'Unlock & Unblock Now' : 'Reset Password'
                                                    )}
                                                </button>
                                            </form>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    }

                    {/* Session Conflict Modal */}
                    {sessionConflict && (
                        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="w-full max-w-md bg-slate-900 border border-red-500/30 rounded-3xl overflow-hidden shadow-2xl"
                            >
                                <div className="p-6 text-center">
                                    <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <ExclamationTriangleIcon className="w-10 h-10 text-red-500" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-white mb-2">Access Restricted</h3>
                                    <p className="text-slate-400 text-sm mb-6">
                                        Your account is already active on another device. To ensure security, you must log out of the other device before signing in here.
                                    </p>

                                    <div className="mb-6 py-2 px-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center space-x-3">
                                        <ShieldCheckIcon className="w-5 h-5 text-red-400 flex-shrink-0" />
                                        <p className="text-[11px] text-red-300 text-left">
                                            A security alert has been dispatched to your email regarding this concurrent session.
                                        </p>
                                    </div>

                                    {sessionData && (
                                        <div className="bg-slate-800/40 rounded-2xl p-4 mb-8 text-left border border-slate-700/50 shadow-inner">
                                            <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/5">
                                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Conflicting Session Info</span>
                                                <div className="flex items-center space-x-1">
                                                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
                                                    <span className="text-[9px] text-red-400 font-bold uppercase">LIVE</span>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 gap-4">
                                                <div className="flex items-start space-x-3">
                                                    <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center mt-0.5">
                                                        <WifiIcon className="w-4 h-4 text-blue-400" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-0.5">Origin (IP)</p>
                                                        <p className="text-sm text-white font-mono truncate">{sessionData.ip}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-start space-x-3">
                                                    <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center mt-0.5">
                                                        <DevicePhoneMobileIcon className="w-4 h-4 text-purple-400" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-0.5">Platform</p>
                                                        <p className="text-[11px] text-slate-200 line-clamp-2">{sessionData.ua}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-start space-x-3">
                                                    <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center mt-0.5">
                                                        <ClockIcon className="w-4 h-4 text-green-400" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-0.5">Established</p>
                                                        <p className="text-[11px] text-slate-200">{new Date(sessionData.started).toLocaleString()}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex flex-col space-y-3">
                                        <button
                                            onClick={handleForceLogin}
                                            disabled={isLoading}
                                            className="w-full py-4 bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white font-bold rounded-2xl shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center space-x-2 border border-red-400/20"
                                        >
                                            {isLoading ? (
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            ) : (
                                                <LockClosedIcon className="w-5 h-5" />
                                            )}
                                            <span>FORCE LOGOUT & LOG IN NOW</span>
                                        </button>
                                        <button
                                            onClick={() => setSessionConflict(false)}
                                            className="w-full py-3 text-slate-400 hover:text-white text-sm font-medium transition-colors"
                                        >
                                            Go Back
                                        </button>
                                    </div>
                                </div>
                                <div className="bg-red-500/5 p-4 border-t border-red-500/10">
                                    <p className="text-[10px] text-red-400/70 text-center leading-tight">
                                        Note: Terminating the other session will immediately disconnect that device from the system.
                                    </p>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
