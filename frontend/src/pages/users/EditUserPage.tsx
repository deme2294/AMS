import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { updateUser, getRoles, getDepartments, getUsers, Role, Department, User } from '../../services/apiService';
import { useNavigate, useParams } from 'react-router-dom';
import { FaUserEdit, FaShieldAlt, FaKey, FaEye, FaEyeSlash, FaArrowLeft, FaCheckCircle, FaUser, FaEnvelope, FaPhone, FaBuilding, FaUserTag } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { Spinner } from 'react-bootstrap';
import DOMPurify from 'dompurify';

const EditUserPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  const [brandColor, setBrandColor] = useState('blue');
  const [formData, setFormData] = useState({
    fname: '', lname: '', user_name: '', password: '', email: '', phone: '', department_id: '', role_id: ''
  });
  const [roles, setRoles] = useState<Role[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    setBrandColor(localStorage.getItem('lms_color') || 'blue');
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [rolesData, deptsData, usersData] = await Promise.all([getRoles(), getDepartments(), getUsers()]);
        setRoles(rolesData);
        setDepartments(deptsData);
        
        const user = usersData.find((u: User) => u.user_id === Number(userId));
        if (user) {
          setFormData({
            fname: user.fname || '',
            lname: user.lname || '',
            user_name: user.user_name || '',
            password: '',
            email: user.email || '',
            phone: user.phone || '',
            department_id: user.department_id ? String(user.department_id) : '',
            role_id: user.role_id ? String(user.role_id) : ''
          });
        } else {
          setError('User not found');
        }
      } catch (err: any) {
        setError("Failed to load user data");
      } finally {
        setLoading(false);
      }
    };
    if (userId) fetchData();
  }, [userId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || !userId) return;

    setSubmitting(true);
    setError(null);
    try {
      await updateUser(userId, {
        ...formData,
        fname: DOMPurify.sanitize(formData.fname).trim(),
        lname: DOMPurify.sanitize(formData.lname).trim()
      });
      setSuccess(true);
      setTimeout(() => navigate('/users/all'), 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to update user');
    } finally {
      setSubmitting(false);
    }
  };

  const InputGroup = ({ label, icon, name, type = "text", placeholder, disabled = false, value }: any) => (
    <div className="space-y-3 group">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 transition-colors group-focus-within:text-blue-500">
        {label}
      </label>
      <div className="relative">
        <div className={`absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none ${disabled ? 'text-slate-200' : 'text-slate-300 group-focus-within:text-blue-500'} transition-colors`}>
          {icon}
        </div>
        <input
          type={type} name={name} value={value} placeholder={placeholder} disabled={disabled} onChange={handleChange}
          className={`w-full pl-14 pr-6 py-4 rounded-[1.8rem] text-sm font-bold transition-all ${disabled ? 'bg-slate-50 dark:bg-slate-800/20 text-slate-300 border-none opacity-60' : 'bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-slate-800 dark:text-white'}`}
        />
      </div>
    </div>
  );

  if (loading) return (
     <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Spinner animation="border" variant="primary" />
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('common.loading')}</span>
     </div>
  );

  if (success) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
       <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-emerald-500">
          <FaCheckCircle className="w-20 h-20 shadow-xl rounded-full" />
       </motion.div>
       <h2 className="text-2xl font-black text-slate-800 dark:text-white">{t('users_page.success_updated')}</h2>
    </div>
  );

  return (
    <div className="container-fluid min-h-screen bg-slate-50/30 dark:bg-slate-950 py-12 px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <button
          onClick={() => navigate('/users/all')}
          className="flex items-center gap-3 text-slate-400 hover:text-blue-600 transition-all font-black uppercase tracking-[0.2em] text-[10px] group"
        >
          <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center shadow-sm group-hover:-translate-x-1 group-hover:bg-blue-600 group-hover:text-white transition-all">
            <FaArrowLeft />
          </div>
          {t('users_page.back_to_dashboard')}
        </button>

        <motion.div
           initial={{ opacity: 0, scale: 0.98, y: 20 }}
           animate={{ opacity: 1, scale: 1, y: 0 }}
           className="bg-white dark:bg-slate-900 rounded-[3.5rem] shadow-2xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden"
        >
           <div className="p-10 md:p-20">
              <div className="flex items-center gap-8 mb-16">
                 <div className={`w-24 h-24 rounded-[2.2rem] bg-${brandColor}-600 flex items-center justify-center text-white text-4xl shadow-2xl shadow-${brandColor}-500/40 relative transform rotate-3`}>
                    <FaUserEdit />
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-500 rounded-full border-4 border-white dark:border-slate-900 flex items-center justify-center text-[10px] text-white">
                       <FaCheckCircle />
                    </div>
                 </div>
                 <div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-3">{t('users_page.edit_user_title')}</h1>
                    <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px] opacity-80">{t('users_page.edit_user_subtitle')}</p>
                 </div>
              </div>

              {error && (
                <div className="mb-10 p-5 bg-rose-50 dark:bg-rose-900/10 border-l-4 border-rose-500 rounded-2xl flex items-center gap-4 text-rose-600 dark:text-rose-400">
                  <FaShieldAlt className="text-xl" />
                  <span className="text-xs font-bold">{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                    <InputGroup label={t('users_page.fname')} icon={<FaUser />} name="fname" value={formData.fname} placeholder="Abebe" />
                    <InputGroup label={t('users_page.lname')} icon={<FaUser />} name="lname" value={formData.lname} placeholder="Kebede" />
                    <InputGroup label={t('users_page.email')} icon={<FaEnvelope />} name="email" value={formData.email} disabled />
                    <InputGroup label={t('users_page.phone')} icon={<FaPhone />} name="phone" value={formData.phone} placeholder="+251..." />
                    <InputGroup label={t('users_page.username')} icon={<FaUserTag />} name="user_name" value={formData.user_name} />
                    
                    <div className="space-y-3 group">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">{t('users_page.security_key')}</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-slate-300 group-focus-within:text-blue-500 transition-colors">
                                <FaKey size={16} />
                            </div>
                            <input
                                type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleChange} placeholder="••••••••••••"
                                className="w-full pl-14 pr-14 py-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[1.8rem] text-sm font-bold tracking-widest font-mono focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-slate-800 dark:text-white"
                            />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 hover:text-blue-500 p-2">
                                {showPassword ? <FaEyeSlash /> : <FaEye />}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-3">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">{t('users_page.department')}</label>
                         <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-slate-300"><FaBuilding /></div>
                            <select
                                name="department_id" required value={formData.department_id} onChange={handleChange}
                                className="w-full pl-14 pr-10 py-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[1.8rem] text-sm font-bold appearance-none cursor-pointer focus:ring-4 focus:ring-blue-500/10 transition-all text-slate-800 dark:text-white"
                            >
                                <option value="">{t('users_page.select_dept')}</option>
                                {departments.map(d => <option key={d.department_id} value={d.department_id}>{d.name}</option>)}
                            </select>
                         </div>
                    </div>

                    <div className="space-y-3">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">{t('users_page.system_role')}</label>
                         <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-slate-300"><FaShieldAlt /></div>
                            <select
                                name="role_id" required value={formData.role_id} onChange={handleChange}
                                className="w-full pl-14 pr-10 py-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[1.8rem] text-sm font-bold appearance-none cursor-pointer focus:ring-4 focus:ring-blue-500/10 transition-all text-slate-800 dark:text-white"
                            >
                                <option value="">{t('users_page.select_role')}</option>
                                {roles.map(r => <option key={r.role_id} value={r.role_id}>{r.role_name}</option>)}
                            </select>
                         </div>
                    </div>
                </div>

                <div className="pt-12 border-t border-slate-50 dark:border-slate-800">
                   <button
                        type="submit" disabled={submitting}
                        className={`w-full py-6 rounded-[2.2rem] bg-${brandColor}-600 text-white font-black uppercase tracking-[0.3em] text-xs shadow-2xl shadow-${brandColor}-500/40 hover:bg-${brandColor}-700 hover:-translate-y-1.5 transition-all flex items-center justify-center gap-4`}
                   >
                     {submitting ? <Spinner animation="border" size="sm" /> : <><FaCheckCircle /> {t('users_page.update_account')}</>}
                   </button>
                </div>
              </form>
           </div>
        </motion.div>
      </div>
    </div>
  );
};

export default EditUserPage;
