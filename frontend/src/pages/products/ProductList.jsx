import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";

const ProductList = () => {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [count, setCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const fetchProducts = async (page = 1) => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/products/?page=${page}`);
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
    fetchProducts(currentPage);
  }, [currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedCategory]);

  const allCategories = useMemo(() => {
    const cats = new Set();
    products.forEach((p) => p.categories.forEach((c) => cats.add(c.name)));
    return ["All", ...Array.from(cats).sort()];
  }, [products]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory =
        selectedCategory === "All" ||
        p.categories.some((c) => c.name === selectedCategory);
      return matchesSearch && matchesCategory;
    });
  }, [products, search, selectedCategory]);

  const getPrimaryImage = (images) => {
    if (!images || images.length === 0) return null;
    const primary = images.find((img) => img.is_primary) || images[0];
    return `${api.defaults.baseURL}${primary.image}`;
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
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-pulse shadow-sm">
              <div className="bg-gray-100 dark:bg-gray-700 h-48 w-full" />
              <div className="p-5 space-y-3">
                <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded w-3/4" />
                <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded w-1/2" />
                <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded w-1/3 mt-4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Fetch error ──
  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <p className="text-6xl mb-4">😞</p>
        <p className="text-gray-500 dark:text-gray-400 text-lg">{error}</p>
        <button
          onClick={() => fetchProducts(currentPage)}
          className="mt-6 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-sm font-medium transition"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen transition-colors duration-300">

      {/* ── Sticky Search + Filter Bar ── */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-16 z-40 shadow-sm transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row gap-4 items-center">

          {/* Search bar */}
          <div className="relative w-full sm:max-w-md">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search on this page..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition shadow-sm"
            />
          </div>

          {/* Category filter */}
          <div className="relative w-full sm:w-auto">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full sm:w-auto pl-4 pr-10 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 transition cursor-pointer appearance-none shadow-sm"
            >
              {allCategories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <svg className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          {/* Count info */}
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap ml-auto bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700">
            {filtered.length} <span className="text-gray-400 dark:text-gray-500 text-xs">of</span> {count}
          </div>
        </div>
      </div>

      {/* ── Product Grid ── */}
      <div className="max-w-7xl mx-auto px-4 py-10">

        {filtered.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-6xl mb-5 opacity-80">🌾</p>
            <p className="text-gray-800 dark:text-gray-200 text-xl font-bold">No products found on this page</p>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">Try adjusting your search or category filter</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filtered.map((product) => (
              <div
                key={product.id}
                onClick={() => navigate(`/products/${product.id}`)}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-700 overflow-hidden cursor-pointer group transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:hover:shadow-2xl shadow-sm"
              >
                {/* Product image */}
                <div className="relative overflow-hidden h-52 bg-gray-100 dark:bg-gray-700">
                  {getPrimaryImage(product.images) ? (
                    <img
                      src={getPrimaryImage(product.images)}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                      <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                      </svg>
                      <span className="text-xs font-medium">No Image</span>
                    </div>
                  )}
                  {product.categories.length > 0 && (
                    <span className="absolute top-3 left-3 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 shadow text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border border-gray-200 dark:border-gray-700">
                      {product.categories[0].name}
                    </span>
                  )}
                </div>

                {/* Product info */}
                <div className="p-5">
                  <h3 className="font-bold text-gray-900 dark:text-white text-base truncate group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                    Sold by <span className="font-medium text-gray-700 dark:text-gray-300">{product.farmer}</span>
                  </p>

                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-end justify-between">
                    <div className="flex flex-col">
                      <span className="text-xl font-extrabold text-green-600 dark:text-green-400 tracking-tight">
                        ₹{parseFloat(product.price).toFixed(2)}
                      </span>
                      <span className="text-[11px] text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wide">
                        per {product.unit}
                      </span>
                    </div>

                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-md border ${
                      parseFloat(product.stock) > 0
                        ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800"
                        : "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800"
                    }`}>
                      {parseFloat(product.stock) > 0 ? `${product.stock} ${product.unit}` : "Sold out"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="mt-14 mb-6 flex flex-col items-center gap-4">
            <div className="flex items-center justify-center gap-2 bg-white dark:bg-gray-800 p-1.5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">

              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition disabled:opacity-40 disabled:hover:bg-transparent"
              >
                Prev
              </button>

              <div className="hidden sm:flex items-center gap-1 px-2 border-x border-gray-200 dark:border-gray-700">
                {getPageNumbers()[0] > 1 && (
                  <>
                    <button onClick={() => handlePageChange(1)} className="w-10 h-10 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition">1</button>
                    {getPageNumbers()[0] > 2 && <span className="text-gray-400 px-1">…</span>}
                  </>
                )}

                {getPageNumbers().map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`w-10 h-10 rounded-lg text-sm font-bold transition ${
                      page === currentPage
                        ? "bg-green-600 text-white shadow-md"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    {page}
                  </button>
                ))}

                {getPageNumbers().at(-1) < totalPages && (
                  <>
                    {getPageNumbers().at(-1) < totalPages - 1 && <span className="text-gray-400 px-1">…</span>}
                    <button onClick={() => handlePageChange(totalPages)} className="w-10 h-10 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition">{totalPages}</button>
                  </>
                )}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition disabled:opacity-40 disabled:hover:bg-transparent"
              >
                Next
              </button>
            </div>

            <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              Page {currentPage} of {totalPages}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductList;
