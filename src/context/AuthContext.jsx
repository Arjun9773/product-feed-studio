import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    return {
      token,
      user_id:  localStorage.getItem('user_id'),
      role:     localStorage.getItem('role'),
      store_id: localStorage.getItem('store_id'),
      shopName: localStorage.getItem('shopName'),
      name:     localStorage.getItem('name'),
    };
  });

  const [activeStoreId, setActiveStoreId] = useState(
    () => localStorage.getItem('activeStoreId') || null
  );
  const [activeShopName, setActiveShopName] = useState(
    () => localStorage.getItem('activeShopName') || null
  );

  const login = (data) => {
    localStorage.setItem('token',    data.token);
    localStorage.setItem('user_id',  data.user_id || '');
    localStorage.setItem('role',     data.role);
    localStorage.setItem('store_id', data.store_id || '');
    localStorage.setItem('shopName', data.shopName || '');
    localStorage.setItem('name',     data.name || '');
    setUser({
      token:    data.token,
      user_id:  data.user_id,
      role:     data.role,
      store_id: data.store_id,
      shopName: data.shopName,
      name:     data.name,
    });
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
    setActiveStoreId(null);
    setActiveShopName(null);
  };

  const switchStore = (storeId, shopName) => {
    setActiveStoreId(storeId);
    setActiveShopName(shopName);
    localStorage.setItem('activeStoreId',  storeId);
    localStorage.setItem('activeShopName', shopName);
  };

  const currentStoreId = user?.role === 'super_admin' ? activeStoreId : user?.store_id;

  // ✅ role helpers — single source of truth
  const isSuperAdmin = user?.role === 'super_admin';
  const isStoreAdmin = user?.role === 'store_admin';
  const canEdit      = isSuperAdmin;

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      switchStore, 
      activeStoreId, 
      activeShopName, 
      currentStoreId,
      isSuperAdmin,   // ✅
      isStoreAdmin,   // ✅
      canEdit,        // ✅
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
