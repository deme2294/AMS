/**
 * Role Helper Hooks & Functions — Frontend
 *
 * Import these helpers instead of accessing user.role_id directly.
 */

import { useAuth } from '../components/Auth/AuthContext';
import { ROLES, STAFF_ROLE_IDS, MANAGEMENT_ROLE_IDS, RoleId } from './roles';

// ─────────────────────────────────────────────────────────
// Pure functions (accept a roleId, no hook needed)
// ─────────────────────────────────────────────────────────

export const roleIs         = (roleId: number | string, target: RoleId) => Number(roleId) === target;
export const roleIsAny      = (roleId: number | string, targets: RoleId[]) => targets.includes(Number(roleId) as RoleId);
export const roleIsAdmin    = (roleId: number | string) => roleIs(roleId, ROLES.ADMIN);
export const roleIsManager  = (roleId: number | string) => roleIs(roleId, ROLES.MANAGER);
export const roleIsBarber   = (roleId: number | string) => roleIs(roleId, ROLES.BARBER);
export const roleIsRecep    = (roleId: number | string) => roleIs(roleId, ROLES.RECEPTIONIST);
export const roleIsCustomer = (roleId: number | string) => roleIs(roleId, ROLES.CUSTOMER);
export const roleIsStaff    = (roleId: number | string) => STAFF_ROLE_IDS.includes(Number(roleId) as RoleId);
export const roleIsMgmt     = (roleId: number | string) => MANAGEMENT_ROLE_IDS.includes(Number(roleId) as RoleId);

// ─────────────────────────────────────────────────────────
// Convenience hook  (wraps useAuth)
// ─────────────────────────────────────────────────────────

export const useRole = () => {
    const { user } = useAuth();
    const roleId = Number(user?.role_id ?? 0);

    return {
        roleId,
        isAdmin:        roleId === ROLES.ADMIN,
        isManager:      roleId === ROLES.MANAGER,
        isBarber:        roleId === ROLES.BARBER,
        isReceptionist: roleId === ROLES.RECEPTIONIST,
        isCustomer:     roleId === ROLES.CUSTOMER,
        isStaff:        STAFF_ROLE_IDS.includes(roleId as RoleId),
        isManagement:   MANAGEMENT_ROLE_IDS.includes(roleId as RoleId),

        /** Returns true if user has any of the listed role IDs. */
        hasAnyRole: (...roles: RoleId[]) => roles.includes(roleId as RoleId),

        /** Returns true if user can manage services (Admin or Manager). */
        canManageServices: () => MANAGEMENT_ROLE_IDS.includes(roleId as RoleId),

        /** Returns true if user can handle booking workflows. */
        canManageBookings: () => [ROLES.ADMIN, ROLES.MANAGER, ROLES.RECEPTIONIST].includes(roleId as RoleId),

        /** Returns true if user can view all staff queues. */
        canViewQueue: () => STAFF_ROLE_IDS.includes(roleId as RoleId),
    };
};

export default useRole;
