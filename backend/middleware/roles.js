/**
 * RBAC Role Constants
 * 
 * Central source of truth for all role IDs in the system.
 * Import this instead of using hardcoded numeric IDs anywhere.
 * 
 * ID Mapping:
 *   1 = ADMIN        - Full system control
 *   2 = MANAGER      - Branch-level management
 *   3 = BARBER       - Service delivery staff
 *   4 = RECEPTIONIST - Walk-ins, check-ins, queue monitoring
 *   5 = CUSTOMER     - End-user self-service
 */

const ROLES = Object.freeze({
    ADMIN: 1,
    MANAGER: 2,
    BARBER: 3,
    RECEPTIONIST: 4,
    CUSTOMER: 5,
});

/**
 * Human-readable display names for each role.
 */
const ROLE_NAMES = Object.freeze({
    1: 'Admin',
    2: 'Manager',
    3: 'Barber',
    4: 'Receptionist',
    5: 'Customer',
});

/**
 * Role descriptions for display / documentation.
 */
const ROLE_DESCRIPTIONS = Object.freeze({
    1: 'Full system control — manage all resources, users, analytics and settings.',
    2: 'Manage an assigned branch, employees, and operational reports.',
    3: 'View assigned services, customers, and appointments. Mark progress.',
    4: 'Handle walk-ins, assist bookings, monitor queue, and check-in customers.',
    5: 'Book services, view history, rate completed services, and submit complaints.',
});

/**
 * Convenience groupings.
 */
const STAFF_ROLES = Object.freeze([ROLES.ADMIN, ROLES.MANAGER, ROLES.BARBER, ROLES.RECEPTIONIST]);
const MANAGEMENT_ROLES = Object.freeze([ROLES.ADMIN, ROLES.MANAGER]);
const ADMIN_ONLY = Object.freeze([ROLES.ADMIN]);
const ALL_ROLES = Object.freeze([ROLES.ADMIN, ROLES.MANAGER, ROLES.BARBER, ROLES.RECEPTIONIST, ROLES.CUSTOMER]);

/**
 * Get role name by ID.
 * @param {number} id
 * @returns {string}
 */
const getRoleName = (id) => ROLE_NAMES[id] || 'Unknown';

/**
 * Check if a role ID is a staff role.
 * @param {number} id
 * @returns {boolean}
 */
const isStaffRole = (id) => STAFF_ROLES.includes(Number(id));

/**
 * Check if a role ID is a management role (Admin or Manager).
 * @param {number} id
 * @returns {boolean}
 */
const isManagementRole = (id) => MANAGEMENT_ROLES.includes(Number(id));

module.exports = {
    ROLES,
    ROLE_NAMES,
    ROLE_DESCRIPTIONS,
    STAFF_ROLES,
    MANAGEMENT_ROLES,
    ADMIN_ONLY,
    ALL_ROLES,
    getRoleName,
    isStaffRole,
    isManagementRole,
};
