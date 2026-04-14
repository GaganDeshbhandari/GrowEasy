import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios";
import { 
  ArrowLeftIcon, 
  MapPinIcon, 
  CalendarIcon, 
  CreditCardIcon, 
  ClockIcon,
  CheckCircleIcon,
  TruckIcon,
  XCircleIcon,
  CubeIcon,
  ExclamationTriangleIcon
} from "@heroicons/react/24/outline";

const getStatusConfig = (status) => {
  switch(status?.toLowerCase()) {
    case 'pending': 
      return { style: "bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/20", icon: ClockIcon, label: "Pending" };
    case 'confirmed': 
      return { style: "bg-blue-100 text-blue-800 dark:bg-blue-500/10 dark:text-blue-400 border-blue-200 dark:border-blue-500/20", icon: CheckCircleIcon, label: "Confirmed" };
    case 'shipped': 
      return { style: "bg-orange-100 text-orange-800 dark:bg-orange-500/10 dark:text-orange-400 border-orange-200 dark:border-orange-500/20", icon: TruckIcon, label: "Shipped" };
    case 'delivered': 
      return { style: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20", icon: CheckCircleIcon, label: "Delivered" };
    case 'cancelled': 
      return { style: "bg-red-100 text-red-800 dark:bg-red-500/10 dark:text-red-400 border-red-200 dark:border-red-500/20", icon: XCircleIcon, label: "Cancelled" };
    default:
      return { style: "bg-gray-100 text-gray-800 dark:bg-gray-500/10 dark:text-gray-400 border-gray-200 dark:border-gray-500/20", icon: CubeIcon, label: status || "Unknown" };
  }
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

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="h-8 w-64 bg-gray-200 dark:bg-gray-800 rounded-lg mb-8 animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-40 bg-gray-200 dark:bg-gray-800 rounded-3xl animate-pulse" />
            <div className="h-40 bg-gray-200 dark:bg-gray-800 rounded-3xl animate-pulse" />
          </div>
          <div className="space-y-4">
            <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-3xl animate-pulse" />
            <div className="h-48 bg-gray-200 dark:bg-gray-800 rounded-3xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-12 max-w-lg w-full text-center shadow-sm">
          <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-6">
            <CubeIcon className="w-10 h-10 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Order Not Found</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
            We couldn't find the order you're looking for. It may have been removed or you might not have access to it.
          </p>
          <button
            onClick={() => navigate("/orders")}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors duration-200 flex-none"
          >
            <ArrowLeftIcon className="w-5 h-5 flex-shrink-0" />
            <span className="flex-none">Return to Orders</span>
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <div className="bg-white dark:bg-gray-900 border border-red-200 dark:border-red-900/50 rounded-3xl p-10 max-w-lg w-full text-center shadow-sm">
          <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-900 dark:text-white font-medium mb-6">{error}</p>
          <button
            onClick={fetchOrder}
            className="px-6 py-2.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium hover:opacity-90 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!order) return null;

  const items = order.order_items || [];
  const statusConfig = getStatusConfig(order.status);
  const StatusIcon = statusConfig.icon;

  return (
    <>
      <div className="max-w-6xl mx-auto px-4 py-8 lg:py-12">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <Link
              to="/orders"
              className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 mb-4 transition-colors group"
            >
              <ArrowLeftIcon className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              Back to all orders
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight flex sm:items-center gap-3">
              {items.length > 0 
                ? `Order of ${items[0].product_name}${items.length > 1 ? ` & ${items.length - 1} more` : ""}`
                : `Order Details`}
            </h1>
            <div className="flex flex-wrap items-center gap-y-2 gap-x-3 mt-3 text-sm text-gray-500 dark:text-gray-400">
              <span className="font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-md">ID: #{order.id}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600 hidden sm:block"></span>
              <span className="flex items-center gap-1.5">
                <CalendarIcon className="w-4 h-4" />
                Placed on {formatDate(order.created_at)}
              </span>
            </div>
          </div>
          
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border border-opacity-50 text-sm font-medium ${statusConfig.style}`}>
            <StatusIcon className="w-5 h-5" />
            {statusConfig.label}
          </div>
        </div>

        {cancelError && (
          <div className="mb-8 flex items-start gap-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 rounded-2xl p-4">
            <ExclamationTriangleIcon className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm">{cancelError}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left Column: Items */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
              <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <CubeIcon className="w-5 h-5 text-gray-400" />
                  Order Items ({items.length})
                </h2>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-800/60">
                {items.map((item) => {
                  const price = parseFloat(item.product_price || 0);
                  const qty = parseFloat(item.quantity || 0);
                  const lineTotal = parseFloat(item.total || price * qty);

                  return (
                    <div
                      key={item.id}
                      className="p-6 flex flex-col sm:flex-row sm:items-center gap-5 hover:bg-gray-50/80 dark:hover:bg-gray-800/30 transition-colors"
                    >
                      <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
                        <CubeIcon className="w-8 h-8 text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white truncate lg:whitespace-normal">
                          {item.product_name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2">
                          <span className="font-medium text-gray-700 dark:text-gray-300">Qty: {qty}</span>
                          <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600"></span>
                          <span>₹{price.toFixed(2)} each</span>
                        </p>
                      </div>
                      <div className="sm:text-right flex items-end sm:items-center justify-between sm:justify-end">
                         <span className="sm:hidden text-sm text-gray-500">Subtotal:</span>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                          ₹{lineTotal.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {order.status === "pending" && (
              <div className="flex justify-start sm:justify-end">
                <button
                  onClick={() => setShowCancelPopup(true)}
                  disabled={cancelling}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 font-semibold transition-colors disabled:opacity-50"
                >
                  <XCircleIcon className="w-5 h-5 flex-shrink-0" />
                  {cancelling ? "Processing..." : "Cancel Order"}
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Summary & Info */}
          <div className="space-y-6">
            {/* Order Summary */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
                <CreditCardIcon className="w-5 h-5 text-gray-400" />
                Payment Summary
              </h2>
              
              <div className="space-y-4">
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                  <span>Subtotal</span>
                  <span className="font-medium text-gray-900 dark:text-gray-200">₹{parseFloat(order.total_price || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                  <span>Shipping</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded">Free</span>
                </div>
                <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl">
                    <span className="text-base font-bold text-gray-900 dark:text-white">Total</span>
                    <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                      ₹{parseFloat(order.total_price || 0).toFixed(2)}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-500 text-center uppercase tracking-wider mt-3 font-medium">Includes all applicable taxes</p>
                </div>
              </div>
            </div>

            {/* Delivery Details */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
                <MapPinIcon className="w-5 h-5 text-gray-400" />
                Delivery Details
              </h2>
              
              <div className="relative pl-4 border-l-2 border-emerald-500/30 dark:border-emerald-500/20">
                <div className="absolute w-2.5 h-2.5 bg-emerald-500 rounded-full -left-[6px] top-1.5 shadow-[0_0_0_4px_white] dark:shadow-[0_0_0_4px_#111827]"></div>
                <p className="font-bold text-gray-900 dark:text-white text-base mb-2">
                  {order.address_full_name}
                </p>
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                  <p className="flex items-center gap-2">
                    {order.address_phone}
                  </p>
                  <p className="leading-relaxed">
                    {order.address_line}<br />
                    {order.address_city}, {order.address_state} - {order.address_pincode}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
          <div 
            className="absolute inset-0 bg-gray-900/40 dark:bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setShowCancelPopup(false)}
          />
          
          <div className="relative bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl shadow-2xl max-w-md w-full p-8 overflow-hidden transform transition-all">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-red-500" />
            
            <div className="mb-6 flex justify-center">
              <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center">
                <ExclamationTriangleIcon className="w-8 h-8 text-red-500" />
              </div>
            </div>
            
            <h3 className="text-xl font-bold text-center text-gray-900 dark:text-white mb-2">
              Cancel this Order?
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-center mb-8">
              This action cannot be undone. Are you sure you want to proceed with cancelling this order?
            </p>

            <div className="flex flex-col-reverse sm:flex-row gap-3">
              <button
                onClick={() => setShowCancelPopup(false)}
                disabled={cancelling}
                className="w-full sm:w-1/2 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                Keep Order
              </button>
              <button
                onClick={handleCancelOrder}
                disabled={cancelling}
                className="w-full sm:w-1/2 px-4 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold shadow-sm shadow-red-600/20 transition-all disabled:opacity-50 flex justify-center items-center gap-2"
              >
                {cancelling ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing
                  </>
                ) : (
                  "Yes, Cancel"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default OrderDetail;