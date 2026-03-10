  import { Navigate } from "react-router-dom";
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

  // Rule 3: Logged in + correct role → show the page
  return children;
};

export default ProtectedRoute;
