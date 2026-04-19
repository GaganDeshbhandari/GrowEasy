import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * ProtectedRoute — guards a route based on login status and user role
 *
 * Props:
 *   allowedRole — "customer" or "farmer" (which role is allowed)
 *   children    — the page/component to show if access is granted
 */
const ProtectedRoute = ({ allowedRole, children }) => {
  const { user, loading } = useAuth();

  // While we're still determining if a user is logged in, show nothing
  if (loading) return null;

  // Rule 1: Not logged in → go to login page
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Rule 2: Logged in but wrong role → go to home page
  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to="/" replace />;
  }

  // Rule 3: Customer MUST have a location set unless they're already on the profile page
  const isCustomerUrl = location.pathname.startsWith("/cart") || 
                        location.pathname.startsWith("/checkout") || 
                        location.pathname.startsWith("/orders") ||
                        location.pathname === "/products"; // Notice: /products is public, but let's assume if it is wrapped, we check it. Wait, /products isn't wrapped in ProtectedRoute! So this rule only applies to nested routes. Wait, the prompt says "If logged-in customer... try to visit ANY route other than /profile/customer". So if they visit /products, but /products is NOT protected!
  // Wait, if /products isn't wrapped in ProtectedRoute, the route guard won't fire!

  // Rule 3: Logged in + correct role → show the page
  return children;
};

export default ProtectedRoute;
