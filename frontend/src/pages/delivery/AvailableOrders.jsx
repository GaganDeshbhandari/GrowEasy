import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";

const AvailableOrders = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [orders, setOrders] = useState([]);
  const [isOnline, setIsOnline] = useState(false);
  const [confirmOrder, setConfirmOrder] = useState(null);
  const [updatingOnline, setUpdatingOnline] = useState(false);
  const [pickingId, setPickingId] = useState(null);

  const fetchAvailabilityAndOrders = async () => {
    try {
      setError("");

      const statusRes = await api.get("/delivery/me/", { withCredentials: true });
      const online = Boolean(statusRes.data?.is_available);
      setIsOnline(online);

      if (!online) {
        setOrders([]);
        return;
      }

      const ordersRes = await api.get("/delivery/orders/?state=active", { withCredentials: true });
      const list = ordersRes.data?.results || ordersRes.data || [];
      setOrders(Array.isArray(list) ? list : []);
    } catch {
      setError("Unable to load available orders right now.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailabilityAndOrders();
  }, []);

  useEffect(() => {
    if (!isOnline) return;
    const id = setInterval(() => {
      fetchAvailabilityAndOrders();
    }, 60000);

    return () => clearInterval(id);
  }, [isOnline]);

  const goOnline = async () => {
    try {
      setUpdatingOnline(true);
      await api.patch(
        "/delivery/availability/",
        { is_available: true },
        { withCredentials: true }
      );
      setIsOnline(true);
      await fetchAvailabilityAndOrders();
    } catch {
      setError("Unable to go online right now.");
    } finally {
      setUpdatingOnline(false);
    }
  };

  const pickupOrder = async () => {
    if (!confirmOrder) return;
    const pickupTargetId = confirmOrder.order_id || confirmOrder.id;
    try {
      setPickingId(pickupTargetId);
      await api.patch(`/delivery/orders/${pickupTargetId}/pickup/`, {}, { withCredentials: true });
      setToast("Order picked up successfully!");
      setConfirmOrder(null);
      setTimeout(() => navigate("/delivery/my-deliveries"), 900);
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to pick up order. Please try again.");
    } finally {
      setPickingId(null);
    }
  };

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 2200);
    return () => clearTimeout(timer);
  }, [toast]);

  const renderedOrders = useMemo(() => orders, [orders]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] dark:bg-[#0A0F0D] py-16 px-4 md:px-8 transition-colors duration-500">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="h-10 w-72 bg-gray-200 dark:bg-[#1A241A] rounded-xl animate-pulse" />
          <div className="h-36 bg-white dark:bg-[#111812] rounded-[24px] border border-gray-100 dark:border-gray-800/60 animate-pulse" />
          <div className="h-36 bg-white dark:bg-[#111812] rounded-[24px] border border-gray-100 dark:border-gray-800/60 animate-pulse" />
          <div className="h-36 bg-white dark:bg-[#111812] rounded-[24px] border border-gray-100 dark:border-gray-800/60 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] dark:bg-[#0A0F0D] py-14 transition-colors duration-500 font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl sm:text-5xl font-black text-[#111812] dark:text-[#E8F3EB] tracking-tight mb-2">Available Orders</h1>
          <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">Pick nearby orders and start deliveries.</p>
        </div>

        {toast && (
          <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/30 rounded-xl text-emerald-700 dark:text-emerald-400 text-sm font-semibold">
            {toast}
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 rounded-xl text-red-700 dark:text-red-400 text-sm font-semibold">
            {error}
          </div>
        )}

        {!isOnline ? (
          <div className="bg-white dark:bg-[#111812] border border-gray-100 dark:border-gray-800 rounded-[28px] p-8 text-center shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
            <p className="text-xl font-black text-[#111812] dark:text-[#E8F3EB] mb-3">You are offline.</p>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Go online to see available orders.</p>
            <button
              type="button"
              onClick={goOnline}
              disabled={updatingOnline}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-7 py-3 rounded-xl disabled:opacity-70"
            >
              {updatingOnline ? "Switching..." : "Go Online"}
            </button>
          </div>
        ) : renderedOrders.length === 0 ? (
          <div className="bg-white dark:bg-[#111812] border border-gray-100 dark:border-gray-800 rounded-[28px] p-10 text-center">
            <p className="text-xl font-black text-[#111812] dark:text-[#E8F3EB] mb-2">No orders available near you right now.</p>
            <p className="text-gray-500 dark:text-gray-400">Check back in a few minutes.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {renderedOrders.map((order) => {
              const items = order.order_items || [];
              const customerArea = order.customer_area || order.customer_city || order.city || "City";
              const farmerName = order.farmer_name || "Farmer";
              const distance = Number(order.distance_km || order.distance || 0).toFixed(1);
              const orderTotal = Number(order.total || 0).toFixed(2);
              const displayOrderId = order.order_id || order.id;
              const normalizedStatus = String(order.status || "").toLowerCase();
              const canPickUp = normalizedStatus === "dispatched" || normalizedStatus === "ready_for_pickup";

              return (
                <div key={order.id} className="bg-white dark:bg-[#111812] border border-gray-100 dark:border-gray-800 rounded-[24px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <p className="text-lg font-black text-[#111812] dark:text-[#E8F3EB]">Order {displayOrderId}</p>
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
                          {distance} km away
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-[#1A241A] px-3 py-2">
                          <p className="text-[11px] uppercase tracking-wider font-bold text-gray-500">Farmer</p>
                          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{farmerName}</p>
                        </div>
                        <div className="rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-[#1A241A] px-3 py-2">
                          <p className="text-[11px] uppercase tracking-wider font-bold text-gray-500">Customer Area</p>
                          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{customerArea}</p>
                        </div>
                        <div className="rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-[#1A241A] px-3 py-2">
                          <p className="text-[11px] uppercase tracking-wider font-bold text-gray-500">Order Value</p>
                          <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">₹{orderTotal}</p>
                        </div>
                      </div>

                      <div className="pt-1 space-y-1.5">
                        {items.length === 0 ? (
                          <p className="text-sm text-gray-600 dark:text-gray-300">Items not listed</p>
                        ) : (
                          items.map((item, idx) => (
                            <p key={`${order.id}-${idx}`} className="text-sm text-gray-700 dark:text-gray-300">
                              {(item.product_name || "Product").trim()} x {item.quantity || 1}
                            </p>
                          ))
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => canPickUp && setConfirmOrder(order)}
                      disabled={!canPickUp}
                      className={`text-white font-black px-6 py-3 rounded-xl h-fit min-w-[140px] ${
                        canPickUp ? "bg-emerald-600 hover:bg-emerald-500" : "bg-gray-400 dark:bg-gray-700 cursor-not-allowed"
                      }`}
                    >
                      {canPickUp ? "Pick Up" : "Already Picked"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {confirmOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setConfirmOrder(null)} />
          <div className="relative max-w-lg w-full bg-white dark:bg-[#111812] rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
            <h3 className="text-2xl font-black text-[#111812] dark:text-[#E8F3EB] mb-3">Confirm Pickup</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-5">
              Are you sure you want to pick up this order?
              <br />
              Farmer: {confirmOrder.farmer_name || "Farmer"} | Distance: {Number(confirmOrder.distance_km || confirmOrder.distance || 0).toFixed(1)} km
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmOrder(null)}
                className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={pickupOrder}
                disabled={pickingId === (confirmOrder.order_id || confirmOrder.id)}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black disabled:opacity-70"
              >
                {pickingId === (confirmOrder.order_id || confirmOrder.id) ? "Picking..." : "Confirm Pick Up"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AvailableOrders;
