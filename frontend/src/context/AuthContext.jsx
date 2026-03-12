import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [village, setVillage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    const storedVillage = localStorage.getItem('village');
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
      if (storedVillage) setVillage(JSON.parse(storedVillage));
    }
    setLoading(false);
  }, []);

  async function login(email, password, villageIdOrSubdomain, isSuperAdmin = false) {
    const endpoint = isSuperAdmin ? '/auth/super-admin/login' : '/auth/login';
    const payload = isSuperAdmin ? { email, password } : { email, password, village_id: villageIdOrSubdomain };
    const { data } = await api.post(endpoint, payload);
    localStorage.setItem('token', data.data.token);
    localStorage.setItem('user', JSON.stringify(data.data.user));
    if (data.data.village) {
      localStorage.setItem('village', JSON.stringify(data.data.village));
      localStorage.setItem('village_id', data.data.village.id);
      setVillage(data.data.village);
    }
    setUser(data.data.user);
    return data.data;
  }

  function logout() {
    localStorage.clear();
    setUser(null);
    setVillage(null);
  }

  function hasPermission(key) {
    return user?.permissions?.includes(key) || user?.is_super_admin;
  }

  return (
    <AuthContext.Provider value={{ user, village, loading, login, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
