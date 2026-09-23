import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getAllMenus,
  createMenu,
  updateMenu,
  deleteMenu,
  getRoles,
  getRolePermissions,
  updateRolePermissions,
  getRoleComparison,
  assignPermissionAction,
  Menu,
  Role,
  RolePermission,
  RoleComparisonData
} from '../../services/apiService';
import {
  FaArrowLeft,
  FaShieldAlt,
  FaKey,
  FaColumns,
  FaPlus,
  FaEdit,
  FaTrash,
  FaEye,
  FaFolderPlus,
  FaSave,
  FaSearch,
  FaFilter,
  FaCheck,
  FaTimes,
  FaLayerGroup,
  FaUserTag,
  FaExclamationTriangle,
  FaSync
} from 'react-icons/fa';

type TabType = 'catalog' | 'role_actions' | 'comparison';

const PermissionsManagementPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Active Tab
  const [activeTab, setActiveTab] = useState<TabType>('catalog');

  // Theme brand color
  const [brandColor, setBrandColor] = useState('blue');
  useEffect(() => {
    const fetchTheme = () => setBrandColor(localStorage.getItem('lms_color') || 'blue');
    fetchTheme();
    window.addEventListener('storage', fetchTheme);
    return () => window.removeEventListener('storage', fetchTheme);
  }, []);

  // Shared Data
  const [menus, setMenus] = useState<Menu[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Fetch initial data
  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [menusData, rolesData] = await Promise.all([
        getAllMenus(),
        getRoles()
      ]);
      setMenus(menusData || []);
      setRoles(rolesData || []);
    } catch (err: any) {
      console.error('Failed to load initial data:', err);
      showToast(err.message || 'Failed to load data', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // ==========================================
  // TAB 1: MODULES & PERMISSIONS CATALOG
  // ==========================================
  const [catalogSearch, setCatalogSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'link' | 'section' | 'dropdown'>('all');
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null);
  const [moduleForm, setModuleForm] = useState({
    title: '',
    path: '',
    icon: '',
    color: 'blue',
    parent_id: '',
    order_index: 0,
    is_section: false,
    is_dropdown: false,
    is_active: true
  });
  const [submittingModule, setSubmittingModule] = useState(false);

  const filteredMenus = useMemo(() => {
    return menus.filter(m => {
      const matchSearch =
        m.title.toLowerCase().includes(catalogSearch.toLowerCase()) ||
        (m.path && m.path.toLowerCase().includes(catalogSearch.toLowerCase()));
      if (!matchSearch) return false;

      if (typeFilter === 'section') return m.is_section;
      if (typeFilter === 'dropdown') return m.is_dropdown;
      if (typeFilter === 'link') return !m.is_section && !m.is_dropdown;
      return true;
    });
  }, [menus, catalogSearch, typeFilter]);

  const handleOpenCreateModal = () => {
    setEditingMenu(null);
    setModuleForm({
      title: '',
      path: '',
      icon: 'fas fa-cog',
      color: 'blue',
      parent_id: '',
      order_index: (menus.length + 1) * 10,
      is_section: false,
      is_dropdown: false,
      is_active: true
    });
    setShowModuleModal(true);
  };

  const handleOpenEditModal = (menu: Menu) => {
    setEditingMenu(menu);
    setModuleForm({
      title: menu.title,
      path: menu.path || '',
      icon: menu.icon || '',
      color: menu.color || 'blue',
      parent_id: menu.parent_id ? String(menu.parent_id) : '',
      order_index: menu.order_index,
      is_section: Boolean(menu.is_section),
      is_dropdown: Boolean(menu.is_dropdown),
      is_active: Boolean(menu.is_active)
    });
    setShowModuleModal(true);
  };

  const handleSaveModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moduleForm.title.trim()) {
      showToast('Module title is required', 'error');
      return;
    }

    setSubmittingModule(true);
    try {
      const payload = {
        title: moduleForm.title.trim(),
        path: moduleForm.path.trim() || null,
        icon: moduleForm.icon.trim() || null,
        color: moduleForm.color || 'blue',
        parent_id: moduleForm.parent_id ? Number(moduleForm.parent_id) : null,
        order_index: Number(moduleForm.order_index) || 0,
        is_section: moduleForm.is_section ? 1 : 0,
        is_dropdown: moduleForm.is_dropdown ? 1 : 0,
        is_active: moduleForm.is_active ? 1 : 0
      };

      if (editingMenu) {
        await updateMenu(editingMenu.id, payload);
        showToast(`Module "${moduleForm.title}" updated successfully`);
      } else {
        await createMenu(payload);
        showToast(`Module "${moduleForm.title}" created successfully`);
      }

      setShowModuleModal(false);
      // Refresh menu list
      const refreshedMenus = await getAllMenus();
      setMenus(refreshedMenus || []);
    } catch (err: any) {
      console.error('Error saving module:', err);
      showToast(err.message || 'Failed to save module', 'error');
    } finally {
      setSubmittingModule(false);
    }
  };

  const handleDeleteModule = async (menu: Menu) => {
    const confirmMessage = `Are you sure you want to delete the permission module "${menu.title}"? This will also revoke all role assignments for this module.`;
    if (!window.confirm(confirmMessage)) return;

    try {
      await deleteMenu(menu.id);
      showToast(`Module "${menu.title}" deleted successfully`);
      setMenus(prev => prev.filter(m => m.id !== menu.id));
    } catch (err: any) {
      console.error('Error deleting module:', err);
      showToast(err.message || 'Failed to delete module', 'error');
    }
  };

  // ==========================================
  // TAB 2: ROLE ACTION ASSIGNMENT
  // ==========================================
  const [selectedRoleId, setSelectedRoleId] = useState<number>(1);
  const [rolePerms, setRolePerms] = useState<RolePermission[]>([]);
  const [loadingRolePerms, setLoadingRolePerms] = useState<boolean>(false);
  const [savingRolePerms, setSavingRolePerms] = useState<boolean>(false);
  const [roleSearchTerm, setRoleSearchTerm] = useState<string>('');

  const loadRolePermissions = async (roleId: number) => {
    setLoadingRolePerms(true);
    try {
      const perms = await getRolePermissions(roleId);
      setRolePerms(perms || []);
    } catch (err: any) {
      console.error('Failed to load role permissions:', err);
      showToast(err.message || 'Failed to load role permissions', 'error');
    } finally {
      setLoadingRolePerms(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'role_actions' && selectedRoleId) {
      loadRolePermissions(selectedRoleId);
    }
  }, [activeTab, selectedRoleId]);

  const handleRoleActionToggle = (menuId: number, field: 'can_view' | 'can_create' | 'can_edit' | 'can_delete') => {
    setRolePerms(prev => {
      const existing = prev.find(p => p.menu_id === menuId);
      if (existing) {
        return prev.map(p =>
          p.menu_id === menuId ? { ...p, [field]: !p[field] } : p
        );
      } else {
        return [
          ...prev,
          {
            menu_id: menuId,
            can_view: field === 'can_view',
            can_create: field === 'can_create',
            can_edit: field === 'can_edit',
            can_delete: field === 'can_delete'
          }
        ];
      }
    });
  };

  const handleApplyPreset = (preset: 'all' | 'view_only' | 'none') => {
    if (preset === 'all') {
      setRolePerms(
        menus.map(m => ({
          menu_id: m.id,
          can_view: true,
          can_create: true,
          can_edit: true,
          can_delete: true
        }))
      );
      showToast('All permissions granted for this role');
    } else if (preset === 'view_only') {
      setRolePerms(
        menus.map(m => ({
          menu_id: m.id,
          can_view: true,
          can_create: false,
          can_edit: false,
          can_delete: false
        }))
      );
      showToast('View-only access applied for this role');
    } else {
      setRolePerms(
        menus.map(m => ({
          menu_id: m.id,
          can_view: false,
          can_create: false,
          can_edit: false,
          can_delete: false
        }))
      );
      showToast('All permissions revoked for this role');
    }
  };

  const handleSaveRolePermissions = async () => {
    setSavingRolePerms(true);
    try {
      const selectedRoleObj = roles.find(r => r.role_id === selectedRoleId);
      await updateRolePermissions(selectedRoleId, rolePerms);
      showToast(`Permissions for role "${selectedRoleObj?.role_name || selectedRoleId}" saved successfully!`);
    } catch (err: any) {
      console.error('Failed to save role permissions:', err);
      showToast(err.message || 'Failed to save role permissions', 'error');
    } finally {
      setSavingRolePerms(false);
    }
  };

  // ==========================================
  // TAB 3: SIDE-BY-SIDE ROLE COMPARISON
  // ==========================================
  const [comparisonData, setComparisonData] = useState<RoleComparisonData | null>(null);
  const [loadingComparison, setLoadingComparison] = useState<boolean>(false);
  const [comparedRoleIds, setComparedRoleIds] = useState<number[]>([]);
  const [showDifferencesOnly, setShowDifferencesOnly] = useState<boolean>(false);
  const [comparisonSearch, setComparisonSearch] = useState<string>('');

  const loadComparison = async (roleIdsToCompare?: number[]) => {
    setLoadingComparison(true);
    try {
      const targetIds = roleIdsToCompare || (roles.length > 0 ? roles.map(r => r.role_id) : undefined);
      const data = await getRoleComparison(targetIds);
      setComparisonData(data);
      if (!roleIdsToCompare || roleIdsToCompare.length === 0) {
        setComparedRoleIds(data.roles.map(r => r.role_id));
      }
    } catch (err: any) {
      console.error('Failed to load comparison data:', err);
      showToast(err.message || 'Failed to load comparison', 'error');
    } finally {
      setLoadingComparison(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'comparison') {
      loadComparison(comparedRoleIds.length > 0 ? comparedRoleIds : undefined);
    }
  }, [activeTab]);

  const toggleComparedRole = (roleId: number) => {
    const updated = comparedRoleIds.includes(roleId)
      ? comparedRoleIds.filter(id => id !== roleId)
      : [...comparedRoleIds, roleId];

    if (updated.length === 0) {
      showToast('Select at least one role to inspect', 'error');
      return;
    }
    setComparedRoleIds(updated);
    loadComparison(updated);
  };

  // Quick inline toggle from comparison view
  const handleInlineActionToggle = async (
    roleId: number,
    menuId: number,
    action: 'can_view' | 'can_create' | 'can_edit' | 'can_delete',
    currentVal: boolean
  ) => {
    const newVal = !currentVal;
    // Optimistic UI update
    if (comparisonData) {
      const updatedMatrix = { ...comparisonData.matrix };
      if (!updatedMatrix[menuId]) updatedMatrix[menuId] = {};
      if (!updatedMatrix[menuId][roleId]) {
        updatedMatrix[menuId][roleId] = { can_view: false, can_create: false, can_edit: false, can_delete: false };
      }
      updatedMatrix[menuId][roleId] = {
        ...updatedMatrix[menuId][roleId],
        [action]: newVal
      };
      setComparisonData({
        ...comparisonData,
        matrix: updatedMatrix
      });
    }

    try {
      await assignPermissionAction(roleId, menuId, action, newVal);
    } catch (err: any) {
      console.error('Failed inline permission toggle:', err);
      showToast('Failed to update permission action', 'error');
      // Revert on failure
      loadComparison(comparedRoleIds);
    }
  };

  // Filter comparison menus
  const filteredComparisonMenus = useMemo(() => {
    if (!comparisonData) return [];
    return comparisonData.menus.filter(m => {
      const matchesSearch =
        m.title.toLowerCase().includes(comparisonSearch.toLowerCase()) ||
        (m.path && m.path.toLowerCase().includes(comparisonSearch.toLowerCase()));
      if (!matchesSearch) return false;

      if (showDifferencesOnly) {
        return comparisonData.differenceMenuIds.includes(m.id);
      }
      return true;
    });
  }, [comparisonData, comparisonSearch, showDifferencesOnly]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 px-4 sm:px-6 lg:px-10 py-6 sm:py-8"
    >
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-xl backdrop-blur-md flex items-center gap-3 border ${
              toastMessage.type === 'error'
                ? 'bg-rose-500/90 text-white border-rose-600'
                : 'bg-emerald-600/90 text-white border-emerald-700'
            }`}
          >
            {toastMessage.type === 'error' ? <FaExclamationTriangle /> : <FaCheck />}
            <span className="text-sm font-semibold">{toastMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Bar with Back Button & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all shadow-sm"
          >
            <FaArrowLeft className="text-xs" />
            <span>{t('common.back', 'Back')}</span>
          </button>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <span>Administration</span>
            <span>/</span>
            <span className="text-indigo-600 dark:text-indigo-400">Permission & Access Management</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setRefreshing(true);
              loadInitialData();
              if (activeTab === 'role_actions') loadRolePermissions(selectedRoleId);
              if (activeTab === 'comparison') loadComparison(comparedRoleIds);
            }}
            disabled={refreshing}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shadow-sm"
          >
            <FaSync className={`text-xs ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/30 transition-all"
          >
            <FaPlus className="text-xs" />
            <span>Add Module</span>
          </button>
        </div>
      </div>

      {/* Page Header & Statistics Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/40 mb-2">
              <FaShieldAlt className="text-xs" />
              Role-Based Access Control (RBAC)
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              Permission & Module Suite
            </h1>
            <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 max-w-2xl">
              Create and manage system modules, configure role access permissions (View, Create, Edit, Delete), and perform live side-by-side role comparisons.
            </p>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4 flex-shrink-0">
            <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Modules</span>
              <span className="text-xl sm:text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">{menus.length}</span>
            </div>
            <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Active Roles</span>
              <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{roles.length}</span>
            </div>
            <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Discrepancies</span>
              <span className="text-xl sm:text-2xl font-black text-amber-500 mt-1">
                {comparisonData ? comparisonData.differenceMenuIds.length : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
              activeTab === 'catalog'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <FaLayerGroup className="text-sm" />
            <span>1. Modules & Permissions Catalog</span>
            <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === 'catalog' ? 'bg-indigo-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
              {menus.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('role_actions')}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
              activeTab === 'role_actions'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <FaKey className="text-sm" />
            <span>2. Role Action Assignment</span>
          </button>

          <button
            onClick={() => setActiveTab('comparison')}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
              activeTab === 'comparison'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <FaColumns className="text-sm" />
            <span>3. Role Permission Comparison</span>
            {comparisonData && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-amber-400/20 text-amber-500 font-black">
                {comparisonData.differenceMenuIds.length} diffs
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: MODULES & PERMISSIONS CATALOG */}
      {/* ========================================================================= */}
      {activeTab === 'catalog' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="relative flex-1 max-w-md">
              <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
              <input
                type="text"
                value={catalogSearch}
                onChange={e => setCatalogSearch(e.target.value)}
                placeholder="Search modules by title or path..."
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all dark:text-white"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1 mr-1">
                <FaFilter className="text-[9px]" /> Type:
              </span>
              {(['all', 'link', 'section', 'dropdown'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all ${
                    typeFilter === type
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {type === 'all' ? 'All' : type === 'link' ? 'Links' : type === 'section' ? 'Sections' : 'Dropdowns'}
                </button>
              ))}
            </div>
          </div>

          {/* Modules Table */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/70 dark:bg-slate-800/40 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-200 dark:border-slate-800">
                    <th className="px-6 py-4">ID</th>
                    <th className="px-6 py-4">Module Title & Path</th>
                    <th className="px-6 py-4">Hierarchy</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4 text-center">Order</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs font-semibold">
                  {filteredMenus.map(menu => {
                    const parentMenu = menu.parent_id ? menus.find(m => m.id === menu.parent_id) : null;
                    return (
                      <tr
                        key={menu.id}
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all group"
                      >
                        <td className="px-6 py-4 text-slate-400 font-mono">#{String(menu.id).padStart(3, '0')}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs border border-indigo-100 dark:border-indigo-900/40">
                              <i className={menu.icon || 'fas fa-cube'} />
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                {menu.title}
                                {menu.color && (
                                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: menu.color }} />
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                                {menu.path || '<no direct path>'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {parentMenu ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-medium border border-slate-200 dark:border-slate-700">
                              ↳ {parentMenu.title}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Root Level</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {menu.is_section ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800/40">
                              Section Header
                            </span>
                          ) : menu.is_dropdown ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/40">
                              Dropdown Group
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                              Standard Route
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center font-mono text-slate-500 dark:text-slate-400">
                          {menu.order_index}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              menu.is_active
                                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${menu.is_active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                            {menu.is_active ? 'Active' : 'Disabled'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEditModal(menu)}
                              className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/50 border border-amber-200/60 dark:border-amber-800/30 transition-all"
                              title="Edit Module"
                            >
                              <FaEdit className="text-xs" />
                            </button>
                            <button
                              onClick={() => handleDeleteModule(menu)}
                              className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-200/60 dark:border-rose-800/30 transition-all"
                              title="Delete Module"
                            >
                              <FaTrash className="text-xs" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredMenus.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-slate-400 italic">
                        No modules found matching the criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ROLE ACTION ASSIGNMENT */}
      {/* ========================================================================= */}
      {activeTab === 'role_actions' && (
        <div className="space-y-6">
          {/* Role Picker & Presets */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">
                  Select Role to Configure
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {roles.map(role => (
                    <button
                      key={role.role_id}
                      onClick={() => setSelectedRoleId(role.role_id)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all ${
                        selectedRoleId === role.role_id
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      <FaUserTag className="text-xs" />
                      <span>{role.role_name}</span>
                      <span className="text-[10px] opacity-70">#{role.role_id}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Presets */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mr-1">
                  Bulk Presets:
                </span>
                <button
                  onClick={() => handleApplyPreset('all')}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-all"
                >
                  Grant Full Access
                </button>
                <button
                  onClick={() => handleApplyPreset('view_only')}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 transition-all"
                >
                  View Only
                </button>
                <button
                  onClick={() => handleApplyPreset('none')}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 transition-all"
                >
                  Revoke All
                </button>
                <button
                  onClick={handleSaveRolePermissions}
                  disabled={savingRolePerms}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/30 transition-all ml-2"
                >
                  <FaSave className="text-xs" />
                  <span>{savingRolePerms ? 'Saving...' : 'Save Permissions'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Role Permissions Matrix Table */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="relative max-w-sm w-full">
                <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                <input
                  type="text"
                  value={roleSearchTerm}
                  onChange={e => setRoleSearchTerm(e.target.value)}
                  placeholder="Filter permissions..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none dark:text-white"
                />
              </div>
              <div className="text-xs font-semibold text-slate-400">
                Configuring permissions for:{' '}
                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                  {roles.find(r => r.role_id === selectedRoleId)?.role_name || 'Selected Role'}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/70 dark:bg-slate-800/40 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-200 dark:border-slate-800">
                    <th className="px-6 py-4">Module / Feature</th>
                    <th className="px-6 py-4 text-center">👁️ View (Read)</th>
                    <th className="px-6 py-4 text-center">➕ Create (Add)</th>
                    <th className="px-6 py-4 text-center">✏️ Edit (Update)</th>
                    <th className="px-6 py-4 text-center">🗑️ Delete (Remove)</th>
                    <th className="px-6 py-4 text-right">Row Quick Toggle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                  {menus
                    .filter(m =>
                      m.title.toLowerCase().includes(roleSearchTerm.toLowerCase()) ||
                      (m.path && m.path.toLowerCase().includes(roleSearchTerm.toLowerCase()))
                    )
                    .map(menu => {
                      const perm = rolePerms.find(p => p.menu_id === menu.id);
                      const canView = Boolean(perm?.can_view);
                      const canCreate = Boolean(perm?.can_create);
                      const canEdit = Boolean(perm?.can_edit);
                      const canDelete = Boolean(perm?.can_delete);

                      const isFull = canView && canCreate && canEdit && canDelete;

                      return (
                        <tr
                          key={menu.id}
                          className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all"
                        >
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                              <i className={`${menu.icon || 'fas fa-circle'} text-xs text-indigo-500`} />
                              {menu.title}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                              {menu.path || '<container/header>'}
                            </div>
                          </td>

                          {/* CAN VIEW */}
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => handleRoleActionToggle(menu.id, 'can_view')}
                              className={`w-9 h-9 rounded-xl inline-flex items-center justify-center transition-all ${
                                canView
                                  ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 hover:bg-slate-200'
                              }`}
                              title="Toggle View Permission"
                            >
                              <FaEye className="text-xs" />
                            </button>
                          </td>

                          {/* CAN CREATE */}
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => handleRoleActionToggle(menu.id, 'can_create')}
                              className={`w-9 h-9 rounded-xl inline-flex items-center justify-center transition-all ${
                                canCreate
                                  ? 'bg-blue-500 text-white shadow-sm shadow-blue-500/30'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 hover:bg-slate-200'
                              }`}
                              title="Toggle Create Permission"
                            >
                              <FaPlus className="text-xs" />
                            </button>
                          </td>

                          {/* CAN EDIT */}
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => handleRoleActionToggle(menu.id, 'can_edit')}
                              className={`w-9 h-9 rounded-xl inline-flex items-center justify-center transition-all ${
                                canEdit
                                  ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/30'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 hover:bg-slate-200'
                              }`}
                              title="Toggle Edit Permission"
                            >
                              <FaEdit className="text-xs" />
                            </button>
                          </td>

                          {/* CAN DELETE */}
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => handleRoleActionToggle(menu.id, 'can_delete')}
                              className={`w-9 h-9 rounded-xl inline-flex items-center justify-center transition-all ${
                                canDelete
                                  ? 'bg-rose-500 text-white shadow-sm shadow-rose-500/30'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 hover:bg-slate-200'
                              }`}
                              title="Toggle Delete Permission"
                            >
                              <FaTrash className="text-xs" />
                            </button>
                          </td>

                          {/* Row Quick Toggle */}
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => {
                                const targetState = !isFull;
                                setRolePerms(prev => {
                                  const filtered = prev.filter(p => p.menu_id !== menu.id);
                                  return [
                                    ...filtered,
                                    {
                                      menu_id: menu.id,
                                      can_view: targetState,
                                      can_create: targetState,
                                      can_edit: targetState,
                                      can_delete: targetState
                                    }
                                  ];
                                });
                              }}
                              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                                isFull
                                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-rose-100 hover:text-rose-600'
                                  : 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100'
                              }`}
                            >
                              {isFull ? 'Clear All' : 'Select All'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: SIDE-BY-SIDE ROLE COMPARISON */}
      {/* ========================================================================= */}
      {activeTab === 'comparison' && (
        <div className="space-y-6">
          {/* Comparison Header & Role Selectors */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">
                  Compare Roles Side-by-Side (Select Roles)
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {roles.map(role => {
                    const isSelected = comparedRoleIds.includes(role.role_id);
                    return (
                      <button
                        key={role.role_id}
                        onClick={() => toggleComparedRole(role.role_id)}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-black uppercase tracking-wider transition-all border ${
                          isSelected
                            ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border-indigo-400 shadow-sm'
                            : 'bg-slate-50 dark:bg-slate-800/60 text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100'
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${isSelected ? 'bg-indigo-500' : 'bg-slate-400'}`}
                        />
                        <span>{role.role_name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Filters & Toggles */}
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={() => setShowDifferencesOnly(!showDifferencesOnly)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all ${
                    showDifferencesOnly
                      ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  <FaExclamationTriangle className="text-xs" />
                  <span>Show Differences Only</span>
                  {comparisonData && (
                    <span className="px-1.5 py-0.5 rounded-full bg-black/20 text-[10px]">
                      {comparisonData.differenceMenuIds.length}
                    </span>
                  )}
                </button>

                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                  <input
                    type="text"
                    value={comparisonSearch}
                    onChange={e => setComparisonSearch(e.target.value)}
                    placeholder="Search in comparison..."
                    className="pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none dark:text-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Comparison Matrix Table */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/70 dark:bg-slate-800/40 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-200 dark:border-slate-800">
                    <th className="px-6 py-4 min-w-[220px]">Permission / Module</th>
                    {comparisonData?.roles.map(role => (
                      <th key={role.role_id} className="px-6 py-4 text-center min-w-[200px]">
                        <div className="font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                          {role.role_name}
                        </div>
                        <div className="text-[9px] text-slate-400 font-mono">
                          [View / Create / Edit / Delete]
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                  {filteredComparisonMenus.map(menu => {
                    const isDifferent = comparisonData?.differenceMenuIds.includes(menu.id);

                    return (
                      <tr
                        key={menu.id}
                        className={`transition-all ${
                          isDifferent
                            ? 'bg-amber-50/30 dark:bg-amber-950/10 hover:bg-amber-50/60 dark:hover:bg-amber-950/20'
                            : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/30'
                        }`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {isDifferent && (
                              <span
                                className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"
                                title="Permissions differ across roles"
                              />
                            )}
                            <span className="font-bold text-slate-900 dark:text-white">{menu.title}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                            {menu.path || '<container>'}
                          </div>
                        </td>

                        {/* Each compared role's actions */}
                        {comparisonData?.roles.map(role => {
                          const val = comparisonData.matrix[menu.id]?.[role.role_id] || {
                            can_view: false,
                            can_create: false,
                            can_edit: false,
                            can_delete: false
                          };

                          return (
                            <td key={role.role_id} className="px-6 py-4 text-center">
                              <div className="inline-flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
                                {/* V badge */}
                                <button
                                  onClick={() =>
                                    handleInlineActionToggle(role.role_id, menu.id, 'can_view', val.can_view)
                                  }
                                  className={`w-7 h-7 rounded-xl text-[10px] font-black uppercase inline-flex items-center justify-center transition-all ${
                                    val.can_view
                                      ? 'bg-emerald-500 text-white shadow-sm'
                                      : 'text-slate-300 dark:text-slate-600 hover:text-slate-400'
                                  }`}
                                  title="View"
                                >
                                  V
                                </button>

                                {/* C badge */}
                                <button
                                  onClick={() =>
                                    handleInlineActionToggle(role.role_id, menu.id, 'can_create', val.can_create)
                                  }
                                  className={`w-7 h-7 rounded-xl text-[10px] font-black uppercase inline-flex items-center justify-center transition-all ${
                                    val.can_create
                                      ? 'bg-blue-500 text-white shadow-sm'
                                      : 'text-slate-300 dark:text-slate-600 hover:text-slate-400'
                                  }`}
                                  title="Create"
                                >
                                  C
                                </button>

                                {/* E badge */}
                                <button
                                  onClick={() =>
                                    handleInlineActionToggle(role.role_id, menu.id, 'can_edit', val.can_edit)
                                  }
                                  className={`w-7 h-7 rounded-xl text-[10px] font-black uppercase inline-flex items-center justify-center transition-all ${
                                    val.can_edit
                                      ? 'bg-amber-500 text-white shadow-sm'
                                      : 'text-slate-300 dark:text-slate-600 hover:text-slate-400'
                                  }`}
                                  title="Edit"
                                >
                                  E
                                </button>

                                {/* D badge */}
                                <button
                                  onClick={() =>
                                    handleInlineActionToggle(role.role_id, menu.id, 'can_delete', val.can_delete)
                                  }
                                  className={`w-7 h-7 rounded-xl text-[10px] font-black uppercase inline-flex items-center justify-center transition-all ${
                                    val.can_delete
                                      ? 'bg-rose-500 text-white shadow-sm'
                                      : 'text-slate-300 dark:text-slate-600 hover:text-slate-400'
                                  }`}
                                  title="Delete"
                                >
                                  D
                                </button>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                  {filteredComparisonMenus.length === 0 && (
                    <tr>
                      <td
                        colSpan={(comparisonData?.roles.length || 0) + 1}
                        className="text-center py-12 text-slate-400 italic"
                      >
                        {showDifferencesOnly
                          ? '🎉 No differences found across the selected roles!'
                          : 'No modules found matching comparison filters.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT MODULE */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showModuleModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
            >
              {/* Modal Header */}
              <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-sm font-bold border border-indigo-100 dark:border-indigo-900/40">
                    <FaFolderPlus />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900 dark:text-white">
                      {editingMenu ? `Edit Module "${editingMenu.title}"` : 'Create New Permission Module'}
                    </h2>
                    <p className="text-xs text-slate-400">
                      Configure module routing, hierarchy, and visibility.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModuleModal(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                >
                  <FaTimes />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleSaveModule} className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Title */}
                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 block mb-1">
                      Module Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={moduleForm.title}
                      onChange={e => setModuleForm({ ...moduleForm, title: e.target.value })}
                      placeholder="e.g. Appointment Management"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:text-white"
                    />
                  </div>

                  {/* Path */}
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 block mb-1">
                      Route Path
                    </label>
                    <input
                      type="text"
                      value={moduleForm.path}
                      onChange={e => setModuleForm({ ...moduleForm, path: e.target.value })}
                      placeholder="e.g. /services/review"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:text-white"
                    />
                  </div>

                  {/* Icon */}
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 block mb-1">
                      Icon (FontAwesome / Class)
                    </label>
                    <input
                      type="text"
                      value={moduleForm.icon}
                      onChange={e => setModuleForm({ ...moduleForm, icon: e.target.value })}
                      placeholder="e.g. fas fa-cut"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:text-white"
                    />
                  </div>

                  {/* Parent Module */}
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 block mb-1">
                      Parent Module (Hierarchy)
                    </label>
                    <select
                      value={moduleForm.parent_id}
                      onChange={e => setModuleForm({ ...moduleForm, parent_id: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:text-white"
                    >
                      <option value="">None (Top-Level Root)</option>
                      {menus
                        .filter(m => !editingMenu || m.id !== editingMenu.id)
                        .map(m => (
                          <option key={m.id} value={m.id}>
                            {m.title} (#{m.id})
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Order Index */}
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 block mb-1">
                      Sort Order Index
                    </label>
                    <input
                      type="number"
                      value={moduleForm.order_index}
                      onChange={e => setModuleForm({ ...moduleForm, order_index: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:text-white"
                    />
                  </div>
                </div>

                {/* Toggles */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-3">
                  <label className="flex items-center gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={moduleForm.is_section}
                      onChange={e => setModuleForm({ ...moduleForm, is_section: e.target.checked })}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Section Header</span>
                  </label>

                  <label className="flex items-center gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={moduleForm.is_dropdown}
                      onChange={e => setModuleForm({ ...moduleForm, is_dropdown: e.target.checked })}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Dropdown Parent</span>
                  </label>

                  <label className="flex items-center gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={moduleForm.is_active}
                      onChange={e => setModuleForm({ ...moduleForm, is_active: e.target.checked })}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Active Status</span>
                  </label>
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowModuleModal(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingModule}
                    className="px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/30 transition-all"
                  >
                    {submittingModule ? 'Saving...' : editingMenu ? 'Save Changes' : 'Create Module'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default PermissionsManagementPage;
