import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { resolveMediaUrl } from "../../utils/media";

const Cart = () => {
  const navigate = useNavigate();

  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null); // which item are we currently updating

  // ── Fetch cart ──
  const fetchCart = useCallback(async () => {
    try {
      const res = await api.get("/orders/cart/");
      setCart(res.data);
      setError("");
    } catch {
      setError("Failed to load your cart. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // ── Update quantity (PATCH) ──
  const updateQuantity = async (itemId, newQty) => {
    if (newQty < 1) return;
    setUpdatingId(itemId);
    try {
      await api.patch(`/orders/cart/items/${itemId}/`, { quantity: newQty });
      await fetchCart();
    } catch {
      setError("Failed to update quantity.");
    } finally {
      setUpdatingId(null);
    }
  };

  // ── Remove item (DELETE) ──
  const removeItem = async (itemId) => {
    setUpdatingId(itemId);
    try {
      await api.delete(`/orders/cart/items/${itemId}/`);
      await fetchCart();
      window.dispatchEvent(new Event("cartUpdated"));
    } catch {
      setError("Failed to remove item.");
    } finally {
      setUpdatingId(null);
    }
  };

  // ── Get primary image from product images array ──
  const getPrimaryImage = (images) => {
    if (!images || images.length === 0) return null;
    const primary = images.find((img) => img.is_primary) || images[0];
    return resolveMediaUrl(primary?.image);
  };

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] dark:bg-[#0A0F0D] py-16 px-4 md:px-8 transition-colors duration-500">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="h-10 w-48 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white dark:bg-[#111812] border border-gray-100 dark:border-gray-800 rounded-[28px] p-6 flex gap-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)] animate-pulse">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gray-200 dark:bg-gray-800 shrink-0" />
                  <div className="flex-1 space-y-4 py-2">
                    <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded-lg w-2/3" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded-lg w-1/3" />
                    <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded-xl w-32 mt-4" />
                  </div>
                </div>
              ))}
            </div>
            <div className="lg:w-80 h-80 bg-white dark:bg-[#111812] border border-gray-100 dark:border-gray-800 rounded-[32px] p-8 shadow-[0_4px_20px_rgba(0,0,0,0.02)] animate-pulse shrink-0" />
          </div>
        </div>
      </div>
    );
  }

  // ── Error ──
  if (error && !cart) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <p className="text-6xl mb-4">😞</p>
        <p className="text-gray-500 dark:text-gray-400 text-lg">{error}</p>
        <button onClick={fetchCart} className="mt-6 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-sm font-medium transition">
          Retry
        </button>
      </div>
    );
  }

  // ── Empty cart ──
  const items = cart?.items || [];
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] dark:bg-[#0A0F0D] flex flex-col items-center justify-center px-4 md:px-8 text-center transition-colors duration-500 font-sans">
        <div className="bg-white dark:bg-[#111812] rounded-[32px] border border-gray-100 dark:border-gray-800/60 p-12 sm:p-16 shadow-[0_4px_20px_rgba(0,0,0,0.02)] max-w-lg w-full flex flex-col items-center justify-center relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gray-100 dark:bg-gray-800 group-hover:bg-emerald-500 transition-colors duration-500"></div>
          <div className="w-24 h-24 bg-emerald-50 dark:bg-emerald-500/10 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
            <span className="text-5xl group-hover:animate-bounce">🛒</span>
          </div>
          <h2 className="text-3xl font-black text-[#111812] dark:text-[#E8F3EB] mb-3 tracking-tight">Your cart is empty</h2>
          <p className="text-gray-500 dark:text-gray-400 text-base font-medium mb-10 text-balance">
            Looks like you haven't added any fresh produce to your cart yet.
          </p>
          <Link
            to="/products"
            className="inline-flex items-center justify-center gap-2.5 bg-[#111812] hover:bg-[#1A241A] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-bold px-8 py-4 rounded-2xl shadow-sm transition-all active:scale-95 w-full sm:w-auto"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  const cartTotal = parseFloat(cart?.total || 0);

  return (
    <div className="min-h-screen bg-[#FDFBF7] dark:bg-[#0A0F0D] py-16 transition-colors duration-500 font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Page header ── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-8 border-b border-gray-200 dark:border-gray-800/80 mb-10">
          <div>
            <h1 className="text-4xl sm:text-5xl font-black text-[#111812] dark:text-[#E8F3EB] tracking-tight mb-2">Shopping Cart</h1>
            <p className="text-lg font-medium text-gray-500 dark:text-gray-400">
              {items.length} {items.length === 1 ? "item" : "items"} ready for checkout
            </p>
          </div>
          <Link
            to="/products"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border-2 border-transparent hover:border-gray-200 dark:hover:border-gray-800 text-sm font-bold text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all group"
          >
            <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Continue Shopping
          </Link>
        </div>

        {/* ── Error banner ── */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm font-medium rounded-lg px-4 py-3">
            ⚠️ {error}
          </div>
        )}

        {/* ── Cart items + Summary layout ── */}
        <div className="flex flex-col lg:flex-row gap-8">

          {/* ── LEFT: Cart item list ── */}
          <div className="flex-1 space-y-6">
            {items.map((item) => {
              const imgUrl = getPrimaryImage(item.product?.images);
              const isUpdating = updatingId === item.id;

              return (
                <div
                  key={item.id}
                  className={`group bg-white dark:bg-[#111812] rounded-[32px] border border-gray-100 dark:border-gray-800/60 p-6 sm:p-8 flex flex-col sm:flex-row gap-6 sm:gap-8 shadow-[0_4px_20px_rgba(0,0,0,0.02)] transition-all duration-300 relative overflow-hidden ${
                    isUpdating ? "opacity-50 pointer-events-none scale-[0.99]" : "hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:hover:border-emerald-900/40"
                  }`}
                >
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-gray-100 dark:bg-gray-800 group-hover:bg-emerald-500 transition-colors duration-500"></div>
                  
                  {/* Product image */}
                  <Link to={`/products/${item.product?.id}`} className="shrink-0 w-full sm:w-36 h-48 sm:h-36 rounded-2xl overflow-hidden bg-gray-50 dark:bg-[#1A241A] block relative border border-gray-100 dark:border-gray-800/50">
                    {imgUrl ? (
                      <img
                        src={imgUrl}
                        alt={item.product?.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => { e.target.style.display = "none"; }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
                        <span className="text-4xl font-black opacity-20={(item.product?.name || 'P').charAt(0)}">
                           {(item.product?.name || "P").charAt(0)}
                        </span>
                      </div>
                    )}
                  </Link>

                  {/* Product details */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <Link to={`/products/${item.product?.id}`} className="block group/link">
                          <h3 className="text-xl sm:text-2xl font-black text-[#111812] dark:text-[#E8F3EB] tracking-tight group-hover/link:text-emerald-600 dark:group-hover/link:text-emerald-400 transition-colors">
                            {item.product?.name}
                          </h3>
                        </Link>
                        <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-widest">
                          ₹{parseFloat(item.product?.price).toFixed(2)} / <span className="text-emerald-600 dark:text-emerald-500">{item.product?.unit}</span>
                        </p>
                      </div>
                      
                      {/* Remove button */}
                      <button
                        onClick={() => removeItem(item.id)}
                        className="shrink-0 p-2.5 rounded-xl bg-gray-50 dark:bg-[#1A241A] text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all active:scale-95 border border-transparent hover:border-red-100 dark:hover:border-red-900/30"
                        title="Remove from cart"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>

                    {/* Quantity controls + item total */}
                    <div className="flex flex-wrap items-end justify-between gap-4 mt-6">

                      {/* Qty controls */}
                      <div>
                        <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 ml-1">Quantity</p>
                        <div className="inline-flex items-center bg-gray-50 dark:bg-[#1A241A] border border-gray-200 dark:border-gray-800/60 rounded-2xl overflow-hidden p-1">
                          <button
                            onClick={() => updateQuantity(item.id, parseFloat(item.quantity) - 1)}
                            disabled={parseFloat(item.quantity) <= 1}
                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-[#111812] text-gray-900 dark:text-gray-100 hover:text-emerald-600 dark:hover:text-emerald-400 border border-gray-100 dark:border-gray-800 shadow-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed font-medium"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" /></svg>
                          </button>
                          
                          <div className="w-16 flex flex-col items-center justify-center">
                            <span className="text-base font-black text-[#111812] dark:text-[#E8F3EB] leading-none mb-0.5">{parseFloat(item.quantity)}</span>
                          </div>
                          
                          <button
                            onClick={() => updateQuantity(item.id, parseFloat(item.quantity) + 1)}
                            disabled={parseFloat(item.quantity) >= parseFloat(item.product?.stock)}
                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-[#111812] text-gray-900 dark:text-gray-100 hover:text-emerald-600 dark:hover:text-emerald-400 border border-gray-100 dark:border-gray-800 shadow-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed font-medium"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                          </button>
                        </div>
                      </div>

                      {/* Item total */}
                      <div className="text-right">
                        <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Subtotal</p>
                        <span className="text-2xl font-black text-emerald-600 dark:text-emerald-500">
                          ₹{parseFloat(item.total).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── RIGHT: Order summary ── */}
          <div className="lg:w-[380px] shrink-0">
            <div className="bg-white dark:bg-[#111812] rounded-[32px] border border-gray-100 dark:border-gray-800/60 p-8 shadow-[0_4px_20px_rgba(0,0,0,0.02)] sticky top-24">

              <h2 className="text-xl font-black text-[#111812] dark:text-[#E8F3EB] mb-8 tracking-tight">Order Summary</h2>

              {/* Items breakdown */}
              <div className="space-y-4 mb-8">
                {items.map((item) => (
                  <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between text-base gap-2">
                    <span className="text-gray-600 dark:text-gray-400 font-medium truncate flex-1 min-w-0 pr-2">
                      <span className="text-[#111812] dark:text-[#E8F3EB] font-bold mr-1.5">{parseFloat(item.quantity)}×</span>
                      {item.product?.name}
                    </span>
                    <span className="font-extrabold text-[#111812] dark:text-[#E8F3EB] shrink-0">
                      ₹{parseFloat(item.total).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Divider */}
              <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-800 to-transparent my-8" />

              {/* Total */}
              <div className="flex items-end justify-between mb-8">
                <span className="text-lg font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1 mt-1">Total</span>
                <span className="text-4xl font-black text-emerald-600 dark:text-emerald-500 tracking-tight leading-none">
                  ₹{cartTotal.toFixed(2)}
                </span>
              </div>

              {/* Checkout CTA */}
              <button
                onClick={() => navigate("/checkout")}
                className="w-full bg-[#111812] hover:bg-[#1A241A] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-bold py-4 rounded-2xl shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2 text-base"
              >
                Proceed to Checkout
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>

              {/* Continue Shopping */}
              <div className="mt-4 text-center">
                <Link
                  to="/products"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors group"
                >
                  <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  or continue shopping
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
