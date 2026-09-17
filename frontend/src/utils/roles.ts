/**
 * RBAC Role Constants — Frontend
 *
 * Single source of truth for role IDs in the frontend.
 * These must stay in sync with backend/middleware/roles.js
 *
 * ID Mapping:
 *   1 = ADMIN
 *   2 = MANAGER
 *   3 = BARBER
 *   4 = RECEPTIONIST
 *   5 = CUSTOMER
 */

export const ROLES = {
    ADMIN: 1,
    MANAGER: 2,
    BARBER: 3,
    RECEPTIONIST: 4,
    CUSTOMER: 5,
} as const;

export type RoleId = typeof ROLES[keyof typeof ROLES];

export const ROLE_LABELS: Record<number, string> = {
    [ROLES.ADMIN]:        'Admin',
    [ROLES.MANAGER]:      'Manager',
    [ROLES.BARBER]:       'Barber',
    [ROLES.RECEPTIONIST]: 'Receptionist',
    [ROLES.CUSTOMER]:     'Customer',
};

export const ROLE_DESCRIPTIONS: Record<number, string> = {
    [ROLES.ADMIN]:        'Full system control — manage all resources, users, analytics and settings.',
    [ROLES.MANAGER]:      'Manage an assigned branch, employees, and operational reports.',
    [ROLES.BARBER]:       'View assigned services, customers, and appointments. Mark progress.',
    [ROLES.RECEPTIONIST]: 'Handle walk-ins, assist bookings, monitor queue, and check-in customers.',
    [ROLES.CUSTOMER]:     'Book services, view history, rate completed services, and submit complaints.',
};

export const ROLE_COLORS: Record<number, string> = {
    [ROLES.ADMIN]:        'red',
    [ROLES.MANAGER]:      'purple',
    [ROLES.BARBER]:       'blue',
    [ROLES.RECEPTIONIST]: 'teal',
    [ROLES.CUSTOMER]:     'green',
};

/** All role IDs that are considered "staff" (not customers). */
export const STAFF_ROLE_IDS: RoleId[] = [ROLES.ADMIN, ROLES.MANAGER, ROLES.BARBER, ROLES.RECEPTIONIST];

/** Role IDs with management privileges. */
export const MANAGEMENT_ROLE_IDS: RoleId[] = [ROLES.ADMIN, ROLES.MANAGER];

/** System role IDs that cannot be deleted. */
export const SYSTEM_ROLE_IDS: RoleId[] = [ROLES.ADMIN, ROLES.MANAGER, ROLES.BARBER, ROLES.RECEPTIONIST, ROLES.CUSTOMER];

/**
 * Get the display label for a role ID.
 */
export const getRoleLabel = (roleId: number | string): string =>
    ROLE_LABELS[Number(roleId)] ?? 'Unknown';

/**
 * Get the color class for a role ID (for badges).
 */
export const getRoleColor = (roleId: number | string): string =>
    ROLE_COLORS[Number(roleId)] ?? 'slate';
