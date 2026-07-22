import React from 'react';
import { useAuthStore } from '../../stores/authStore';
import { ForbiddenPage } from '../common/ForbiddenPage';

interface PermissionGuardProps {
  requiredPermission: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function PermissionGuard({
  requiredPermission,
  children,
  fallback,
}: PermissionGuardProps) {
  const { hasPermission } = useAuthStore();

  if (!hasPermission(requiredPermission)) {
    if (fallback !== undefined) {
      return <>{fallback}</>;
    }
    return <ForbiddenPage requiredPermission={requiredPermission} />;
  }

  return <>{children}</>;
}
