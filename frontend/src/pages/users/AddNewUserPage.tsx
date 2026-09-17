import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { addUser, getRoles, getDepartments, Role, Department } from '../../services/apiService';
import { useNavigate } from 'react-router-dom';
import { FaUserPlus, FaShieldAlt, FaKey, FaEye, FaEyeSlash, FaArrowLeft, FaCheckCircle, FaUser, FaEnvelope, FaPhone, FaBuilding, FaUserTag } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { Spinner } from 'react-bootstrap';
import DOMPurify from 'dompurify';

const AddNewUserPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [brandColor, setBrandColor] = useState('blue');
  const [formData, setFormData] = useState({
    fname: '',
    lname: '',
    user_name: '',
    password: '',
    email: '',
    phone: '',
    department_id: '',
    role_id: ''
  });
  const [roles, setRoles] = useState<Role[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const fetchTheme = () => {
      setBrandColor(localStorage.getItem('lms_color') || 'blue');
    };
    fetchTheme();
    window.addEventListener('storage', fetchTheme);
    return () => window.removeEventListener('storage', fetchTheme);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [rolesData, deptsData] = await Promise.all([getRoles(), getDepartments()]);
        setRoles(rolesData);
        setDepartments(deptsData);
      } catch (err: any) {
        console.error("Failed to load options", err);
      }
    };
    fetchData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError(null);
  };

  const handleGeneratePassword = () => {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@$!%*?&";
    const requiredChars = [
      "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)],
      "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)],
      "0123456789"[Math.floor(Math.random() * 26)],
      "@$!%*?&"[Math.floor(Math.random() * 7)]
    ];

    let generated = "";
    for (let i = 0; i < 8; i++) {
        generated += charset.charAt(Math.floor(Math.random() * charset.length));
    }

    const pwdArray = (generated + requiredChars.join('')).split('');
    for (let i = pwdArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pwdArray[i], pwdArray[j]] = [pwdArray[j], pwdArray[i]];
    }

    setFormData(prev => ({ ...prev, password: pwdArray.join('').slice(0, 12) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (formData.password.length < 8) {
        setError(t('users_page.error_password'));
        return;
    }

    // Basic cleaning before submit
    const cleanFname = DOMPurify.sanitize(formData.fname).trim();
    const cleanLname = DOMPurify.sanitize(formData.lname).trim();
    
    setLoading(true);
    setError(null);
    try {
      await addUser({
        ...formData,
        fname: cleanFname,
        lname: cleanLname
      });
      setSuccess(true);
      setTimeout(() => navigate('/users/all'), 2500);
    } catch (err: any) {
      setError(err.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const InputGroup = ({ label, icon, name, type = "text", placeholder, required = true, value }: any) => {
    const inputRef = useRef<HTMLInputElement>(null);
    return (
      <div className="space-y-2 group">
        <label 
          className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 transition-colors group-focus-within:text-blue-500 cursor-text"
          onClick={() => inputRef.current?.focus()}
        >
          {label}
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-300 group-focus-within:text-blue-500 transition-colors">
            {icon}
          </div>
          <input
            ref={inputRef}
            type={type}
            name={name}
            required={required}
            value={value}
            placeholder={placeholder}
            onChange={handleChange}
            className="w-full pl-12 pr-6 py-4 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-[1.5rem] text-sm font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 focus:bg-white dark:focus:bg-slate-900 transition-all placeholder:text-slate-300 dark:placeholder:text-slate-700"
          />
        </div>
      </div>
    );
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-6 bg-slate-50/30 dark:bg-slate-950">
        <motion.div initial={{ scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', damping: 12 }} className="relative">
           <div className={`absolute inset-0 bg-emerald-500 blur-2xl opacity-20 animate-pulse`}></div>
           <FaCheckCircle className="w-24 h-24 text-emerald-500 relative z-10" />
        </motion.div>
        <div className="text-center space-y-2">
            <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">{t('users_page.success_created')}</h2>
            <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-[10px]">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid min-h-screen bg-slate-50/30 dark:bg-slate-950 py-12 px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Back Navigation */}
        <button
          onClick={() => navigate('/users/all')}
          className="flex items-center gap-3 text-slate-400 hover:text-blue-600 transition-all font-black uppercase tracking-[0.2em] text-[10px] group mb-4"
        >
          <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center shadow-sm group-hover:-translate-x-1 group-hover:shadow-md transition-all">
            <FaArrowLeft />
          </div>
          {t('users_page.back_to_dashboard')}
        </button>

        <motion.div
           initial={{ opacity: 0, y: 30 }}
           animate={{ opacity: 1, y: 0 }}
           className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] dark:shadow-none border border-slate-100/50 dark:border-slate-800/50 overflow-hidden relative"
        >
           {/* Decorative background accent */}
           <div className={`absolute top-0 right-0 w-64 h-64 bg-${brandColor}-500/5 rounded-full blur-3xl -mr-32 -mt-32`}></div>
           <div className={`absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -ml-32 -mb-32`}></div>

           <div className="p-10 md:p-16 relative z-10">
              {/* Header Section */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16">
                 <div className="flex items-center gap-6">
                    <div className={`w-20 h-20 rounded-[2rem] bg-${brandColor}-600 flex items-center justify-center text-white text-3xl shadow-2xl shadow-${brandColor}-500/40 transform -rotate-3`}>
                       <FaUserPlus />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-2">{t('users_page.new_user_title')}</h1>
                        <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px] opacity-80">{t('users_page.new_user_subtitle')}</p>
                    </div>
                 </div>
                 <div className="hidden lg:block">
                    <div className="px-4 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Status: </span>
                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest leading-none">Drafting</span>
                    </div>
                 </div>
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }} 
                  animate={{ opacity: 1, x: 0 }}
                  className="mb-10 p-5 bg-rose-50 dark:bg-rose-900/10 border-l-4 border-rose-500 rounded-2xl flex items-center gap-4 text-rose-600 dark:text-rose-400 shadow-sm"
                >
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center flex-shrink-0">
                    <FaShieldAlt className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold leading-relaxed">{error}</span>
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-12">
                {/* Section 1: Personal Details */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className={`w-1.5 h-6 bg-${brandColor}-600 rounded-full`}></div>
                        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Personal Information</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <InputGroup label={t('users_page.fname')} icon={<FaUser />} name="fname" value={formData.fname} placeholder="e.g. Abebe" />
                        <InputGroup label={t('users_page.lname')} icon={<FaUser />} name="lname" value={formData.lname} placeholder="e.g. Kebede" />
                        <InputGroup label={t('users_page.email')} icon={<FaEnvelope />} name="email" type="email" value={formData.email} placeholder="abebe@example.com" />
                        <InputGroup label={t('users_page.phone')} icon={<FaPhone />} name="phone" value={formData.phone} placeholder="+251 91..." />
                    </div>
                </div>

                {/* Section 2: Account Access */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className={`w-1.5 h-6 bg-blue-600 rounded-full`}></div>
                        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">System Access</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <InputGroup label={t('users_page.username')} icon={<FaUserTag />} name="user_name" value={formData.user_name} placeholder="akebede" />
                        
                        {/* Security Key Group */}
                        <div className="space-y-2 group md:col-span-1">
                            <div className="flex justify-between items-center mb-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">{t('users_page.security_key')}</label>
                                <button
                                    type="button" 
                                    onClick={handleGeneratePassword}
                                    className={`text-[8px] font-black uppercase tracking-widest bg-${brandColor}-600/10 text-${brandColor}-600 px-3 py-1 rounded-lg hover:bg-${brandColor}-600 hover:text-white transition-all`}
                                >
                                    {t('users_page.auto_generate')}
                                </button>
                            </div>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-300 group-focus-within:text-blue-500 transition-colors">
                                    <FaKey />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    required
                                    value={formData.password}
                                    placeholder="••••••••••••"
                                    onChange={handleChange}
                                    className="w-full pl-12 pr-14 py-4 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-[1.5rem] text-sm font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 tracking-widest font-mono transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 p-2 transition-colors"
                                >
                                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                                </button>
                            </div>
                        </div>

                        {/* Custom Selects */}
                        <div className="space-y-2">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">{t('users_page.department')}</label>
                             <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-300">
                                    <FaBuilding />
                                </div>
                                <select
                                    name="department_id" required value={formData.department_id} onChange={handleChange}
                                    className="w-full pl-12 pr-10 py-4 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-[1.5rem] text-sm font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 appearance-none cursor-pointer transition-all"
                                >
                                    <option value="">{t('users_page.select_dept')}</option>
                                    {departments.map(dept => (
                                        <option key={dept.department_id} value={dept.department_id}>{dept.name}</option>
                                    ))}
                                </select>
                             </div>
                        </div>

                        <div className="space-y-2">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">{t('users_page.system_role')}</label>
                             <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-300">
                                    <FaShieldAlt />
                                </div>
                                <select
                                    name="role_id" required value={formData.role_id} onChange={handleChange}
                                    className="w-full pl-12 pr-10 py-4 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-[1.5rem] text-sm font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 appearance-none cursor-pointer transition-all"
                                >
                                    <option value="">{t('users_page.select_role')}</option>
                                    {roles.map(role => (
                                        <option key={role.role_id} value={role.role_id}>{role.role_name}</option>
                                    ))}
                                </select>
                             </div>
                        </div>
                    </div>
                </div>

                <div className="pt-12 border-t border-slate-100 dark:border-slate-800">
                   <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-6 rounded-[2rem] bg-${brandColor}-600 text-white font-black uppercase tracking-[0.3em] text-sm shadow-2xl shadow-${brandColor}-500/40 hover:bg-${brandColor}-700 hover:-translate-y-1.5 hover:shadow-${brandColor}-500/50 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-4 relative overflow-hidden group`}
                   >
                     <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
                     {loading ? (
                        <div className="flex items-center gap-3">
                           <Spinner animation="border" size="sm" />
                           <span>{t('users_page.initializing')}</span>
                        </div>
                     ) : (
                        <>
                           <FaUserPlus className="w-5 h-5 shadow-sm" /> 
                           <span>{t('users_page.create_account')}</span>
                        </>
                     )}
                   </button>
                </div>
              </form>
           </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AddNewUserPage;