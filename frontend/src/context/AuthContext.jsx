import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true); // ← KEY FIX

  // Load user from localStorage on app start
  useEffect(() => {
    try {
      const saved = localStorage.getItem("atix_user");
      if (saved) setUser(JSON.parse(saved));
    } catch {
      localStorage.removeItem("atix_user");
    } finally {
      setLoading(false); // ← done checking, now render
    }
  }, []);

  function login(userData) {
    setUser(userData);
    localStorage.setItem("atix_user", JSON.stringify(userData));
  }

  function logout() {
    setUser(null);
    localStorage.removeItem("atix_user");
    localStorage.removeItem("atix_token");
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

