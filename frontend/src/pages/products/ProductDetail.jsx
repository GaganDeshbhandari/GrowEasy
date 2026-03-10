import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";

const BASE_URL = "http://localhost:8000";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);

  const [cartLoading, setCartLoading] = useState(false);
  const [cartSuccess, setCartSuccess] = useState(false);
  const [cartError, setCartError] = useState("");

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await api.get(`/products/${id}/`);
        setProduct(res.data);
      } catch (err) {
        if (err.response?.status === 404) setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleAddToCart = async () => {
    setCartLoading(true);
    setCartError("");
    setCartSuccess(false);
    try {
      await api.post("/orders/cart/items/", {
        product: product.id,
        quantity: quantity,
      });
      setCartSuccess(true);
      setTimeout(() => setCartSuccess(false), 3000);
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.non_field_errors?.[0];
      setCartError(msg || "Could not add to cart. Please try again.");
    } finally {
      setCartLoading(false);
    }
  };

  const getImageUrl = (img) => (img?.image ? `${BASE_URL}${img.image}` : null);
  const images = product?.images?.length > 0 ? product.images : [{ image: null, is_primary: true }];

  const NoImagePlaceholder = () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500">
      <svg className="w-16 h-16 mb-2" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
      </svg>
      <span className="text-sm font-medium">No Image</span>
    </div>
  );

  // ── Loading ──
  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10 animate-pulse">
        <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-8" />
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-1/2 bg-gray-200 dark:bg-gray-700 rounded-xl h-[400px]" />
          <div className="w-full md:w-1/2 space-y-4">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mt-6" />
            <div className="h-14 bg-gray-200 dark:bg-gray-700 rounded-lg mt-8" />
          </div>
        </div>
      </div>
    );
  }

  // ── Not found ──
  if (notFound || !product) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-24 text-center">
        <p className="text-7xl mb-6">🔍</p>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Product Not Found</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">This product may have been removed or never existed.</p>
        <button
          onClick={() => navigate("/products")}
          className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-8 py-3 rounded-lg shadow-sm transition"
        >
          ← Back to Products
        </button>
      </div>
    );
  }

  const maxQty = parseFloat(product.stock);

  return (
    <div className="min-h-screen transition-colors duration-300 pb-20">
      <div className="max-w-5xl mx-auto px-4 py-10">

        {/* ── Back button ── */}
        <button
          onClick={() => navigate("/products")}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors mb-8 group"
        >
          <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Products
        </button>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm dark:shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-300">
          <div className="flex flex-col md:flex-row">

            {/* ── LEFT: Image Gallery ── */}
            <div className="w-full md:w-1/2 p-6 lg:p-8 space-y-4">
              <div className="rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700 aspect-[4/3] border border-gray-100 dark:border-gray-700">
                {getImageUrl(images[activeImageIndex]) ? (
                  <img
                    src={getImageUrl(images[activeImageIndex])}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <NoImagePlaceholder />
                )}
              </div>

              {images.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImageIndex(i)}
                      className={`shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                        i === activeImageIndex
                          ? "border-green-500 opacity-100 shadow-md"
                          : "border-gray-200 dark:border-gray-700 opacity-60 hover:opacity-100"
                      }`}
                    >
                      {getImageUrl(img) ? (
                        <img
                          src={getImageUrl(img)}
                          alt={`${product.name} thumbnail ${i + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400 dark:text-gray-500">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ── RIGHT: Product Info ── */}
            <div className="w-full md:w-1/2 p-6 lg:p-8 md:border-l border-gray-100 dark:border-gray-700 flex flex-col justify-center bg-gray-50/50 dark:bg-gray-900/50">

              <div className="mb-6">
                {product.categories.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {product.categories.map((cat) => (
                      <span key={cat.id} className="bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border border-green-200 dark:border-green-800">
                        {cat.name}
                      </span>
                    ))}
                  </div>
                )}

                <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white leading-tight mb-2">
                  {product.name}
                </h1>

                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Freshly harvested by <span className="font-bold text-gray-700 dark:text-gray-200">{product.farmer}</span>
                </p>
              </div>

              {/* Price & Stock */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm mb-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Price</p>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl font-black text-green-600 dark:text-green-400">
                      ₹{parseFloat(product.price).toFixed(2)}
                    </span>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      / {product.unit}
                    </span>
                  </div>
                </div>

                <div className="h-10 w-px bg-gray-200 dark:bg-gray-700 hidden sm:block" />

                <div>
                  <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Availability</p>
                  <span className={`inline-flex items-center gap-2 text-sm font-bold px-3 py-1.5 rounded-lg border ${
                    maxQty > 0
                      ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800"
                      : "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800"
                  }`}>
                    <span className={`w-2 h-2 rounded-full animate-pulse ${maxQty > 0 ? "bg-green-500" : "bg-red-500"}`} />
                    {maxQty > 0 ? `${product.stock} ${product.unit} in stock` : "Sold out"}
                  </span>
                </div>
              </div>

              {/* ── Add to Cart (customer only) ── */}
              {user?.role === "customer" && maxQty > 0 && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Quantity selector */}
                    <div className="flex items-center bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm p-1">
                      <button
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        className="w-10 h-10 flex items-center justify-center rounded text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                      >−</button>
                      <div className="w-14 flex flex-col items-center justify-center">
                        <span className="text-base font-bold text-gray-900 dark:text-white">{quantity}</span>
                        <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500">{product.unit}</span>
                      </div>
                      <button
                        onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                        className="w-10 h-10 flex items-center justify-center rounded text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                      >+</button>
                    </div>

                    {/* Add to cart button */}
                    <button
                      onClick={handleAddToCart}
                      disabled={cartLoading}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold text-lg py-3 px-6 rounded-lg shadow-sm transition disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                    >
                      {cartLoading ? (
                        <>
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                          </svg>
                          Adding...
                        </>
                      ) : "🛒 Add to Cart"}
                    </button>
                  </div>

                  {cartSuccess && (
                    <div className="flex items-center gap-3 text-green-700 dark:text-green-400 text-sm font-semibold bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg px-4 py-3">
                      ✅ Successfully added to your cart!
                    </div>
                  )}
                  {cartError && (
                    <div className="flex items-center gap-3 text-red-700 dark:text-red-400 text-sm font-semibold bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3">
                      ❌ {cartError}
                    </div>
                  )}
                </div>
              )}

              {/* Not logged in prompt */}
              {!user && (
                <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-6 text-center shadow-sm">
                  <p className="text-gray-600 dark:text-gray-300 font-medium mb-3">Want to buy this fresh product?</p>
                  <div className="flex items-center justify-center gap-3">
                    <Link to="/login" className="px-5 py-2 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-white font-bold rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition border border-gray-200 dark:border-gray-600">Sign In</Link>
                    <span className="text-gray-400 text-sm">or</span>
                    <Link to="/register" className="text-green-600 dark:text-green-400 font-bold hover:underline">Create Account</Link>
                  </div>
                </div>
              )}

              {/* ── Reviews placeholder ── */}
              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Customer Reviews</h3>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700 text-center">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Reviews for this product are coming soon.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
