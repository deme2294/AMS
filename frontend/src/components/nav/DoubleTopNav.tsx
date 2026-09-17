import React from 'react';

const DoubleTopNav: React.FC = () => {
  // TODO: Implement state and handlers for search, theme switch, dropdowns, etc.
  return (
    <nav className="navbar navbar-light navbar-glass navbar-top navbar-expand-lg" data-double-top-nav="data-double-top-nav">
      <div className="w-100">
        <div className="d-flex flex-between-center">
          {/* Humburger Toggle - Needs state/handler */}
          <button className="btn navbar-toggler-humburger-icon navbar-toggler me-1 me-sm-3" type="button" data-bs-toggle="collapse" data-bs-target="#navbarDoubleTop" aria-controls="navbarDoubleTop" aria-expanded="false" aria-label="Toggle Navigation">
            <span className="navbar-toggle-icon"><span className="toggle-line"></span></span>
          </button>
          <a className="navbar-brand me-1 me-sm-3" href="index.html">
            <div className="d-flex align-items-center">
              <img className="me-2" src="/assets/img/icons/spot-illustrations/falcon.png" alt="" width="40" />
              <span className="font-sans-serif text-primary">BMS WEBSITE</span>
            </div>
          </a>
          <ul className="navbar-nav align-items-center d-none d-lg-block">
            <li className="nav-item">
              {/* Search Box - Needs state/handler/library */}
              <div className="search-box" data-list='{"valueNames":["title"]}'>
                <form className="position-relative" data-bs-toggle="search" data-bs-display="static">
                  <input className="form-control search-input fuzzy-search" type="search" placeholder="Search..." aria-label="Search" />
                  <span className="fas fa-search search-box-icon"></span>
                </form>
                <div className="btn-close-falcon-container position-absolute end-0 top-50 translate-middle shadow-none" data-bs-dismiss="search">
                  <button className="btn btn-link btn-close-falcon p-0" aria-label="Close"></button>
                </div>
                {/* Search Dropdown - Needs state/handler/library */}
                <div className="dropdown-menu border font-base start-0 mt-2 py-0 overflow-hidden w-100">
                  {/* Search results content */}
                  <div className="scrollbar list py-3" style={{ maxHeight: '24rem' }}>
                     <h6 className="dropdown-header fw-medium text-uppercase px-x1 fs-11 pt-0 pb-2">Recently Browsed</h6>
                     {/* ... other dropdown items */}
                     <a className="dropdown-item fs-10 px-x1 py-1 hover-primary" href="app/events/event-detail.html">
                       <div className="d-flex align-items-center">
                         <span className="fas fa-circle me-2 text-300 fs-11"></span>
                         <div className="fw-normal title">Pages <span className="fas fa-chevron-right mx-1 text-500 fs-11" data-fa-transform="shrink-2"></span> Events</div>
                       </div>
                     </a>
                     {/* ... more items */}
                     <hr className="text-200 dark__text-900" />
                     <h6 className="dropdown-header fw-medium text-uppercase px-x1 fs-11 pt-0 pb-2">Suggested Filter</h6>
                      {/* ... more items */}
                     <hr className="text-200 dark__text-900" />
                     <h6 className="dropdown-header fw-medium text-uppercase px-x1 fs-11 pt-0 pb-2">Files</h6>
                      {/* ... more items */}
                     <hr className="text-200 dark__text-900" />
                     <h6 className="dropdown-header fw-medium text-uppercase px-x1 fs-11 pt-0 pb-2">Members</h6>
                      {/* ... more items */}
                  </div>
                  <div className="text-center mt-n3">
                    <p className="fallback fw-bold fs-8 d-none">No Result Found.</p>
                  </div>
                </div>
              </div>
            </li>
          </ul>
          <ul className="navbar-nav navbar-nav-icons ms-auto flex-row align-items-center">
            {/* Theme Switcher - Needs state/handler */}
            <li className="nav-item ps-2 pe-0">
              <div className="dropdown theme-control-dropdown">
                <a className="nav-link d-flex align-items-center dropdown-toggle fa-icon-wait fs-9 pe-1 py-0" href="#" role="button" id="themeSwitchDropdown" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                  <span className="fas fa-sun fs-7" data-fa-transform="shrink-2" data-theme-dropdown-toggle-icon="light"></span>
                  <span className="fas fa-moon fs-7" data-fa-transform="shrink-3" data-theme-dropdown-toggle-icon="dark"></span>
                  <span className="fas fa-adjust fs-7" data-fa-transform="shrink-2" data-theme-dropdown-toggle-icon="auto"></span>
                </a>
                <div className="dropdown-menu dropdown-menu-end dropdown-caret border py-0 mt-3" aria-labelledby="themeSwitchDropdown">
                  <div className="bg-white dark__bg-1000 rounded-2 py-2">
                    {/* Add onClick handlers to these buttons */}
                    <button className="dropdown-item d-flex align-items-center gap-2" type="button" value="light" data-theme-control="theme"><span className="fas fa-sun"></span>Light<span className="fas fa-check dropdown-check-icon ms-auto text-600"></span></button>
                    <button className="dropdown-item d-flex align-items-center gap-2" type="button" value="dark" data-theme-control="theme"><span className="fas fa-moon" data-fa-transform=""></span>Dark<span className="fas fa-check dropdown-check-icon ms-auto text-600"></span></button>
                    <button className="dropdown-item d-flex align-items-center gap-2" type="button" value="auto" data-theme-control="theme"><span className="fas fa-adjust" data-fa-transform=""></span>Auto<span className="fas fa-check dropdown-check-icon ms-auto text-600"></span></button>
                  </div>
                </div>
              </div>
            </li>
            {/* Shopping Cart */}
            <li className="nav-item d-none d-sm-block">
              <a className="nav-link px-0 notification-indicator notification-indicator-warning notification-indicator-fill fa-icon-wait" href="app/e-commerce/shopping-cart.html">
                <span className="fas fa-shopping-cart" data-fa-transform="shrink-7" style={{ fontSize: '33px' }}></span>
                <span className="notification-indicator-number">1</span>
              </a>
            </li>
            {/* Notifications Dropdown - Needs state/handler */}
            <li className="nav-item dropdown">
              <a className="nav-link notification-indicator notification-indicator-primary px-0 fa-icon-wait" id="navbarDropdownNotification" role="button" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false" data-hide-on-body-scroll="data-hide-on-body-scroll">
                <span className="fas fa-bell" data-fa-transform="shrink-6" style={{ fontSize: '33px' }}></span>
              </a>
              <div className="dropdown-menu dropdown-caret dropdown-caret dropdown-menu-end dropdown-menu-card dropdown-menu-notification dropdown-caret-bg" aria-labelledby="navbarDropdownNotification">
                <div className="card card-notification shadow-none">
                  <div className="card-header">
                    <div className="row justify-content-between align-items-center">
                      <div className="col-auto"><h6 className="card-header-title mb-0">Notifications</h6></div>
                      <div className="col-auto ps-0 ps-sm-3"><a className="card-link fw-normal" href="#">Mark all as read</a></div>
                    </div>
                  </div>
                  <div className="scrollbar-overlay" style={{ maxHeight: '19rem' }}>
                    <div className="list-group list-group-flush fw-normal fs-10">
                      {/* Notification items */}
                      <div className="list-group-title border-bottom">NEW</div>
                      {/* ... notification items ... */}
                    </div>
                  </div>
                  <div className="card-footer text-center border-top"><a className="card-link d-block" href="app/social/notifications.html">View all</a></div>
                </div>
              </div>
            </li>
            {/* Nine Dots Menu - Needs state/handler */}
            <li className="nav-item dropdown px-1">
              <a className="nav-link fa-icon-wait nine-dots p-1" id="navbarDropdownMenu" role="button" data-hide-on-body-scroll="data-hide-on-body-scroll" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="43" viewBox="0 0 16 16" fill="none">
                  <circle cx="2" cy="2" r="2" fill="currentColor"></circle>
                  <circle cx="2" cy="8" r="2" fill="currentColor"></circle>
                  <circle cx="2" cy="14" r="2" fill="currentColor"></circle>
                  <circle cx="8" cy="8" r="2" fill="currentColor"></circle>
                  <circle cx="8" cy="14" r="2" fill="currentColor"></circle>
                  <circle cx="14" cy="8" r="2" fill="currentColor"></circle>
                  <circle cx="14" cy="14" r="2" fill="currentColor"></circle>
                  <circle cx="8" cy="2" r="2" fill="currentColor"></circle>
                  <circle cx="14" cy="2" r="2" fill="currentColor"></circle>
                </svg>
              </a>
              <div className="dropdown-menu dropdown-caret dropdown-caret dropdown-menu-end dropdown-menu-card dropdown-caret-bg" aria-labelledby="navbarDropdownMenu">
                <div className="card shadow-none">
                  <div className="scrollbar-overlay nine-dots-dropdown">
                    <div className="card-body px-3">
                      <div className="row text-center gx-0 gy-0">
                        {/* Grid items */}
                        <div className="col-4"><a className="d-block hover-bg-200 px-2 py-3 rounded-3 text-center text-decoration-none" href="pages/user/profile.html" target="_blank" rel="noopener noreferrer">
                          <div className="avatar avatar-2xl"> <img className="rounded-circle" src="/assets/img/team/3.jpg" alt="" /></div>
                          <p className="mb-0 fw-medium text-800 text-truncate fs-11">Account</p>
                        </a></div>
                        {/* ... more grid items ... */}
                        <div className="col-12"><a className="btn btn-outline-primary btn-sm mt-4" href="#!">Show more</a></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </li>
            {/* User Profile Dropdown - Needs state/handler */}
            <li className="nav-item dropdown">
              <a className="nav-link pe-0 ps-2" id="navbarDropdownUser" role="button" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                <div className="avatar avatar-xl">
                  <img className="rounded-circle" src="/assets/img/team/3-thumb.jpg" alt="" />
                </div>
              </a>
              <div className="dropdown-menu dropdown-caret dropdown-caret dropdown-menu-end py-0" aria-labelledby="navbarDropdownUser">
                <div className="bg-white dark__bg-1000 rounded-2 py-2">
                  <a className="dropdown-item fw-bold text-warning" href="#!"><span className="fas fa-crown me-1"></span><span>Go Pro</span></a>
                  <div className="dropdown-divider"></div>
                  <a className="dropdown-item" href="#!">Set status</a>
                  <a className="dropdown-item" href="pages/user/profile.html">Profile &amp; account</a>
                  <a className="dropdown-item" href="#!">Feedback</a>
                  <div className="dropdown-divider"></div>
                  <a className="dropdown-item" href="pages/user/settings.html">Settings</a>
                  <a className="dropdown-item" href="pages/authentication/card/logout.html">Logout</a>
                </div>
              </div>
            </li>
          </ul>
        </div>
        <hr className="my-2 d-none d-lg-block" />
        {/* Collapsible Lower Navbar Section - Needs state/handler for collapse */}
        <div className="collapse navbar-collapse scrollbar py-lg-2" id="navbarDoubleTop">
          <ul className="navbar-nav" data-top-nav-dropdowns="data-top-nav-dropdowns">
            {/* Dashboard Dropdown */}
            <li className="nav-item dropdown">
              <a className="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false" id="dashboardsNav">Dashboard</a>
              <div className="dropdown-menu dropdown-caret dropdown-menu-card border-0 mt-0" aria-labelledby="dashboardsNav">
                <div className="bg-white dark__bg-1000 rounded-3 py-2">
                  <a className="dropdown-item link-600 fw-medium" href="index.html">Default</a>
                  {/* ... other dashboard links */}
                </div>
              </div>
            </li>
            {/* App Dropdown (Mega Menu) */}
            <li className="nav-item dropdown">
               <a className="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false" id="appsNav">App</a>
               <div className="dropdown-menu dropdown-caret dropdown-menu-card border-0 mt-0" aria-labelledby="appsNav">
                 <div className="card navbar-card-app shadow-none dark__bg-1000">
                   <div className="card-body scrollbar max-h-dropdown">
                     <img className="img-dropdown" src="/assets/img/icons/spot-illustrations/authentication-corner.png" width="130" alt="" />
                     <div className="row">
                       {/* App links columns */}
                       <div className="col-6 col-md-4">
                         <div className="nav flex-column">
                           {/* ... App links */}
                         </div>
                       </div>
                       {/* ... other columns */}
                     </div>
                   </div>
                 </div>
               </div>
            </li>
             {/* Pages Dropdown (Mega Menu) */}
             <li className="nav-item dropdown">
                <a className="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false" id="pagesNav">Pages</a>
                <div className="dropdown-menu dropdown-caret dropdown-menu-card border-0 mt-0" aria-labelledby="pagesNav">
                   {/* ... Pages mega menu content ... */}
                </div>
             </li>
             {/* Modules Dropdown (Mega Menu) */}
             <li className="nav-item dropdown">
                <a className="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false" id="modulesNav">Modules</a>
                <div className="dropdown-menu dropdown-caret dropdown-menu-card border-0 mt-0" aria-labelledby="modulesNav">
                   {/* ... Modules mega menu content ... */}
                </div>
             </li>
             {/* Documentation Dropdown */}
             <li className="nav-item dropdown">
                <a className="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false" id="documentationNav">Documentation</a>
                <div className="dropdown-menu dropdown-caret dropdown-menu-card border-0 mt-0" aria-labelledby="documentationNav">
                   {/* ... Documentation links ... */}
                </div>
             </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default DoubleTopNav;