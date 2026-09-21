import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import type { StaffRole } from './types';

interface RoleContextValue {
  role: StaffRole | null;
}

// An unresolved identity must never inherit privileged actions.
const RoleContext = createContext<RoleContextValue>({ role: null });

export function RoleProvider({ children, role }: { children: ReactNode; role: StaffRole | null }) {
  return <RoleContext.Provider value={{ role }}>{children}</RoleContext.Provider>;
}

export function useCurrentRole(): RoleContextValue {
  return useContext(RoleContext);
}

export const ROLE_LABELS: Record<StaffRole, string> = {
  admin: 'Admin',
  clinician: 'Clinician',
  front_desk: 'Front Desk',
};

export function canUploadRecords(role: StaffRole | null): boolean {
  return role === 'admin' || role === 'clinician';
}

export function canRevokeAccess(role: StaffRole | null): boolean {
  return role === 'admin' || role === 'clinician';
}

export function canManageStaff(role: StaffRole | null): boolean {
  return role === 'admin';
}
