import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios";

const statusStyles = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  shipped: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  delivered: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");
  const [showCancelPopup, setShowCancelPopup] = useState(false);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      setError("");
      setNotFound(false);

      let response;
      try {
        response = await api.get(`/orders/${id}/`);
      } catch {
        response = await api.get(`/orders/orders/${id}/`);
      }

      setOrder(response.data);
    } catch (err) {
      if (err?.response?.status === 404) {
        setNotFound(true);
      } else {
        setError("Failed to load order details. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const handleCancelOrder = async () => {
    try {
      setCancelling(true);
      setCancelError("");

      let response;
      try {
        response = await api.patch(`/orders/${id}/cancel/`);
      } catch {
        response = await api.patch(`/orders/orders/${id}/cancel/`);
      }

      setOrder(response.data);
      setShowCancelPopup(false);
    } catch (err) {
      const message = err?.response?.data?.detail || "Failed to cancel order. Please try again.";
      setCancelError(message);
    } finally {
      setCancelling(false);
    }
  };

  const statusClass = (status) =>
    statusStyles[status] || "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200";

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-8 animate-pulse" />
        <div className="space-y-4">
          <div className="h-28 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
          <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
          <div className="h-56 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-12">
          <p className="text-6xl mb-4">🔍</p>
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-3">Order not found</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">The requested order does not exist or is not accessible.</p>
          <button
            onClick={() => navigate("/orders")}
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-3 rounded-lg transition"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-red-600 dark:text-red-400 font-semibold mb-4">{error}</p>
        <button
          onClick={fetchOrder}
          className="px-6 py-2.5 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium transition"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  const items = order.order_items || [];

  return (
    <>
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Order Details</h1>
        <Link
          to="/orders"
          className="text-sm font-semibold text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
        >
          ← Back to Orders
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 mb-6">
        {cancelError && (
          <div className="mb-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm rounded-lg px-3 py-2">
            {cancelError}
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Order ID</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">#{order.id}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Order Date</p>
            <p className="text-base font-semibold text-gray-900 dark:text-white">{formatDate(order.created_at)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Status</p>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wide ${statusClass(order.status)}`}>
              {order.status}
            </span>
          </div>
        </div>

        {order.status === "pending" && (
          <div className="mt-5">
            <button
              onClick={() => setShowCancelPopup(true)}
              disabled={cancelling}
              className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold transition"
            >
              {cancelling ? "Cancelling..." : "Cancel Order"}
            </button>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 mb-6">
        <h2 className="text-lg font-extrabold text-gray-900 dark:text-white mb-3">Delivery Address</h2>
        <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
          <p className="font-semibold text-gray-900 dark:text-white">{order.address_full_name}</p>
          <p>{order.address_phone}</p>
          <p>{order.address_line}</p>
          <p>
            {order.address_city}, {order.address_state} - {order.address_pincode}
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
        <h2 className="text-lg font-extrabold text-gray-900 dark:text-white mb-4">Items</h2>

        <div className="space-y-3">
          {items.map((item) => {
            const price = parseFloat(item.product_price || 0);
            const qty = parseFloat(item.quantity || 0);
            const lineTotal = parseFloat(item.total || price * qty);

            return (
              <div
                key={item.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              >
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">{item.product_name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    ₹{price.toFixed(2)} × {qty}
                  </p>
                </div>
                <p className="text-base font-extrabold text-green-600 dark:text-green-400">
                  ₹{lineTotal.toFixed(2)}
                </p>
              </div>
            );
          })}
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 mt-5 pt-5 flex items-center justify-between">
          <span className="text-base font-bold text-gray-900 dark:text-white">Total Price</span>
          <span className="text-2xl font-black text-green-600 dark:text-green-400">
            ₹{parseFloat(order.total_price || 0).toFixed(2)}
          </span>
        </div>
      </div>
    </div>
    {showCancelPopup && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-xl">
          <h3 className="text-lg font-extrabold text-gray-900 dark:text-white mb-2">Cancel Order</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">Are you sure you want to cancel this order?</p>

          <div className="flex items-center justify-end gap-3">
            <button
              onClick={() => setShowCancelPopup(false)}
              disabled={cancelling}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-semibold text-gray-700 dark:text-gray-200 disabled:opacity-60"
            >
              Keep Order
            </button>
            <button
              onClick={handleCancelOrder}
              disabled={cancelling}
              className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold disabled:opacity-60"
            >
              {cancelling ? "Cancelling..." : "Yes, Cancel"}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default OrderDetail;