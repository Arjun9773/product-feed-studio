import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    return {
      token,
      userId:    localStorage.getItem('userId'),
      userType:  localStorage.getItem('userType'),
      storeId:   localStorage.getItem('storeId'),
      shopName:  localStorage.getItem('shopName'),
      name:      localStorage.getItem('name'),
      companyId: localStorage.getItem('companyId'),
    };
  });

  const [activeStoreId, setActiveStoreId] = useState(
    () => localStorage.getItem('activeStoreId') || null
  );
  const [activeShopName, setActiveShopName] = useState(
    () => localStorage.getItem('activeShopName') || null
  );

  const login = (data) => {
    // Save all user info to localStorage
    localStorage.setItem('token',     data.token);
    localStorage.setItem('userId',    data.userId    || '');
    localStorage.setItem('userType',  data.userType  || '');
    localStorage.setItem('storeId',   data.storeId   || '');
    localStorage.setItem('shopName',  data.shopName  || '');
    localStorage.setItem('name',      data.name      || '');
    localStorage.setItem('companyId', data.companyId || '');

    setUser({
      token:     data.token,
      userId:    data.userId,
      userType:  data.userType,
      storeId:   data.storeId,
      shopName:  data.shopName,
      name:      data.name,
      companyId: data.companyId,
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

  // Super admin → switched store, Store admin → own store
  const currentStoreId = user?.userType === 'super_admin' ? activeStoreId : user?.storeId;

  // Role helpers — single source of truth
  const isSuperAdmin = user?.userType === 'super_admin';
  const isStoreAdmin = user?.userType === 'store_admin';
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
      isSuperAdmin,
      isStoreAdmin,
      canEdit,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);