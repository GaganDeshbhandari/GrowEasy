import { createContext, useContext, useEffect, useRef, useState } from "react";
import api from "../api/axios";

// 1. Create the context
const AuthContext = createContext();
const AUTH_STORAGE_KEY = "groweasy_user";

// 2. AuthProvider component — wraps the entire app
export const AuthProvider = ({ children }) => {
  // 3. State: user object & loading flag
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Prevent duplicate initialization in React StrictMode (development).
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const initializeAuth = async () => {
      const storedUser = localStorage.getItem(AUTH_STORAGE_KEY);

      if (!storedUser) {
        setLoading(false);
        return;
      }

      try {
        const parsedUser = JSON.parse(storedUser);

        // Validate cookie session and rotate tokens before restoring UI user state.
        await api.post("/auth/refreshToken/");

        // Hydrate location for customers strictly on initialization
        if (parsedUser.role === "customer") {
          try {
            const profileRes = await api.get("/auth/customer/profile/");
            parsedUser.latitude = profileRes.data.latitude;
            parsedUser.longitude = profileRes.data.longitude;
          } catch (e) {
            console.warn("Failed to securely hydrate location on boot", e);
          }
        }

        // Hydrate location for delivery partners strictly on initialization
        if (parsedUser.role === "delivery_partner") {
          try {
            const profileRes = await api.get("/delivery/me/");
            parsedUser.latitude = profileRes.data.latitude;
            parsedUser.longitude = profileRes.data.longitude;
          } catch (e) {
            console.warn("Failed to securely hydrate delivery location on boot", e);
          }
        }

        setUser(parsedUser);
      } catch (error) {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // 4a. login — saves the user object into state
  const login = (userData) => {
    setUser(userData);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
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
      localStorage.removeItem(AUTH_STORAGE_KEY);
      setLoading(false);
    }
  };

  // Helper for dynamically appending location to context post-save
  const updateLocationInContext = (lat, lng) => {
    if (!user) return;
    const updatedUser = { ...user, latitude: lat, longitude: lng };
    setUser(updatedUser);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedUser));
  };

  // Value object shared with every component that uses this context
  const value = {
    user,
    loading,
    login,
    logout,
    setLoading,
    updateLocationInContext,
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
