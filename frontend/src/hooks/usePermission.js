// hooks/usePermission.js — Hook pour vérifier les permissions côté frontend
import { useCallback } from 'react';

/**
 * Hook personnalisé pour vérifier les permissions d'un utilisateur.
 * 
 * Utilisation :
 * const { hasPermission, hasAnyPermission, isAdmin } = usePermission();
 * 
 * if (hasPermission('FACTURE:CREATE')) { ... }
 * if (hasAnyPermission(['USER:READ', 'USER:UPDATE'])) { ... }
 */
const usePermission = () => {
  // Récupérer l'utilisateur depuis le localStorage
  const getUser = useCallback(() => {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  }, []);

  /**
   * Vérifie si l'utilisateur a une permission spécifique.
   * Format : 'ENTITY:ACTION' (ex: 'FACTURE:CREATE')
   * 
   * @param {string} permission - La permission à vérifier
   * @returns {boolean} true si l'utilisateur a la permission
   */
  const hasPermission = useCallback((permission) => {
    const user = getUser();
    if (!user) return false;

    // L'admin système a toutes les permissions
    if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
      // Vérifier via appRoles si SUPER_ADMIN
      if (user.appRoles?.some(r => r.name === 'SUPER_ADMIN')) {
        return true;
      }
    }

    // Vérifier dans la liste des permissions chargées depuis le serveur
    if (user.permissions && Array.isArray(user.permissions)) {
      return user.permissions.includes(permission);
    }

    return false;
  }, [getUser]);

  /**
   * Vérifie si l'utilisateur a AU MOINS UNE des permissions listées.
   * 
   * @param {string[]} permissions - Liste des permissions
   * @returns {boolean}
   */
  const hasAnyPermission = useCallback((permissions) => {
    return permissions.some(p => hasPermission(p));
  }, [hasPermission]);

  /**
   * Vérifie si l'utilisateur a TOUTES les permissions listées.
   * 
   * @param {string[]} permissions - Liste des permissions
   * @returns {boolean}
   */
  const hasAllPermissions = useCallback((permissions) => {
    return permissions.every(p => hasPermission(p));
  }, [hasPermission]);

  /**
   * Vérifie si l'utilisateur est un administrateur système.
   * Un admin système a le rôle ADMIN ou SUPER_ADMIN.
   */
  const isAdmin = useCallback(() => {
    const user = getUser();
    if (!user) return false;
    return user.role === 'ADMIN' ||
      user.appRoles?.some(r => ['SUPER_ADMIN', 'ADMIN'].includes(r.name));
  }, [getUser]);

  /**
   * Vérifie si l'utilisateur a un rôle applicatif spécifique.
   * 
   * @param {string} roleName - Nom du rôle (ex: 'MANAGER')
   */
  const hasRole = useCallback((roleName) => {
    const user = getUser();
    if (!user) return false;
    return user.appRoles?.some(r => r.name === roleName) || false;
  }, [getUser]);

  /**
   * Récupère la liste complète des permissions de l'utilisateur.
   */
  const getPermissions = useCallback(() => {
    const user = getUser();
    return user?.permissions || [];
  }, [getUser]);

  /**
   * Récupère les rôles applicatifs de l'utilisateur.
   */
  const getRoles = useCallback(() => {
    const user = getUser();
    return user?.appRoles || [];
  }, [getUser]);

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isAdmin,
    hasRole,
    getPermissions,
    getRoles,
  };
};

export default usePermission;
