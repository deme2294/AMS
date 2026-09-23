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
    BARBER: 2,
    CUSTOMER: 3,
    MANAGER: 4,
    RECEPTIONIST: 5,
} as const;

export type RoleId = typeof ROLES[keyof typeof ROLES];

export const ROLE_LABELS: Record<number, string> = {
    [ROLES.ADMIN]:        'Admin',
    [ROLES.BARBER]:       'Barber',
    [ROLES.CUSTOMER]:     'Customer',
    [ROLES.MANAGER]:      'Manager',
    [ROLES.RECEPTIONIST]: 'Receptionist',
};

export const ROLE_DESCRIPTIONS: Record<number, string> = {
    [ROLES.ADMIN]:        'Full system control — manage all resources, users, analytics and settings.',
    [ROLES.BARBER]:       'View assigned services, customers, and appointments. Mark progress.',
    [ROLES.CUSTOMER]:     'Book services, view history, rate completed services, and submit complaints.',
    [ROLES.MANAGER]:      'Manage an assigned branch, employees, and operational reports.',
    [ROLES.RECEPTIONIST]: 'Handle walk-ins, assist bookings, monitor queue, and check-in customers.',
};

export const ROLE_COLORS: Record<number, string> = {
    [ROLES.ADMIN]:        'red',
    [ROLES.BARBER]:       'blue',
    [ROLES.CUSTOMER]:     'green',
    [ROLES.MANAGER]:      'purple',
    [ROLES.RECEPTIONIST]: 'teal',
};

/** All role IDs that are considered "staff" (not customers). */
export const STAFF_ROLE_IDS: RoleId[] = [ROLES.ADMIN, ROLES.MANAGER, ROLES.BARBER, ROLES.RECEPTIONIST];

/** Role IDs with management privileges. */
export const MANAGEMENT_ROLE_IDS: RoleId[] = [ROLES.ADMIN, ROLES.MANAGER];

/** System role IDs that cannot be deleted. */
export const SYSTEM_ROLE_IDS: RoleId[] = [ROLES.ADMIN, ROLES.MANAGER, ROLES.BARBER, ROLES.RECEPTIONIST, ROLES.CUSTOMER];

const DYNAMIC_PALETTE = ['indigo', 'cyan', 'amber', 'rose', 'emerald', 'sky', 'violet', 'fuchsia', 'orange'];

/**
 * Get the display label for a role ID with optional fallback name.
 */
export const getRoleLabel = (roleId: number | string, fallbackName?: string): string => {
    if (fallbackName && fallbackName.trim()) return fallbackName;
    const id = Number(roleId);
    return ROLE_LABELS[id] ?? (id ? `Role #${id}` : 'Unknown');
};

/**
 * Get the color class for a role ID (for badges).
 * Provides deterministic vibrant colors for custom/dynamic roles.
 */
export const getRoleColor = (roleId: number | string): string => {
    const id = Number(roleId);
    if (ROLE_COLORS[id]) return ROLE_COLORS[id];
    if (!id) return 'slate';
    const idx = Math.abs(id) % DYNAMIC_PALETTE.length;
    return DYNAMIC_PALETTE[idx];
};
