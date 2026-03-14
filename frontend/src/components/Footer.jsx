import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Footer = () => {
  const { user } = useAuth();
  const currentYear = new Date().getFullYear();

  const roleLink =
    user?.role === "farmer"
      ? { to: "/farmer/dashboard", label: "Dashboard" }
      : user?.role === "customer"
      ? { to: "/orders", label: "My Orders" }
      : null;

  return (
    <footer className="mt-10 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-sm text-gray-600 dark:text-gray-400 text-center sm:text-left">
          © {currentYear} GrowEasy. All rights reserved.
        </p>

        <div className="flex items-center gap-4 text-sm font-medium">
          <Link
            to="/"
            className="text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition"
          >
            Home
          </Link>
          <Link
            to="/products"
            className="text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition"
          >
            Products
          </Link>
          {roleLink && (
            <Link
              to={roleLink.to}
              className="text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition"
            >
              {roleLink.label}
            </Link>
          )}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
