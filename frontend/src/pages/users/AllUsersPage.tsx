import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  getUsers, changeUserStatus, deleteUser, getRoles, User, Role, 
  getAllMenus, getUserPermissions, updateUserPermissions, Menu,
  addUser, updateUser, getDepartments, Department
} from '../../services/apiService';
import { Link } from 'react-router-dom';
import Pagination from '../../components/Pagination';
import { Modal, Spinner } from 'react-bootstrap';
import { 
  FaUserPlus, FaKey, FaEdit, FaTrash, FaSearch, FaUser, 
  FaUsers, FaShieldAlt, FaListUl, FaAngleRight, FaCheckCircle,
  FaChevronRight, FaBuilding, FaUserTag, FaEnvelope, FaPhone, FaEye, FaEyeSlash, FaTimes
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import DOMPurify from 'dompurify';

const AllUsersPage: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'list' | 'add'>('list');
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [brandColor, setBrandColor] = useState('blue');

  const [formData, setFormData] = useState({
    fname: '', lname: '', user_name: '', password: '', email: '', phone: '', department_id: '', role_id: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);

  const [showPermsModal, setShowPermsModal] = useState(false);
  const [selectedUserForPerms, setSelectedUserForPerms] = useState<User | null>(null);
  const [allMenus, setAllMenus] = useState<Menu[]>([]);
  const [userOverrides, setUserOverrides] = useState<{ menu_id: number, permission_type: string }[]>([]);
  const [permsLoading, setPermsLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    const fetchTheme = () => setBrandColor(localStorage.getItem('lms_color') || 'blue');
    fetchTheme();
    window.addEventListener('storage', fetchTheme);
    return () => window.removeEventListener('storage', fetchTheme);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [u, r, d] = await Promise.all([getUsers(), getRoles(), getDepartments()]);
      setUsers(u); setRoles(r); setDepartments(d);
    } catch (err) { console.error("Data fetch failed", err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleStatusChange = async (uid: number, s: any) => {
    try {
      const ns = (s == 1) ? 0 : 1;
      await changeUserStatus(uid, ns);
      setUsers(users.map(u => u.user_id === uid ? { ...u, status: ns } : u));
    } catch (e) { alert(e); }
  };

  const handleDelete = async (uid: number) => {
    if (confirm(t('common.confirm_delete') || 'Are you sure?')) {
      await deleteUser(uid);
      setUsers(users.filter(u => u.user_id !== uid));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
       if (editingUserId) {
           await updateUser(editingUserId.toString(), formData);
           setFormSuccess(true);
           setTimeout(() => {
               setFormSuccess(false);
               setShowEditModal(false);
               setEditingUserId(null);
               fetchData();
               resetForm();
           }, 2000);
       } else {
           await addUser(formData);
           setFormSuccess(true);
           setTimeout(() => { 
                setFormSuccess(false); 
                setActiveTab('list'); 
                fetchData();
                resetForm();
           }, 2000);
       }
    } catch (err: any) { alert(err.message); }
    finally { setSubmitting(false); }
  };

  const resetForm = () => {
    setFormData({ fname: '', lname: '', user_name: '', password: '', email: '', phone: '', department_id: '', role_id: '' });
    setShowPassword(false);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUserId(user.user_id);
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
    setShowEditModal(true);
  };

  const handleOpenPerms = async (u: User) => {
    setSelectedUserForPerms(u); setShowPermsModal(true); setPermsLoading(true);
    try {
      const [m, o] = await Promise.all([getAllMenus(), getUserPermissions(u.user_id)]);
      setAllMenus(m); setUserOverrides(o);
    } finally { setPermsLoading(false); }
  };

  const handleSetOverride = (menuId: number, type: 'allow' | 'deny' | 'none') => {
    if (type === 'none') {
      setUserOverrides(userOverrides.filter(o => o.menu_id !== menuId));
    } else {
      const existing = userOverrides.find(o => o.menu_id === menuId);
      if (existing) {
        setUserOverrides(userOverrides.map(o => o.menu_id === menuId ? { ...o, permission_type: type } : o));
      } else {
        setUserOverrides([...userOverrides, { menu_id: menuId, permission_type: type }]);
      }
    }
  };

  const handleSavePermissions = async () => {
    if (!selectedUserForPerms) return;
    try {
      await updateUserPermissions(selectedUserForPerms.user_id, userOverrides);
      setShowPermsModal(false);
      alert('Permissions updated!');
    } catch (e) { alert(e); }
  };

  const filteredUsers = users.filter(u => (u.user_name+(u.email||'')+(u.name||'')).toLowerCase().includes(searchTerm.toLowerCase()));
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // -- Shared User Form --
  const UserForm = ({ isEdit = false }: { isEdit?: boolean }) => (
    <div className="space-y-4 sm:space-y-8">
      {formSuccess ? (
          <div className="text-center space-y-3 py-8 sm:py-16">
             <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="mx-auto w-20 h-20 sm:w-24 sm:h-24 bg-emerald-100 dark:bg-emerald-900/20 text-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <FaCheckCircle size={40} />
             </motion.div>
             <h3 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">
                {isEdit ? t('users_page.success_updated') : t('users_page.success_created')}
             </h3>
          </div>
      ) : (
          <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto space-y-4 sm:space-y-6">
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-5">
               {[
                 { label: t('users_page.fname'), icon: <FaUser />, name: 'fname', p: 'e.g. Abebe' },
                 { label: t('users_page.lname'), icon: <FaUser />, name: 'lname', p: 'e.g. Kebede' },
                 { label: t('users_page.email'), icon: <FaEnvelope />, name: 'email', type: 'email', p: 'abebe@example.com', disabled: isEdit },
                 { label: t('users_page.phone'), icon: <FaPhone />, name: 'phone', p: '+251 9...' },
                 { label: t('users_page.username'), icon: <FaUserTag />, name: 'user_name', p: 'akebede' },
               ].map(f => (
                 <div key={f.name} className="space-y-1 sm:space-y-2 group">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{f.label}</label>
                    <div className="relative">
                       <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none ${f.disabled ? 'text-slate-100' : 'text-slate-300 group-focus-within:text-blue-500'} transition-colors`}>{f.icon}</div>
                       <input 
                         type={f.type || 'text'} required={!f.disabled} name={f.name} value={(formData as any)[f.name]} onChange={e => setFormData({ ...formData, [f.name]: e.target.value })} 
                         disabled={f.disabled}
                         placeholder={f.p} className="w-full pl-10 pr-4 py-2.5 sm:py-3.5 bg-slate-50/50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-sans disabled:opacity-40"
                       />
                    </div>
                 </div>
               ))}
               
               {/* Password Field */}
               <div className="space-y-1 sm:space-y-2 group">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{t('users_page.security_key')}</label>
                      <button type="button" onClick={() => setFormData({...formData, password: Math.random().toString(36).slice(-10)})} className={`text-[8px] font-black uppercase tracking-widest text-${brandColor}-600 bg-${brandColor}-50 py-1 px-2 rounded-lg`}>{t('users_page.auto_generate')}</button>
                    </div>
                    <div className="relative">
                       <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-300 group-focus-within:text-blue-500 transition-colors"><FaKey /></div>
                       <input 
                         type={showPassword ? 'text' : 'password'} required={!isEdit} name="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} 
                         placeholder={isEdit ? "•••••••• (Leave blank to keep)" : "••••••••"} className="w-full pl-10 pr-12 py-2.5 sm:py-3.5 bg-slate-50/50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-mono"
                       />
                       <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-blue-500 transition-colors">{showPassword? <FaEyeSlash size={16}/>:<FaEye size={16}/>}</button>
                    </div>
               </div>

               {/* Department */}
               <div className="space-y-1 sm:space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{t('users_page.department')}</label>
                  <select required name="department_id" value={formData.department_id} onChange={e => setFormData({...formData, department_id: e.target.value})} className="w-full px-4 py-2.5 sm:py-3.5 bg-slate-50/50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold appearance-none cursor-pointer focus:ring-4 focus:ring-blue-500/10 transition-all">
                     <option value="">{t('users_page.select_dept')}</option>
                     {departments.map(d => <option key={d.department_id} value={d.department_id}>{d.name}</option>)}
                  </select>
               </div>

               {/* Role */}
               <div className="space-y-1 sm:space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{t('users_page.system_role')}</label>
                  <select required name="role_id" value={formData.role_id} onChange={e => setFormData({...formData, role_id: e.target.value})} className="w-full px-4 py-2.5 sm:py-3.5 bg-slate-50/50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold appearance-none cursor-pointer focus:ring-4 focus:ring-blue-500/10 transition-all">
                     <option value="">{t('users_page.select_role')}</option>
                     {roles.map(r => <option key={r.role_id} value={r.role_id}>{r.role_name}</option>)}
                  </select>
               </div>
             </div>

             <button 
                type="submit" 
                disabled={submitting}
                className={`w-full py-3 sm:py-4 rounded-[2rem] bg-${brandColor}-600 text-white font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-${brandColor}-500/30 hover:bg-${brandColor}-700 hover:-translate-y-1 transition-all active:scale-95 flex items-center justify-center gap-3`}
             >
                {submitting ? <Spinner animation="border" size="sm" /> : (isEdit ? <><FaEdit /> {t('users_page.update_account')}</> : <><FaUserPlus /> {t('users_page.create_account')}</>)}
             </button>
          </form>
      )}
    </div>
  );

  // -- Navigation items --
  const navItems = [
    { id: 'list', label: t('users_page.tab_list'), icon: <FaUsers /> },
    { id: 'add', label: t('users_page.tab_add'), icon: <FaUserPlus /> },
    { id: 'roles', label: t('users_page.tab_roles'), icon: <FaShieldAlt />, link: '/users/roles' }
  ];

  return (
    <div className="w-full space-y-4 sm:space-y-6 px-0 sm:px-4 lg:px-8 pt-3 sm:pt-5 lg:pt-8 pb-6 animate-fade-in relative">
      {/* Page Header */}
      <div className="flex flex-col gap-1 px-3 sm:px-0">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white tracking-tight">{t('users_page.title')}</h1>
        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
           <span>{t('menu.administration')}</span>
           <FaChevronRight className="w-2" />
           <span className={`text-${brandColor}-600`}>{t('users_page.tab_list')}</span>
        </div>
      </div>

      {/* --- MOBILE: Horizontal pill tab bar --- */}
      <div className="flex lg:hidden w-full overflow-x-auto gap-2 pb-1 no-scrollbar px-3 sm:px-0">
        {navItems.map(item => (
          <div key={item.id} className="flex-shrink-0">
            {item.link ? (
              <Link
                to={item.link}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-wider whitespace-nowrap transition-all text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 no-underline`}
              >
                <span className="text-sm">{item.icon}</span>{item.label}
              </Link>
            ) : (
              <button
                onClick={() => { setActiveTab(item.id as any); resetForm(); }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-wider whitespace-nowrap transition-all ${
                  activeTab === item.id
                    ? `bg-${brandColor}-600 text-white shadow-lg shadow-${brandColor}-500/20`
                    : 'text-slate-400 bg-slate-100 dark:bg-slate-800'
                }`}
              >
                <span className="text-sm">{item.icon}</span>{item.label}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* --- DESKTOP: Sidebar + Content layout --- */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">

        {/* Sidebar — hidden on mobile */}
        <div className="hidden lg:flex w-72 flex-shrink-0 flex-col gap-6">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.02)] dark:shadow-none overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex items-center gap-3">
               <FaListUl className={`text-${brandColor}-600`} />
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('users_page.col_actions')}</span>
            </div>
            <ul className="p-3 space-y-2">
               {navItems.map(item => (
                 <li key={item.id}>
                   {item.link ? (
                      <Link to={item.link} className={`flex items-center justify-between p-4 rounded-3xl text-[11px] font-black uppercase tracking-wider text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group no-underline`}>
                         <div className="flex items-center gap-3">
                            <span className="text-sm opacity-40 group-hover:scale-110 group-hover:text-amber-500 group-hover:opacity-100 transition-all">{item.icon}</span>
                            {item.label}
                         </div>
                         <FaAngleRight className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                      </Link>
                   ) : (
                      <button 
                        onClick={() => { setActiveTab(item.id as any); resetForm(); }}
                        className={`w-full flex items-center justify-between p-4 rounded-3xl text-[11px] font-black uppercase tracking-wider transition-all group ${activeTab === item.id ? `bg-${brandColor}-600 text-white shadow-xl shadow-${brandColor}-500/20` : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                      >
                         <div className="flex items-center gap-3">
                            <span className={`text-sm ${activeTab === item.id ? 'opacity-100' : 'opacity-40 group-hover:scale-110 group-hover:text-blue-500 group-hover:opacity-100 transition-all'}`}>{item.icon}</span>
                            {item.label}
                         </div>
                         <FaAngleRight className={`${activeTab === item.id ? 'opacity-100' : 'opacity-0'} group-hover:opacity-100 group-hover:translate-x-1 transition-all`} />
                      </button>
                   )}
                 </li>
               ))}
            </ul>
          </div>

          <div className={`p-8 rounded-[2.5rem] bg-${brandColor}-600/5 border border-${brandColor}-600/10 relative overflow-hidden`}>
            <div className={`absolute top-0 right-0 w-20 h-20 bg-${brandColor}-600/10 rounded-full -mr-10 -mt-10 blur-xl`}></div>
            <div className="flex items-center gap-3 mb-3 relative z-10">
               <FaShieldAlt className={`text-${brandColor}-600`} />
               <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">System Governance</span>
            </div>
            <p className="text-[10px] text-slate-400 font-bold leading-relaxed relative z-10 opacity-70">Control all user life-cycles, permissions, and security parameters from this centralized administrative hub.</p>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 w-full min-w-0 relative">
          <AnimatePresence mode="wait">
            {activeTab === 'list' ? (
               <motion.div key="list" initial={{ opacity: 0, scale: 0.99 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, y: 10 }} className="space-y-4">
                   <div className="bg-white dark:bg-slate-900 rounded-none sm:rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.04)] border-y sm:border border-slate-200 dark:border-slate-800 overflow-hidden">
                      {/* Search / Filter Bar */}
                      <div className="px-3 py-3 sm:p-8 border-b border-slate-200 dark:border-slate-800 flex flex-row items-center gap-2 bg-slate-50/20 dark:bg-slate-800/10">
                         <div className="relative flex-1 group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-300 group-focus-within:text-blue-500 transition-colors">
                               <FaSearch />
                            </div>
                            <input 
                              type="text" placeholder={t('users_page.search_placeholder')} 
                              className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 transition-all text-sm font-bold shadow-sm"
                              value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                            />
                         </div>
                         <span className="flex-shrink-0 px-3 py-2 sm:px-4 sm:py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl sm:rounded-2xl text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-slate-500 border border-slate-200 dark:border-slate-700 whitespace-nowrap">
                           {filteredUsers.length}
                         </span>
                      </div>

                      {/* --- DESKTOP TABLE --- */}
                      <div className="hidden sm:block overflow-x-auto">
                         <table className="w-full">
                            <thead>
                               <tr className="text-[11px] font-black uppercase tracking-[0.2em] border-b border-slate-200 dark:border-slate-800 text-slate-400">
                                  <th className="px-8 py-5 text-left">{t('users_page.col_id')}</th>
                                  <th className="px-8 py-5 text-left">{t('users_page.col_user')}</th>
                                  <th className="px-8 py-5 text-left">{t('users_page.col_role')}</th>
                                  <th className="px-8 py-5 text-center">{t('users_page.col_actions')}</th>
                               </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/50">
                               {paginatedUsers.map(user => (
                                  <tr key={user.user_id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all duration-300">
                                     <td className="px-8 py-5 text-xs font-black text-slate-300 tabular-nums">#{user.user_id}</td>
                                     <td className="px-8 py-5">
                                        <div className="flex items-center gap-4">
                                           <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white group-hover:rotate-6 transition-all duration-500 shadow-sm flex-shrink-0">
                                               <FaUser />
                                           </div>
                                           <div>
                                              <p className="font-black text-slate-800 dark:text-white text-[14px] tracking-tight m-0 leading-none mb-1">{user.name || `${user.fname} ${user.lname}`}</p>
                                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest opacity-60 m-0">@{user.user_name}</p>
                                           </div>
                                        </div>
                                     </td>
                                     <td className="px-8 py-5">
                                        <span className="inline-flex items-center px-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-[10px] font-black uppercase tracking-tight text-slate-500 border border-slate-100 dark:border-slate-700">
                                           {user.role_name}
                                        </span>
                                     </td>
                                     <td className="px-8 py-5">
                                        <div className="flex items-center justify-center gap-3">
                                           <button 
                                             onClick={() => handleStatusChange(user.user_id, user.status)}
                                             className={`w-11 h-6 rounded-full relative transition-all duration-500 flex-shrink-0 ${user.status == 1 ? 'bg-emerald-500 shadow-xl shadow-emerald-500/20' : 'bg-slate-200 dark:bg-slate-800'}`}
                                           >
                                              <div className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-500 ${user.status == 1 ? 'left-6' : 'left-1'}`} />
                                           </button>
                                           <div className="flex gap-2">
                                              <button onClick={() => handleOpenPerms(user)} title="Permissions" className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-blue-600 hover:text-white transform hover:scale-110 transition-all"><FaKey size={12} /></button>
                                              <button onClick={() => handleOpenEdit(user)} title="Edit" className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-emerald-600 hover:text-white transform hover:scale-110 transition-all"><FaEdit size={12} /></button>
                                              <button onClick={() => handleDelete(user.user_id)} title="Delete" className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-rose-600 hover:text-white transform hover:scale-110 transition-all"><FaTrash size={12} /></button>
                                           </div>
                                        </div>
                                     </td>
                                  </tr>
                               ))}
                            </tbody>
                         </table>
                      </div>

                      {/* --- MOBILE CARD LIST --- */}
                      <div className="sm:hidden divide-y divide-slate-100 dark:divide-slate-800">
                        {paginatedUsers.map(user => (
                          <div key={user.user_id} className="p-4 flex items-center gap-4">
                            {/* Avatar */}
                            <div className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 flex-shrink-0 shadow-sm">
                              <FaUser size={14} />
                            </div>
                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <p className="font-black text-slate-800 dark:text-white text-sm tracking-tight truncate m-0">
                                {user.name || `${user.fname} ${user.lname}`}
                              </p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest truncate m-0">@{user.user_name}</p>
                              <span className="inline-block mt-1 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-[9px] font-black uppercase text-slate-500">
                                {user.role_name}
                              </span>
                            </div>
                            {/* Actions */}
                            <div className="flex flex-col items-end gap-2 flex-shrink-0">
                              <button 
                                onClick={() => handleStatusChange(user.user_id, user.status)}
                                className={`w-10 h-5 rounded-full relative transition-all duration-500 ${user.status == 1 ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`}
                              >
                                <div className={`absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-sm transition-all duration-500 ${user.status == 1 ? 'left-5' : 'left-0.5'}`} />
                              </button>
                              <div className="flex gap-1.5">
                                <button onClick={() => handleOpenPerms(user)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-blue-600 hover:text-white transition-all"><FaKey size={11} /></button>
                                <button onClick={() => handleOpenEdit(user)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-emerald-600 hover:text-white transition-all"><FaEdit size={11} /></button>
                                <button onClick={() => handleDelete(user.user_id)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-rose-600 hover:text-white transition-all"><FaTrash size={11} /></button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {filteredUsers.length > itemsPerPage && (
                         <div className="p-4 sm:p-8 bg-slate-50/10 dark:bg-slate-800/5">
                            <Pagination currentPage={currentPage} totalItems={filteredUsers.length} itemsPerPage={itemsPerPage} onPageChange={setCurrentPage} />
                         </div>
                      )}
                   </div>
               </motion.div>
            ) : (
               <motion.div key="add" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="bg-white dark:bg-slate-900 rounded-none sm:rounded-[3rem] shadow-sm border-y sm:border border-slate-100 dark:border-slate-800 p-4 sm:p-10 md:p-16 relative overflow-hidden">
                   <div className={`absolute top-0 left-0 w-1.5 h-full bg-${brandColor}-600/50`}></div>
                   <div className="mb-5 sm:mb-12">
                       <h2 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tighter mb-1">{t('users_page.tab_add')}</h2>
                       <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.3em]">{t('users_page.new_user_subtitle')}</p>
                   </div>
                   <UserForm />
               </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* EDIT MODAL */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg" centered dialogClassName="rounded-[2rem] sm:rounded-[3rem] overflow-hidden mx-2">
        <div className="bg-white dark:bg-slate-900 border-none rounded-[2rem] sm:rounded-[3rem] overflow-hidden shadow-2xl">
           <div className="p-5 sm:p-8 border-b border-slate-50 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/30 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                 <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-[1.5rem] bg-emerald-600 text-white flex items-center justify-center shadow-xl shadow-emerald-500/20 transform -rotate-3 flex-shrink-0`}>
                    <FaEdit size={20} />
                 </div>
                 <div>
                    <h2 className="text-lg sm:text-2xl font-black text-slate-800 dark:text-white tracking-tight m-0">{t('users_page.edit_user_title')}</h2>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 leading-none mt-1">UID: {editingUserId}</p>
                 </div>
              </div>
              <button 
                onClick={() => setShowEditModal(false)}
                className="w-10 h-10 rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-all flex items-center justify-center text-slate-400 hover:rotate-90 flex-shrink-0"
              >
                 <FaTimes size={18} />
              </button>
           </div>
           <div className="p-5 sm:p-10 overflow-y-auto max-h-[75vh]">
              <UserForm isEdit={true} />
           </div>
        </div>
      </Modal>

      {/* PERMISSIONS MODAL */}
      <Modal show={showPermsModal} onHide={() => setShowPermsModal(false)} size="lg" centered dialogClassName="rounded-[2rem] sm:rounded-[3.5rem] overflow-hidden mx-2">
        <div className="bg-white dark:bg-slate-900 border-none rounded-[2rem] sm:rounded-[3.5rem] overflow-hidden shadow-2xl">
           <div className="p-5 sm:p-8 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/40">
              <div className="flex items-center gap-4">
                 <div className={`w-12 h-12 rounded-2xl bg-${brandColor}-600 text-white flex items-center justify-center shadow-xl shadow-${brandColor}-500/30 flex-shrink-0`}>
                    <FaShieldAlt size={22} />
                 </div>
                 <div>
                    <h2 className="text-lg sm:text-2xl font-black text-slate-800 dark:text-white tracking-tight m-0">{t('users_page.perms')}</h2>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">
                      Access control for <span className={`text-${brandColor}-600`}>{selectedUserForPerms?.user_name}</span>
                    </p>
                 </div>
              </div>
              <button onClick={() => setShowPermsModal(false)} className="w-10 h-10 rounded-full hover:bg-white/20 dark:hover:bg-slate-800 transition-all flex items-center justify-center text-slate-400 flex-shrink-0">
                 <FaTimes size={18} />
              </button>
           </div>

           <div className="p-4 sm:p-8 max-h-[55vh] overflow-y-auto space-y-2">
              {allMenus.map(menu => {
                 const override = userOverrides.find(o => o.menu_id === menu.id);
                 if (menu.is_section) return (
                    <div key={menu.id} className="pt-8 pb-3 border-b border-slate-100 dark:border-slate-800 mb-3 px-1">
                       <span className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-300">{menu.title}</span>
                    </div>
                 );

                 return (
                    <div key={menu.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-slate-50/30 dark:bg-slate-800/30 rounded-2xl border border-transparent hover:border-slate-100 dark:hover:border-slate-700 transition-all group">
                       <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-400/50 text-sm group-hover:text-blue-500 transition-colors shadow-sm flex-shrink-0" dangerouslySetInnerHTML={{ __html: menu.icon || '' }} />
                          <span className="text-sm font-bold text-slate-700 dark:text-slate-200 tracking-tight truncate">{menu.title}</span>
                       </div>
                       <div className="flex gap-1.5 p-1 bg-white dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800 shadow-inner self-start sm:self-auto">
                          {[
                            { id: 'allow', label: 'Allow', color: 'emerald' },
                            { id: 'deny', label: 'Deny', color: 'rose' },
                            { id: 'none', label: 'Default', color: brandColor }
                          ].map(btn => (
                             <button
                               key={btn.id}
                               onClick={() => handleSetOverride(menu.id, btn.id as any)}
                               className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-300 ${
                                  (btn.id === 'none' ? !override : override?.permission_type === btn.id) 
                                  ? `bg-${btn.color}-600 text-white shadow-lg shadow-${btn.color}-500/40 scale-[1.05]` 
                                  : 'text-slate-400 hover:text-slate-600'
                               }`}
                             >{btn.label}</button>
                          ))}
                       </div>
                    </div>
                 );
              })}
           </div>

           <div className="p-4 sm:p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/10 flex gap-3">
              <button 
                onClick={() => setShowPermsModal(false)}
                className="flex-1 py-4 rounded-3xl font-black text-[11px] uppercase tracking-widest text-slate-400 hover:bg-white dark:hover:bg-slate-800 transition-all border border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900"
              >
                  {t('common.cancel')}
              </button>
              <button 
                onClick={handleSavePermissions}
                className={`flex-[2] py-4 rounded-3xl font-black text-[11px] uppercase tracking-widest text-white shadow-2xl transition-all bg-${brandColor}-600 shadow-${brandColor}-500/40 hover:brightness-110 active:scale-95`}
              >
                  {t('common.save')}
              </button>
           </div>
        </div>
      </Modal>
    </div>
  );
};

export default AllUsersPage;
