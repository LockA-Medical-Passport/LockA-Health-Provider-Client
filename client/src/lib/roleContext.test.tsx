import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { canManageStaff, canRevokeAccess, canUploadRecords, RoleProvider, useCurrentRole } from './roleContext';
import type { StaffRole } from './types';

describe('permission helpers', () => {
  it.each<[StaffRole, boolean]>([
    ['admin', true],
    ['clinician', true],
    ['front_desk', false],
  ])('canUploadRecords(%s) -> %s', (role, expected) => {
    expect(canUploadRecords(role)).toBe(expected);
  });

  it.each<[StaffRole, boolean]>([
    ['admin', true],
    ['clinician', true],
    ['front_desk', false],
  ])('canRevokeAccess(%s) -> %s', (role, expected) => {
    expect(canRevokeAccess(role)).toBe(expected);
  });

  it.each<[StaffRole, boolean]>([
    ['admin', true],
    ['clinician', false],
    ['front_desk', false],
  ])('canManageStaff(%s) -> %s', (role, expected) => {
    expect(canManageStaff(role)).toBe(expected);
  });
});

function Probe() {
  const { role } = useCurrentRole();
  return <span>current role: {role ?? 'unresolved'}</span>;
}

describe('useCurrentRole', () => {
  it('denies privileged actions without a resolved identity', () => {
    render(<Probe />);
    expect(screen.getByText('current role: unresolved')).toBeInTheDocument();
    expect(canUploadRecords(null)).toBe(false);
    expect(canRevokeAccess(null)).toBe(false);
    expect(canManageStaff(null)).toBe(false);
  });

  it('updates consumers when the effective role changes', () => {
    const { rerender } = render(<RoleProvider role="admin"><Probe /></RoleProvider>);
    expect(screen.getByText('current role: admin')).toBeInTheDocument();
    rerender(<RoleProvider role="front_desk"><Probe /></RoleProvider>);
    expect(screen.getByText('current role: front_desk')).toBeInTheDocument();
  });
});
