import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getMyNavigation, deleteMenu, Menu } from '../../services/apiService';
import { useAuth } from '../Auth/AuthContext';

interface VerticalNavbarProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

interface NavSectionItem {
  id?: number | string;
  title: string;
  path: string;
  icon?: string;
  color?: string;
  badge?: string;
}

interface NavSectionGroup {
  id: string;
  title: string;
  icon: string;
  basePath: string;
  color: string;
  items: NavSectionItem[];
}

type NavEntry = 
  | { type: 'divider'; title: string }
  | { type: 'item'; item: NavSectionItem }
  | { type: 'group'; group: NavSectionGroup };

const VerticalNavbar: React.FC<VerticalNavbarProps> = ({ isSidebarOpen, toggleSidebar }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [logo, setLogo] = useState<string | null>(null);
  const [activeColor, setActiveColor] = useState('indigo');

  // Role details â€” must match ROLES constants: Admin=1, Barber=2, Customer=3, Manager=4, Receptionist=5
  const roleId = user ? Number(user.role_id) : 0;
  const getRolePrefix = () => {
    if (roleId === 1) return 'admin';
    if (roleId === 2) return 'barber';       // ROLES.BARBER = 2
    if (roleId === 3) return 'customer';     // ROLES.CUSTOMER = 3
    if (roleId === 4) return 'manager';      // ROLES.MANAGER = 4
    if (roleId === 5) return 'receptionist'; // ROLES.RECEPTIONIST = 5
    return 'user';
  };
  const rolePrefix = getRolePrefix();

  // Helper to translate menu titles if they exist in locales
  const translateTitle = (title: string) => {
    const key = `menu.${title.toLowerCase().replace(/\s+/g, '_')}`;
    return t(key, title);
  };

  useEffect(() => {
    const fetchSettings = () => {
      const savedLogo = localStorage.getItem('lms_logo_preview');
      if (savedLogo) setLogo(savedLogo);
      
      const savedColor = localStorage.getItem('lms_color');
      if (savedColor) setActiveColor(savedColor);
    };
    fetchSettings();
    window.addEventListener('storage', fetchSettings);
    return () => window.removeEventListener('storage', fetchSettings);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchMenus = async () => {
      try {
        const data = await getMyNavigation();
        if (isMounted) {
          // Filter out any legacy non-barber menu items just in case
          const allowedKeywords = [
            'dashboard', 'service', 'booking', 'queue', 'user', 'role', 
            'permission', 'overview', 'analytic', 'rate', 'categor', 'availab'
          ];
          const filtered = (data || []).filter((m: Menu) => {
            if (!m.is_active) return false;
            const titleLower = (m.title || '').toLowerCase();
            const pathLower = (m.path || '').toLowerCase();
            return allowedKeywords.some(kw => titleLower.includes(kw) || pathLower.includes(kw));
          });
          setMenus(filtered);
        }
      } catch (error: any) {
        if (error?.message?.includes('Session invalidated') || error?.status === 401) {
          return;
        }
        console.error("Failed to fetch menus", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchMenus();
    return () => { isMounted = false; };
  }, [roleId]);

  // Reusable Icon Renderer
  const renderIcon = (icon?: string) => {
    if (!icon) {
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      );
    }
    const isSvg = icon.trim().startsWith('<svg');
    return isSvg ? (
      <div className="w-4 h-4 flex items-center justify-center icon-svg-container" dangerouslySetInnerHTML={{ __html: icon }} />
    ) : (
      <i className={`${icon} text-sm`}></i>
    );
  };

  const getNavLinkClass = ({ isActive }: { isActive: boolean }) => {
    const base = `flex items-center ${isSidebarOpen ? 'px-3.5' : 'justify-center px-2'} py-2.5 text-sm font-medium transition-all duration-200 rounded-xl mx-2 my-0.5 group relative`;
    if (isActive) {
      return `${base} bg-indigo-600/30 text-white font-semibold shadow-sm border border-indigo-500/30 backdrop-blur-sm`;
    }
    return `${base} text-slate-300 hover:text-white hover:bg-white/10`;
  };

  const SectionDivider = ({ title }: { title: string }) => (
    <div className={`px-5 mt-5 mb-2 transition-opacity duration-300 ${!isSidebarOpen ? 'hidden' : 'block'}`}>
      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-heading">{translateTitle(title)}</p>
    </div>
  );

  const NavItem = ({ to, title, icon }: { to: string, title: string, icon?: string }) => (
    <li className="mb-0.5 px-2">
      <NavLink
        to={to}
        className={getNavLinkClass}
        title={!isSidebarOpen ? translateTitle(title) : ''}
      >
        {({ isActive }) => (
          <>
            <div className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 ${isActive ? `bg-indigo-600 text-white shadow-md shadow-indigo-500/40` : `bg-white/10 text-slate-300 group-hover:bg-indigo-600 group-hover:text-white`}`}>
              {renderIcon(icon)}
            </div>
            <span className={`ml-3 transition-all duration-300 ${!isSidebarOpen ? 'hidden w-0 opacity-0' : 'block opacity-100 font-medium whitespace-nowrap overflow-hidden text-sm'}`}>
              {translateTitle(title)}
            </span>
            {!isSidebarOpen && (
              <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-xl border border-slate-700/80 transition-opacity">
                {translateTitle(title)}
              </div>
            )}
          </>
        )}
      </NavLink>
    </li>
  );

  const Dropdown = ({ title, icon, basePath, children }: { title: string, icon?: string, basePath: string, children: React.ReactNode }) => {
    // Check if current route matches this dropdown
    const isCurrentActive = location.pathname.startsWith(basePath);
    const [isOpen, setIsOpen] = useState(isCurrentActive);

    useEffect(() => {
      if (isCurrentActive) {
        setIsOpen(true);
      }
    }, [isCurrentActive]);

    if (!isSidebarOpen) {
      return (
        <li className="mb-1 px-2 relative group">
          <Link
            to={basePath}
            className={`w-full flex justify-center py-2.5 rounded-xl transition-all text-slate-200 ${isCurrentActive ? 'bg-indigo-600/30' : 'hover:bg-white/10'}`}
          >
            <div className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all ${isCurrentActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'bg-white/10 text-slate-300 group-hover:bg-indigo-600 group-hover:text-white'}`}>
              {renderIcon(icon)}
            </div>
          </Link>
          <div className="absolute left-full top-2 ml-2 px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-xl border border-slate-700/80">
            {translateTitle(title)}
          </div>
        </li>
      );
    }

    return (
      <li className="mb-1 px-2">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 text-sm font-medium transition-all duration-200 rounded-xl group
            ${isCurrentActive ? 'text-white bg-indigo-600/20 border border-indigo-500/30' : 'text-slate-300 hover:text-white hover:bg-white/10'}`}
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <div className={`flex items-center justify-center h-8 w-8 min-w-[32px] rounded-lg transition-all ${isCurrentActive ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30' : 'bg-white/10 text-slate-300 group-hover:bg-indigo-600 group-hover:text-white'}`}>
              {renderIcon(icon)}
            </div>
            <span className="font-semibold whitespace-nowrap overflow-hidden text-sm">{translateTitle(title)}</span>
          </div>
          <svg
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-90 text-indigo-400' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
          <ul className="pl-3 border-l-2 border-slate-800 ml-6 space-y-0.5 pt-1 pb-1">
            {children}
          </ul>
        </div>
      </li>
    );
  };

  const DropdownItem = ({ title, to }: { title: string, to: string }) => {
    return (
      <li className="group relative">
        <NavLink
          to={to}
          className={({ isActive }) => `flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-all duration-150
            ${isActive 
              ? 'text-indigo-400 font-semibold bg-indigo-600/20 border-l-2 border-indigo-500' 
              : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
        >
          {({ isActive }) => (
            <span className="flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-indigo-400' : 'bg-slate-600 group-hover:bg-slate-400'}`}></span>
              {translateTitle(title)}
            </span>
          )}
        </NavLink>
      </li>
    );
  };

  // Build permitted navigation structure per role
  const getRoleNavigation = (): NavEntry[] => {
    // -------------------------------------------------------------
    // ROLE 1: ADMIN - Full Professional Barber Management
    // -------------------------------------------------------------
    if (roleId === 1) {
      return [
        { type: 'divider', title: 'Main' },
        {
          type: 'group',
          group: {
            id: 'admin-dashboard',
            title: 'Dashboard',
            basePath: '/admin/dashboard',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M0 1.5A1.5 1.5 0 0 1 1.5 0h13A1.5 1.5 0 0 1 16 1.5v13a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 0 14.5v-13zM1.5 1a.5.5 0 0 0-.5.5V5h4V1H1.5zM5 6H1v3h4V6zm1 4h4V6H6v4zm-1 1H1v3.5a.5.5 0 0 0 .5.5H5v-4zm1 0v4h4v-4H6zm5 0v4h3.5a.5.5 0 0 0 .5-.5V11h-4zm0-1h4V6h-4v4zm0-5h4V1.5a.5.5 0 0 0-.5-.5H11v4zm-1 0V1H6v4h4z"/></svg>',
            color: 'indigo',
            items: [
              { title: 'Overview', path: '/admin/dashboard/overview' },
              { title: 'Analytics', path: '/admin/dashboard/analytics' },
            ]
          }
        },
        { type: 'divider', title: 'Barber Services' },
        {
          type: 'group',
          group: {
            id: 'admin-services',
            title: 'Services Management',
            basePath: '/admin/services',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M1 2a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2zm5 0a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V2zm5 0a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1V2zM1 7a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V7zm5 0a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7zm5 0a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1V7zM1 12a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1v-2zm5 0a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-2zm5 0a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-2z"/></svg>',
            color: 'blue',
            items: [
              { title: 'All Services', path: '/admin/services' },
              { title: 'Service Categories', path: '/admin/categories' },
              { title: 'Availability Management', path: '/admin/services/availability' },
            ]
          }
        },
        {
          type: 'group',
          group: {
            id: 'admin-appointments',
            title: 'Appointments & Operations',
            basePath: `/${rolePrefix}/services`,
            icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z"/></svg>',
            color: 'cyan',
            items: [
              { title: 'Book Service', path: `/${rolePrefix}/services/book` },
              { title: 'Review Bookings', path: '/admin/services/review' },
              { title: 'Queue Management', path: '/admin/services/queue' },
              { title: 'Rate Service', path: `/${rolePrefix}/rate-services` },
            ]
          }
        },
        { type: 'divider', title: 'Administration' },
        {
          type: 'group',
          group: {
            id: 'admin-access',
            title: 'Users & Permissions',
            basePath: '/admin/users',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/></svg>',
            color: 'purple',
            items: [
              { title: 'All Users', path: '/admin/users/all' },
              { title: 'Add User', path: '/admin/users/add' },
              { title: 'Manage Employees', path: '/admin/users/manage-employees' },
              { title: 'Roles Management', path: '/admin/users/roles' },
              { title: 'Permission Center', path: '/admin/users/permissions' },
            ]
          }
        },
      ];
    }

    // ---------------------------------------------------------------
    // ROLE 2: BARBER â€” Station, Queue, Bookings  (ROLES.BARBER = 2)
    // ---------------------------------------------------------------
    if (roleId === 2) {
      return [
        { type: 'divider', title: 'Main' },
        {
          type: 'item',
          item: {
            title: 'Overview',
            path: '/barber/dashboard/overview',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M0 1.5A1.5 1.5 0 0 1 1.5 0h13A1.5 1.5 0 0 1 16 1.5v13a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 0 14.5v-13z"/></svg>',
          }
        },
        { type: 'divider', title: 'Operations' },
        {
          type: 'item',
          item: {
            title: 'Queue Management',
            path: '/barber/services/queue',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M3 9.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/></svg>',
          }
        },
        {
          type: 'item',
          item: {
            title: 'Browse Services',
            path: '/barber/services',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M4 .5a.5.5 0 0 0-1 0V1H2a2 2 0 0 0-2 2v1h16V3a2 2 0 0 0-2-2h-1V.5a.5.5 0 0 0-1 0V1H4V.5zM16 14V5H0v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2z"/></svg>',
          }
        },
        {
          type: 'item',
          item: {
            title: 'Book Service',
            path: `/${rolePrefix}/services/book`,
            icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z"/><path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/></svg>',
          }
        },
        {
          type: 'item',
          item: {
            title: 'Rate Service',
            path: `/${rolePrefix}/rate-services`,
            icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.283.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z"/></svg>',
          }
        },
      ];
    }

    // ---------------------------------------------------------------
    // ROLE 3: CUSTOMER â€” Self-service Experience  (ROLES.CUSTOMER = 3)
    // ---------------------------------------------------------------
    if (roleId === 3) {
      return [
        { type: 'divider', title: 'Customer Portal' },
        {
          type: 'item',
          item: {
            title: 'My Dashboard',
            path: '/customer/dashboard/overview',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M0 1.5A1.5 1.5 0 0 1 1.5 0h13A1.5 1.5 0 0 1 16 1.5v13a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 0 14.5v-13z"/></svg>',
          }
        },
        {
          type: 'item',
          item: {
            title: 'Browse Services',
            path: '/customer/services',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M4 .5a.5.5 0 0 0-1 0V1H2a2 2 0 0 0-2 2v1h16V3a2 2 0 0 0-2-2h-1V.5a.5.5 0 0 0-1 0V1H4V.5zM16 14V5H0v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2z"/></svg>',
          }
        },
        {
          type: 'item',
          item: {
            title: 'Book Service',
            path: `/${rolePrefix}/services/book`,
            icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z"/><path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/></svg>',
          }
        },
        {
          type: 'item',
          item: {
            title: 'Rate Service',
            path: `/${rolePrefix}/rate-services`,
            icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.283.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z"/></svg>',
          }
        },
        {
          type: 'item',
          item: {
            title: 'Track Booking',
            path: `/${rolePrefix}/track-booking`,
            icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z"/></svg>',
          }
        },
      ];
    }

    // ---------------------------------------------------------------
    // ROLE 4: MANAGER â€” Operations, Services, Staff, Analytics  (ROLES.MANAGER = 4)
    // ---------------------------------------------------------------
    if (roleId === 4) {
      return [
        { type: 'divider', title: 'Main' },
        {
          type: 'group',
          group: {
            id: 'mgr-dashboard',
            title: 'Dashboard',
            basePath: '/manager/dashboard',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M0 1.5A1.5 1.5 0 0 1 1.5 0h13A1.5 1.5 0 0 1 16 1.5v13a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 0 14.5v-13z"/></svg>',
            color: 'indigo',
            items: [
              { title: 'Overview', path: '/manager/dashboard/overview' },
              { title: 'Analytics', path: '/manager/dashboard/analytics' },
            ]
          }
        },
        { type: 'divider', title: 'Barber Services' },
        {
          type: 'group',
          group: {
            id: 'mgr-services',
            title: 'Services Management',
            basePath: '/manager/services',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M1 2a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2z"/></svg>',
            color: 'blue',
            items: [
              { title: 'All Services', path: '/manager/services' },
              { title: 'Service Categories', path: '/manager/categories' },
              { title: 'Availability Management', path: '/manager/services/availability' },
            ]
          }
        },
        {
          type: 'group',
          group: {
            id: 'mgr-appointments',
            title: 'Appointments & Operations',
            basePath: `/${rolePrefix}/services`,
            icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z"/></svg>',
            color: 'cyan',
            items: [
              { title: 'Book Service', path: `/${rolePrefix}/services/book` },
              { title: 'Review Bookings', path: '/manager/services/review' },
              { title: 'Queue Management', path: '/manager/services/queue' },
              { title: 'Rate Service', path: `/${rolePrefix}/rate-services` },
            ]
          }
        },
        { type: 'divider', title: 'Team' },
        {
          type: 'item',
          item: {
            title: 'Manage Employees',
            path: '/manager/users/manage-employees',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M7 14s-1 0-1-1 1-4 5-4 5 3 5 4-1 1-1 1H7zm4-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/></svg>',
          }
        },
      ];
    }

    // ---------------------------------------------------------------
    // ROLE 5: RECEPTIONIST â€” Walk-ins, Bookings, Queue  (ROLES.RECEPTIONIST = 5)
    // ---------------------------------------------------------------
    if (roleId === 5) {
      return [
        { type: 'divider', title: 'Main' },
        {
          type: 'item',
          item: {
            title: 'Overview',
            path: '/receptionist/dashboard/overview',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M0 1.5A1.5 1.5 0 0 1 1.5 0h13A1.5 1.5 0 0 1 16 1.5v13a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 0 14.5v-13z"/></svg>',
          }
        },
        { type: 'divider', title: 'Front Desk' },
        {
          type: 'item',
          item: {
            title: 'Review Bookings',
            path: '/receptionist/services/review',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z"/></svg>',
          }
        },
        {
          type: 'item',
          item: {
            title: 'Queue Management',
            path: '/receptionist/services/queue',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M3 9.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/></svg>',
          }
        },
        {
          type: 'item',
          item: {
            title: 'Book Service',
            path: `/${rolePrefix}/services/book`,
            icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z"/><path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/></svg>',
          }
        },
        {
          type: 'item',
          item: {
            title: 'Browse Services',
            path: '/receptionist/services',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M4 .5a.5.5 0 0 0-1 0V1H2a2 2 0 0 0-2 2v1h16V3a2 2 0 0 0-2-2h-1V.5a.5.5 0 0 0-1 0V1H4V.5zM16 14V5H0v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2z"/></svg>',
          }
        },
        {
          type: 'item',
          item: {
            title: 'Rate Service',
            path: `/${rolePrefix}/rate-services`,
            icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.283.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z"/></svg>',
          }
        },
      ];
    }

    // Default fallback (unknown role â€” show generic customer nav)
    return [
      { type: 'divider', title: 'Customer Portal' },
      {
        type: 'item',
        item: {
          title: 'My Dashboard',
          path: `/${rolePrefix}/dashboard/overview`,
          icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M0 1.5A1.5 1.5 0 0 1 1.5 0h13A1.5 1.5 0 0 1 16 1.5v13a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 0 14.5v-13z"/></svg>',
        }
      },
      {
        type: 'item',
        item: {
          title: 'Book Service',
          path: `/${rolePrefix}/services/book`,
          icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z"/><path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/></svg>',
        }
      },
      {
        type: 'item',
        item: {
          title: 'Rate Service',
          path: `/${rolePrefix}/rate-services`,
          icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.283.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z"/></svg>',
        }
      },
    ];
  };

  const roleNavItems = getRoleNavigation();

  // Search filtering logic
  const filteredNavItems: NavEntry[] = searchQuery.trim()
    ? roleNavItems.reduce<NavEntry[]>((acc, entry) => {
        const q = searchQuery.toLowerCase();
        if (entry.type === 'item') {
          if (translateTitle(entry.item.title).toLowerCase().includes(q)) {
            acc.push(entry);
          }
        } else if (entry.type === 'group') {
          const matchedGroup = translateTitle(entry.group.title).toLowerCase().includes(q);
          const matchedItems = entry.group.items.filter(i => translateTitle(i.title).toLowerCase().includes(q));
          if (matchedGroup || matchedItems.length > 0) {
            acc.push({
              type: 'group',
              group: {
                ...entry.group,
                items: matchedItems.length > 0 ? matchedItems : entry.group.items
              }
            });
          }
        }
        return acc;
      }, [])
    : roleNavItems;

  return (
    <nav className="font-sans overscroll-contain flex flex-col h-full bg-slate-900 border-r border-slate-800 text-slate-100 transition-all duration-300">
      {/* Brand Header */}
      <div className={`flex flex-col gap-4 px-4 py-5 ${!isSidebarOpen ? 'items-center' : ''}`}>
        <Link to="/" className={`flex items-center gap-3 ${!isSidebarOpen ? 'justify-center' : ''} group`}>
          {logo ? (
            <img src={logo} alt="System Logo" className="h-10 w-auto object-contain rounded-xl shadow-sm" />
          ) : (
            <div className="h-10 w-10 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md shadow-indigo-500/25 group-hover:scale-105 transition-transform">
              B
            </div>
          )}
          {isSidebarOpen && (
            <div className="flex flex-col">
              <span className="font-heading font-black text-lg tracking-tight text-white leading-none">
                BMS <span className="text-indigo-400 font-extrabold text-sm tracking-widest uppercase">Portal</span>
              </span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mt-1">
                Barber Management
              </span>
            </div>
          )}
        </Link>

        {/* Search Bar */}
        <div className={`relative w-full mt-1 transition-all duration-300 ${!isSidebarOpen ? 'px-0 opacity-0 h-0 overflow-hidden' : 'opacity-100 h-10'}`}>
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-9 pr-3 py-2 text-xs border border-slate-700/80 rounded-xl bg-slate-800/60 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
            placeholder={t('common.search')}
          />
        </div>
      </div>

      {/* Menu List */}
      <ul className="flex flex-col space-y-1 pt-2 flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <div className="w-8 h-8 border-4 border-indigo-600/20 border-t-indigo-500 rounded-full animate-spin"></div>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">{t('common.loading')}</span>
          </div>
        ) : (
          filteredNavItems.map((entry, index) => {
            if (entry.type === 'divider') {
              return <SectionDivider key={`divider-${index}`} title={entry.title} />;
            }
            if (entry.type === 'item') {
              return (
                <NavItem
                  key={entry.item.path}
                  to={entry.item.path}
                  title={entry.item.title}
                  icon={entry.item.icon}
                />
              );
            }
            if (entry.type === 'group') {
              return (
                <Dropdown
                  key={entry.group.id}
                  title={entry.group.title}
                  icon={entry.group.icon}
                  basePath={entry.group.basePath}
                >
                  {entry.group.items.map((subItem) => (
                    <DropdownItem
                      key={subItem.path}
                      title={subItem.title}
                      to={subItem.path}
                    />
                  ))}
                </Dropdown>
              );
            }
            return null;
          })
        )}
      </ul>

      {/* Bottom Toggle */}
      <div className="mt-auto border-t border-slate-800 p-4">
        <button
          onClick={toggleSidebar}
          className={`w-full flex items-center gap-3 p-2 rounded-xl transition-all duration-300 group hover:bg-white/10 ${!isSidebarOpen ? 'justify-center' : ''}`}
        >
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/10 group-hover:bg-white/20 text-slate-200 transition-all shadow-sm">
            <svg className={`w-5 h-5 transition-transform duration-300 ${!isSidebarOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </div>
          {isSidebarOpen && (
            <div className="flex flex-col items-start overflow-hidden">
              <span className="text-sm font-bold whitespace-nowrap text-slate-200 group-hover:text-indigo-400 transition-colors uppercase tracking-tight">
                {user?.role_name || (roleId === 1 ? 'Admin' : roleId === 2 ? 'Manager' : roleId === 3 ? 'Barber' : roleId === 4 ? 'Receptionist' : 'Customer')}
              </span>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest leading-none">
                {user?.user_name ? `@${user.user_name}` : 'Logged in'}
              </span>
            </div>
          )}
        </button>
      </div>
    </nav>
  );
};

export default VerticalNavbar;
