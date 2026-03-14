import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api/axios";

const BASE_URL = "http://localhost:8000";

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
    return `${BASE_URL}${primary.image}`;
  };

  // ── Loading ──
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-8 animate-pulse" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 flex gap-5 animate-pulse">
              <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-lg shrink-0" />
              <div className="flex-1 space-y-3">
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
              </div>
            </div>
          ))}
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
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 shadow-sm max-w-md w-full">
          <p className="text-7xl mb-5">🛒</p>
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-2">Your cart is empty</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">Looks like you haven't added any products yet.</p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold px-8 py-3 rounded-lg shadow-sm transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  const cartTotal = parseFloat(cart?.total || 0);

  return (
    <div className="min-h-screen transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-4 py-10">

        {/* ── Page header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Shopping Cart</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {items.length} {items.length === 1 ? "item" : "items"} in your cart
            </p>
          </div>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition group"
          >
            <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
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
          <div className="flex-1 space-y-4">
            {items.map((item) => {
              const imgUrl = getPrimaryImage(item.product?.images);
              const isUpdating = updatingId === item.id;

              return (
                <div
                  key={item.id}
                  className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 flex gap-5 transition-all duration-300 ${
                    isUpdating ? "opacity-60 pointer-events-none" : ""
                  }`}
                >
                  {/* Product image */}
                  <Link to={`/products/${item.product?.id}`} className="shrink-0 w-24 h-24 sm:w-28 sm:h-28 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 block">
                    {imgUrl ? (
                      <img
                        src={imgUrl}
                        alt={item.product?.name}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        onError={(e) => { e.target.style.display = "none"; }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                        </svg>
                      </div>
                    )}
                  </Link>

                  {/* Product details */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <Link to={`/products/${item.product?.id}`} className="block">
                        <h3 className="font-bold text-gray-900 dark:text-white text-base truncate hover:text-green-600 dark:hover:text-green-400 transition-colors">
                          {item.product?.name}
                        </h3>
                      </Link>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        ₹{parseFloat(item.product?.price).toFixed(2)}{" "}
                        <span className="uppercase">per {item.product?.unit}</span>
                      </p>
                    </div>

                    {/* Quantity controls + item total */}
                    <div className="flex flex-wrap items-center justify-between gap-3 mt-3">

                      {/* Qty controls */}
                      <div className="flex items-center bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                        <button
                          onClick={() => updateQuantity(item.id, parseFloat(item.quantity) - 1)}
                          disabled={parseFloat(item.quantity) <= 1}
                          className="w-9 h-9 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition disabled:opacity-30 disabled:cursor-not-allowed font-bold text-lg"
                        >
                          −
                        </button>
                        <div className="w-12 h-9 flex flex-col items-center justify-center border-x border-gray-200 dark:border-gray-700">
                          <span className="text-sm font-bold text-gray-900 dark:text-white leading-tight">{parseFloat(item.quantity)}</span>
                          <span className="text-[9px] text-gray-400 dark:text-gray-500 uppercase font-semibold leading-tight">{item.product?.unit}</span>
                        </div>
                        <button
                          onClick={() => updateQuantity(item.id, parseFloat(item.quantity) + 1)}
                          disabled={parseFloat(item.quantity) >= parseFloat(item.product?.stock)}
                          className="w-9 h-9 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition disabled:opacity-30 disabled:cursor-not-allowed font-bold text-lg"
                        >
                          +
                        </button>
                      </div>

                      {/* Item total */}
                      <span className="text-lg font-extrabold text-green-600 dark:text-green-400 whitespace-nowrap">
                        ₹{parseFloat(item.total).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Remove button */}
                  <button
                    onClick={() => removeItem(item.id)}
                    className="shrink-0 self-start p-2 rounded-lg text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                    title="Remove from cart"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>

          {/* ── RIGHT: Order summary ── */}
          <div className="lg:w-80 shrink-0">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm sticky top-24">

              <h2 className="text-lg font-extrabold text-gray-900 dark:text-white mb-5">Order Summary</h2>

              {/* Items breakdown */}
              <div className="space-y-3 mb-5">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400 truncate mr-3 max-w-[180px]">
                      {item.product?.name} × {parseFloat(item.quantity)}
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                      ₹{parseFloat(item.total).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Divider */}
              <div className="border-t border-gray-200 dark:border-gray-700 my-5" />

              {/* Total */}
              <div className="flex items-center justify-between mb-6">
                <span className="text-base font-bold text-gray-900 dark:text-white">Total</span>
                <span className="text-2xl font-black text-green-600 dark:text-green-400">
                  ₹{cartTotal.toFixed(2)}
                </span>
              </div>

              {/* Checkout CTA */}
              <button
                onClick={() => navigate("/checkout")}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-lg shadow-sm transition flex items-center justify-center gap-2 text-base"
              >
                Proceed to Checkout
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Continue Shopping */}
              <Link
                to="/products"
                className="mt-3 w-full inline-flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
