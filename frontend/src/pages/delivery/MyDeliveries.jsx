import { useEffect, useMemo, useState } from "react";
import api from "../../api/axios";

const tabLabels = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "delivered", label: "Delivered" },
];

const STATUS_META = {
  dispatched: {
    label: "Dispatched",
    className: "bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-500/30",
  },
  ready_for_pickup: {
    label: "Ready for Pickup",
    className: "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30",
  },
  out_for_delivery: {
    label: "Out for Delivery",
    className: "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30",
  },
  delivered: {
    label: "Delivered",
    className: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30",
  },
};

const formatStatusLabel = (status) => {
  const raw = String(status || "").toLowerCase();
  if (STATUS_META[raw]) return STATUS_META[raw].label;
  if (!raw) return "Unknown";
  return raw
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const MyDeliveries = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [deliveries, setDeliveries] = useState([]);
  const [tab, setTab] = useState("all");
  const [otpInputs, setOtpInputs] = useState({});
  const [otpOpenFor, setOtpOpenFor] = useState({});
  const [workingId, setWorkingId] = useState(null);

  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/delivery/orders/", { withCredentials: true });
      const list = res.data?.results || res.data || [];
      setDeliveries(Array.isArray(list) ? list : []);
    } catch {
      setError("Unable to load assigned deliveries.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveries();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  const filtered = useMemo(() => {
    if (tab === "all") return deliveries;
    if (tab === "active") {
      return deliveries.filter((d) => String(d.status || "").toLowerCase() !== "delivered");
    }
    return deliveries.filter((d) => String(d.status || "").toLowerCase() === "delivered");
  }, [deliveries, tab]);

  const statusBadge = (status) => {
    const normalized = String(status || "").toLowerCase();
    return STATUS_META[normalized]?.className || "bg-gray-100 dark:bg-[#1A241A] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700";
  };

  const generateOtp = async (deliveryId, orderApiId) => {
    try {
      setWorkingId(deliveryId);
      await api.patch(`/delivery/orders/${orderApiId}/pickup/`, {}, { withCredentials: true });
      setToast("OTP sent to customer's email");
      setOtpOpenFor((prev) => ({ ...prev, [deliveryId]: true }));
      await fetchDeliveries();
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to send OTP. Please try again.");
    } finally {
      setWorkingId(null);
    }
  };

  const verifyOtp = async (deliveryId, orderApiId) => {
    const otp = String(otpInputs[deliveryId] || "").trim();
    if (!/^\d{6}$/.test(otp)) {
      setError("Enter a valid 6-digit OTP.");
      return;
    }

    try {
      setWorkingId(deliveryId);
      await api.post(`/delivery/orders/${orderApiId}/verify-otp/`, { otp }, { withCredentials: true });
      setToast("Delivery Completed! You earned ₹50 🎉");
      setOtpOpenFor((prev) => ({ ...prev, [deliveryId]: false }));
      await fetchDeliveries();
    } catch (err) {
      const message = err?.response?.data?.detail || "Invalid OTP. Ask customer again.";
      if (/expired/i.test(message)) {
        setError("OTP expired. Generate a new one.");
      } else {
        setError("Invalid OTP. Ask customer again.");
      }
    } finally {
      setWorkingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] dark:bg-[#0A0F0D] py-16 px-4 md:px-8 transition-colors duration-500">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="h-10 w-64 bg-gray-200 dark:bg-[#1A241A] rounded-xl animate-pulse" />
          <div className="h-40 bg-white dark:bg-[#111812] rounded-[24px] border border-gray-100 dark:border-gray-800/60 animate-pulse" />
          <div className="h-40 bg-white dark:bg-[#111812] rounded-[24px] border border-gray-100 dark:border-gray-800/60 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] dark:bg-[#0A0F0D] py-14 transition-colors duration-500 font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl sm:text-5xl font-black text-[#111812] dark:text-[#E8F3EB] tracking-tight mb-2">My Deliveries</h1>
          <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">Track active and completed delivery tasks.</p>
        </div>

        {toast && (
          <div className="mb-5 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/30 rounded-xl text-emerald-700 dark:text-emerald-400 text-sm font-semibold animate-pulse">
            {toast}
          </div>
        )}

        {error && (
          <div className="mb-5 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 rounded-xl text-red-700 dark:text-red-400 text-sm font-semibold">
            {error}
          </div>
        )}

        <div className="flex items-center gap-2 mb-6">
          {tabLabels.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setTab(item.key)}
              className={`px-4 py-2 rounded-xl text-sm font-bold ${tab === item.key ? "bg-emerald-600 text-white" : "bg-white dark:bg-[#111812] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800"}`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white dark:bg-[#111812] border border-gray-100 dark:border-gray-800 rounded-[24px] p-8 text-center text-gray-500 dark:text-gray-400">
            No deliveries in this tab.
          </div>
        ) : (
          <div className="space-y-5">
            {filtered.map((order) => {
              const items = order.order_items || [];
              const isDelivered = String(order.status || "").toLowerCase() === "delivered";
              const normalizedStatus = String(order.status || "").toLowerCase();
              const canOtp = normalizedStatus === "ready_for_pickup" || normalizedStatus === "dispatched";
              const showOtpInput = Boolean(otpOpenFor[order.id]);
              const orderApiId = order.order_id || order.id;

              return (
                <div key={order.id} className="bg-white dark:bg-[#111812] border border-gray-100 dark:border-gray-800 rounded-[24px] p-6 shadow-[0_3px_16px_rgba(0,0,0,0.03)]">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-lg font-black text-[#111812] dark:text-[#E8F3EB]">Order {orderApiId}</p>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusBadge(order.status)}`}>
                          {formatStatusLabel(order.status)}
                        </span>
                      </div>

                      <div className="space-y-1">
                        {items.length === 0 ? (
                          <p className="text-sm text-gray-600 dark:text-gray-300">Items unavailable</p>
                        ) : (
                          items.map((item, idx) => (
                            <p key={`${order.id}-${idx}`} className="text-sm text-gray-700 dark:text-gray-300">
                              {item.product_name || "Product"} x {item.quantity || 1}
                            </p>
                          ))
                        )}
                      </div>

                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Customer Address: {order.customer_address || order.address_line || `${order.city || "City"}, ${order.state || "State"}`}
                      </p>

                      {isDelivered && (
                        <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                          Delivered: {order.delivered_at ? new Date(order.delivered_at).toLocaleString("en-IN") : "-"} • Earnings: ₹50
                        </p>
                      )}
                    </div>

                    {!isDelivered && (
                      <div className="w-full lg:w-[300px] space-y-3">
                        {canOtp && (
                          <button
                            type="button"
                            onClick={() => generateOtp(order.id, orderApiId)}
                            disabled={workingId === order.id}
                            className="w-full px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black disabled:opacity-70"
                          >
                            {workingId === order.id ? "Sending..." : "Generate OTP"}
                          </button>
                        )}

                        {normalizedStatus === "out_for_delivery" && !showOtpInput && (
                          <button
                            type="button"
                            onClick={() => setOtpOpenFor((prev) => ({ ...prev, [order.id]: true }))}
                            className="w-full px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black"
                          >
                            Enter OTP
                          </button>
                        )}

                        {showOtpInput && (
                          <div className="space-y-2">
                            <input
                              value={otpInputs[order.id] || ""}
                              onChange={(e) => setOtpInputs((prev) => ({ ...prev, [order.id]: e.target.value.replace(/\D/g, "").slice(0, 6) }))}
                              placeholder="Enter 6-digit OTP"
                              className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#1A241A] border border-gray-200 dark:border-gray-800"
                            />
                            <button
                              type="button"
                              onClick={() => verifyOtp(order.id, orderApiId)}
                              disabled={workingId === order.id}
                              className="w-full px-5 py-3 rounded-xl bg-[#111812] hover:bg-[#1A241A] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-black disabled:opacity-70"
                            >
                              {workingId === order.id ? "Verifying..." : "Verify & Complete Delivery"}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyDeliveries;
