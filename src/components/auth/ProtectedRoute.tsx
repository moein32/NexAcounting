import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { ForbiddenPage } from '../common/ForbiddenPage';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  requiredPermission?: string;
  children?: React.ReactNode;
}

export function ProtectedRoute({ requiredPermission, children }: ProtectedRouteProps) {
  const { isAuthenticated, currentBusiness, isLoading, hasPermission } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-300 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="text-xs font-semibold">در حال دریافت و اعتبارسنجی اطلاعات کاربر...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!currentBusiness && location.pathname !== '/select-business') {
    return <Navigate to="/select-business" replace />;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <ForbiddenPage requiredPermission={requiredPermission} />;
  }

  return children ? <>{children}</> : <Outlet />;
}
