import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaUser, FaEnvelope, FaPhone, FaLock, FaEye, FaEyeSlash, 
  FaUserPlus, FaArrowLeft, FaCheckCircle, FaCut, FaShieldAlt
} from 'react-icons/fa';
import { Alert, Spinner } from 'react-bootstrap';
import { request } from '../../services/apiService';

const CustomerRegister: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);
  
  // Get redirect URL from state or localStorage on mount
  useEffect(() => {
    const fromState = location.state?.from;
    const fromStorage = localStorage.getItem('redirectAfterLogin');
    const finalRedirect = fromState || fromStorage || '/dashboard/overview';
    setRedirectUrl(finalRedirect);
  }, [location]);
  
  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    email: '',
    phone: '',
    password: '',
    confirm_password: ''
  });

  const passwordCriteria = {
    length: formData.password.length >= 8,
    uppercase: /[A-Z]/.test(formData.password),
    lowercase: /[a-z]/.test(formData.password),
    number: /[0-9]/.test(formData.password),
    special: /[@$!%*?&]/.test(formData.password)
  };
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  const validateForm = (): boolean => {
    if (!formData.username.trim()) {
      setError('Username is required');
      return false;
    }
    const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
    if (!usernameRegex.test(formData.username)) {
      setError('Username must be 3-30 characters long and contain only letters, numbers, and underscores');
      return false;
    }
    if (!formData.full_name.trim()) {
      setError('Full name is required');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (!formData.phone.trim()) {
      setError('Phone number is required');
      return false;
    }
    if (!formData.password) {
      setError('Password is required');
      return false;
    }
    
    // Check strong password requirements
    const isStrong = passwordCriteria.length && passwordCriteria.uppercase && 
                     passwordCriteria.lowercase && passwordCriteria.number && 
                     passwordCriteria.special;
    if (!isStrong) {
      setError('Password does not meet strong security requirements.');
      return false;
    }
    
    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await request<{ success: boolean; message: string; user_id?: number }>('/register', {
        method: 'POST',
        data: {
          username: formData.username,
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password
        }
      });

      if (response.success) {
        setSuccess(true);
        // Redirect to login after 2.5 seconds, passing the redirect URL
        setTimeout(() => {
          navigate('/login', { 
            state: { 
              message: 'Registration successful! Please login with your credentials.',
              email: formData.username,
              from: redirectUrl || '/dashboard/overview'
            }
          });
        }, 2500);
      } else {
        setError(response.message || 'Registration failed. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during registration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-[500px] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/95 dark:bg-slate-950/60 backdrop-blur-2xl rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-8 max-w-md w-full text-center"
        >
          <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
            <FaCheckCircle className="text-emerald-500 text-4xl" />
          </div>
          <h2 className="text-2xl font-bold font-heading text-slate-900 dark:text-white mb-3">Registration Successful!</h2>
          <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-6">
            Your account has been created successfully. We are redirecting you to the login page to verify your credentials.
          </p>
          <div className="flex items-center justify-center gap-3 text-sm text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-500/5 py-3 px-4 rounded-xl border border-indigo-500/15">
            <Spinner animation="border" size="sm" className="text-indigo-600 dark:text-indigo-400" />
            <span>Redirecting to Secure Gateway...</span>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto py-4 px-2">
      {/* Back Button */}
      <button 
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white mb-6 transition-all duration-300 group text-sm font-semibold bg-white/80 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800/85 px-4 py-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700/30 shadow-sm"
      >
        <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" /> Back to Home
      </button>

      {/* Register Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/95 dark:bg-slate-950/50 backdrop-blur-2xl rounded-[2.5rem] border border-slate-200/80 dark:border-slate-800/80 shadow-[0_20px_60px_rgba(0,0,0,0.06)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] overflow-hidden transition-colors duration-300"
      >
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-indigo-600 via-indigo-600 to-blue-600 p-6 md:p-8 text-center relative overflow-hidden">
          {/* Atmospheric design glows */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-400/20 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl pointer-events-none" />
          
          <div className="relative z-10">
            <div className="w-14 h-14 bg-white/15 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/25 shadow-inner">
              <FaCut className="text-white text-xl animate-pulse" />
            </div>
            <h1 className="text-2xl md:text-3xl font-heading font-black text-white tracking-tight">Create Customer Account</h1>
            <p className="text-blue-100 text-xs md:text-sm mt-1.5 font-medium">Join BarberShop Pro for seamless appointments & grooming insights</p>
          </div>
        </div>

        {/* Form Container */}
        <div className="p-6 md:p-10">
          {error && (
            <Alert variant="danger" className="mb-6 bg-rose-50 dark:bg-red-950/40 border-rose-200 dark:border-red-800 text-rose-700 dark:text-red-200 rounded-xl py-3 px-4 backdrop-blur-sm text-sm">
              <div className="flex items-center gap-2.5">
                <FaShieldAlt className="text-rose-500 dark:text-red-400 text-base" />
                <span>{error}</span>
              </div>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Column 1: Personal Details */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                  <span className="w-1.5 h-4 bg-indigo-600 rounded-full"></span>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-200 uppercase tracking-widest">Personal Details</h3>
                </div>

                {/* Full Name */}
                <div>
                  <label htmlFor="reg-fullname" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <FaUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-sm pointer-events-none" />
                    <input
                      type="text"
                      id="reg-fullname"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleChange}
                      placeholder="e.g. John Doe"
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/40 focus:border-indigo-500 dark:focus:border-indigo-400 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500/20 transition-all rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none text-sm font-medium"
                      required
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Please enter your legal first and last name</p>
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="reg-email" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <FaEnvelope className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-sm pointer-events-none" />
                    <input
                      type="email"
                      id="reg-email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="e.g. john@example.com"
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/40 focus:border-indigo-500 dark:focus:border-indigo-400 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500/20 transition-all rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none text-sm font-medium"
                      required
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">We will send appointment receipts & updates here</p>
                </div>

                {/* Phone */}
                <div>
                  <label htmlFor="reg-phone" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                    Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <FaPhone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-sm pointer-events-none" />
                    <input
                      type="tel"
                      id="reg-phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="e.g. +251 911 234 567"
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/40 focus:border-indigo-500 dark:focus:border-indigo-400 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500/20 transition-all rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none text-sm font-medium"
                      required
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Used strictly for scheduling & SMS notifications</p>
                </div>
              </div>

              {/* Column 2: Account Setup */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                  <span className="w-1.5 h-4 bg-blue-600 rounded-full"></span>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-200 uppercase tracking-widest">Account Setup</h3>
                </div>

                {/* Username */}
                <div>
                  <label htmlFor="reg-username" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                    Choose Username <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <FaUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-sm pointer-events-none" />
                    <input
                      type="text"
                      id="reg-username"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      placeholder="e.g. john_doe"
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/40 focus:border-indigo-500 dark:focus:border-indigo-400 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500/20 transition-all rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none text-sm font-medium"
                      required
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">3-30 characters; alphanumeric & underscores only</p>
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="reg-password" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                    Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <FaLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-sm pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="reg-password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="w-full pl-11 pr-12 py-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/40 focus:border-indigo-500 dark:focus:border-indigo-400 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500/20 transition-all rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none text-sm font-medium"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>

                {/* Dynamic Password Strength Checklist */}
                <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2.5">
                  <p className="font-bold text-slate-900 dark:text-slate-200 text-xs flex items-center gap-2">
                    <FaShieldAlt className="text-indigo-600 dark:text-blue-400" /> Security Standards Check:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold ${passwordCriteria.length ? "bg-emerald-500/20 text-emerald-600 dark:text-green-400" : "bg-rose-500/10 text-rose-500 dark:text-red-400"}`}>
                        {passwordCriteria.length ? "✓" : "•"}
                      </span>
                      <span className={passwordCriteria.length ? "text-emerald-700 dark:text-green-300 font-semibold" : "text-slate-500 dark:text-slate-400"}>
                        Min. 8 characters
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold ${passwordCriteria.uppercase ? "bg-emerald-500/20 text-emerald-600 dark:text-green-400" : "bg-rose-500/10 text-rose-500 dark:text-red-400"}`}>
                        {passwordCriteria.uppercase ? "✓" : "•"}
                      </span>
                      <span className={passwordCriteria.uppercase ? "text-emerald-700 dark:text-green-300 font-semibold" : "text-slate-500 dark:text-slate-400"}>
                        Uppercase character
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold ${passwordCriteria.lowercase ? "bg-emerald-500/20 text-emerald-600 dark:text-green-400" : "bg-rose-500/10 text-rose-500 dark:text-red-400"}`}>
                        {passwordCriteria.lowercase ? "✓" : "•"}
                      </span>
                      <span className={passwordCriteria.lowercase ? "text-emerald-700 dark:text-green-300 font-semibold" : "text-slate-500 dark:text-slate-400"}>
                        Lowercase character
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold ${passwordCriteria.number ? "bg-emerald-500/20 text-emerald-600 dark:text-green-400" : "bg-rose-500/10 text-rose-500 dark:text-red-400"}`}>
                        {passwordCriteria.number ? "✓" : "•"}
                      </span>
                      <span className={passwordCriteria.number ? "text-emerald-700 dark:text-green-300 font-semibold" : "text-slate-500 dark:text-slate-400"}>
                        Number (0-9)
                      </span>
                    </div>
                    <div className="flex items-center gap-2 sm:col-span-2">
                      <span className={`flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold ${passwordCriteria.special ? "bg-emerald-500/20 text-emerald-600 dark:text-green-400" : "bg-rose-500/10 text-rose-500 dark:text-red-400"}`}>
                        {passwordCriteria.special ? "✓" : "•"}
                      </span>
                      <span className={passwordCriteria.special ? "text-emerald-700 dark:text-green-300 font-semibold" : "text-slate-500 dark:text-slate-400"}>
                        Special symbol (@$!%*?&)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label htmlFor="reg-confirmpassword" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                    Confirm Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <FaLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-sm pointer-events-none" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="reg-confirmpassword"
                      name="confirm_password"
                      value={formData.confirm_password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="w-full pl-11 pr-12 py-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/40 focus:border-indigo-500 dark:focus:border-indigo-400 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500/20 transition-all rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none text-sm font-medium"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
                    >
                      {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>
              </div>

            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                id="reg-submit-btn"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-indigo-600 via-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 text-sm uppercase tracking-wider"
              >
                {loading ? (
                  <>
                    <Spinner animation="border" size="sm" />
                    <span>Authorizing & Syncing Account...</span>
                  </>
                ) : (
                  <>
                    <FaUserPlus className="text-base" />
                    <span>Create Secure Account</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Login Link */}
          <div className="text-center mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              Already registered?{' '}
              <Link 
                to="/login" 
                className="text-indigo-600 dark:text-blue-400 font-bold hover:text-indigo-500 dark:hover:text-blue-300 hover:underline transition-all"
              >
                Access Secure Gateway
              </Link>
            </p>
          </div>
        </div>
      </motion.div>

      {/* Trust & Performance Indicators */}
      <div className="mt-8 grid grid-cols-3 gap-4 text-center">
        <div className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-md rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="text-2xl font-black font-heading text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-600 dark:from-blue-400 dark:to-cyan-300">100%</div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mt-1">SSL Encrypted</div>
        </div>
        <div className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-md rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="text-2xl font-black font-heading text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-600 dark:from-blue-400 dark:to-cyan-300">Strict</div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mt-1">Role Segregation</div>
        </div>
        <div className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-md rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="text-2xl font-black font-heading text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-600 dark:from-blue-400 dark:to-cyan-300">24/7</div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mt-1">Secure Logs</div>
        </div>
      </div>
    </div>
  );
};

export default CustomerRegister;
