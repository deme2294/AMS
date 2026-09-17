export interface NavItem {
  path: string;
  label: string;
  icon: string;
  end?: boolean;
  children?: NavItem[];
  basePath?: string;
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

export const navigationConfig: NavSection[] = [
  {
    label: "Dashboard",
    items: [
      {
        path: "#dashboard",
        basePath: "/dashboard",
        label: "Dashboard",
        icon: "fas fa-tachometer-alt",
        children: [
          { path: "/", label: "Overview", icon: "", end: true },
          { path: "/dashboard/analytics", label: "Analytics", icon: "" },
        ]
      }
    ]
  },
  {
    label: "Services",
    items: [
      { path: "/service-submission", label: "Add New Service", icon: "fas fa-plus-circle" },
      { path: "/services/categories", label: "Categories", icon: "fas fa-folder" },
      { path: "/services", label: "All Services", icon: "fas fa-cut" },
      { path: "/services/queue", label: "Queue Management", icon: "fas fa-users" },
      { path: "/services/review", label: "Review Bookings", icon: "fas fa-check-circle" },
    ]
  },
  {
    label: "Users",
    items: [
      { path: "/users/all", label: "Employees", icon: "fas fa-users" },
      { path: "/users/add", label: "Add Employee", icon: "fas fa-user-plus" },
      { path: "/users/manage-employees", label: "Manage Employees", icon: "fas fa-id-card" },
    ]
  },
  {
    label: "Settings",
    items: [
      { path: "/users/roles", label: "Roles & Permissions", icon: "fas fa-user-shield" },
    ]
  }
];

export const isRootDashboardPath = (path: string | undefined): boolean => path === "/dashboard";
