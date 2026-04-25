import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

/**
 * A component to conditionally render children or redirect based on user permissions.
 *
 * @param {Object} props
 * @param {string|string[]} props.permissions - The permission(s) required. If an array is provided,
 *                                              the user must have at least one (or all, depending on requireAll).
 * @param {boolean} [props.requireAll=false] - If true and permissions is an array, user must have all permissions.
 * @param {boolean} [props.redirect=false] - If true, redirects to dashboard when unauthorized instead of returning null.
 * @param {React.ReactNode} props.children - The content to render if authorized.
 */
const PermissionGuard = ({ permissions, requireAll = false, redirect = false, children }) => {
  const { user } = useContext(AuthContext);

  if (!user) {
    return redirect ? <Navigate to="/login" replace /> : null;
  }

  // System admin role has full access
  if (user.role === 'ADMIN') {
    return children;
  }

  const userPermissions = user.permissions || [];
  let hasAccess = false;

  if (Array.isArray(permissions)) {
    if (requireAll) {
      hasAccess = permissions.every(p => userPermissions.includes(p));
    } else {
      hasAccess = permissions.some(p => userPermissions.includes(p));
    }
  } else if (typeof permissions === 'string') {
    hasAccess = userPermissions.includes(permissions);
  } else {
    // If no permissions specified, just check authentication (which is handled by PrivateRoute usually)
    hasAccess = true;
  }

  if (hasAccess) {
    return children;
  }

  return redirect ? <Navigate to="/dashboard" replace /> : null;
};

export default PermissionGuard;
