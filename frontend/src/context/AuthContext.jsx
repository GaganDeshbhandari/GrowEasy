import { createContext, useContext, useState } from "react";
import api from "../api/axios";

// 1. Create the context
const AuthContext = createContext();

// 2. AuthProvider component — wraps the entire app
export const AuthProvider = ({ children }) => {
  // 3. State: user object & loading flag
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 4a. login — saves the user object into state
  const login = (userData) => {
    setUser(userData);
    setLoading(false);
  };

  // 4b. logout — calls the backend logout API, then clears user
  const logout = async () => {
    try {
      await api.post("/auth/logout/");
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setUser(null);
    }
  };

  // Value object shared with every component that uses this context
  const value = {
    user,
    loading,
    login,
    logout,
    setLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// 5. Custom hook — shortcut so components just call useAuth()
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
