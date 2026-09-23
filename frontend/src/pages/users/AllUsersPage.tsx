import React, { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import {
  getUsers,
  addUser,
  updateUser,
  deleteUser,
  changeUserStatus,
  assignUserRole,
  unlockUserAccount,
  getRoles,
  getDepartments,
  User,
  Role,
  Department,
  getAllMenus,
  getUserPermissions,
  updateUserPermissions,
  Menu
} from '../../services/apiService';
import { useAuth } from '../../components/Auth/AuthContext';
import { getRoleColor, getRoleLabel } from '../../utils/roles';
import Pagination from '../../components/Pagination';
import { Modal, Spinner } from 'react-bootstrap';
import {
  FaUserPlus,
  FaKey,
  FaEdit,
  FaTrash,
  FaSearch,
  FaUser,
  FaUsers,
  FaShieldAlt,
  FaBuilding,
  FaUserTag,
  FaEnvelope,
  FaPhone,
  FaEye,
  FaEyeSlash,
  FaTimes,
  FaUnlock,
  FaLock,
  FaCheckCircle,
  FaExclamationTriangle,
  FaSyncAlt,
  FaChevronRight,
  FaExchangeAlt
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const AllUsersPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  // Core Data
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [brandColor, setBrandColor] = useState('blue');

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'locked'>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Create & Edit Modal State
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    fname: '',
    lname: '',
    user_name: '',
    password: '',
    email: '',
    phone: '',
    department_id: '',
    role_id: '',
    status: '1'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Quick Role Assignment Modal State
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedUserForRole, setSelectedUserForRole] = useState<User | null>(null);
  const [targetRoleId, setTargetRoleId] = useState<string>('');
  const [roleAssigning, setRoleAssigning] = useState(false);

  // Permissions Override Modal State
  const [showPermsModal, setShowPermsModal] = useState(false);
  const [selectedUserForPerms, setSelectedUserForPerms] = useState<User | null>(null);
  const [allMenus, setAllMenus] = useState<Menu[]>([]);
  const [userOverrides, setUserOverrides] = useState<{ menu_id: number; permission_type: string }[]>([]);
  const [permsLoading, setPermsLoading] = useState(false);

  // Delete Confirmation Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchTheme = () => setBrandColor(localStorage.getItem('lms_color') || 'blue');
    fetchTheme();
    window.addEventListener('storage', fetchTheme);
    return () => window.removeEventListener('storage', fetchTheme);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [u, r, d] = await Promise.all([getUsers(), getRoles(), getDepartments()]);
      setUsers(u || []);
      setRoles(r || []);
      setDepartments(d || []);
    } catch (err: any) {
      console.error('Data fetch failed:', err);
      showToast(err.message || 'Failed to load users data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Quick Status Toggle
  const handleStatusChange = async (targetUser: User) => {
    const nextStatus = Number(targetUser.status) === 1 ? 0 : 1;
    try {
      await changeUserStatus(targetUser.user_id, nextStatus);
      setUsers(prev => prev.map(u => (u.user_id === targetUser.user_id ? { ...u, status: nextStatus } : u)));
      showToast(`User @${targetUser.user_name} is now ${nextStatus === 1 ? 'Active' : 'Inactive'}.`);
    } catch (err: any) {
      showToast(err.message || 'Failed to update user status', 'error');
    }
  };

  // Quick Unlock Account
  const handleUnlockAccount = async (targetUser: User) => {
    try {
      await unlockUserAccount(targetUser.user_id);
      setUsers(prev =>
        prev.map(u =>
          u.user_id === targetUser.user_id
            ? { ...u, failed_login_attempts: 0, account_locked_until: null }
            : u
        )
      );
      showToast(`Account @${targetUser.user_name} unlocked successfully.`);
    } catch (err: any) {
      showToast(err.message || 'Failed to unlock account', 'error');
    }
  };

  // Open Quick Role Assignment Modal
  const handleOpenRoleAssign = (targetUser: User) => {
    setSelectedUserForRole(targetUser);
    setTargetRoleId(String(targetUser.role_id || ''));
    setShowRoleModal(true);
  };

  // Submit Quick Role Assignment
  const handleSaveRoleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForRole || !targetRoleId) return;

    setRoleAssigning(true);
    try {
      const res = await assignUserRole(selectedUserForRole.user_id, targetRoleId);
      setUsers(prev =>
        prev.map(u =>
          u.user_id === selectedUserForRole.user_id
            ? { ...u, role_id: Number(targetRoleId), role_name: res.role_name }
            : u
        )
      );
      showToast(res.message || `Role updated for @${selectedUserForRole.user_name}`);
      setShowRoleModal(false);
    } catch (err: any) {
      showToast(err.message || 'Failed to assign role', 'error');
    } finally {
      setRoleAssigning(false);
    }
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingUser(null);
    setFormData({
      fname: '',
      lname: '',
      user_name: '',
      password: '',
      email: '',
      phone: '',
      department_id: '',
      role_id: roles.length > 0 ? String(roles[0].role_id) : '',
      status: '1'
    });
    setShowPassword(false);
    setShowUserModal(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (targetUser: User) => {
    setEditingUser(targetUser);
    setFormData({
      fname: targetUser.fname || '',
      lname: targetUser.lname || '',
      user_name: targetUser.user_name || '',
      password: '',
      email: targetUser.email || '',
      phone: targetUser.phone || '',
      department_id: targetUser.department_id ? String(targetUser.department_id) : '',
      role_id: targetUser.role_id ? String(targetUser.role_id) : '',
      status: String(targetUser.status ?? '1')
    });
    setShowPassword(false);
    setShowUserModal(true);
  };

  // Strong Password Generator
  const handleGeneratePassword = () => {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@$!%*?&';
    const requiredChars = [
      'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)],
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)],
      '0123456789'[Math.floor(Math.random() * 10)],
      '@$!%*?&'[Math.floor(Math.random() * 7)]
    ];

    let generated = '';
    for (let i = 0; i < 8; i++) {
      generated += charset.charAt(Math.floor(Math.random() * charset.length));
    }

    const pwdArray = (generated + requiredChars.join('')).split('');
    for (let i = pwdArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pwdArray[i], pwdArray[j]] = [pwdArray[j], pwdArray[i]];
    }

    setFormData(prev => ({ ...prev, password: pwdArray.join('').slice(0, 12) }));
    setShowPassword(true);
  };

  // Submit Create or Edit User
  const handleSubmitUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.user_name.trim()) {
      showToast('Username is required', 'error');
      return;
    }

    setSubmitting(true);
    try {
      if (editingUser) {
        await updateUser(editingUser.user_id, formData);
        showToast(`User @${formData.user_name.trim()} updated successfully.`);
      } else {
        await addUser(formData);
        showToast(`User @${formData.user_name.trim()} created successfully.`);
      }
      setShowUserModal(false);
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Error saving user', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete User with Self-Deletion Guard
  const handleConfirmDelete = (targetUser: User) => {
    const currentId = currentUser ? Number(currentUser.user_id) : null;
    if (currentId && currentId === Number(targetUser.user_id)) {
      showToast('Security check: You cannot delete your own active administrator account.', 'error');
      return;
    }
    setUserToDelete(targetUser);
    setShowDeleteModal(true);
  };

  const handleExecuteDelete = async () => {
    if (!userToDelete) return;
    setDeleting(true);
    try {
      await deleteUser(userToDelete.user_id);
      setUsers(prev => prev.filter(u => u.user_id !== userToDelete.user_id));
      showToast(`User @${userToDelete.user_name} deleted successfully.`);
      setShowDeleteModal(false);
    } catch (err: any) {
      showToast(err.message || 'Failed to delete user', 'error');
    } finally {
      setDeleting(false);
    }
  };

  // Permissions Modal
  const handleOpenPerms = async (u: User) => {
    setSelectedUserForPerms(u);
    setShowPermsModal(true);
    setPermsLoading(true);
    try {
      const [m, o] = await Promise.all([getAllMenus(), getUserPermissions(u.user_id)]);
      setAllMenus(m || []);
      setUserOverrides(o || []);
    } catch (err: any) {
      showToast(err.message || 'Error loading permissions', 'error');
    } finally {
      setPermsLoading(false);
    }
  };

  const handleSetOverride = (menuId: number, type: 'allow' | 'deny' | 'none') => {
    if (type === 'none') {
      setUserOverrides(userOverrides.filter(o => o.menu_id !== menuId));
    } else {
      const existing = userOverrides.find(o => o.menu_id === menuId);
      if (existing) {
        setUserOverrides(userOverrides.map(o => (o.menu_id === menuId ? { ...o, permission_type: type } : o)));
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
      showToast(`Permissions updated for @${selectedUserForPerms.user_name}`);
    } catch (e: any) {
      showToast(e.message || 'Error saving permissions', 'error');
    }
  };

  // Filtered Users Memo
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const searchBlob = `${user.user_name || ''} ${user.name || ''} ${user.fname || ''} ${user.lname || ''} ${
        user.email || ''
      } ${user.phone || ''}`.toLowerCase();
      const matchesSearch = searchBlob.includes(searchTerm.toLowerCase());

      const matchesRole = roleFilter === 'all' || String(user.role_id) === String(roleFilter);

      const isLocked = Boolean(user.account_locked_until && new Date(user.account_locked_until) > new Date());
      const matchesStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'locked'
          ? isLocked
          : statusFilter === 'active'
          ? Number(user.status) === 1
          : Number(user.status) === 0;

      const matchesDept =
        departmentFilter === 'all' || String(user.department_id) === String(departmentFilter);

      return matchesSearch && matchesRole && matchesStatus && matchesDept;
    });
  }, [users, searchTerm, roleFilter, statusFilter, departmentFilter]);

  // Pagination
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // KPI Metrics
  const totalUsers = users.length;
  const activeUsers = users.filter(u => Number(u.status) === 1).length;
  const inactiveUsers = users.filter(u => Number(u.status) === 0).length;
  const lockedUsers = users.filter(
    u => u.account_locked_until && new Date(u.account_locked_until) > new Date()
  ).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full space-y-4 sm:space-y-6 px-0 sm:px-4 lg:px-8 pt-3 sm:pt-5 lg:pt-8 pb-10 bg-slate-50 dark:bg-slate-950 min-h-screen relative"
    >
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-2xl shadow-xl border text-sm font-bold flex items-center gap-3 backdrop-blur-md ${
              toastMessage.type === 'error'
                ? 'bg-rose-50/95 dark:bg-rose-950/90 text-rose-700 dark:text-rose-200 border-rose-200 dark:border-rose-800'
                : 'bg-emerald-50/95 dark:bg-emerald-950/90 text-emerald-700 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800'
            }`}
          >
            <i
              className={`fas ${
                toastMessage.type === 'error' ? 'fa-exclamation-circle text-rose-500' : 'fa-check-circle text-emerald-500'
              }`}
            ></i>
            <span>{toastMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-3 sm:px-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shadow-sm"
          >
            <i className="fas fa-arrow-left text-xs"></i>
            <span>{t('common.back', 'Back')}</span>
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white tracking-tight">
                User Management Command Center
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-300/40">
                Directory & RBAC
              </span>
            </div>
            <p className="text-[11px] sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
              Create, edit, delete users, assign dynamic roles, and manage access privileges across the system.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/users/roles"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-slate-800 hover:bg-slate-900 text-slate-100 shadow-sm border border-slate-700 transition-all no-underline"
          >
            <FaShieldAlt className="text-indigo-400 text-xs" />
            <span>Dynamic Roles</span>
          </Link>
          <button
            onClick={handleOpenCreateModal}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-${brandColor}-600 hover:bg-${brandColor}-700 text-white shadow-md shadow-${brandColor}-600/30 transition-all`}
          >
            <FaUserPlus className="text-xs" />
            <span>Add New User</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 px-3 sm:px-0">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-lg">
            <FaUsers />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white tabular-nums">{totalUsers}</div>
            <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">Total Users</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-lg">
            <FaCheckCircle />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white tabular-nums">{activeUsers}</div>
            <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">Active Accounts</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center text-lg">
            <FaLock />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white tabular-nums">{inactiveUsers}</div>
            <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">Inactive Accounts</div>
          </div>
        </div>

        <div className={`bg-white dark:bg-slate-900 rounded-2xl p-4 border shadow-sm flex items-center gap-3.5 ${
          lockedUsers > 0 ? 'border-amber-300 dark:border-amber-800 bg-amber-50/20' : 'border-slate-200/80 dark:border-slate-800'
        }`}>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg ${
            lockedUsers > 0 ? 'bg-amber-100 text-amber-600 dark:bg-amber-950/40' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
          }`}>
            <FaExclamationTriangle />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white tabular-nums">{lockedUsers}</div>
            <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">Locked Out</div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white dark:bg-slate-900 rounded-none sm:rounded-[2.5rem] shadow-sm border-y sm:border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Filter and Search Bar */}
        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-slate-50/30 dark:bg-slate-800/10">
          <div className="relative flex-1 max-w-md">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by username, full name, email, phone..."
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-100"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Dynamic Role Filter */}
            <select
              value={roleFilter}
              onChange={e => {
                setRoleFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all">All Roles ({roles.length})</option>
              {roles.map(r => (
                <option key={r.role_id} value={r.role_id}>
                  {r.role_name}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={e => {
                setStatusFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
              <option value="locked">Locked Only</option>
            </select>

            {/* Department Filter */}
            {departments.length > 0 && (
              <select
                value={departmentFilter}
                onChange={e => {
                  setDepartmentFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="all">All Departments</option>
                {departments.map(d => (
                  <option key={d.department_id} value={d.department_id}>
                    {d.name}
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={fetchData}
              title="Refresh Users"
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
            >
              <FaSyncAlt className="text-xs" />
            </button>
          </div>
        </div>

        {/* Content Table */}
        <div className="w-full">
          {loading ? (
            <div className="p-16 text-center text-slate-400 flex flex-col items-center gap-3">
              <Spinner animation="border" size="sm" />
              <span className="text-sm font-medium">Loading user accounts and roles...</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-16 text-center text-slate-400 italic text-sm">
              No users match the selected search or filter criteria.
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/40 text-slate-400 text-[10px] font-black uppercase tracking-[0.18em] border-b border-slate-200 dark:border-slate-800">
                      <th className="px-6 py-4 text-left">User ID</th>
                      <th className="px-6 py-4 text-left">User & Identity</th>
                      <th className="px-6 py-4 text-left">Assigned Role</th>
                      <th className="px-6 py-4 text-left">Department</th>
                      <th className="px-6 py-4 text-center">Status & Security</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {paginatedUsers.map(u => {
                      const roleColor = getRoleColor(u.role_id);
                      const isLocked = Boolean(u.account_locked_until && new Date(u.account_locked_until) > new Date());
                      const isSelf = currentUser && Number(currentUser.user_id) === Number(u.user_id);

                      return (
                        <tr
                          key={u.user_id}
                          className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all duration-200 group"
                        >
                          <td className="px-6 py-4 text-xs font-mono font-black text-slate-400 tabular-nums">
                            #{u.user_id.toString().padStart(3, '0')}
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold text-sm flex-shrink-0 shadow-sm">
                                {u.user_name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                                    {u.name || `${u.fname || ''} ${u.lname || ''}`.trim() || u.user_name}
                                  </span>
                                  {isSelf && (
                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                                      You
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                                  <span className="font-mono text-slate-500">@{u.user_name}</span>
                                  {u.email && <span>• {u.email}</span>}
                                  {u.phone && <span>• {u.phone}</span>}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-${roleColor}-50 text-${roleColor}-700 dark:bg-${roleColor}-950/40 dark:text-${roleColor}-300 border border-${roleColor}-200/60 dark:border-${roleColor}-800/30`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full bg-${roleColor}-500`}></span>
                                {u.role_name || getRoleLabel(u.role_id)}
                              </span>
                              <button
                                onClick={() => handleOpenRoleAssign(u)}
                                title="Change or reassign role"
                                className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 flex items-center justify-center transition-all text-xs"
                              >
                                <FaExchangeAlt />
                              </button>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                              {u.department_name || (u.department_id ? `Dept #${u.department_id}` : 'General')}
                            </span>
                          </td>

                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-2.5">
                              {/* Active switch */}
                              <button
                                onClick={() => handleStatusChange(u)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all focus:outline-none flex-shrink-0 ${
                                  Number(u.status) === 1
                                    ? 'bg-emerald-500 shadow-sm shadow-emerald-500/20'
                                    : 'bg-slate-200 dark:bg-slate-700'
                                }`}
                                title={Number(u.status) === 1 ? 'Click to deactivate' : 'Click to activate'}
                              >
                                <span
                                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-all shadow-sm ${
                                    Number(u.status) === 1 ? 'translate-x-[22px]' : 'translate-x-1'
                                  }`}
                                />
                              </button>

                              {/* Lock state badge / action */}
                              {isLocked ? (
                                <button
                                  onClick={() => handleUnlockAccount(u)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200 border border-amber-300 hover:bg-amber-200 transition-all"
                                  title="Account is locked out. Click to unlock now."
                                >
                                  <FaUnlock className="text-[10px]" /> Unlock
                                </button>
                              ) : (
                                <span
                                  className={`w-2.5 h-2.5 rounded-full ${
                                    u.online_flag ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300 dark:bg-slate-700'
                                  }`}
                                  title={u.online_flag ? 'User is Online' : 'User is Offline'}
                                />
                              )}
                            </div>
                          </td>

                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end items-center gap-1.5 text-[10px] font-black uppercase tracking-wider">
                              {/* Assign Role quick action */}
                              <button
                                onClick={() => handleOpenRoleAssign(u)}
                                className="px-2.5 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-100 transition-all border border-indigo-200/50 dark:border-indigo-800/30 flex items-center gap-1.5"
                                title="Assign Role"
                              >
                                <FaUserTag className="text-[10px]" />
                                <span>Role</span>
                              </button>

                              {/* Edit User */}
                              <button
                                onClick={() => handleOpenEditModal(u)}
                                className="px-2.5 py-1.5 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-xl hover:bg-amber-100 transition-all border border-amber-200/50 dark:border-amber-800/30 flex items-center gap-1.5"
                                title="Edit Profile & Credentials"
                              >
                                <FaEdit className="text-[10px]" />
                                <span>Edit</span>
                              </button>

                              {/* Permissions Overrides */}
                              <button
                                onClick={() => handleOpenPerms(u)}
                                className="px-2.5 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-100 transition-all border border-blue-200/50 dark:border-blue-800/30 flex items-center gap-1.5"
                                title="User Specific Permissions"
                              >
                                <FaKey className="text-[10px]" />
                                <span>Perms</span>
                              </button>

                              {/* Delete User */}
                              {!isSelf && (
                                <button
                                  onClick={() => handleConfirmDelete(u)}
                                  className="px-2.5 py-1.5 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-xl hover:bg-rose-100 transition-all border border-rose-200/50 dark:border-rose-800/30 flex items-center gap-1.5"
                                  title="Delete Account"
                                >
                                  <FaTrash className="text-[10px]" />
                                  <span>Delete</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
                {paginatedUsers.map(u => {
                  const roleColor = getRoleColor(u.role_id);
                  const isLocked = Boolean(u.account_locked_until && new Date(u.account_locked_until) > new Date());
                  const isSelf = currentUser && Number(currentUser.user_id) === Number(u.user_id);

                  return (
                    <div key={u.user_id} className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300">
                            {u.user_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                              <span>{u.name || `${u.fname || ''} ${u.lname || ''}`.trim() || u.user_name}</span>
                              {isSelf && (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-blue-100 text-blue-700">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-400 font-mono">@{u.user_name}</div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleStatusChange(u)}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-all focus:outline-none flex-shrink-0 ${
                            Number(u.status) === 1 ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'
                          }`}
                        >
                          <span
                            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-all shadow-sm ${
                              Number(u.status) === 1 ? 'translate-x-[18px]' : 'translate-x-[2px]'
                            }`}
                          />
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800/60">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-${roleColor}-50 text-${roleColor}-700 dark:bg-${roleColor}-950/40 dark:text-${roleColor}-300`}
                        >
                          {u.role_name || getRoleLabel(u.role_id)}
                        </span>
                        <button
                          onClick={() => handleOpenRoleAssign(u)}
                          className="text-xs font-bold text-blue-600 dark:text-blue-400 underline underline-offset-2 flex items-center gap-1"
                        >
                          <FaExchangeAlt className="text-[10px]" /> Change Role
                        </button>
                      </div>

                      {isLocked && (
                        <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-between">
                          <span className="text-xs font-bold text-amber-800 dark:text-amber-200 flex items-center gap-1.5">
                            <FaLock /> Account Locked
                          </span>
                          <button
                            onClick={() => handleUnlockAccount(u)}
                            className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase bg-amber-600 text-white"
                          >
                            Unlock Now
                          </button>
                        </div>
                      )}

                      <div className="grid grid-cols-3 gap-1.5 pt-1 text-[10px] font-black uppercase tracking-wider">
                        <button
                          onClick={() => handleOpenEditModal(u)}
                          className="py-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 flex items-center justify-center gap-1"
                        >
                          <FaEdit /> Edit
                        </button>
                        <button
                          onClick={() => handleOpenPerms(u)}
                          className="py-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center gap-1"
                        >
                          <FaKey /> Perms
                        </button>
                        {!isSelf ? (
                          <button
                            onClick={() => handleConfirmDelete(u)}
                            className="py-2 rounded-xl bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 flex items-center justify-center gap-1"
                          >
                            <FaTrash /> Delete
                          </button>
                        ) : (
                          <div className="py-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-300 flex items-center justify-center gap-1 cursor-not-allowed">
                            <FaShieldAlt /> Self
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Pagination Footer */}
        {filteredUsers.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/10 dark:bg-slate-800/5">
            <Pagination
              currentPage={currentPage}
              totalItems={filteredUsers.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      {/* QUICK ROLE ASSIGNMENT MODAL */}
      <Modal
        show={showRoleModal}
        onHide={() => !roleAssigning && setShowRoleModal(false)}
        centered
        dialogClassName="max-w-md"
        contentClassName="bg-white dark:bg-slate-900 border-none rounded-3xl overflow-hidden shadow-2xl"
      >
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-950/40 flex items-center justify-center text-lg">
              <FaExchangeAlt />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-800 dark:text-white">Assign Dynamic Role</h3>
              <p className="text-xs text-slate-400">Update role privileges for @{selectedUserForRole?.user_name}</p>
            </div>
          </div>
          <button
            onClick={() => setShowRoleModal(false)}
            className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center hover:bg-slate-200"
          >
            <FaTimes className="text-xs" />
          </button>
        </div>

        <form onSubmit={handleSaveRoleAssign}>
          <div className="p-6 space-y-4">
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Target User</div>
              <div className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                {selectedUserForRole?.name || selectedUserForRole?.user_name}
              </div>
              <div className="text-xs text-slate-500 font-mono">@{selectedUserForRole?.user_name}</div>
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Select New Role Designation <span className="text-rose-500">*</span>
              </label>
              <select
                value={targetRoleId}
                onChange={e => setTargetRoleId(e.target.value)}
                required
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="">-- Choose Role --</option>
                {roles.map(r => (
                  <option key={r.role_id} value={r.role_id}>
                    {r.role_name} {r.is_system ? '(System)' : '(Dynamic)'}
                  </option>
                ))}
              </select>
            </div>

            {targetRoleId && (
              <div className="p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 text-xs text-slate-600 dark:text-slate-300">
                <span className="font-bold text-indigo-600 dark:text-indigo-400">Role Scope:</span>{' '}
                {roles.find(r => String(r.role_id) === String(targetRoleId))?.description ||
                  'Custom access rights defined by dynamic permissions matrix.'}
              </div>
            )}
          </div>

          <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 bg-slate-50/30 dark:bg-slate-800/10">
            <button
              type="button"
              onClick={() => setShowRoleModal(false)}
              className="px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-slate-500 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={roleAssigning}
              className="px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-indigo-600 hover:bg-indigo-700 shadow-md transition-all flex items-center gap-2"
            >
              {roleAssigning && <Spinner animation="border" size="sm" />}
              <span>Apply Role Assignment</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* CREATE / EDIT USER MODAL */}
      <Modal
        show={showUserModal}
        onHide={() => !submitting && setShowUserModal(false)}
        centered
        dialogClassName="max-w-2xl"
        contentClassName="bg-white dark:bg-slate-900 border-none rounded-3xl overflow-hidden shadow-2xl"
      >
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                editingUser ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
              }`}
            >
              {editingUser ? <FaEdit /> : <FaUserPlus />}
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-800 dark:text-white">
                {editingUser ? `Edit Account: @${editingUser.user_name}` : 'Create New User Account'}
              </h3>
              <p className="text-xs text-slate-400">
                {editingUser
                  ? 'Update profile details, password, and assigned role'
                  : 'Register a new user account with employee profile and role credentials'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowUserModal(false)}
            className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center hover:bg-slate-200"
          >
            <FaTimes className="text-xs" />
          </button>
        </div>

        <form onSubmit={handleSubmitUser}>
          <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
            {/* Name Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">
                  First Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.fname}
                  onChange={e => setFormData({ ...formData, fname: e.target.value })}
                  placeholder="e.g. Dawit"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">
                  Last Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.lname}
                  onChange={e => setFormData({ ...formData, lname: e.target.value })}
                  placeholder="e.g. Bekele"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            {/* Username & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">
                  Username <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.user_name}
                  onChange={e => setFormData({ ...formData, user_name: e.target.value })}
                  placeholder="e.g. dawit.bekele"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold font-mono text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="dawit@ams.com"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            {/* Phone & Department */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="0911000000 or +251 9..."
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">
                  Department
                </label>
                <select
                  value={formData.department_id}
                  onChange={e => setFormData({ ...formData, department_id: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="">No Department / General</option>
                  {departments.map(d => (
                    <option key={d.department_id} value={d.department_id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Role & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">
                  Assigned Role <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={formData.role_id}
                  onChange={e => setFormData({ ...formData, role_id: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="">-- Choose Role --</option>
                  {roles.map(r => (
                    <option key={r.role_id} value={r.role_id}>
                      {r.role_name} {r.is_system ? '(System)' : '(Dynamic)'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">
                  Account Status
                </label>
                <select
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="1">Active Account</option>
                  <option value="0">Inactive / Suspended</option>
                </select>
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500">
                  {editingUser ? 'Password (Leave blank to keep current)' : 'Password'} {!editingUser && <span className="text-rose-500">*</span>}
                </label>
                <button
                  type="button"
                  onClick={handleGeneratePassword}
                  className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-lg"
                >
                  Generate Strong
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required={!editingUser}
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  placeholder={editingUser ? '••••••••' : 'Min 8 chars, 1 uppercase, 1 number, 1 symbol'}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 bg-slate-50/30 dark:bg-slate-800/10">
            <button
              type="button"
              onClick={() => setShowUserModal(false)}
              className="px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-slate-500 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-white shadow-md transition-all flex items-center gap-2 ${
                editingUser ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {submitting && <Spinner animation="border" size="sm" />}
              <span>{editingUser ? 'Save Changes' : 'Create User'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        show={showDeleteModal}
        onHide={() => !deleting && setShowDeleteModal(false)}
        centered
        dialogClassName="max-w-md"
        contentClassName="bg-white dark:bg-slate-900 border-none rounded-3xl overflow-hidden shadow-2xl"
      >
        <div className="p-6 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950/40 flex items-center justify-center mx-auto text-2xl">
            <FaTrash />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-800 dark:text-white">Delete User Account</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Are you sure you want to permanently delete user <span className="font-bold text-rose-600">@{userToDelete?.user_name}</span>? This action removes authentication credentials and cannot be undone.
            </p>
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 bg-slate-50/30 dark:bg-slate-800/10">
          <button
            type="button"
            onClick={() => setShowDeleteModal(false)}
            className="px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-slate-500"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={deleting}
            onClick={handleExecuteDelete}
            className="px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-rose-600 hover:bg-rose-700 shadow-md transition-all flex items-center gap-2"
          >
            {deleting && <Spinner animation="border" size="sm" />}
            <span>Confirm Delete</span>
          </button>
        </div>
      </Modal>

      {/* USER PERMISSIONS OVERRIDE MODAL */}
      <Modal
        show={showPermsModal}
        onHide={() => setShowPermsModal(false)}
        centered
        dialogClassName="max-w-3xl"
        contentClassName="bg-white dark:bg-slate-900 border-none rounded-3xl overflow-hidden shadow-2xl"
      >
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950/40 flex items-center justify-center text-lg">
              <FaShieldAlt />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-800 dark:text-white">User Permission Overrides</h3>
              <p className="text-xs text-slate-400">
                Grant or revoke specific modules for @{selectedUserForPerms?.user_name}
              </p>
            </div>
          </div>
          <button onClick={() => setShowPermsModal(false)} className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center">
            <FaTimes className="text-xs" />
          </button>
        </div>

        <div className="p-6 max-h-[55vh] overflow-y-auto space-y-2">
          {permsLoading ? (
            <div className="p-10 text-center flex flex-col items-center gap-2 text-slate-400">
              <Spinner animation="border" size="sm" />
              <span>Loading module permissions...</span>
            </div>
          ) : (
            allMenus.map(menu => {
              const override = userOverrides.find(o => o.menu_id === menu.id);
              if (menu.is_section) {
                return (
                  <div key={menu.id} className="pt-4 pb-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      {menu.title}
                    </span>
                  </div>
                );
              }

              return (
                <div
                  key={menu.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-50/50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400 text-xs shadow-sm">
                      <i className={menu.icon || 'fas fa-cube'}></i>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-800 dark:text-slate-100">{menu.title}</div>
                      {menu.path && <div className="text-[10px] font-mono text-slate-400">{menu.path}</div>}
                    </div>
                  </div>

                  <div className="flex gap-1 p-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                    {[
                      { id: 'allow', label: 'Allow', color: 'emerald' },
                      { id: 'deny', label: 'Deny', color: 'rose' },
                      { id: 'none', label: 'Role Default', color: brandColor }
                    ].map(btn => (
                      <button
                        key={btn.id}
                        type="button"
                        onClick={() => handleSetOverride(menu.id, btn.id as any)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                          (btn.id === 'none' ? !override : override?.permission_type === btn.id)
                            ? `bg-${btn.color}-600 text-white shadow-sm`
                            : 'text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 bg-slate-50/30 dark:bg-slate-800/10">
          <button
            type="button"
            onClick={() => setShowPermsModal(false)}
            className="px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-slate-500"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSavePermissions}
            className={`px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-${brandColor}-600 hover:bg-${brandColor}-700 shadow-md transition-all`}
          >
            Save Overrides
          </button>
        </div>
      </Modal>
    </motion.div>
  );
};

export default AllUsersPage;
