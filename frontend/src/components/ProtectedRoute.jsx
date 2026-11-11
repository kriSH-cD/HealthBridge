import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = ({ allowedRoles = [] }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-slate-500">ਲੋਡ ਹੋ ਰਿਹਾ ਹੈ... (Loading SehatSetu)</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return (
      <div className="max-w-xl mx-auto my-12 p-6 bg-red-50 border border-red-200 rounded-xl text-center space-y-3">
        <h3 className="text-lg font-bold text-red-800">ਪਹੁੰਚ ਸੀਮਿਤ ਹੈ (Access Restricted)</h3>
        <p className="text-sm text-red-700">
          ਇਸ ਪੰਨੇ ਨੂੰ ਦੇਖਣ ਲਈ ਤੁਹਾਨੂੰ {allowedRoles.join(', ')} ਵਜੋਂ ਲਾਗਇਨ ਕਰਨਾ ਪਵੇਗਾ।
        </p>
        <p className="text-xs text-red-500">
          ਤੁਹਾਡੀ ਮੌਜੂਦਾ ਭੂਮਿਕਾ: <strong>{user?.role}</strong>
        </p>
      </div>
    );
  }

  return <Outlet />;
};

