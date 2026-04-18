import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { resolveMediaUrl } from "../../utils/media";

const ProductList = () => {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [count, setCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const fetchCategories = async () => {
    try {
      const res = await api.get("/products/categories/");
      setCategories(Array.isArray(res.data) ? res.data : []);
    } catch {
      setCategories([]);
    }
  };

  const fetchProducts = async (page = 1) => {
    setLoading(true);
    setError("");
    try {
      const categoryQuery = selectedCategory !== "all" ? `&category=${selectedCategory}` : "";
      const res = await api.get(`/products/?page=${page}${categoryQuery}`);
      const data = res.data;
      setProducts(data.results);
      setCount(data.count);
      setTotalPages(Math.ceil(data.count / 12));
    } catch {
      setError("Failed to load products. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts(currentPage);
  }, [currentPage, selectedCategory]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const allCategories = useMemo(
    () => [{ id: "all", name: "All" }, ...categories],
    [categories]
  );

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
      return matchesSearch;
    });
  }, [products, search]);

  const getPrimaryImage = (images) => {
    if (!images || images.length === 0) return null;
    const primary = images.find((img) => img.is_primary) || images[0];
    return resolveMediaUrl(primary?.image);
  };

  const getStockText = (stock, unit) => {
    const stockValue = parseFloat(stock);
    const normalizedUnit = String(unit || "").toLowerCase();

    if (!(stockValue > 0)) return "Out of Stock";

    const displayStock = Number.isInteger(stockValue) ? stockValue : stockValue.toFixed(2).replace(/\.00$/, "");

    if (normalizedUnit.includes("kg")) {
      return `${displayStock} kg left`;
    }

    if (normalizedUnit.includes("unit")) {
      return `${displayStock} ${stockValue === 1 ? "unit" : "units"} left`;
    }

    return `${displayStock} ${unit || "units"} left`;
  };

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getPageNumbers = () => {
    const pages = [];
    const delta = 2;
    const left = Math.max(1, currentPage - delta);
    const right = Math.min(totalPages, currentPage + delta);
    for (let i = left; i <= right; i++) pages.push(i);
    return pages;
  };

  // ── Loading skeleton ──
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] dark:bg-gray-950 pt-32 pb-20 px-4 transition-colors duration-300">
        <div className="max-w-7xl mx-auto">
          {/* Skeleton Header */}
          <div className="flex flex-col items-center mb-20 animate-pulse">
            <div className="h-6 w-32 bg-emerald-100 dark:bg-emerald-900/30 rounded-full mb-6"></div>
            <div className="h-12 sm:h-16 w-3/4 sm:w-1/2 bg-gray-200 dark:bg-gray-800 rounded-2xl mb-4"></div>
            <div className="h-5 w-1/2 sm:w-1/3 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm animate-pulse">
                <div className="bg-gray-100 dark:bg-gray-800 h-60 w-full" />
                <div className="p-6 space-y-4">
                  <div className="h-6 bg-gray-100 dark:bg-gray-800 rounded-lg w-3/4" />
                  <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded-md w-1/2" />
                  <div className="pt-4 border-t border-gray-100 dark:border-gray-800 mt-4 flex justify-between items-end">
                    <div className="h-8 bg-gray-100 dark:bg-gray-800 rounded-lg w-20" />
                    <div className="h-6 bg-gray-100 dark:bg-gray-800 rounded-md w-16" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Fetch error ──
  if (error) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] dark:bg-gray-950 flex flex-col items-center justify-center px-4 py-20 transition-colors duration-300">
        <div className="bg-white dark:bg-gray-900 p-10 rounded-[3rem] shadow-xl shadow-black/5 dark:shadow-black/40 border border-gray-200/50 dark:border-gray-800 flex flex-col items-center text-center max-w-md w-full">
          <p className="text-6xl mb-6 opacity-80 mix-blend-luminosity">🥀</p>
          <h2 className="font-heading text-2xl font-black text-gray-900 dark:text-white mb-2">Oops, something went wrong</h2>
          <p className="text-gray-500 dark:text-gray-400 text-base font-medium mb-8">{error}</p>
          <button
            onClick={() => fetchProducts(currentPage)}
            className="w-full px-6 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl shadow-sm font-bold transition-all active:scale-[0.98]"
          >
            Refresh Harvest
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] dark:bg-gray-950 font-sans text-gray-900 dark:text-gray-100 transition-colors duration-300 selection:bg-emerald-200 selection:text-emerald-900 dark:selection:bg-emerald-800 dark:selection:text-emerald-100 pt-[88px] pb-20">

      {/* ── Filter / Search Bar ── */}
      <div className="sticky top-[72px] z-30 bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50 transition-colors duration-300 shadow-sm shadow-black/5 dark:shadow-black/20">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row gap-4 items-center justify-between">

          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto flex-1">
            {/* Search bar */}
            <div className="relative w-full sm:max-w-md group">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500 group-focus-within:text-emerald-500 transition-colors" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-200/70 dark:border-gray-700/70 bg-white dark:bg-gray-800 text-sm font-bold text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 hover:border-gray-300 dark:hover:border-gray-600 transition-all shadow-sm"
              />
            </div>

            {/* Category filter */}
            <div className="relative w-full sm:w-auto">
              <div
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`flex items-center justify-between w-full sm:w-56 px-5 py-2.5 rounded-2xl border bg-white dark:bg-gray-800 cursor-pointer shadow-sm transition-all outline-none ${
                  isDropdownOpen
                    ? "border-emerald-500 ring-4 ring-emerald-500/20"
                    : "border-gray-200/70 dark:border-gray-700/70 hover:border-gray-300 dark:hover:border-gray-600 focus:ring-4 focus:ring-emerald-500/20"
                }`}
                tabIndex={0}
              >
                <div className="flex flex-col text-left">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-500 mb-0.5">Category</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate leading-none">
                    {allCategories.find((c) => c.id === selectedCategory)?.name || "All"}
                  </span>
                </div>
                <svg className={`w-4 h-4 ml-3 text-gray-400 transition-transform duration-300 ${isDropdownOpen ? "rotate-180 text-emerald-500" : "group-hover:text-gray-600 dark:group-hover:text-gray-300"}`} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              {/* Overlay for closing dropdown when clicking outside */}
              {isDropdownOpen && (
                <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
              )}

              {/* Dropdown Menu */}
              <div
                className={`absolute right-0 top-full mt-2 w-full sm:w-56 bg-white dark:bg-[#111812] border border-gray-100 dark:border-gray-800/80 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-2 z-50 transition-all duration-200 origin-top flex flex-col gap-1 max-h-[300px] overflow-y-auto hide-scrollbar ${
                  isDropdownOpen
                    ? "opacity-100 scale-100 translate-y-0"
                    : "opacity-0 scale-95 -translate-y-2 pointer-events-none hidden"
                }`}
              >
                {allCategories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                        setSelectedCategory(cat.id);
                        setCurrentPage(1);
                        setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-colors ${
                      selectedCategory === cat.id
                        ? "bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400"
                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1A241A] hover:text-gray-900 dark:hover:text-white"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── Product Grid ── */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {filtered.length === 0 ? (
          <div className="text-center py-24 bg-white/50 dark:bg-gray-900/30 rounded-[3rem] border border-gray-200/50 dark:border-gray-800/50 backdrop-blur-sm shadow-sm">
            <p className="text-7xl mb-6 opacity-60 mix-blend-luminosity">🌾</p>
            <p className="font-heading text-3xl font-black text-gray-900 dark:text-white">Nothing found here.</p>
            <p className="text-gray-500 dark:text-gray-400 text-base font-medium mt-4 max-w-md mx-auto leading-relaxed">Try adjusting your filters, or search terms to uncover fresh produce.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filtered.map((product) => (
              <div
                key={product.id}
                onClick={() => navigate(`/products/${product.id}`)}
                className="group relative flex flex-col bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-200/60 dark:border-gray-800/80 overflow-hidden cursor-pointer shadow-sm hover:shadow-2xl hover:shadow-button dark:hover:shadow-black/50 transition-all duration-500 hover:-translate-y-2 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/50"
              >
                {/* Image Container */}
                <div className="relative h-60 w-full overflow-hidden bg-gray-100 dark:bg-gray-800/80 border-b border-gray-100 dark:border-gray-800">
                  {getPrimaryImage(product.images) ? (
                    <img
                      src={getPrimaryImage(product.images)}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-110"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 dark:text-gray-600 bg-gray-50 dark:bg-gray-800/80">
                      <span className="text-4xl mb-2 grayscale opacity-50">📸</span>
                      <span className="text-[10px] font-black uppercase tracking-widest">No Image</span>
                    </div>
                  )}
                  {/* Overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                  {/* Badge */}
                  {product.categories.length > 0 && (
                    <span className="absolute top-4 left-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md text-gray-900 dark:text-gray-100 shadow-sm text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border border-gray-200/50 dark:border-gray-700/50">
                      {product.categories[0].name}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="p-6 flex flex-col flex-grow relative bg-white dark:bg-gray-900">
                  <div className="flex justify-between items-start gap-3 mb-2">
                    <h3 className="font-heading font-black text-xl text-gray-900 dark:text-white leading-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-2">
                      {product.name}
                    </h3>
                  </div>

                  <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold mb-auto uppercase tracking-wide">
                    By {product.farmer_id ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/farmers/${product.farmer_id}`);
                        }}
                        className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline decoration-2 underline-offset-4 ml-1 capitalize"
                      >
                        {product.farmer}
                      </button>
                    ) : (
                      <span className="font-bold text-gray-700 dark:text-gray-300 ml-1 capitalize">{product.farmer}</span>
                    )}
                  </p>

                  {/* Pricing & Stock Footer */}
                  <div className="mt-6 pt-5 border-t border-gray-100 dark:border-gray-800 flex items-end justify-between">
                    <div>
                      <span className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                        ₹{parseFloat(product.price).toFixed(2)}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 font-bold ml-1 uppercase tracking-wider">
                        / {product.unit}
                      </span>
                    </div>

                    <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-[0.4rem] border ${
                      parseFloat(product.stock) > 0
                        ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/50"
                        : "bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border-rose-200/60 dark:border-rose-800/50"
                    }`}>
                      {getStockText(product.stock, product.unit)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="mt-16 flex flex-col items-center gap-4">
            <div className="inline-flex items-center gap-1.5 bg-white dark:bg-gray-900 p-2 rounded-2xl shadow-sm border border-gray-200/60 dark:border-gray-800">

              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all disabled:opacity-30 disabled:hover:bg-transparent"
              >
                Prev
              </button>

              <div className="hidden sm:flex items-center gap-1 px-3 border-x border-gray-200/60 dark:border-gray-800">
                {getPageNumbers()[0] > 1 && (
                  <>
                    <button onClick={() => handlePageChange(1)} className="w-10 h-10 rounded-xl text-sm font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition">1</button>
                    {getPageNumbers()[0] > 2 && <span className="text-gray-400 px-1 font-bold">…</span>}
                  </>
                )}

                {getPageNumbers().map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${
                      page === currentPage
                        ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30 dark:shadow-emerald-500/20 scale-105"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                  >
                    {page}
                  </button>
                ))}

                {getPageNumbers().at(-1) < totalPages && (
                  <>
                    {getPageNumbers().at(-1) < totalPages - 1 && <span className="text-gray-400 px-1 font-bold">…</span>}
                    <button onClick={() => handlePageChange(totalPages)} className="w-10 h-10 rounded-xl text-sm font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition">{totalPages}</button>
                  </>
                )}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all disabled:opacity-30 disabled:hover:bg-transparent"
              >
                Next
              </button>
            </div>

            <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
              Page {currentPage} of {totalPages}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductList;
