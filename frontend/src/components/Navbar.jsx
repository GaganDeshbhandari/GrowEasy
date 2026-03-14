import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import api from "../api/axios";

const Navbar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [cartCount, setCartCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (user?.role === "customer") {
      api
        .get("/orders/cart/")
        .then((res) => {
          const items = res.data?.items || [];
          setCartCount(items.length);
        })
        .catch(() => setCartCount(0));
    } else {
      setCartCount(0);
    }
  }, [user, location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
    setMenuOpen(false);
  };

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const isActive = (path) => location.pathname === path;

  const linkClass = (path) =>
    `text-sm font-medium transition-colors duration-200 ${
      isActive(path)
        ? "text-green-600 dark:text-green-400 font-bold"
        : "text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400"
    }`;

  return (
    <nav className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* ── Logo ── */}
          <Link to="/" className="flex items-center gap-2 shrink-0 group">
            <span className="text-2xl group-hover:scale-110 transition-transform duration-300">🌱</span>
            <span className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent tracking-tight">
              GrowEasy
            </span>
          </Link>

          {/* ── Desktop Links ── */}
          <div className="hidden md:flex items-center gap-7">

            {!user && (
              <>
                <Link to="/products" className={linkClass("/products")}>Products</Link>
                <Link to="/login" className={linkClass("/login")}>Login</Link>
                <Link
                  to="/register"
                  className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-5 py-2 rounded-lg shadow-sm transition-all duration-200"
                >
                  Register
                </Link>
              </>
            )}

            {user?.role === "customer" && (
              <>
                <Link to="/products" className={linkClass("/products")}>Products</Link>
                <Link to="/cart" className={`relative ${linkClass("/cart")}`}>
                  <span>Cart</span>
                  {cartCount > 0 && (
                    <span className="absolute -top-2.5 -right-3.5 bg-green-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center ring-2 ring-white dark:ring-gray-900">
                      {cartCount > 9 ? "9+" : cartCount}
                    </span>
                  )}
                </Link>
                <Link to="/orders" className={linkClass("/orders")}>Orders</Link>
                <Link to="/profile/customer" className={linkClass("/profile/customer")}>Profile</Link>
                <button onClick={handleLogout} className="text-sm font-medium text-red-500 hover:text-red-600 transition">
                  Logout
                </button>
              </>
            )}

            {user?.role === "farmer" && (
              <>
                <Link to="/farmer/dashboard" className={linkClass("/farmer/dashboard")}>Dashboard</Link>
                <Link to="/farmer/orders" className={linkClass("/farmer/orders")}>Orders</Link>
                <Link to="/profile/farmer" className={linkClass("/profile/farmer")}>Profile</Link>
                <button onClick={handleLogout} className="text-sm font-medium text-red-500 hover:text-red-600 transition">
                  Logout
                </button>
              </>
            )}

            {/* ── Dark mode toggle ── */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-yellow-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300 border border-gray-200 dark:border-gray-700"
              aria-label="Toggle dark mode"
            >
              {theme === "dark" ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd"/>
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/>
                </svg>
              )}
            </button>
          </div>

          {/* ── Mobile right side ── */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-yellow-400 border border-gray-200 dark:border-gray-700 transition-all"
              aria-label="Toggle dark mode"
            >
              {theme === "dark" ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd"/>
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/>
                </svg>
              )}
            </button>

            <button
              className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              {menuOpen ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile Dropdown ── */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-4 space-y-3 shadow-lg transition-colors duration-300">

          {!user && (
            <>
              <Link to="/products" className="block text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-green-600">Products</Link>
              <Link to="/login" className="block text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-green-600">Login</Link>
              <Link to="/register" className="block text-sm font-semibold text-white bg-green-600 hover:bg-green-700 px-4 py-2.5 rounded-lg text-center">Register</Link>
            </>
          )}

          {user?.role === "customer" && (
            <>
              <Link to="/products" className="block text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-green-600">Products</Link>
              <Link to="/cart" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-green-600">
                Cart {cartCount > 0 && <span className="bg-green-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{cartCount > 9 ? "9+" : cartCount}</span>}
              </Link>
              <Link to="/orders" className="block text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-green-600">Orders</Link>
              <Link to="/profile/customer" className="block text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-green-600">Profile</Link>
              <button onClick={handleLogout} className="block w-full text-left text-sm font-medium text-red-500 hover:text-red-600">Logout</button>
            </>
          )}

          {user?.role === "farmer" && (
            <>
              <Link to="/farmer/dashboard" className="block text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-green-600">Dashboard</Link>
              <Link to="/farmer/orders" className="block text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-green-600">Orders</Link>
              <Link to="/profile/farmer" className="block text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-green-600">Profile</Link>
              <button onClick={handleLogout} className="block w-full text-left text-sm font-medium text-red-500 hover:text-red-600">Logout</button>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
