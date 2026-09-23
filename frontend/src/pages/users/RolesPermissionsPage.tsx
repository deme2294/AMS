import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    getRoles,
    createRole,
    deleteRole,
    updateRole,
    cloneRole,
    getRoleUsers,
    Role,
    RoleUserItem,
    getAllMenus,
    getRolePermissions,
    updateRolePermissions,
    Menu,
    RolePermission
} from '../../services/apiService';
import { getRoleColor } from '../../utils/roles';
import Pagination from '../../components/Pagination';
import { Modal, Spinner } from 'react-bootstrap';
import { motion, AnimatePresence } from 'framer-motion';

const PermissionToggle = ({ label, checked, onChange, color, brandColor }: { label: string, checked: boolean, onChange: () => void, color: string, brandColor: string }) => {
    return (
        <div className="flex items-center gap-1.5 sm:gap-2 cursor-pointer bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl hover:border-slate-200 dark:hover:border-slate-600 transition-all shadow-sm group/toggle" onClick={(e) => { e.stopPropagation(); onChange(); }}>
            <div className={`relative inline-flex h-3 w-6 sm:h-4 sm:w-8 items-center rounded-full transition-all focus:outline-none flex-shrink-0 ${checked ? (color === brandColor || color === 'blue' ? `bg-${brandColor}-500 shadow-sm shadow-${brandColor}-500/30` : `bg-${color}-500 shadow-sm shadow-${color}-500/30`) : 'bg-slate-200 dark:bg-slate-700'}`}>
                <span className={`inline-block h-2 w-2 sm:h-2.5 sm:w-2.5 transform rounded-full bg-white transition-all shadow-sm ${checked ? 'translate-x-[14px] sm:translate-x-[20px]' : 'translate-x-0.5 sm:translate-x-1'}`} />
            </div>
            <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-widest ${checked ? (color === brandColor || color === 'blue' ? `text-${brandColor}-600 dark:text-${brandColor}-400` : `text-${color}-600 dark:text-${color}-400`) : 'text-slate-400 dark:text-slate-500 transition-colors'}`}>
                {label}
            </span>
        </div>
    );
};

const RolesPermissionsPage: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    // Data State
    const [roles, setRoles] = useState<Role[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [brandColor, setBrandColor] = useState('blue');

    // Filter & Search State
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const [typeFilter, setTypeFilter] = useState<'all' | 'system' | 'custom'>('all');

    // Create & Edit State
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    const [formRoleName, setFormRoleName] = useState('');
    const [formDescription, setFormDescription] = useState('');
    const [formStatus, setFormStatus] = useState<number>(1);
    const [cloneSourceId, setCloneSourceId] = useState<string>('');
    const [submitting, setSubmitting] = useState(false);

    // Clone Role Modal State
    const [showCloneModal, setShowCloneModal] = useState(false);
    const [roleToClone, setRoleToClone] = useState<Role | null>(null);
    const [cloneName, setCloneName] = useState('');
    const [cloneDesc, setCloneDesc] = useState('');
    const [cloning, setCloning] = useState(false);

    // Assigned Users Modal State
    const [showUsersModal, setShowUsersModal] = useState(false);
    const [selectedRoleForUsers, setSelectedRoleForUsers] = useState<Role | null>(null);
    const [roleUsers, setRoleUsers] = useState<RoleUserItem[]>([]);
    const [usersLoading, setUsersLoading] = useState(false);

    // Permissions Modal State
    const [showPermsModal, setShowPermsModal] = useState(false);
    const [selectedRoleForPerms, setSelectedRoleForPerms] = useState<Role | null>(null);
    const [allMenus, setAllMenus] = useState<Menu[]>([]);
    const [selectedPermissions, setSelectedPermissions] = useState<RolePermission[]>([]);
    const [permsLoading, setPermsLoading] = useState(false);
    const [menuSearchTerm, setMenuSearchTerm] = useState('');

    // Notification toast
    const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
    const showToast = (text: string, type: 'success' | 'error' = 'success') => {
        setToastMessage({ text, type });
        setTimeout(() => setToastMessage(null), 4000);
    };

    useEffect(() => {
        const fetchTheme = () => setBrandColor(localStorage.getItem('lms_color') || 'blue');
        fetchTheme();
        window.addEventListener('storage', fetchTheme);
        return () => window.removeEventListener('storage', fetchTheme);
    }, []);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    const fetchRoles = async () => {
        setLoading(true);
        try {
            const data = await getRoles();
            setRoles(data || []);
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Error fetching roles');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRoles();
    }, []);

    // Open Create Modal
    const handleOpenCreateModal = () => {
        setEditingRole(null);
        setFormRoleName('');
        setFormDescription('');
        setFormStatus(1);
        setCloneSourceId('');
        setShowRoleModal(true);
    };

    // Open Edit Modal
    const handleOpenEditModal = (role: Role) => {
        setEditingRole(role);
        setFormRoleName(role.role_name);
        setFormDescription(role.description || '');
        setFormStatus(Number(role.status) === 1 ? 1 : 0);
        setCloneSourceId('');
        setShowRoleModal(true);
    };

    // Submit Create or Edit Role
    const handleSubmitRole = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formRoleName.trim()) {
            showToast('Role designation name is required', 'error');
            return;
        }

        setSubmitting(true);
        try {
            if (editingRole) {
                await updateRole(editingRole.role_id, {
                    role_name: formRoleName.trim(),
                    description: formDescription.trim(),
                    status: formStatus
                });
                showToast(`Role "${formRoleName.trim()}" updated successfully.`);
            } else {
                await createRole({
                    role_name: formRoleName.trim(),
                    description: formDescription.trim(),
                    status: formStatus,
                    clone_from_role_id: cloneSourceId ? Number(cloneSourceId) : undefined
                });
                showToast(`Dynamic role "${formRoleName.trim()}" created successfully.`);
            }
            setShowRoleModal(false);
            fetchRoles();
        } catch (err: any) {
            showToast(err.message || 'Error saving role', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    // Quick Toggle Status
    const handleToggleRoleStatus = async (role: Role) => {
        const nextStatus = Number(role.status) === 1 ? 0 : 1;
        try {
            await updateRole(role.role_id, {
                role_name: role.role_name,
                description: role.description || undefined,
                status: nextStatus
            });
            setRoles(prev => prev.map(r => r.role_id === role.role_id ? { ...r, status: nextStatus } : r));
            showToast(`Role "${role.role_name}" is now ${nextStatus === 1 ? 'Active' : 'Inactive'}.`);
        } catch (err: any) {
            showToast(err.message || 'Error updating status', 'error');
        }
    };

    // Delete Role with safety check
    const handleDeleteRole = async (role: Role) => {
        if (role.is_system) {
            showToast(`System role "${role.role_name}" cannot be deleted.`, 'error');
            return;
        }

        if (role.user_count && role.user_count > 0) {
            showToast(`Cannot delete "${role.role_name}": ${role.user_count} user(s) are currently assigned to this role. Please reassign them first.`, 'error');
            return;
        }

        if (window.confirm(`Are you sure you want to permanently delete dynamic role "${role.role_name}"? All assigned permissions will also be removed.`)) {
            try {
                await deleteRole(role.role_id);
                showToast(`Role "${role.role_name}" deleted successfully.`);
                fetchRoles();
            } catch (err: any) {
                showToast(err.message || 'Error deleting role', 'error');
            }
        }
    };

    // Open Clone Modal
    const handleOpenClone = (role: Role) => {
        setRoleToClone(role);
        setCloneName(`${role.role_name} (Copy)`);
        setCloneDesc(`Cloned from ${role.role_name}. ${role.description || ''}`);
        setShowCloneModal(true);
    };

    // Submit Clone Role
    const handleSubmitClone = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!roleToClone || !cloneName.trim()) return;

        setCloning(true);
        try {
            await cloneRole(roleToClone.role_id, {
                role_name: cloneName.trim(),
                description: cloneDesc.trim()
            });
            showToast(`Role "${cloneName.trim()}" cloned from "${roleToClone.role_name}" successfully.`);
            setShowCloneModal(false);
            fetchRoles();
        } catch (err: any) {
            showToast(err.message || 'Error cloning role', 'error');
        } finally {
            setCloning(false);
        }
    };

    // View Assigned Users
    const handleViewUsers = async (role: Role) => {
        setSelectedRoleForUsers(role);
        setShowUsersModal(true);
        setUsersLoading(true);
        try {
            const res = await getRoleUsers(role.role_id);
            setRoleUsers(res.data || []);
        } catch (err: any) {
            showToast(err.message || 'Error loading role users', 'error');
        } finally {
            setUsersLoading(false);
        }
    };

    // Permissions Modal Logic
    const handleOpenPerms = async (role: Role) => {
        setSelectedRoleForPerms(role);
        setShowPermsModal(true);
        setPermsLoading(true);
        setMenuSearchTerm('');
        try {
            const [menus, perms] = await Promise.all([
                getAllMenus(),
                getRolePermissions(role.role_id)
            ]);
            setAllMenus(menus || []);
            setSelectedPermissions(perms || []);
        } catch (err: any) {
            showToast(err.message || 'Error loading permissions', 'error');
        } finally {
            setPermsLoading(false);
        }
    };

    const handlePermissionToggle = (menuId: number, field: keyof RolePermission) => {
        setSelectedPermissions(prev => {
            const existing = prev.find(p => p.menu_id === menuId);
            if (existing) {
                return prev.map(p => p.menu_id === menuId ? { ...p, [field]: !existing[field] } : p);
            } else {
                return [...prev, {
                    menu_id: menuId,
                    can_view: field === 'can_view',
                    can_create: field === 'can_create',
                    can_edit: field === 'can_edit',
                    can_delete: field === 'can_delete'
                }];
            }
        });
    };

    const handleSelectAll = (select: boolean) => {
        if (select) {
            setSelectedPermissions(allMenus.map(m => ({
                menu_id: m.id,
                can_view: true,
                can_create: true,
                can_edit: true,
                can_delete: true
            })));
        } else {
            setSelectedPermissions([]);
        }
    };

    const handleSavePermissions = async () => {
        if (!selectedRoleForPerms) return;
        setPermsLoading(true);
        try {
            await updateRolePermissions(selectedRoleForPerms.role_id, selectedPermissions);
            setShowPermsModal(false);
            showToast(`Permissions updated for role "${selectedRoleForPerms.role_name}".`);
        } catch (err: any) {
            showToast(err.message || 'Error saving permissions', 'error');
        } finally {
            setPermsLoading(false);
        }
    };

    // Filtered Roles
    const filteredRoles = useMemo(() => {
        return roles.filter(role => {
            const matchesSearch = role.role_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (role.description && role.description.toLowerCase().includes(searchTerm.toLowerCase()));

            const matchesStatus = statusFilter === 'all'
                ? true
                : statusFilter === 'active'
                ? Number(role.status) === 1
                : Number(role.status) === 0;

            const matchesType = typeFilter === 'all'
                ? true
                : typeFilter === 'system'
                ? role.is_system
                : !role.is_system;

            return matchesSearch && matchesStatus && matchesType;
        });
    }, [roles, searchTerm, statusFilter, typeFilter]);

    // Pagination
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentRoles = filteredRoles.slice(indexOfFirstItem, indexOfLastItem);

    // KPI Metrics
    const totalCount = roles.length;
    const activeCount = roles.filter(r => Number(r.status) === 1).length;
    const dynamicCount = roles.filter(r => !r.is_system).length;
    const totalUserAssignments = roles.reduce((sum, r) => sum + (r.user_count || 0), 0);

    const filteredMenus = useMemo(() => {
        if (!menuSearchTerm) return allMenus;
        return allMenus.filter(m =>
            m.title.toLowerCase().includes(menuSearchTerm.toLowerCase()) ||
            (m.path && m.path.toLowerCase().includes(menuSearchTerm.toLowerCase()))
        );
    }, [allMenus, menuSearchTerm]);

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
                        <i className={`fas ${toastMessage.type === 'error' ? 'fa-exclamation-circle text-rose-500' : 'fa-check-circle text-emerald-500'}`}></i>
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
                                Dynamic Role Command Center
                            </h1>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-300/40">
                                Dynamic RBAC
                            </span>
                        </div>
                        <p className="text-[11px] sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                            Create, customize, clone, and manage roles dynamically with real-time permission enforcement.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2.5">
                    <button
                        onClick={() => navigate('/admin/users/permissions')}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-slate-800 hover:bg-slate-900 text-slate-100 shadow-sm border border-slate-700 transition-all"
                    >
                        <i className="fas fa-shield-alt text-xs text-indigo-400"></i>
                        <span>Module Matrix</span>
                    </button>
                    <button
                        onClick={handleOpenCreateModal}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-${brandColor}-600 hover:bg-${brandColor}-700 text-white shadow-md shadow-${brandColor}-600/30 transition-all`}
                    >
                        <i className="fas fa-plus text-xs"></i>
                        <span>Create Dynamic Role</span>
                    </button>
                </div>
            </div>

            {/* KPI Metric Overview Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 px-3 sm:px-0">
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-lg">
                        <i className="fas fa-id-card"></i>
                    </div>
                    <div>
                        <div className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white tabular-nums">{totalCount}</div>
                        <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">Total Roles</div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-lg">
                        <i className="fas fa-check-circle"></i>
                    </div>
                    <div>
                        <div className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white tabular-nums">{activeCount}</div>
                        <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">Active Roles</div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 flex items-center justify-center text-lg">
                        <i className="fas fa-puzzle-piece"></i>
                    </div>
                    <div>
                        <div className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white tabular-nums">{dynamicCount}</div>
                        <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">Dynamic Roles</div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 flex items-center justify-center text-lg">
                        <i className="fas fa-users"></i>
                    </div>
                    <div>
                        <div className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white tabular-nums">{totalUserAssignments}</div>
                        <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">Assigned Users</div>
                    </div>
                </div>
            </div>

            {/* Main Roles Container */}
            <div className="bg-white dark:bg-slate-900 rounded-none sm:rounded-[2rem] shadow-sm border-y sm:border border-slate-200 dark:border-slate-800 overflow-hidden">
                {/* Search & Filters Bar */}
                <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-50/30 dark:bg-slate-800/10">
                    <div className="relative flex-1 max-w-md">
                        <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            placeholder="Search roles by name or description..."
                            className="w-full pl-10 pr-4 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-100"
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                        {/* Status Filter */}
                        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
                            {(['all', 'active', 'inactive'] as const).map(st => (
                                <button
                                    key={st}
                                    onClick={() => { setStatusFilter(st); setCurrentPage(1); }}
                                    className={`px-3 py-1.5 rounded-lg capitalize transition-all ${
                                        statusFilter === st
                                            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                            : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                                    }`}
                                >
                                    {st}
                                </button>
                            ))}
                        </div>

                        {/* Type Filter */}
                        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
                            {(['all', 'system', 'custom'] as const).map(tp => (
                                <button
                                    key={tp}
                                    onClick={() => { setTypeFilter(tp); setCurrentPage(1); }}
                                    className={`px-3 py-1.5 rounded-lg capitalize transition-all ${
                                        typeFilter === tp
                                            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                            : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                                    }`}
                                >
                                    {tp === 'custom' ? 'Dynamic' : tp}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={fetchRoles}
                            title="Refresh Roles"
                            className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                        >
                            <i className="fas fa-sync-alt text-xs"></i>
                        </button>
                    </div>
                </div>

                {/* Table Content */}
                <div className="w-full">
                    {loading ? (
                        <div className="p-16 text-center text-slate-400 flex flex-col items-center gap-3">
                            <Spinner animation="border" size="sm" />
                            <span className="text-sm font-medium">Loading dynamic roles...</span>
                        </div>
                    ) : error ? (
                        <div className="p-12 text-center">
                            <p className="text-rose-500 mb-4 font-semibold text-sm">{error}</p>
                            <button
                                onClick={fetchRoles}
                                className={`px-5 py-2.5 bg-${brandColor}-50 dark:bg-${brandColor}-900/20 text-${brandColor}-600 dark:text-${brandColor}-400 rounded-xl font-bold text-sm`}
                            >
                                Retry
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Desktop Table View */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-slate-50 dark:bg-slate-800/40 text-slate-400 text-[10px] font-black uppercase tracking-[0.18em] border-b border-slate-200 dark:border-slate-800">
                                            <th className="px-6 py-4 text-left">Role ID</th>
                                            <th className="px-6 py-4 text-left">Designation & Description</th>
                                            <th className="px-6 py-4 text-center">Type</th>
                                            <th className="px-6 py-4 text-center">Assigned Users</th>
                                            <th className="px-6 py-4 text-center">Active Status</th>
                                            <th className="px-6 py-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                        {currentRoles.map(role => {
                                            const color = getRoleColor(role.role_id);
                                            return (
                                                <tr key={role.role_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all duration-200 group">
                                                    <td className="px-6 py-4 text-xs font-mono font-black text-slate-400 tabular-nums">
                                                        #{role.role_id.toString().padStart(3, '0')}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                                                                    {role.role_name}
                                                                </span>
                                                                <span className={`w-2 h-2 rounded-full bg-${color}-500`}></span>
                                                            </div>
                                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1 max-w-md">
                                                                {role.description || <span className="italic text-slate-400">No description provided</span>}
                                                            </p>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        {role.is_system ? (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                                                <i className="fas fa-lock text-[9px]"></i> System
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/30">
                                                                <i className="fas fa-sparkles text-[9px]"></i> Dynamic
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <button
                                                            onClick={() => handleViewUsers(role)}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-all border border-slate-200/60 dark:border-slate-700"
                                                        >
                                                            <i className="fas fa-user-circle text-slate-400 text-xs"></i>
                                                            <span>{role.user_count || 0} user{role.user_count === 1 ? '' : 's'}</span>
                                                        </button>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <button
                                                            onClick={() => handleToggleRoleStatus(role)}
                                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all focus:outline-none flex-shrink-0 ${
                                                                Number(role.status) === 1
                                                                    ? 'bg-emerald-500 shadow-sm shadow-emerald-500/20'
                                                                    : 'bg-slate-200 dark:bg-slate-700'
                                                            }`}
                                                            title={Number(role.status) === 1 ? 'Click to deactivate' : 'Click to activate'}
                                                        >
                                                            <span
                                                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-all shadow-sm ${
                                                                    Number(role.status) === 1 ? 'translate-x-[22px]' : 'translate-x-1'
                                                                }`}
                                                            />
                                                        </button>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex justify-end items-center gap-1.5 text-[10px] font-black uppercase tracking-wider">
                                                            {/* Permissions Matrix */}
                                                            <button
                                                                onClick={() => handleOpenPerms(role)}
                                                                className="px-2.5 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-100 transition-all border border-blue-200/50 dark:border-blue-800/30 flex items-center gap-1.5"
                                                                title="Manage Module Permissions"
                                                            >
                                                                <i className="fas fa-key text-[10px]"></i>
                                                                <span>Permissions</span>
                                                            </button>

                                                            {/* Clone Role */}
                                                            <button
                                                                onClick={() => handleOpenClone(role)}
                                                                className="px-2.5 py-1.5 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-xl hover:bg-purple-100 transition-all border border-purple-200/50 dark:border-purple-800/30 flex items-center gap-1.5"
                                                                title="Clone Role with Permissions"
                                                            >
                                                                <i className="fas fa-copy text-[10px]"></i>
                                                                <span>Clone</span>
                                                            </button>

                                                            {/* Edit Role */}
                                                            <button
                                                                onClick={() => handleOpenEditModal(role)}
                                                                className="px-2.5 py-1.5 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-xl hover:bg-amber-100 transition-all border border-amber-200/50 dark:border-amber-800/30 flex items-center gap-1.5"
                                                                title="Edit Role Details"
                                                            >
                                                                <i className="fas fa-edit text-[10px]"></i>
                                                                <span>Edit</span>
                                                            </button>

                                                            {/* Delete Role */}
                                                            {!role.is_system && (
                                                                <button
                                                                    onClick={() => handleDeleteRole(role)}
                                                                    className="px-2.5 py-1.5 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-xl hover:bg-rose-100 transition-all border border-rose-200/50 dark:border-rose-800/30 flex items-center gap-1.5"
                                                                    title="Delete Role"
                                                                >
                                                                    <i className="fas fa-trash text-[10px]"></i>
                                                                    <span>Delete</span>
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {currentRoles.length === 0 && (
                                            <tr>
                                                <td colSpan={6} className="text-center py-12 text-slate-400 italic text-sm">
                                                    No roles match the selected search or filter criteria.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Card View */}
                            <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
                                {currentRoles.map(role => (
                                    <div key={role.role_id} className="p-4 space-y-3">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-mono text-[10px] font-black text-slate-500">
                                                    #{role.role_id.toString().padStart(3, '0')}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                                                        {role.role_name}
                                                    </div>
                                                    <div className="text-[11px] text-slate-400 line-clamp-1">
                                                        {role.description || 'No description'}
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleToggleRoleStatus(role)}
                                                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-all focus:outline-none flex-shrink-0 ${
                                                    Number(role.status) === 1 ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'
                                                }`}
                                            >
                                                <span
                                                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-all shadow-sm ${
                                                        Number(role.status) === 1 ? 'translate-x-[18px]' : 'translate-x-[2px]'
                                                    }`}
                                                />
                                            </button>
                                        </div>

                                        <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800/60">
                                            <span className="text-[10px] uppercase font-bold text-slate-400">
                                                {role.is_system ? 'System Role' : 'Dynamic Role'}
                                            </span>
                                            <button
                                                onClick={() => handleViewUsers(role)}
                                                className="text-xs font-bold text-blue-600 dark:text-blue-400 underline underline-offset-2"
                                            >
                                                {role.user_count || 0} user{role.user_count === 1 ? '' : 's'} assigned
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-4 gap-1.5 pt-2 text-[10px] font-black uppercase tracking-wider">
                                            <button
                                                onClick={() => handleOpenPerms(role)}
                                                className="py-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex flex-col items-center justify-center gap-1"
                                            >
                                                <i className="fas fa-key"></i>
                                                <span>Perms</span>
                                            </button>
                                            <button
                                                onClick={() => handleOpenClone(role)}
                                                className="py-2 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 flex flex-col items-center justify-center gap-1"
                                            >
                                                <i className="fas fa-copy"></i>
                                                <span>Clone</span>
                                            </button>
                                            <button
                                                onClick={() => handleOpenEditModal(role)}
                                                className="py-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 flex flex-col items-center justify-center gap-1"
                                            >
                                                <i className="fas fa-edit"></i>
                                                <span>Edit</span>
                                            </button>
                                            {!role.is_system ? (
                                                <button
                                                    onClick={() => handleDeleteRole(role)}
                                                    className="py-2 rounded-xl bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 flex flex-col items-center justify-center gap-1"
                                                >
                                                    <i className="fas fa-trash"></i>
                                                    <span>Delete</span>
                                                </button>
                                            ) : (
                                                <div className="py-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-300 dark:text-slate-600 flex flex-col items-center justify-center gap-1 cursor-not-allowed">
                                                    <i className="fas fa-lock"></i>
                                                    <span>Locked</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* Pagination */}
                {filteredRoles.length > 0 && (
                    <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/10 dark:bg-slate-800/5">
                        <Pagination
                            currentPage={currentPage}
                            totalItems={filteredRoles.length}
                            itemsPerPage={itemsPerPage}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                )}
            </div>

            {/* CREATE / EDIT ROLE MODAL */}
            <Modal
                show={showRoleModal}
                onHide={() => !submitting && setShowRoleModal(false)}
                centered
                dialogClassName="max-w-lg"
                contentClassName="bg-white dark:bg-slate-900 border-none rounded-3xl overflow-hidden shadow-2xl"
            >
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${editingRole ? 'bg-amber-100 text-amber-600 dark:bg-amber-950/40' : 'bg-blue-100 text-blue-600 dark:bg-blue-950/40'}`}>
                            <i className={`fas ${editingRole ? 'fa-edit' : 'fa-plus-circle'}`}></i>
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-slate-800 dark:text-white">
                                {editingRole ? 'Modify Role Designation' : 'Create Dynamic Role'}
                            </h3>
                            <p className="text-xs text-slate-400">
                                {editingRole ? 'Update role properties and permissions access' : 'Define a brand new dynamic role for users'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowRoleModal(false)}
                        className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700"
                    >
                        <i className="fas fa-times text-xs"></i>
                    </button>
                </div>

                <form onSubmit={handleSubmitRole}>
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                                Role Designation Name <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formRoleName}
                                onChange={(e) => setFormRoleName(e.target.value)}
                                placeholder="e.g. Front Desk Supervisor, Auditor, Floor Manager"
                                required
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                                Role Description & Scope
                            </label>
                            <textarea
                                value={formDescription}
                                onChange={(e) => setFormDescription(e.target.value)}
                                rows={3}
                                placeholder="Describe what responsibilities and scope this role covers..."
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                        </div>

                        {!editingRole && (
                            <div>
                                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                                    Clone Initial Permissions From (Optional)
                                </label>
                                <select
                                    value={cloneSourceId}
                                    onChange={(e) => setCloneSourceId(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 font-semibold"
                                >
                                    <option value="">Start with blank permissions</option>
                                    {roles.map(r => (
                                        <option key={r.role_id} value={r.role_id}>
                                            Clone from {r.role_name} (#{r.role_id})
                                        </option>
                                    ))}
                                </select>
                                <p className="text-[11px] text-slate-400 mt-1">
                                    Select an existing role to automatically copy its module permissions to this new role.
                                </p>
                            </div>
                        )}

                        <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <div>
                                <div className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">
                                    Role Active Status
                                </div>
                                <div className="text-[11px] text-slate-400">
                                    Inactive roles cannot be assigned or access protected modules
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setFormStatus(prev => prev === 1 ? 0 : 1)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all focus:outline-none flex-shrink-0 ${
                                    formStatus === 1 ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                                }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-all shadow-sm ${
                                        formStatus === 1 ? 'translate-x-[22px]' : 'translate-x-1'
                                    }`}
                                />
                            </button>
                        </div>
                    </div>

                    <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 bg-slate-50/30 dark:bg-slate-800/10">
                        <button
                            type="button"
                            onClick={() => setShowRoleModal(false)}
                            className="px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className={`px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-white shadow-md transition-all flex items-center gap-2 ${
                                editingRole ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                        >
                            {submitting && <Spinner animation="border" size="sm" />}
                            <span>{editingRole ? 'Save Changes' : 'Create Role'}</span>
                        </button>
                    </div>
                </form>
            </Modal>

            {/* CLONE ROLE MODAL */}
            <Modal
                show={showCloneModal}
                onHide={() => !cloning && setShowCloneModal(false)}
                centered
                dialogClassName="max-w-md"
                contentClassName="bg-white dark:bg-slate-900 border-none rounded-3xl overflow-hidden shadow-2xl"
            >
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-950/40 flex items-center justify-center">
                            <i className="fas fa-copy"></i>
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-slate-800 dark:text-white">Clone Dynamic Role</h3>
                            <p className="text-xs text-slate-400">Copy permissions from {roleToClone?.role_name}</p>
                        </div>
                    </div>
                    <button onClick={() => setShowCloneModal(false)} className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center">
                        <i className="fas fa-times text-xs"></i>
                    </button>
                </div>

                <form onSubmit={handleSubmitClone}>
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                                Cloned Role Name <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={cloneName}
                                onChange={(e) => setCloneName(e.target.value)}
                                required
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-purple-500/20"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                                Description
                            </label>
                            <textarea
                                value={cloneDesc}
                                onChange={(e) => setCloneDesc(e.target.value)}
                                rows={2}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-purple-500/20"
                            />
                        </div>
                    </div>

                    <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 bg-slate-50/30 dark:bg-slate-800/10">
                        <button
                            type="button"
                            onClick={() => setShowCloneModal(false)}
                            className="px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-slate-500"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={cloning}
                            className="px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-purple-600 hover:bg-purple-700 shadow-md transition-all flex items-center gap-2"
                        >
                            {cloning && <Spinner animation="border" size="sm" />}
                            <span>Duplicate Role</span>
                        </button>
                    </div>
                </form>
            </Modal>

            {/* ASSIGNED USERS MODAL */}
            <Modal
                show={showUsersModal}
                onHide={() => setShowUsersModal(false)}
                centered
                dialogClassName="max-w-2xl"
                contentClassName="bg-white dark:bg-slate-900 border-none rounded-3xl overflow-hidden shadow-2xl"
            >
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950/40 flex items-center justify-center">
                            <i className="fas fa-users"></i>
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-slate-800 dark:text-white">
                                Assigned Users: {selectedRoleForUsers?.role_name}
                            </h3>
                            <p className="text-xs text-slate-400">
                                {roleUsers.length} user{roleUsers.length === 1 ? '' : 's'} assigned to this role
                            </p>
                        </div>
                    </div>
                    <button onClick={() => setShowUsersModal(false)} className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center">
                        <i className="fas fa-times text-xs"></i>
                    </button>
                </div>

                <div className="p-6 max-h-[60vh] overflow-y-auto">
                    {usersLoading ? (
                        <div className="p-10 text-center flex flex-col items-center gap-2 text-slate-400">
                            <Spinner animation="border" size="sm" />
                            <span>Loading users...</span>
                        </div>
                    ) : roleUsers.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 italic">
                            No users are currently assigned to this role.
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                            {roleUsers.map(user => (
                                <div key={user.user_id} className="py-3 flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold text-xs">
                                            {user.user_name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-slate-800 dark:text-slate-100">
                                                {user.full_name || user.user_name}
                                            </div>
                                            <div className="text-xs text-slate-400">
                                                @{user.user_name} {user.email ? `• ${user.email}` : ''}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                            Number(user.status) === 1 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                                        }`}>
                                            {Number(user.status) === 1 ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end bg-slate-50/30 dark:bg-slate-800/10">
                    <button
                        onClick={() => setShowUsersModal(false)}
                        className="px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                    >
                        Close
                    </button>
                </div>
            </Modal>

            {/* PERMISSIONS MATRIX DRAWER / MODAL */}
            <Modal
                show={showPermsModal}
                onHide={() => setShowPermsModal(false)}
                scrollable
                dialogClassName="fixed inset-y-0 right-0 m-0 w-full sm:w-[90vw] md:w-[750px] lg:w-[900px] h-full max-w-none shadow-[0_0_100px_rgba(0,0,0,0.2)]"
                contentClassName="h-full bg-white dark:bg-slate-900 border-none rounded-none sm:rounded-l-[2.5rem] overflow-hidden flex flex-col"
            >
                <div className="p-5 sm:p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 flex-shrink-0">
                    <div>
                        <h3 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white tracking-tight">
                            Module Permissions Matrix
                        </h3>
                        <p className="text-[10px] sm:text-xs text-slate-500 mt-1 uppercase tracking-widest font-bold">
                            Configuring access for dynamic role: <span className={`text-${brandColor}-600 underline underline-offset-4 decoration-2 font-black`}>{selectedRoleForPerms?.role_name}</span>
                        </p>
                    </div>
                    <button onClick={() => setShowPermsModal(false)} className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 transition-all flex items-center justify-center text-slate-400">
                        <i className="fas fa-times text-lg"></i>
                    </button>
                </div>

                <div className="p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
                    <div className="relative flex-1 min-w-[200px]">
                        <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                        <input
                            type="text"
                            value={menuSearchTerm}
                            onChange={(e) => setMenuSearchTerm(e.target.value)}
                            placeholder="Filter module or section name..."
                            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => handleSelectAll(true)}
                            className="px-3 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-all"
                        >
                            Grant All
                        </button>
                        <button
                            type="button"
                            onClick={() => handleSelectAll(false)}
                            className="px-3 py-2 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-bold hover:bg-rose-100 transition-all"
                        >
                            Revoke All
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-3">
                    {permsLoading ? (
                        <div className="p-16 text-center text-slate-400 flex flex-col items-center gap-3">
                            <Spinner animation="border" size="sm" />
                            <span className="text-sm font-medium">Loading permissions matrix...</span>
                        </div>
                    ) : filteredMenus.length === 0 ? (
                        <div className="p-12 text-center text-slate-400 italic text-sm">
                            No modules found.
                        </div>
                    ) : (
                        filteredMenus.map(menu => {
                            const perm = selectedPermissions.find(p => p.menu_id === menu.id) || {
                                menu_id: menu.id,
                                can_view: false,
                                can_create: false,
                                can_edit: false,
                                can_delete: false
                            };

                            return (
                                <div
                                    key={menu.id}
                                    className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 text-xs">
                                            <i className={menu.icon || 'fas fa-cube'}></i>
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                                <span>{menu.title}</span>
                                                {menu.path && (
                                                    <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                                                        {menu.path}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mt-0.5">
                                                {menu.is_section ? 'Section Header' : menu.is_dropdown ? 'Dropdown Parent' : 'Functional Page'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Toggles */}
                                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                        <PermissionToggle
                                            label="View"
                                            checked={perm.can_view}
                                            onChange={() => handlePermissionToggle(menu.id, 'can_view')}
                                            color="emerald"
                                            brandColor={brandColor}
                                        />
                                        <PermissionToggle
                                            label="Create"
                                            checked={perm.can_create}
                                            onChange={() => handlePermissionToggle(menu.id, 'can_create')}
                                            color="blue"
                                            brandColor={brandColor}
                                        />
                                        <PermissionToggle
                                            label="Edit"
                                            checked={perm.can_edit}
                                            onChange={() => handlePermissionToggle(menu.id, 'can_edit')}
                                            color="amber"
                                            brandColor={brandColor}
                                        />
                                        <PermissionToggle
                                            label="Delete"
                                            checked={perm.can_delete}
                                            onChange={() => handlePermissionToggle(menu.id, 'can_delete')}
                                            color="rose"
                                            brandColor={brandColor}
                                        />
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                <div className="p-5 sm:p-8 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 bg-white dark:bg-slate-900 flex-shrink-0">
                    <button
                        type="button"
                        onClick={() => setShowPermsModal(false)}
                        className="px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                        Close
                    </button>
                    <button
                        type="button"
                        disabled={permsLoading}
                        onClick={handleSavePermissions}
                        className={`px-8 py-3 rounded-xl font-bold text-xs uppercase tracking-wider text-white shadow-lg transition-all flex items-center gap-2 bg-${brandColor}-600 hover:bg-${brandColor}-700 shadow-${brandColor}-600/30`}
                    >
                        {permsLoading && <Spinner animation="border" size="sm" />}
                        <span>Save Permissions Matrix</span>
                    </button>
                </div>
            </Modal>
        </motion.div>
    );
};

export default RolesPermissionsPage;
