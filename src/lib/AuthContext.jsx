import React, { createContext, useState, useContext } from 'react';
import { db } from "@/api/base44Client";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [isLoadingAuth] = useState(false);
  const [authChecked] = useState(true);

  const logout = () => { setUser(null); setIsAuthenticated(false); };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoadingAuth, authChecked, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
