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
    case 'ready_for_pickup':
      return { style: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/30", icon: TruckIcon, label: "Finding Delivery Partner" };
    case 'out_for_delivery':
      return { style: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-400 border-purple-200 dark:border-purple-500/30", icon: TruckIcon, label: "Out for Delivery 🚚" };
    case 'pending':
      return { style: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-400 border-amber-200 dark:border-amber-500/30", icon: ClockIcon, label: "Pending" };
    case 'confirmed':
      return { style: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400 border-blue-200 dark:border-blue-500/30", icon: CheckCircleIcon, label: "Confirmed" };
    case 'shipped':
      return { style: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-400 border-orange-200 dark:border-orange-500/30", icon: TruckIcon, label: "Shipped" };
    case 'delivered':
      return { style: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30", icon: CheckCircleIcon, label: "Delivered ✅" };
    case 'cancelled':
      return { style: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400 border-red-200 dark:border-red-500/30", icon: XCircleIcon, label: "Cancelled" };
    default:
      return { style: "bg-gray-100 text-gray-800 dark:bg-[#1A241A] dark:text-gray-300 border-gray-200 dark:border-gray-700", icon: CubeIcon, label: status || "Unknown" };
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
        // Fallback or specific secondary route
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
      <div className="max-w-6xl mx-auto px-4 py-12 md:py-20 transition-colors duration-300">
        <div className="h-8 w-64 bg-gray-200 dark:bg-[#1A241A] rounded-2xl animate-pulse mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-40 bg-gray-200 dark:bg-[#111812] rounded-[32px] animate-pulse" />
            <div className="h-40 bg-gray-200 dark:bg-[#111812] rounded-[32px] animate-pulse" />
          </div>
          <div className="space-y-4">
            <div className="h-64 bg-gray-200 dark:bg-[#111812] rounded-[32px] animate-pulse" />
            <div className="h-48 bg-gray-200 dark:bg-[#111812] rounded-[32px] animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 bg-[#FDFBF7] dark:bg-[#0A0F0D]">
        <div className="bg-white dark:bg-[#111812] border-2 border-gray-100 dark:border-gray-800/60 rounded-[32px] p-12 max-w-lg w-full text-center shadow-[0_4px_20px_rgb(0,0,0,0.02)]">
          <div className="w-20 h-20 bg-gray-50 dark:bg-[#1A241A] rounded-full flex items-center justify-center mx-auto mb-6">
            <CubeIcon className="w-10 h-10 text-gray-400" />
          </div>
          <h2 className="text-3xl font-black text-[#111812] dark:text-[#E8F3EB] tracking-tight mb-3">Order Not Found</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8 font-medium leading-relaxed">
            We couldn't find the order you're looking for. It may have been removed or you might not have access to it.
          </p>
          <button
            onClick={() => navigate("/orders")}
            className="w-full inline-flex justify-center items-center gap-2 bg-[#111812] hover:bg-[#1A241A] dark:bg-emerald-600 dark:hover:bg-emerald-500 active:scale-[0.98] transition-all text-white font-black px-6 py-4 rounded-[20px]"
          >
            <ArrowLeftIcon className="w-5 h-5 flex-shrink-0" />
            <span>Return to Orders</span>
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 bg-[#FDFBF7] dark:bg-[#0A0F0D]">
        <div className="bg-white dark:bg-[#111812] border-2 border-red-200 dark:border-red-900/50 rounded-[32px] p-10 max-w-lg w-full text-center shadow-[0_4px_20px_rgb(0,0,0,0.02)]">
          <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-[#111812] dark:text-[#E8F3EB] font-black tracking-tight mb-6">{error}</p>
          <button
            onClick={fetchOrder}
            className="w-full inline-flex justify-center items-center gap-2 bg-[#111812] hover:bg-[#1A241A] dark:bg-white dark:hover:bg-gray-100 active:scale-[0.98] transition-all text-white dark:text-[#111812] font-black px-6 py-4 rounded-[20px]"
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
    <div className="min-h-screen bg-[#FDFBF7] dark:bg-[#0A0F0D] transition-colors duration-500 py-12 md:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <Link
              to="/orders"
              className="inline-flex items-center gap-2 text-xs font-black text-gray-400 hover:text-[#111812] dark:hover:text-white uppercase tracking-widest transition-colors mb-4 group"
            >
              <ArrowLeftIcon className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              Back to all orders
            </Link>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#111812] dark:text-[#E8F3EB] tracking-tight leading-none mb-4">
              {items.length > 0
                ? `${items[0].product_name}${items.length > 1 ? ` & ${items.length - 1} more` : ""}`
                : `Order Details`}
            </h1>
            <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
              <span>ID: <span className="text-[#111812] dark:text-white">{order.id}</span></span>
              <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600 hidden sm:block"></span>
              <span className="flex items-center gap-1.5">
                <CalendarIcon className="w-4 h-4" />
                {formatDate(order.created_at)}
              </span>
            </div>
          </div>

          <div className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-[20px] font-black border-2 shadow-sm ${statusConfig.style}`}>
            <StatusIcon className="w-6 h-6" />
            <span className="tracking-wide">{statusConfig.label}</span>
          </div>
        </div>

        {cancelError && (
          <div className="mb-8 flex items-start gap-3 bg-red-50 dark:bg-red-500/10 border-2 border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 rounded-[20px] p-5 font-bold animate-in fade-in slide-in-from-top-2">
            <ExclamationTriangleIcon className="w-6 h-6 shrink-0 mt-0.5" />
            <p>{cancelError}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Left Column: Items */}
          <div className="lg:col-span-7 space-y-8">
            <div className="bg-white dark:bg-[#111812] rounded-[32px] border-2 border-gray-100 dark:border-gray-800/60 overflow-hidden shadow-[0_4px_20px_rgb(0,0,0,0.02)]">
              <div className="px-8 py-6 border-b-2 border-gray-100 dark:border-gray-800/60 bg-gray-50/50 dark:bg-[#1A241A]/30">
                <h2 className="text-xl font-black text-[#111812] dark:text-[#E8F3EB] tracking-tight flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <CubeIcon className="w-5 h-5 flex-shrink-0" />
                  </div>
                  Order Items ({items.length})
                </h2>
              </div>
              <div className="divide-y-2 divide-gray-100 dark:divide-gray-800/60">
                {items.map((item) => {
                  const price = parseFloat(item.product_price || 0);
                  const qty = parseFloat(item.quantity || 0);
                  const lineTotal = parseFloat(item.total || price * qty);

                  return (
                    <div
                      key={item.id}
                      className="p-8 flex flex-col sm:flex-row sm:items-center gap-6 hover:bg-gray-50/80 dark:hover:bg-[#1A241A]/50 transition-colors"
                    >
                      <div className="w-20 h-20 rounded-[20px] bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0 border-2 border-transparent">
                        {item.product_image ? (
                           <img src={item.product_image} alt={item.product_name} className="w-full h-full object-cover rounded-[18px]" />
                        ) : (
                           <CubeIcon className="w-10 h-10 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-black text-[#111812] dark:text-white truncate lg:whitespace-normal mb-1">
                          {item.product_name}
                        </h3>
                        {/* FARMER DETAILS INJECTED HERE */}
                        {item.farmer_id ? (
                          <Link
                            to={`/farmers/${item.farmer_id}`}
                            className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-3 bg-emerald-50 dark:bg-emerald-900/40 inline-flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors group/farmer"
                          >
                            Sold by: {item.farmer_name}
                            <svg className="w-3 h-3 group-hover/farmer:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                          </Link>
                        ) : (
                          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-3 bg-emerald-50 dark:bg-emerald-900/40 inline-block px-2 py-1 rounded-lg">
                            Sold by: {item.farmer_name || "Verified Farmer"}
                          </span>
                        )}

                        <p className="text-sm font-bold text-gray-500 dark:text-gray-400 flex items-center gap-2">
                          <span className="text-[#111812] dark:text-gray-300">Qty: {qty}{item.product_unit || 'kg'}</span>
                          <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600"></span>
                          <span>₹{price.toFixed(2)} each</span>
                        </p>
                      </div>
                      <div className="sm:text-right flex items-end sm:items-center justify-between sm:justify-end">
                         <span className="sm:hidden text-xs font-black text-gray-400 uppercase tracking-widest">Subtotal</span>
                        <p className="text-2xl font-black text-[#111812] dark:text-[#E8F3EB] tracking-tight">
                          ₹{lineTotal.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {order.status === "pending" && (
              <div className="flex justify-start sm:justify-start">
                <button
                  onClick={() => setShowCancelPopup(true)}
                  disabled={cancelling}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-[20px] text-red-600 dark:text-red-400 border-2 border-red-200 dark:border-red-900/50 hover:border-red-500 bg-white dark:bg-transparent hover:bg-red-50 dark:hover:bg-red-900/20 font-black transition-all active:scale-95 disabled:opacity-50 group"
                >
                  <XCircleIcon className="w-6 h-6 flex-shrink-0 group-hover:scale-110 transition-transform" />
                  {cancelling ? "Processing..." : "Cancel Order"}
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Summary & Info */}
          <div className="lg:col-span-5 space-y-8">
            {/* Order Summary */}
            <div className="bg-white dark:bg-[#111812] rounded-[32px] border-2 border-gray-100 dark:border-gray-800/60 p-8 shadow-[0_4px_20px_rgb(0,0,0,0.02)] sticky top-[104px]">

              {/* Payment Info */}
              <div className="mb-8">
                 <h2 className="text-xl font-black text-[#111812] dark:text-[#E8F3EB] tracking-tight mb-6 flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                     <CreditCardIcon className="w-5 h-5 flex-shrink-0" />
                   </div>
                   Payment Summary
                 </h2>
                 <div className="bg-gray-50 dark:bg-[#1A241A]/50 rounded-[20px] p-6 border-2 border-gray-100 dark:border-gray-800/60">
                    <div className="space-y-4 text-sm font-bold text-gray-500 dark:text-gray-400">
                      <div className="flex justify-between items-center">
                        <span className="uppercase tracking-widest text-[10px]">Subtotal</span>
                        <span className="text-base text-[#111812] dark:text-gray-200">₹{parseFloat(order.total_price || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="uppercase tracking-widest text-[10px]">Delivery</span>
                        <span className="text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Free</span>
                      </div>
                      <div className="border-t-2 border-dashed border-gray-200 dark:border-gray-700/80 my-2 pt-4 flex justify-between items-end">
                        <span className="text-xs font-black uppercase tracking-widest text-[#111812] dark:text-white">Total</span>
                        <span className="text-3xl font-black text-[#111812] dark:text-[#E8F3EB] tracking-tight leading-none">
                          <span className="text-xl text-emerald-600 mr-1">₹</span>{parseFloat(order.total_price || 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                 </div>
              </div>

              {/* Delivery Details */}
              <div>
                <h2 className="text-xl font-black text-[#111812] dark:text-[#E8F3EB] tracking-tight mb-6 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <MapPinIcon className="w-5 h-5 flex-shrink-0" />
                  </div>
                  Delivery Details
                </h2>

                <div className="relative pl-6 border-l-4 border-emerald-500/30 dark:border-emerald-500/20 ml-2">
                  <div className="absolute w-4 h-4 bg-emerald-500 rounded-full -left-[10px] top-1 shadow-[0_0_0_4px_white] dark:shadow-[0_0_0_4px_#111812]"></div>
                  <p className="font-black text-[#111812] dark:text-white text-lg mb-2">
                    {order.address_full_name}
                  </p>
                  <p className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-3">
                    {order.address_phone}
                  </p>
                  <p className="text-base font-medium text-[#111812] dark:text-gray-300 leading-relaxed">
                    {order.address_line}<br />
                    {order.address_city}, {order.address_state} - <span className="font-bold">{order.address_pincode}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelPopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-gray-900/60 dark:bg-black/80 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
            onClick={() => setShowCancelPopup(false)}
          />

          <div className="relative bg-white dark:bg-[#111812] border-2 border-gray-100 dark:border-gray-800 rounded-[32px] shadow-2xl max-w-md w-full p-8 sm:p-10 transform transition-all animate-in zoom-in-95 duration-300">
            <div className="absolute top-0 left-0 w-full h-2 bg-red-500 rounded-t-[32px]" />

            <div className="mb-6 flex justify-center">
              <div className="w-20 h-20 rounded-[24px] bg-red-50 dark:bg-red-500/10 flex items-center justify-center border-2 border-red-100 dark:border-red-900/40">
                <XCircleIcon className="w-10 h-10 text-red-500" />
              </div>
            </div>

            <h3 className="text-2xl font-black text-center text-[#111812] dark:text-white tracking-tight mb-3">
              Cancel this Order?
            </h3>
            <p className="text-gray-500 dark:text-gray-400 font-medium text-center mb-8 leading-relaxed">
              This action cannot be undone. You will not be charged if you cancel a pending order.
            </p>

            <div className="flex flex-col gap-4">
              <button
                onClick={handleCancelOrder}
                disabled={cancelling}
                className="w-full px-6 py-4 rounded-[20px] bg-red-600 hover:bg-red-500 text-white font-black text-lg shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 flex justify-center items-center gap-3"
              >
                {cancelling ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Cancelling...
                  </>
                ) : (
                  "Yes, Cancel Order"
                )}
              </button>
              <button
                onClick={() => setShowCancelPopup(false)}
                disabled={cancelling}
                className="w-full px-6 py-4 rounded-[20px] border-2 border-gray-200 dark:border-gray-800 font-black text-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1A241A] transition-colors disabled:opacity-50"
              >
                Keep Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetail;