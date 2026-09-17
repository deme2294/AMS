import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getMyNavigation, deleteMenu, Menu } from '../../services/apiService';
import { useAuth } from '../Auth/AuthContext';

interface VerticalNavbarProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

const VerticalNavbar: React.FC<VerticalNavbarProps> = ({ isSidebarOpen, toggleSidebar }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [logo, setLogo] = useState<string | null>(null);
  const [activeColor, setActiveColor] = useState('blue');

  // Helper to translate menu titles if they exist in locales
  const translateTitle = (title: string) => {
    // Convert "Audit Logs" -> "audit_logs"
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
    const fetchMenus = async () => {
      try {
        const data = await getMyNavigation();
        setMenus(data);
      } catch (error) {
        console.error("Failed to fetch menus", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMenus();
  }, []);

  // Helper for NavLink class
  const getNavLinkClass = ({ isActive }: { isActive: boolean }, colorClass: string) => {
    const color = colorClass || activeColor;
    const base = `flex items-center ${isSidebarOpen ? 'px-4' : 'justify-center px-2'} py-3 text-sm font-medium transition-all duration-[800ms] rounded-xl mx-2 my-1 group relative text-slate-200`;
    if (isActive) {
      return `${base} bg-${color}-500 bg-opacity-30 text-white`;
    }
    return `${base} hover:bg-white/10`;
  };
  
  // Reusable Icon Renderer
  const renderIcon = (icon?: string) => {
    if (!icon) return null;
    const isSvg = icon.trim().startsWith('<svg');
    return isSvg ? (
      <div className="w-5 h-5 flex items-center justify-center icon-svg-container" dangerouslySetInnerHTML={{ __html: icon }} />
    ) : (
      <i className={`${icon} text-sm`}></i>
    );
  };

  const SectionDivider = ({ title }: { title: string }) => (
    <div className={`px-6 mt-6 mb-2 transition-opacity duration-[800ms] ${!isSidebarOpen ? 'hidden' : 'block'}`}>
       <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{translateTitle(title)}</p>
    </div>
  );

  const NavItem = ({ to, title, icon, color }: { to: string, title: string, icon?: string, color: string }) => (
    <li className="mb-1 px-2">
      <NavLink
        to={to}
        className={({ isActive }) => getNavLinkClass({ isActive }, color)}
        title={!isSidebarOpen ? translateTitle(title) : ''}
      >
        {({ isActive }) => (
          <>
            <div className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-[800ms] ${isActive ? `bg-${color}-500 text-white shadow-lg shadow-${color}-500/30` : `bg-white/10 text-${color}-500 group-hover:bg-${color}-500 group-hover:text-white`}`}>
              {renderIcon(icon)}
            </div>
            <span className={`ml-3 transition-opacity duration-[800ms] ${!isSidebarOpen ? 'hidden w-0 opacity-0' : 'block opacity-100 font-bold whitespace-nowrap overflow-hidden'}`}>{translateTitle(title)}</span>
            {!isSidebarOpen && (
              <div className="absolute left-full top-2 ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-lg">
                {translateTitle(title)}
              </div>
            )}
          </>
        )}
      </NavLink>
    </li>
  );

  const Dropdown = ({ title, icon, basePath, color, children, onRemove }: { title: string, icon?: string, basePath: string, color: string, children: React.ReactNode, onRemove?: (itemId: number) => void }) => {
    const pathWithoutInteraction = location.pathname.replace(/^\/interaction/, '');
    const isActive = location.pathname.startsWith(basePath) || pathWithoutInteraction.startsWith(basePath.replace('/interaction', ''));
    const [isOpen, setIsOpen] = useState(isActive);
    
    // Keep dropdown open when any child is active
    useEffect(() => {
        if (isActive) {
            setIsOpen(true);
        }
    }, [isActive]);

    if (!isSidebarOpen) {
      return (
        <li className="mb-1 px-2 relative group">
          <Link
            to={basePath}
            className={`w-full flex justify-center py-3 rounded-xl transition-all text-slate-200 ${isActive ? `bg-${color}-500/30` : 'hover:bg-white/10'}`}
          >
            <div className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-[800ms] ${isActive ? `bg-${color}-500 text-white shadow-lg shadow-${color}-500/30` : `bg-white/10 text-${color}-500 group-hover:bg-${color}-500 group-hover:text-white`}`}>
              {renderIcon(icon)}
            </div>
          </Link>
          <div className="absolute left-full top-2 ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
            {translateTitle(title)}
          </div>
        </li>
      );
    }

    return (
      <li className="mb-1 px-2">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium transition-colors duration-[800ms] rounded-xl group
              ${isActive
              ? `text-white bg-${color}-500 bg-opacity-30 border border-white/10`
              : "text-slate-200 hover:bg-white/10"
            }`}
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <div className={`flex items-center justify-center h-8 w-8 min-w-[32px] rounded-lg transition-all duration-[800ms] ${isActive ? `bg-${color}-500 text-white shadow-lg shadow-${color}-500/30` : `bg-white/10 text-${color}-500 group-hover:bg-${color}-500 group-hover:text-white`}`}>
              {renderIcon(icon)}
            </div>
            <span className="font-bold whitespace-nowrap overflow-hidden transition-all duration-[800ms]">{translateTitle(title)}</span>
          </div>
          <svg
            className={`w-4 h-4 text-slate-300 transition-transform duration-[800ms] ${isOpen ? "rotate-90" : ""}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <div className={`overflow-hidden transition-all duration-[800ms] ${isOpen ? "max-h-96 opacity-100 mt-1" : "max-h-0 opacity-0"}`}>
          <ul className="pl-4 border-l-2 border-dashed border-white/20 ml-6 space-y-1 pt-1">
            {React.Children.map(children, (child, index) => {
              if (React.isValidElement(child)) {
                return React.cloneElement(child as React.ReactElement<any>, { onRemove, color });
              }
              return child;
            })}
          </ul>
        </div>
      </li>
    );
  };

  const DropdownItem = ({ item, color, onRemove }: { item: Menu, color: string, onRemove?: (itemId: number) => void }) => {
    const [isHovered, setIsHovered] = useState(false);
    
    return (
      <li 
        className="group relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <NavLink
          to={item.path || '#'}
          className={({ isActive }) => `flex items-center justify-between px-4 py-2.5 text-sm rounded-lg transition-all duration-200
            ${isActive 
              ? `text-${color}-600 dark:text-${color}-400 font-semibold bg-${color}-50 dark:bg-${color}-900/20 border-l-2 border-${color}-500` 
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-800/50"
            }`}
        >
          {({ isActive }) => (
            <>
              <span className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${isActive ? `bg-${color}-500` : 'bg-gray-300 group-hover:bg-gray-400'}`}></span>
                {translateTitle(item.title)}
              </span>
              {onRemove && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onRemove(item.id);
                  }}
                  className={`opacity-0 group-hover:opacity-100 transition-all duration-200 p-1 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500 dark:hover:text-red-400 ${isHovered ? 'translate-x-0' : 'translate-x-2'}`}
                  title="Remove"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </>
          )}
        </NavLink>
      </li>
    );
  };

  // Grouping logic for rendering
  const renderMenus = () => {
    const rootItems = menus.filter(m => !m.parent_id);
    return rootItems.map(item => {
      if (item.is_section) {
        return (
          <React.Fragment key={item.id}>
            <SectionDivider title={item.title} />
            {menus.filter(m => m.parent_id === item.id).map(child => renderMenuItem(child))}
          </React.Fragment>
        );
      }
      return renderMenuItem(item);
    });
  };

  const handleRemoveMenuItem = async (itemId: number) => {
    if (!confirm('Are you sure you want to remove this menu item?')) return;
    try {
      await deleteMenu(itemId);
      setMenus(prev => prev.filter(m => m.id !== itemId));
    } catch (error) {
      console.error('Failed to remove menu item:', error);
    }
  };

  const renderMenuItem = (item: Menu) => {
    const children = menus.filter(m => m.parent_id === item.id);
    if (item.is_dropdown || children.length > 0) {
      return (
        <Dropdown key={item.id} title={item.title} icon={item.icon} basePath={item.path || ''} color={item.color || 'blue'} onRemove={handleRemoveMenuItem}>
          {children.map(child => (
            <DropdownItem key={child.id} item={child} color={item.color || 'blue'} onRemove={handleRemoveMenuItem} />
          ))}
        </Dropdown>
      );
    }
    return <NavItem key={item.id} to={item.path || '#'} title={item.title} icon={item.icon} color={item.color || 'blue'} />;
  };

  return (
    <nav className="font-sans overscroll-contain flex flex-col h-full bg-gradient-to-br from-[#16284F] to-[#0C7C92] border-r border-white/10 text-slate-100 transition-all duration-[800ms]">
      <div className={`flex flex-col gap-4 px-4 py-6 ${!isSidebarOpen ? 'items-center' : ''}`}>
        <Link to="/" className={`flex items-center gap-3 ${!isSidebarOpen ? 'justify-center' : ''}`}>
          {logo ? (
            <img src={logo} alt="System Logo" className="h-10 w-auto object-contain rounded-lg shadow-sm" />
          ) : (
            <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/20">B</div>
          )}
            {isSidebarOpen && <span className="font-black text-xl tracking-tighter text-white">BMS <span className="text-blue-300">WEBSITE</span></span>}
        </Link>

        {/* Search Bar */}
        <div className={`relative w-full mt-2 transition-all duration-[800ms] ${!isSidebarOpen ? 'px-0 opacity-0 h-0 overflow-hidden' : 'opacity-100 h-10'}`}>
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
             <svg className="h-4 w-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
             className="block w-full pl-9 pr-3 py-2 text-sm border border-white/20 rounded-xl bg-white/10 text-white placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-400/30 transition-all"
            placeholder={t('common.search')}
          />
        </div>
      </div>

      {/* Menu List */}
      <ul className="flex flex-col space-y-1 pt-2 flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
             <div className="w-8 h-8 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
             <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">{t('common.loading')}</span>
          </div>
        ) : searchQuery ? (
          menus.filter(m => !m.is_section && translateTitle(m.title).toLowerCase().includes(searchQuery.toLowerCase())).map(item => (
            <NavItem key={item.id} to={item.path || '#'} title={item.title} icon={item.icon} color={item.color || 'blue'} />
          ))
        ) : (
          <>
            {renderMenus()}
            
            {/* Dashboard - Admin/Manager Only */}
            {(() => {
              const roleId = user ? Number(user.role_id) : null;
              const getRolePrefix = () => {
                if (roleId === 1) return 'admin';
                if (roleId === 2) return 'manager';
                if (roleId === 3) return 'barber';
                if (roleId === 4) return 'receptionist';
                if (roleId === 5) return 'customer';
                return 'user';
              };
              const rolePrefix = getRolePrefix();
              
              if (roleId !== 1 && roleId !== 2) return null;
              
              return (
                <Dropdown 
                  title="Dashboard" 
                  basePath={`/${rolePrefix}/dashboard`} 
                  color="indigo" 
                  icon='<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M0 1.5A1.5 1.5 0 0 1 1.5 0h13A1.5 1.5 0 0 1 16 1.5v13a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 0 14.5v-13zM1.5 1a.5.5 0 0 0-.5.5V5h4V1H1.5zM5 6H1v3h4V6zm1 4h4V6H6v4zm-1 1H1v3.5a.5.5 0 0 0 .5.5H5v-4zm1 0v4h4v-4H6zm5 0v4h3.5a.5.5 0 0 0 .5-.5V11h-4zm0-1h4V6h-4v4zm0-5h4V1.5a.5.5 0 0 0-.5-.5H11v4zm-1 0V1H6v4h4z"/></svg>'
                >
                  <DropdownItem 
                    item={{ 
                      id: -10, 
                      title: 'Overview', 
                      path: `/${rolePrefix}/dashboard/overview`, 
                      is_dropdown: false, 
                      is_section: false, 
                      parent_id: 0, 
                      sort_order: 0, 
                      icon: '', 
                      order_index: 0, 
                      is_active: true 
                    } as Menu} 
                    color="indigo" 
                  />
                  <DropdownItem 
                    item={{ 
                      id: -11, 
                      title: 'Analytics', 
                      path: `/${rolePrefix}/dashboard/analytics`, 
                      is_dropdown: false, 
                      is_section: false, 
                      parent_id: 0, 
                      sort_order: 0, 
                      icon: '', 
                      order_index: 0, 
                      is_active: true 
                    } as Menu} 
                    color="indigo" 
                  />
                </Dropdown>
              );
            })()}
            
            {/* Appointments - Admin/Manager/Barber/Receptionist */}
            {(() => {
              const roleId = user ? Number(user.role_id) : null;
              const getRolePrefix = () => {
                if (roleId === 1) return 'admin';
                if (roleId === 2) return 'manager';
                if (roleId === 3) return 'barber';
                if (roleId === 4) return 'receptionist';
                if (roleId === 5) return 'customer';
                return 'user';
              };
              const rolePrefix = getRolePrefix();
              
              if (roleId !== 1 && roleId !== 2 && roleId !== 3 && roleId !== 4) return null;
              
              return (
                <Dropdown 
                  title="Appointments" 
                  basePath={`/${rolePrefix}/services`} 
                  color="blue" 
                  icon='<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z"/></svg>'
                >
                  {(roleId === 1 || roleId === 2 || roleId === 4) && (
                    <DropdownItem 
                      item={{ 
                        id: -1, 
                        title: 'Review Bookings', 
                        path: `/${rolePrefix}/services/review`, 
                        is_dropdown: false, 
                        is_section: false, 
                        parent_id: 0, 
                        sort_order: 0, 
                        icon: '', 
                        order_index: 0, 
                        is_active: true 
                      } as Menu} 
                      color="blue" 
                    />
                  )}
                  <DropdownItem 
                    item={{ 
                      id: -2, 
                      title: 'Queue Management', 
                      path: `/${rolePrefix}/services/queue`, 
                      is_dropdown: false, 
                      is_section: false, 
                      parent_id: 0, 
                      sort_order: 0, 
                      icon: '', 
                      order_index: 0, 
                      is_active: true 
                    } as Menu} 
                    color="blue" 
                  />
                  {(roleId === 1 || roleId === 2) && (
                    <DropdownItem 
                      item={{
                        id: -3,
                        title: 'Availability Management',
                        path: `/${rolePrefix}/services/availability`,
                        is_dropdown: false,
                        is_section: false,
                        parent_id: 0,
                        sort_order: 0,
                        icon: '',
                        order_index: 0,
                        is_active: false,
                      } as unknown as Menu} 
                      color="blue" 
                    />
                  )}
                </Dropdown>
              );
            })()}
            
            {/* Categories Management - Admin/Manager Only */}
            {(() => {
              const roleId = user ? Number(user.role_id) : null;
              const getRolePrefix = () => {
                if (roleId === 1) return 'admin';
                if (roleId === 2) return 'manager';
                return 'user';
              };
              const rolePrefix = getRolePrefix();
              
              if (roleId !== 1 && roleId !== 2) return null;
              
              return (
                <NavItem 
                  to={`/${rolePrefix}/categories`} 
                  title="Service Categories" 
                  icon='<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M1 2a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2zm5 0a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V2zm5 0a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1V2zM1 7a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V7zm5 0a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7zm5 0a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1V7zM1 12a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1v-2zm5 0a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-2zm5 0a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-2z"/></svg>' 
                  color="purple" 
                />
              );
            })()}
            {/* Customer-specific navigation items */}
            {(() => {
              const roleId = user ? Number(user.role_id) : null;
              const isCustomer = roleId === 5;
              if (!isCustomer) return null;
              
              return (
                <>
                  <div className={`px-6 mt-6 mb-2 transition-opacity duration-[800ms] ${!isSidebarOpen ? 'hidden' : 'block'}`}>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('menu.dashboard', 'Dashboard')}</p>
                  </div>
                  <NavItem 
                    to="/customer/dashboard/overview" 
                    title="My Dashboard" 
                    icon='<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M0 1.5A1.5 1.5 0 0 1 1.5 0h13A1.5 1.5 0 0 1 16 1.5v13a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 0 14.5v-13zM1.5 1a.5.5 0 0 0-.5.5V5h4V1H1.5zM5 6H1v3h4V6zm1 4h4V6H6v4zm-1 1H1v3.5a.5.5 0 0 0 .5.5H5v-4zm1 0v4h4v-4H6zm5 0v4h3.5a.5.5 0 0 0 .5-.5V11h-4zm0-1h4V6h-4v4zm0-5h4V1.5a.5.5 0 0 0-.5-.5H11v4zm-1 0V1H6v4h4z"/></svg>' 
                    color="indigo" 
                  />
                  
                  <div className={`px-6 mt-6 mb-2 transition-opacity duration-[800ms] ${!isSidebarOpen ? 'hidden' : 'block'}`}>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('menu.services', 'Services')}</p>
                  </div>
                  <NavItem 
                    to="/customer/services" 
                    title="Browse Services" 
                    icon='<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M4 .5a.5.5 0 0 0-1 0V1H2a2 2 0 0 0-2 2v1h16V3a2 2 0 0 0-2-2h-1V.5a.5.5 0 0 0-1 0V1H4V.5zM16 14V5H0v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2zM8 7.993a.667.667 0 1 1 0 1.334.667.667 0 0 1 0-1.334z"/></svg>' 
                    color="blue" 
                  />
                  <NavItem
                    title="Rate Services"
                    to="/customer/rate-services"
                    icon='<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.283.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z"/></svg>'
                    color="yellow"
                  />
                  <NavItem 
                    to="/customer/appointments" 
                    title="My Appointments" 
                    icon='<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M11 6.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1zm-3 0a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1zm-5 3a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1zm3 0a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1z"/><path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z"/></svg>' 
                    color="green" 
                  />
                </>
              );
            })()}
          </>
        )}
      </ul>

      {/* Bottom Toggle */}
      <div className="mt-auto border-t border-white/10 p-4">
        <button
          onClick={toggleSidebar}
          className={`w-full flex items-center gap-3 p-2 rounded-xl transition-all duration-[800ms] group hover:bg-white/10 ${!isSidebarOpen ? 'justify-center' : ''}`}
        >
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/10 group-hover:bg-white/20 text-slate-200 transition-all duration-[800ms] shadow-sm">
            <svg className={`w-5 h-5 transition-transform duration-[800ms] ${!isSidebarOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </div>
          {isSidebarOpen && (
            <div className="flex flex-col items-start overflow-hidden">
                <span className="text-sm font-bold whitespace-nowrap text-slate-200 group-hover:text-blue-400 transition-colors uppercase tracking-tight">{t('common.actions')}</span>
                <span className="text-[10px] text-slate-400 uppercase tracking-widest leading-none">{t('common.settings')}</span>
            </div>
          )}
        </button>
      </div>
    </nav>
  );
};

export default VerticalNavbar;