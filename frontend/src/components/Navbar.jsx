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
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll state for navbar appearance shifting
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
    `relative px-3 py-1.5 text-sm font-medium transition-all duration-300 rounded-md group ${
      isActive(path)
        ? "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30"
        : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/80 dark:hover:bg-gray-800/80"
    }`;

  return (
    <>
      <div className={`fixed top-0 left-0 right-0 z-[70] flex justify-center transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${scrolled ? "pt-3 px-3" : "pt-6 px-4 md:px-8"}`}>
        <nav className={`w-full max-w-6xl transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] flex items-center justify-between px-5 md:px-6 
            backdrop-blur-xl bg-white/75 dark:bg-gray-950/75 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]
            ${scrolled ? "rounded-full py-2.5 border border-gray-200/50 dark:border-gray-800/60" : "rounded-2xl py-3.5 border border-transparent"}`}>
            
            {/* ── Logo ── */}
            <Link to="/" className="flex items-center gap-2.5 shrink-0 group z-10 outline-none rounded-md focus-visible:ring-2 focus-visible:ring-emerald-500">
              <span className="text-2xl group-hover:rotate-[15deg] group-hover:scale-110 transition-transform duration-500 will-change-transform origin-bottom">🌱</span>
              <span className="text-xl font-bold bg-gradient-to-br from-emerald-600 to-green-500 dark:from-emerald-400 dark:to-green-300 bg-clip-text text-transparent tracking-tight leading-none">
                GrowEasy
              </span>
            </Link>

            {/* ── Desktop Links ── */}
            <div className="hidden md:flex items-center gap-1.5 absolute left-1/2 -translate-x-1/2">
              {!user && (
                <>
                  <Link to="/" className={linkClass("/")}>Home</Link>
                  <Link to="/products" className={linkClass("/products")}>Products</Link>
                  <Link to="/about" className={linkClass("/about")}>About</Link>
                </>
              )}

              {user?.role === "customer" && (
                <>
                  <Link to="/products" className={linkClass("/products")}>Products</Link>
                  <Link to="/orders" className={linkClass("/orders")}>Orders</Link>
                  <Link to="/cart" className={`relative ${linkClass("/cart")}`}>
                    <span>Cart</span>
                    {cartCount > 0 && (
                      <span className="absolute -top-1.5 -right-2 bg-emerald-500 text-white text-[9px] font-extrabold rounded-full w-[18px] h-[18px] flex items-center justify-center shadow-sm shadow-emerald-500/30">
                        {cartCount > 9 ? "9+" : cartCount}
                      </span>
                    )}
                  </Link>
                  <Link to="/profile/customer" className={linkClass("/profile/customer")}>Profile</Link>
                </>
              )}

              {user?.role === "farmer" && (
                <>
                  <Link to="/farmer/dashboard" className={linkClass("/farmer/dashboard")}>Dashboard</Link>
                  <Link to="/farmer/orders" className={linkClass("/farmer/orders")}>Orders</Link>
                  <Link to="/profile/farmer" className={linkClass("/profile/farmer")}>Profile</Link>
                </>
              )}
            </div>

            {/* ── Right Actions ── */}
            <div className="hidden md:flex items-center gap-3 z-10">
              {/* Dark mode toggle */}
              <button
                onClick={toggleTheme}
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-yellow-400 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
                aria-label="Toggle dark mode"
              >
                {theme === "dark" ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd"/></svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                )}
              </button>

              <div className="h-4 w-px bg-gray-200 dark:bg-gray-800 mx-1"></div>

              {!user ? (
                <>
                  <Link to="/login" className="text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-2 transition-colors">Log in</Link>
                  <Link
                    to="/register"
                    className="relative inline-flex items-center justify-center px-4 py-1.5 text-sm font-bold text-white transition-all bg-gray-900 dark:bg-emerald-500 rounded-full hover:bg-gray-800 dark:hover:bg-emerald-400 hover:scale-[1.02] active:scale-95 shadow-[0_4px_12px_rgba(0,0,0,0.1)] focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                  >
                    <span>Sign up</span>
                  </Link>
                </>
              ) : (
                <button 
                  onClick={handleLogout} 
                  className="text-sm font-bold text-red-600 dark:text-red-500 px-4 py-1.5 rounded-full hover:bg-red-600 hover:text-white dark:hover:bg-red-500 dark:hover:text-white transition-all duration-300"
                >
                  Logout
                </button>
              )}
            </div>

            {/* ── Mobile Menu Toggle ── */}
            <div className="md:hidden flex items-center z-10">
              <button
                className="p-2 text-gray-600 dark:text-gray-300 hover:text-emerald-600 transition-colors focus:outline-none"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="Toggle menu"
              >
                {menuOpen ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
        </nav>
      </div>

      {/* spacer to prevent content from hiding under the fixed navbar */}
      <div className="h-24"></div>

      {/* ── Mobile Dropdown ── */}
      <div className={`md:hidden fixed inset-x-4 top-[72px] z-[60] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${menuOpen ? "opacity-100 translate-y-0 visible" : "opacity-0 -translate-y-4 invisible"}`}>
        <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/40 overflow-hidden divide-y divide-gray-100 dark:divide-gray-800/80">
          
          <div className="p-3 flex flex-col gap-1">
            {!user && (
              <>
                <Link to="/" className="px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg">Home</Link>
                <Link to="/products" className="px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg">Products</Link>
              </>
            )}

            {user?.role === "customer" && (
              <>
                <Link to="/products" className="px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg">Products</Link>
                <Link to="/orders" className="px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg">Orders</Link>
                <Link to="/cart" className="px-4 py-2.5 text-sm font-medium flex items-center justify-between text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg">
                  Cart 
                  {cartCount > 0 && <span className="bg-emerald-500 text-white text-[10px] font-bold rounded-full w-[18px] h-[18px] flex items-center justify-center">{cartCount > 9 ? "9+" : cartCount}</span>}
                </Link>
                <Link to="/profile/customer" className="px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg">Profile</Link>
              </>
            )}

            {user?.role === "farmer" && (
              <>
                <Link to="/farmer/dashboard" className="px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg">Dashboard</Link>
                <Link to="/farmer/orders" className="px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg">Orders</Link>
                <Link to="/profile/farmer" className="px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg">Profile</Link>
              </>
            )}
          </div>
          
          <div className="p-3 flex flex-col gap-2">
            {!user ? (
              <>
                <Link to="/login" className="w-full text-center px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:dark:bg-gray-700 rounded-xl transition-colors">Log in</Link>
                <Link to="/register" className="w-full text-center px-4 py-2.5 text-sm font-bold text-white bg-gray-900 dark:bg-emerald-500 rounded-xl shadow-sm hover:dark:bg-emerald-400 transition-colors">Sign up</Link>
              </>
            ) : (
              <button onClick={handleLogout} className="w-full text-center px-4 py-2.5 text-sm font-bold text-red-600 dark:text-red-500 bg-red-50/50 dark:bg-red-500/10 hover:bg-red-600 hover:text-white dark:hover:bg-red-500 dark:hover:text-white border border-red-100 dark:border-red-500/20 rounded-xl transition-all duration-300">
                Log out
              </button>
            )}
            
            <button
              onClick={toggleTheme}
              className="mt-1 w-full flex items-center justify-center gap-2.5 px-4 py-2.5 text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800/50 rounded-xl uppercase tracking-widest transition-all duration-200"
            >
              {theme === "dark" ? (
                <><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd"/></svg> Light Mode</>
              ) : (
                <><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg> Dark Mode</>
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Dim overlay for mobile menu */}
      {menuOpen && (
        <div 
          className="md:hidden fixed inset-0 z-50 bg-gray-900/20 dark:bg-black/40 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setMenuOpen(false)}
        />
      )}
    </>
  );
};

export default Navbar;
