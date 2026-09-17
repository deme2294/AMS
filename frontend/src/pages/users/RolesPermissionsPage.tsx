import React, { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { getRoles, createRole, deleteRole, updateRole, Role, getAllMenus, getRolePermissions, updateRolePermissions, Menu, RolePermission } from '../../services/apiService';
import Pagination from '../../components/Pagination';
import { Modal, Spinner } from 'react-bootstrap';
import { motion } from 'framer-motion';

const PermissionToggle = ({ label, checked, onChange, color, brandColor }: { label: string, checked: boolean, onChange: () => void, color: string, brandColor: string }) => {
    const { t } = useTranslation();
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
    const [roles, setRoles] = useState<Role[]>([]);
    const [roleName, setRoleName] = useState('');
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [brandColor, setBrandColor] = useState('blue');

    // Permissions State
    const [showPermsModal, setShowPermsModal] = useState(false);
    const [selectedRoleForPerms, setSelectedRoleForPerms] = useState<Role | null>(null);
    const [allMenus, setAllMenus] = useState<Menu[]>([]);
    const [selectedPermissions, setSelectedPermissions] = useState<RolePermission[]>([]);
    const [permsLoading, setPermsLoading] = useState(false);
    const [menuSearchTerm, setMenuSearchTerm] = useState('');

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
            setRoles(data);
            setError(null);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRoles();
    }, []);

    const handleSubmitRole = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!roleName) return;
        try {
            if (editingRole) {
                await updateRole(editingRole.role_id, { role_name: roleName, status: editingRole.status });
            } else {
                await createRole({ role_name: roleName });
            }
            setRoleName('');
            setEditingRole(null);
            fetchRoles();
        } catch (err: any) {
            alert('Error saving role: ' + err.message);
        }
    };

    const handleEditRole = (role: Role) => {
        setEditingRole(role);
        setRoleName(role.role_name);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setEditingRole(null);
        setRoleName('');
    };

    const handleDeleteRole = async (roleId: number) => {
        if (window.confirm('Are you sure you want to delete this role? This action cannot be undone.')) {
            try {
                await deleteRole(roleId);
                fetchRoles();
            } catch (err: any) {
                alert('Error deleting role: ' + err.message);
            }
        }
    };

    // Permissions Logic
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
            setAllMenus(menus);
            setSelectedPermissions(perms);
        } catch (err: any) {
            alert('Error loading permissions: ' + err.message);
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

    const handleToggleRoleStatus = async (role: Role) => {
        try {
            const newStatus = role.status == 1 ? 0 : 1;
            await updateRole(role.role_id, { role_name: role.role_name, status: newStatus });
            fetchRoles();
        } catch (err: any) {
            alert('Error updating role status: ' + err.message);
        }
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
            alert(t('roles_page.success_update') + selectedRoleForPerms.role_name);
        } catch (err: any) {
            alert('Error updating permissions: ' + err.message);
        } finally {
            setPermsLoading(false);
        }
    };

    const filteredMenus = useMemo(() => {
        if (!menuSearchTerm) return allMenus;
        return allMenus.filter(m =>
            m.title.toLowerCase().includes(menuSearchTerm.toLowerCase()) ||
            (m.path && m.path.toLowerCase().includes(menuSearchTerm.toLowerCase()))
        );
    }, [allMenus, menuSearchTerm]);

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentRoles = roles.slice(indexOfFirstItem, indexOfLastItem);

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full space-y-4 sm:space-y-6 px-0 sm:px-4 lg:px-8 pt-3 sm:pt-5 lg:pt-8 pb-6 bg-slate-50 dark:bg-slate-950 min-h-screen relative"
        >
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-1 sm:gap-4 px-3 sm:px-0 mb-4 sm:mb-8">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white tracking-tight mb-1">{t('roles_page.title')}</h1>
                    <p className="text-[11px] sm:text-sm text-slate-500 dark:text-slate-400 font-medium">{t('roles_page.subtitle')}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-8">
                {/* Form part */}
                <div className="lg:col-span-4">
                    <div className="bg-white dark:bg-slate-900 rounded-none sm:rounded-[2rem] shadow-sm border-y sm:border border-slate-200 dark:border-slate-800 overflow-hidden lg:sticky lg:top-4">
                        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3 bg-slate-50/30 dark:bg-slate-800/20">
                            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-[1rem] flex items-center justify-center shadow-sm transition-colors ${editingRole ? 'bg-amber-100 text-amber-600' : `bg-${brandColor}-50 text-${brandColor}-600`}`}>
                                <i className={`fas ${editingRole ? 'fa-edit' : 'fa-plus-circle'}`}></i>
                            </div>
                            <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100">
                                {editingRole ? t('roles_page.modify_role') : t('roles_page.create_new')}
                            </h2>
                        </div>
                        <div className="p-4 sm:p-6">
                            <form onSubmit={handleSubmitRole}>
                                <div className="space-y-3 sm:space-y-4">
                                    <div>
                                        <label className="block text-[10px] sm:text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5 ml-1">{t('roles_page.designation')}</label>
                                        <input
                                            type="text"
                                            className={`w-full px-4 py-3 sm:py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-${brandColor}-500/10 focus:border-${brandColor}-500 outline-none transition-all dark:text-white text-sm font-semibold`}
                                            value={roleName}
                                            onChange={(e) => setRoleName(e.target.value)}
                                            placeholder={t('roles_page.placeholder')}
                                            required
                                        />
                                    </div>
                                    <div className="flex gap-2.5 pt-2">
                                        <button
                                            type="submit"
                                            className={`flex-1 py-3 sm:py-3.5 rounded-xl font-bold transition-all shadow-sm text-[11px] sm:text-xs uppercase tracking-wider flex justify-center items-center ${editingRole ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20' : `bg-${brandColor}-600 hover:bg-${brandColor}-700 text-white shadow-${brandColor}-500/20`}`}
                                        >
                                            {editingRole ? t('roles_page.update') : t('roles_page.register')}
                                        </button>
                                        {editingRole && (
                                            <button
                                                type="button"
                                                className="px-4 py-3 sm:py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all font-bold text-[11px] sm:text-xs uppercase tracking-wider"
                                                onClick={handleCancelEdit}
                                            >
                                                {t('roles_page.discard')}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>

                {/* Table / List part */}
                <div className="lg:col-span-8">
                    <div className="bg-white dark:bg-slate-900 rounded-none sm:rounded-[2rem] shadow-sm border-y sm:border border-slate-200 dark:border-slate-800 overflow-hidden">
                        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/20 dark:bg-slate-800/10">
                            <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100">{t('roles_page.defined_roles')}</h2>
                            <span className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl text-[10px] font-black tracking-widest uppercase border border-slate-200 dark:border-slate-700">
                                {roles.length} {t('roles_page.total')}
                            </span>
                        </div>
                        
                        <div className="w-full">
                            {loading ? (
                                <div className="p-10 sm:p-20 text-center text-slate-400 flex flex-col items-center gap-3">
                                    <Spinner animation="border" size="sm" /> 
                                    <span className="text-sm font-medium">{t('common.loading')}</span>
                                </div>
                            ) : error ? (
                                <div className="p-10 text-center">
                                    <p className="text-rose-500 mb-4 font-medium text-sm">{error}</p>
                                    <button onClick={fetchRoles} className={`px-5 py-2.5 bg-${brandColor}-50 dark:bg-${brandColor}-900/20 text-${brandColor}-600 dark:text-${brandColor}-400 hover:bg-${brandColor}-100 dark:hover:bg-${brandColor}-900/40 rounded-xl transition-all text-sm font-bold border border-${brandColor}-200/50`}>{t('common.retry')}</button>
                                </div>
                            ) : (
                                <>
                                    {/* --- DESKTOP TABLE --- */}
                                    <div className="hidden sm:block overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="bg-slate-50 dark:bg-slate-800/30 text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-200 dark:border-slate-800">
                                                    <th className="px-6 py-4 text-left">{t('roles_page.col_id')}</th>
                                                    <th className="px-6 py-4 text-left">{t('roles_page.col_title')}</th>
                                                    <th className="px-6 py-4 text-center">{t('roles_page.col_status')}</th>
                                                    <th className="px-6 py-4 text-right">{t('roles_page.col_actions')}</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                                {currentRoles.map(role => (
                                                    <tr key={role.role_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all duration-300 group">
                                                        <td className="px-6 py-4 text-xs font-black text-slate-400 tabular-nums">#{(role.role_id).toString().padStart(3, '0')}</td>
                                                        <td className="px-6 py-4">
                                                            <span className="text-sm font-bold text-slate-700 dark:text-slate-200 tracking-tight">{role.role_name}</span>
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <button
                                                                onClick={() => handleToggleRoleStatus(role)}
                                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all focus:outline-none flex-shrink-0 ${role.status == 1 ? 'bg-emerald-500 shadow-sm shadow-emerald-500/20' : 'bg-slate-200 dark:bg-slate-700'}`}
                                                            >
                                                                <span
                                                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-all shadow-sm ${role.status == 1 ? 'translate-x-[22px]' : 'translate-x-1'}`}
                                                                />
                                                            </button>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <div className="flex justify-end gap-2 text-[10px] font-black uppercase tracking-wider">
                                                                <button
                                                                    className={`flex items-center justify-center gap-1.5 w-9 h-9 sm:w-auto sm:h-auto sm:px-3 sm:py-2 bg-${brandColor}-50 dark:bg-${brandColor}-900/20 text-${brandColor}-600 dark:text-${brandColor}-400 rounded-xl hover:bg-${brandColor}-100 dark:hover:bg-${brandColor}-900/40 transition-all border border-${brandColor}-200/50 dark:border-${brandColor}-800/30`}
                                                                    onClick={() => handleOpenPerms(role)}
                                                                    title={t('roles_page.btn_perms')}
                                                                >
                                                                    <i className="fas fa-key"></i>
                                                                    <span className="hidden sm:inline">{t('roles_page.btn_perms')}</span>
                                                                </button>
                                                                <button
                                                                    className="flex items-center justify-center gap-1.5 w-9 h-9 sm:w-auto sm:h-auto sm:px-3 sm:py-2 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-xl hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-all border border-amber-200/50 dark:border-amber-800/30"
                                                                    onClick={() => handleEditRole(role)}
                                                                    title={t('roles_page.btn_edit')}
                                                                >
                                                                    <i className="fas fa-edit"></i>
                                                                    <span className="hidden sm:inline">{t('roles_page.btn_edit')}</span>
                                                                </button>
                                                                <button
                                                                    className="flex items-center justify-center gap-1.5 w-9 h-9 sm:w-auto sm:h-auto sm:px-3 sm:py-2 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-all border border-rose-200/50 dark:border-rose-800/30"
                                                                    onClick={() => handleDeleteRole(role.role_id)}
                                                                    title={t('roles_page.btn_del')}
                                                                >
                                                                    <i className="fas fa-trash"></i>
                                                                    <span className="hidden sm:inline">{t('roles_page.btn_del')}</span>
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {roles.length === 0 && (
                                                    <tr>
                                                        <td colSpan={4} className="text-center py-12 text-slate-400 italic text-sm">
                                                            {t('roles_page.no_results')}
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* --- MOBILE CARDS --- */}
                                    <div className="sm:hidden divide-y divide-slate-100 dark:divide-slate-800">
                                        {currentRoles.map(role => (
                                            <div key={role.role_id} className="p-4 flex flex-col gap-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 font-mono text-[10px] font-black">
                                                            #{(role.role_id).toString().padStart(3, '0')}
                                                        </div>
                                                        <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{role.role_name}</span>
                                                    </div>
                                                    <button
                                                        onClick={() => handleToggleRoleStatus(role)}
                                                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-all focus:outline-none flex-shrink-0 ${role.status == 1 ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`}
                                                    >
                                                        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-all shadow-sm ${role.status == 1 ? 'translate-x-[18px]' : 'translate-x-[2px]'}`} />
                                                    </button>
                                                </div>
                                                <div className="flex justify-end gap-2 text-[10px] font-black uppercase tracking-wider w-full pt-1 border-t border-slate-50 dark:border-slate-800/50">
                                                    <button
                                                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 bg-${brandColor}-50 dark:bg-${brandColor}-900/20 text-${brandColor}-600 dark:text-${brandColor}-400 rounded-xl transition-all border border-${brandColor}-200/50 dark:border-${brandColor}-800/30`}
                                                        onClick={() => handleOpenPerms(role)}
                                                    >
                                                        <i className="fas fa-key"></i> {t('roles_page.btn_perms')}
                                                    </button>
                                                    <button
                                                        className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-xl transition-all border border-amber-200/50 dark:border-amber-800/30"
                                                        onClick={() => handleEditRole(role)}
                                                    >
                                                        <i className="fas fa-edit"></i> {t('roles_page.btn_edit')}
                                                    </button>
                                                    <button
                                                        className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-xl transition-all border border-rose-200/50 dark:border-rose-800/30"
                                                        onClick={() => handleDeleteRole(role.role_id)}
                                                    >
                                                        <i className="fas fa-trash"></i> {t('roles_page.btn_del')}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        {roles.length === 0 && (
                                            <div className="text-center py-12 text-slate-400 italic text-sm">
                                                {t('roles_page.no_results')}
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                        {roles.length > 0 && (
                            <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/10 dark:bg-slate-800/5">
                                <Pagination
                                    currentPage={currentPage}
                                    totalItems={roles.length}
                                    itemsPerPage={itemsPerPage}
                                    onPageChange={setCurrentPage}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <Modal
                show={showPermsModal}
                onHide={() => setShowPermsModal(false)}
                scrollable
                dialogClassName="fixed inset-y-0 right-0 m-0 w-full sm:w-[90vw] md:w-[750px] lg:w-[900px] h-full max-w-none shadow-[0_0_100px_rgba(0,0,0,0.2)]"
                contentClassName="h-full bg-white dark:bg-slate-900 border-none rounded-none sm:rounded-l-[2.5rem] overflow-hidden flex flex-col"
            >
                {/* Header fixed at top */}
                <div className="p-5 sm:p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 flex-shrink-0">
                    <div>
                        <h3 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white tracking-tight">{t('roles_page.modal_title')}</h3>
                        <p className="text-[10px] sm:text-xs text-slate-500 mt-1 uppercase tracking-widest font-bold">{t('roles_page.modal_subtitle')} <span className={`text-${brandColor}-600 underline underline-offset-4 decoration-2`}>{selectedRoleForPerms?.role_name}</span></p>
                    </div>
                    <button onClick={() => setShowPermsModal(false)} className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 transition-all flex items-center justify-center text-slate-400">
                        <i className="fas fa-times text-lg"></i>
                    </button>
                </div>
                
                <Modal.Body className="p-0 flex-1 flex flex-col overflow-hidden bg-slate-50/10 dark:bg-slate-950/20">
                    <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex-shrink-0 z-20 shadow-sm">
                        <div className="flex flex-col sm:flex-row gap-3 items-center">
                            <div className="relative flex-1 w-full">
                                <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                                <input
                                    type="text"
                                    placeholder={t('roles_page.search_placeholder')}
                                    className={`w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-${brandColor}-500/10 outline-none transition-all dark:text-white text-sm font-semibold shadow-sm`}
                                    value={menuSearchTerm}
                                    onChange={e => setMenuSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-2 w-full sm:w-auto self-start sm:self-auto">
                                <button
                                    onClick={() => handleSelectAll(true)}
                                    className={`flex-1 sm:flex-auto px-4 py-3 text-[10px] sm:text-xs font-black uppercase tracking-widest bg-${brandColor}-50 dark:bg-${brandColor}-900/20 text-${brandColor}-700 dark:text-${brandColor}-400 hover:bg-${brandColor}-100 rounded-xl transition-colors border border-${brandColor}-100 dark:border-${brandColor}-800/30 truncate`}
                                >
                                    {t('roles_page.grant_all')}
                                </button>
                                <button
                                    onClick={() => handleSelectAll(false)}
                                    className="flex-1 sm:flex-auto px-4 py-3 text-[10px] sm:text-xs font-black uppercase tracking-widest bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 hover:bg-rose-100 rounded-xl transition-colors border border-rose-100 dark:border-rose-800/30 truncate"
                                >
                                    {t('roles_page.revoke_all')}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 sm:p-4 custom-scrollbar">
                        {permsLoading ? (
                            <div className="text-center py-20 flex flex-col items-center gap-3">
                                <Spinner animation="border" variant="primary" />
                                <p className="mt-2 text-slate-500 font-bold text-sm tracking-wide">{t('roles_page.loading_perms')}</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {filteredMenus.map(menu => {
                                    const perm = selectedPermissions.find(p => p.menu_id === menu.id) || { menu_id: menu.id, can_view: false, can_create: false, can_edit: false, can_delete: false };
                                    const isSub = menu.parent_id !== null;
                                    const isGrandChild = isSub && allMenus.find(m => m.id === menu.parent_id)?.parent_id;

                                    return (
                                        <div
                                            key={menu.id}
                                            className={`group flex flex-col xl:flex-row xl:items-center justify-between p-4 sm:p-5 transition-all rounded-[1.5rem] border border-transparent mb-3 ${perm.can_view ? `bg-white dark:bg-slate-900 border-${brandColor}-200 dark:border-${brandColor}-900 shadow-md transform scale-[1.01]` : 'bg-white/40 dark:bg-slate-800/20 hover:bg-white dark:hover:bg-slate-800 border-slate-100 dark:border-slate-800/50'}`}
                                        >
                                            <div className={`flex items-center flex-1 min-w-0 mb-4 xl:mb-0 transition-all ${isGrandChild ? 'ml-8 sm:ml-12' : (isSub ? 'ml-4 sm:ml-6' : 'ml-0')}`}>
                                                <div className="flex-1 min-w-0 flex items-center gap-4">
                                                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all shadow-sm ${perm.can_view ? `bg-${brandColor}-600 text-white shadow-${brandColor}-500/20` : 'bg-white dark:bg-slate-800 text-slate-400 opacity-60'}`}>
                                                        <i className={`${(menu.icon && menu.icon.includes('fa-')) ? menu.icon : 'fas fa-cube opacity-50'}`}></i>
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-2 flex-wrap mb-1">
                                                            <span className={`truncate leading-none ${!!menu.is_section ? 'font-black uppercase tracking-widest text-[10px] sm:text-xs text-slate-800 dark:text-slate-100' : (!!menu.is_dropdown ? 'font-bold text-slate-700 dark:text-slate-200 text-base' : 'text-slate-700 dark:text-slate-200 font-bold text-base')}`}>
                                                                {menu.title}
                                                            </span>
                                                            <div className="flex gap-1.5">
                                                                {!!menu.is_section ? <span className="px-2 py-0.5 bg-slate-800 text-white text-[8px] rounded-lg font-black uppercase tracking-wider">{t('roles_page.type_group')}</span> : null}
                                                                {!!menu.is_dropdown ? <span className={`px-2 py-0.5 bg-${brandColor}-600 text-white text-[8px] rounded-lg font-black uppercase tracking-wider`}>{t('roles_page.type_expandable')}</span> : null}
                                                            </div>
                                                        </div>
                                                        {menu.path && <p className="text-[10px] text-slate-400 font-mono tracking-tight opacity-70 truncate">{menu.path}</p>}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className={`grid grid-cols-2 sm:grid-cols-4 xl:flex xl:items-center gap-3 sm:gap-4 transition-all ${perm.can_view || !!menu.is_section || !!menu.is_dropdown ? 'opacity-100' : 'opacity-30'}`}>
                                                 <PermissionToggle label={t('roles_page.view')} checked={perm.can_view} onChange={() => handlePermissionToggle(menu.id, 'can_view')} color="blue" brandColor={brandColor} />
                                                 {(!menu.is_section && !menu.is_dropdown) && (
                                                     <>
                                                         <PermissionToggle label={t('roles_page.create')} checked={perm.can_create} onChange={() => handlePermissionToggle(menu.id, 'can_create')} color="emerald" brandColor={brandColor} />
                                                         <PermissionToggle label={t('roles_page.edit')} checked={perm.can_edit} onChange={() => handlePermissionToggle(menu.id, 'can_edit')} color="amber" brandColor={brandColor} />
                                                         <PermissionToggle label={t('roles_page.delete')} checked={perm.can_delete} onChange={() => handlePermissionToggle(menu.id, 'can_delete')} color="rose" brandColor={brandColor} />
                                                     </>
                                                 )}
                                            </div>
                                        </div>
                                    );
                                })}
                                {filteredMenus.length === 0 && (
                                    <div className="py-16 text-center text-slate-400 italic text-sm font-medium">
                                        {t('roles_page.no_results')}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </Modal.Body>
                
                {/* Footer fixed at bottom */}
                <div className="p-4 sm:p-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 flex-shrink-0">
                    <button
                        className="flex-1 sm:flex-none px-8 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-[1.2rem] hover:bg-slate-200 border border-transparent font-black text-[11px] uppercase tracking-widest transition-all"
                        onClick={() => setShowPermsModal(false)}
                    >
                        {t('roles_page.cancel')}
                    </button>
                    <button
                        className={`flex-[2] sm:flex-none px-12 py-4 bg-${brandColor}-600 hover:bg-${brandColor}-700 text-white rounded-[1.2rem] font-black text-[11px] uppercase tracking-widest shadow-xl shadow-${brandColor}-500/25 transition-all flex justify-center items-center gap-3 active:scale-95`}
                        onClick={handleSavePermissions}
                        disabled={permsLoading}
                    >
                        {permsLoading ? <Spinner size="sm" /> : <i className="fas fa-save shadow-sm"></i>}
                        {t('roles_page.sync')}
                    </button>
                </div>
            </Modal>
        </motion.div>
    );
};

export default RolesPermissionsPage;
