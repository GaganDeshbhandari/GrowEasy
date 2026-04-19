import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";
import { resolveMediaUrl } from "../../utils/media";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [quantityError, setQuantityError] = useState("");

  const [cartLoading, setCartLoading] = useState(false);
  const [cartSuccess, setCartSuccess] = useState(false);
  const [cartError, setCartError] = useState("");
  const [isShaking, setIsShaking] = useState(false);

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
    if (quantity > maxQty) {
      setQuantityError(`Only ${maxQty}kg available`);
      return;
    }

    if (quantity < 1) {
      setQuantityError("Quantity must be at least 1");
      return;
    }

    setCartLoading(true);
    setCartError("");
    setCartSuccess(false);
    try {
      await api.post("/orders/cart/items/", {
        product_id: product.id,
        quantity: quantity,
      });
      setCartSuccess(true);
      setQuantityError("");
      window.dispatchEvent(new Event("cartUpdated"));
      setTimeout(() => setCartSuccess(false), 3000);
    } catch (err) {
      const backendError = err.response?.data?.error;
      const msg = (Array.isArray(backendError) ? backendError[0] : backendError) || err.response?.data?.detail || err.response?.data?.non_field_errors?.[0];

      if (err.response?.status === 400) {
        setQuantityError(msg || "Insufficient stock. Please try again.");
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500);
      } else {
        setCartError(msg || "Could not add to cart. Please try again.");
      }
    } finally {
      setCartLoading(false);
    }
  };

  const handleQuantityInputChange = (event) => {
    const inputValue = parseFloat(event.target.value);
    if (Number.isNaN(inputValue)) {
      setQuantity(1);
      setQuantityError("");
      return;
    }

    setQuantity(inputValue);
    if (inputValue > maxQty) {
      setQuantityError(`Only ${maxQty}kg available`);
    } else {
      setQuantityError("");
    }
  };

  const getImageUrl = (img) => resolveMediaUrl(img?.image);
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
      <div className="min-h-screen bg-[#FDFBF7] dark:bg-[#0A0F0D] py-16 px-4 md:px-8 transition-colors duration-500">
        <div className="max-w-6xl mx-auto space-y-12 mb-10">
          <div className="h-6 w-32 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
          <div className="flex flex-col lg:flex-row gap-12">
            <div className="w-full lg:w-[55%]">
                <div className="bg-white dark:bg-[#111812] border border-gray-100 dark:border-gray-800/60 rounded-[32px] aspect-[4/3] w-full animate-pulse shadow-sm" />
                <div className="flex gap-4 mt-6">
                    <div className="w-24 h-24 bg-white dark:bg-[#111812] border border-gray-100 dark:border-gray-800/60 rounded-2xl animate-pulse" />
                    <div className="w-24 h-24 bg-white dark:bg-[#111812] border border-gray-100 dark:border-gray-800/60 rounded-2xl animate-pulse" />
                </div>
            </div>
            <div className="w-full lg:w-[45%] space-y-6 pt-4">
                <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded-xl w-3/4 animate-pulse" />
                <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded-lg w-1/3 animate-pulse" />
                <div className="h-24 bg-white dark:bg-[#111812] border border-gray-100 dark:border-gray-800/60 rounded-[24px] mt-8 animate-pulse shadow-sm" />
                <div className="h-16 bg-white dark:bg-[#111812] border border-gray-100 dark:border-gray-800/60 rounded-[20px] mt-8 animate-pulse shadow-sm" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Not found ──
  if (notFound || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7] dark:bg-[#0A0F0D] py-16 px-4 transition-colors duration-500">
        <div className="max-w-lg w-full bg-white dark:bg-[#111812] border border-gray-100 dark:border-gray-800/60 rounded-[32px] p-12 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none">
          <div className="w-20 h-20 bg-gray-50 dark:bg-[#1A241A] rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
          </div>
          <h2 className="text-2xl font-black text-[#111812] dark:text-[#E8F3EB] tracking-tight mb-3">Product Not Found</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-sm mx-auto font-medium">This product may have been removed, or the link is broken.</p>
          <button
            onClick={() => navigate("/products")}
            className="w-full bg-[#111812] hover:bg-[#1A241A] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-bold px-6 py-4 rounded-2xl transition-all shadow-sm active:scale-95"
          >
            Explore Market
          </button>
        </div>
      </div>
    );
  }

  const maxQty = parseFloat(product.available_stock ?? 0);

  return (
    <div className="min-h-screen bg-[#FDFBF7] dark:bg-[#0A0F0D] transition-colors duration-500 py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Back button ── */}
        <button
          onClick={() => navigate("/products")}
          className="inline-flex items-center gap-2 text-[13px] font-extrabold text-gray-500 dark:text-gray-400 hover:text-[#111812] dark:hover:text-emerald-400 tracking-widest uppercase transition-colors mb-10 group"
        >
          <svg className="w-5 h-5 group-hover:-translate-x-1.5 transition-transform" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          BACK TO MARKET
        </button>

        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">

            {/* ── LEFT: Image Gallery ── */}
            <div className="w-full lg:w-[55%] space-y-6">
              <div className="rounded-[32px] overflow-hidden bg-white dark:bg-[#111812] aspect-[4/3] border border-gray-100 dark:border-gray-800/80 shadow-[0_8px_30px_rgba(0,0,0,0.02)]">
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
                <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar snap-x">
                  {images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImageIndex(i)}
                      className={`shrink-0 w-24 h-24 rounded-2xl overflow-hidden border-2 transition-all snap-start ${
                        i === activeImageIndex
                          ? "border-emerald-500 opacity-100 ring-4 ring-emerald-500/20"
                          : "border-gray-200 dark:border-gray-800/80 opacity-60 hover:opacity-100 hover:border-gray-300 dark:hover:border-gray-700"
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
                        <div className="w-full h-full bg-gray-50 dark:bg-[#1A241A] flex items-center justify-center text-gray-400 dark:text-gray-500">
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
            <div className="w-full lg:w-[45%] space-y-8">

              <div className="space-y-4">
                {product.categories.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {product.categories.map((cat) => (
                      <span key={cat.id} className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border border-emerald-200/50 dark:border-emerald-800/50">
                        {cat.name}
                      </span>
                    ))}
                  </div>
                )}

                <h1 className="text-4xl lg:text-5xl font-black text-[#111812] dark:text-[#E8F3EB] tracking-tight leading-[1.1]">
                  {product.name}
                </h1>

                <p className="text-base text-gray-500 dark:text-gray-400 font-medium">
                  Freshly harvested by {" "}
                  {product.farmer_id ? (
                    <button
                      type="button"
                      onClick={() => navigate(`/farmers/${product.farmer_id}`)}
                      className="font-bold text-[#111812] dark:text-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-300 underline underline-offset-4 decoration-2 decoration-emerald-500/30 hover:decoration-emerald-500 transition-all"
                    >
                      {product.farmer}
                    </button>
                  ) : (
                    <span className="font-bold text-[#111812] dark:text-[#E8F3EB]">{product.farmer}</span>
                  )}
                </p>
              </div>

              {/* Price & Stock Container */}
              <div className="bg-white dark:bg-[#111812] rounded-[24px] p-6 lg:p-8 border border-gray-100 dark:border-gray-800/60 shadow-[0_4px_20px_rgb(0,0,0,0.02)] flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                  <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Market Price</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black text-[#111812] dark:text-emerald-400">
                      ₹{parseFloat(product.price).toFixed(2)}
                    </span>
                    <span className="text-lg font-bold text-gray-400 dark:text-gray-500">
                      / {product.unit}
                    </span>
                  </div>
                </div>

                <div className="h-16 w-px bg-gray-100 dark:bg-gray-800/60 hidden sm:block" />

                <div>
                  <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">Availability</p>
                  <span className={`inline-flex items-center gap-2.5 text-sm font-black px-4 py-2 rounded-xl border ${
                    maxQty > 0
                      ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-800/50"
                      : "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200/50 dark:border-red-800/50"
                  }`}>
                    <span className={`w-2 h-2 rounded-full font-black ${maxQty > 0 ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
                    {maxQty > 0 ? `${product.available_stock} ${product.unit} left` : "Out of Stock"}
                  </span>
                </div>
              </div>

              {/* ── Add to Cart (customer only) ── */}
              {user?.role === "customer" && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-4 lg:gap-5">
                    {/* Quantity selector */}
                    <div className={`flex items-center bg-white dark:bg-[#111812] border ${quantityError ? 'border-red-500 ring-2 ring-red-500/20' : 'border-gray-100 dark:border-gray-800/60'} rounded-[20px] shadow-sm p-1.5 shrink-0 ${isShaking ? 'animate-shake' : ''} transition-all ${maxQty === 0 ? 'opacity-50' : ''}`}>
                      <button
                        disabled={maxQty === 0}
                        onClick={() => {
                          setQuantity((q) => {
                            const next = Math.max(1, q - 1);
                            if (next <= maxQty) {
                              setQuantityError("");
                            }
                            return next;
                          });
                        }}
                        className={`w-12 h-12 flex items-center justify-center rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1A241A] hover:text-[#111812] dark:hover:text-white transition-all text-xl font-medium ${maxQty === 0 ? 'cursor-not-allowed' : ''}`}
                      >−</button>
                      <div className="w-20 flex flex-col items-center justify-center">
                        <input
                          type="number"
                          min={1}
                          max={maxQty}
                          step="1"
                          disabled={maxQty === 0}
                          value={maxQty === 0 ? 0 : quantity}
                          onChange={handleQuantityInputChange}
                          className={`w-full text-center bg-transparent text-lg font-black leading-none focus:outline-none ${quantityError ? 'text-red-500 font-bold' : 'text-[#111812] dark:text-[#E8F3EB]'} ${maxQty === 0 ? 'cursor-not-allowed' : ''}`}
                        />
                        <span className="text-[10px] uppercase font-black text-gray-400 dark:text-gray-500 mt-1">{product.unit}</span>
                      </div>
                      <button
                        disabled={maxQty === 0}
                        onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                        className={`w-12 h-12 flex items-center justify-center rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1A241A] hover:text-[#111812] dark:hover:text-white transition-all text-xl font-medium ${maxQty === 0 ? 'cursor-not-allowed' : ''}`}
                      >+</button>
                    </div>

                    {/* Add to cart button */}
                    <button
                      onClick={handleAddToCart}
                      disabled={cartLoading || maxQty === 0 || quantity > maxQty || quantity < 1}
                      className="flex-1 bg-[#111812] hover:bg-[#1A241A] dark:bg-emerald-600 dark:hover:bg-emerald-500 active:scale-[0.98] text-white font-black text-lg py-4 px-8 rounded-[20px] shadow-sm transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3 group"
                    >
                      {cartLoading ? (
                        <>
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                          </svg>
                          Adding...
                        </>
                      ) : maxQty === 0 ? (
                        <>Out of Stock</>
                      ) : (
                          <>
                            <svg className="w-5 h-5 group-hover:-translate-y-0.5 group-hover:rotate-[-5deg] transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            Add to Cart
                          </>
                      )}
                    </button>
                  </div>

                  {maxQty === 0 && (
                    <p className="text-sm font-bold text-red-600 dark:text-red-400 mt-2">
                      This product is currently out of stock
                    </p>
                  )}

                  {quantityError && (
                    <p className="text-sm font-bold text-red-600 dark:text-red-400">
                      {quantityError}
                    </p>
                  )}

                  {cartSuccess && (
                    <div className="flex justify-center items-center gap-2 text-emerald-700 dark:text-emerald-400 text-sm font-bold bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200/50 dark:border-emerald-800/50 rounded-[16px] px-5 py-3 animate-fade-in">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                      Added to your cart!
                    </div>
                  )}
                  {cartError && (
                    <div className="flex justify-center items-center gap-2 text-red-700 dark:text-red-400 text-sm font-bold bg-red-50 dark:bg-red-900/20 border border-red-200/50 dark:border-red-800/50 rounded-[16px] px-5 py-3 animate-fade-in">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                      {cartError}
                    </div>
                  )}
                </div>
              )}

              {/* Not logged in prompt */}
              {!user && (
                <div className="bg-white dark:bg-[#111812] border border-gray-100 dark:border-gray-800/60 rounded-[24px] p-8 text-center shadow-sm">
                  <p className="text-[#111812] dark:text-[#E8F3EB] text-lg font-bold mb-4">Want to buy this fresh product?</p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link to="/login" className="w-full sm:w-auto px-8 py-3 bg-[#111812] hover:bg-[#1A241A] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-sm active:scale-95">Sign In</Link>
                    <span className="text-gray-400 text-sm font-medium">or</span>
                    <Link to="/register" className="w-full sm:w-auto px-8 py-3 bg-white dark:bg-[#1A241A] text-[#111812] dark:text-white font-bold rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all active:scale-95">Create Account</Link>
                  </div>
                </div>
              )}

              {/* ── Reviews placeholder ── */}
              <div className="pt-8">
                <h3 className="text-lg font-black text-[#111812] dark:text-[#E8F3EB] tracking-tight mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                    Customer Reviews
                </h3>
                <div className="bg-white dark:bg-[#111812] rounded-[24px] p-8 border border-gray-100 dark:border-gray-800/60 text-center shadow-sm">
                  <div className="w-12 h-12 bg-gray-50 dark:bg-[#1A241A] rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                  </div>
                  <p className="text-sm font-bold text-gray-500 dark:text-gray-400">Reviews for this product are coming soon.</p>
                </div>
              </div>

            </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
