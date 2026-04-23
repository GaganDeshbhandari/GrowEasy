import { useEffect, useMemo, useState } from "react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profileStatus, setProfileStatus] = useState({ can_accept_deliveries: false, is_online: false });
  const [stats, setStats] = useState({
    total_deliveries: 0,
    total_earnings: 0,
    active_delivery: null,
    recent_earnings: [],
  });

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const [statusRes, earningsRes, activeRes] = await Promise.all([
        api.get("/delivery/me/", { withCredentials: true }),
        api.get("/delivery/earnings/", { withCredentials: true }),
        api.get("/delivery/orders/?state=active", { withCredentials: true }),
      ]);

      const earnings = earningsRes.data || {};
      const deliveriesRaw = activeRes.data?.results || activeRes.data || [];
      const deliveries = Array.isArray(deliveriesRaw) ? deliveriesRaw : [];
      const activeDelivery = deliveries.find((item) => ["ready_for_pickup", "out_for_delivery", "picked_up"].includes(String(item.status || "").toLowerCase()));

      setProfileStatus({
        can_accept_deliveries: Boolean(statusRes.data?.is_profile_complete),
        is_online: Boolean(statusRes.data?.is_available),
      });

      const recent = Array.isArray(earnings.history) ? earnings.history.slice(0, 5) : [];

      setStats({
        total_deliveries: Number(earnings.total_deliveries || recent.length || 0),
        total_earnings: Number(earnings.total_earnings || 0),
        active_delivery: activeDelivery || null,
        recent_earnings: recent,
      });
    } catch {
      setError("Failed to load dashboard. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const toggleAvailability = async () => {
    if (!profileStatus.can_accept_deliveries) return;
    try {
      await api.patch(
        "/delivery/availability/",
        { is_available: !profileStatus.is_online },
        { withCredentials: true }
      );
      setProfileStatus((prev) => ({ ...prev, is_online: !prev.is_online }));
    } catch {
      setError("Unable to update availability right now.");
    }
  };

  const availabilityLabel = useMemo(
    () => (profileStatus.is_online ? "You are online" : "You are offline"),
    [profileStatus.is_online]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] dark:bg-[#0A0F0D] py-16 px-4 md:px-8 transition-colors duration-500">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="h-28 bg-white dark:bg-[#111812] rounded-[24px] border border-gray-100 dark:border-gray-800/60 animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-36 bg-white dark:bg-[#111812] rounded-[24px] border border-gray-100 dark:border-gray-800/60 animate-pulse" />
            <div className="h-36 bg-white dark:bg-[#111812] rounded-[24px] border border-gray-100 dark:border-gray-800/60 animate-pulse" />
            <div className="h-36 bg-white dark:bg-[#111812] rounded-[24px] border border-gray-100 dark:border-gray-800/60 animate-pulse" />
          </div>
          <div className="h-72 bg-white dark:bg-[#111812] rounded-[24px] border border-gray-100 dark:border-gray-800/60 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] dark:bg-[#0A0F0D] py-14 transition-colors duration-500 font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="bg-white dark:bg-[#111812] border border-gray-100 dark:border-gray-800 rounded-[28px] p-7 md:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
          <h1 className="text-3xl sm:text-4xl font-black text-[#111812] dark:text-[#E8F3EB] tracking-tight mb-2">
            Hello {user?.first_name || "Partner"}! Ready to deliver?
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-base font-medium">Track your live performance and go online to pick nearby orders.</p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 rounded-xl text-red-700 dark:text-red-400 text-sm font-semibold">
            {error}
          </div>
        )}

        <div className="bg-white dark:bg-[#111812] border border-gray-100 dark:border-gray-800 rounded-[28px] p-6 md:p-7 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500">Availability</p>
              <div className="flex items-center gap-2 mt-2">
                <span className={`w-2.5 h-2.5 rounded-full ${profileStatus.is_online ? "bg-emerald-500" : "bg-gray-400"}`} />
                <p className="text-lg font-black text-[#111812] dark:text-[#E8F3EB]">{availabilityLabel}</p>
              </div>
              {!profileStatus.can_accept_deliveries && (
                <p className="text-amber-600 dark:text-amber-400 text-sm font-semibold mt-2">Complete your profile to go online.</p>
              )}
            </div>

            <button
              type="button"
              title={!profileStatus.can_accept_deliveries ? "Complete your profile to go online" : ""}
              onClick={toggleAvailability}
              disabled={!profileStatus.can_accept_deliveries}
              className={`relative w-[200px] h-14 rounded-full p-1.5 transition-all ${
                profileStatus.is_online ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-700"
              } ${!profileStatus.can_accept_deliveries ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              <span
                className={`absolute left-1.5 top-1.5 h-11 w-11 rounded-full bg-white shadow-md transition-transform ${
                  profileStatus.is_online ? "translate-x-[144px]" : "translate-x-0"
                }`}
              />
              <span className="absolute inset-0 flex items-center justify-center text-sm font-black text-white tracking-wide">
                {profileStatus.is_online ? "Go Offline" : "Go Online"}
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white dark:bg-[#111812] border border-gray-100 dark:border-gray-800 rounded-[24px] p-6">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Total Deliveries Completed</p>
            <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{stats.total_deliveries}</p>
          </div>
          <div className="bg-white dark:bg-[#111812] border border-gray-100 dark:border-gray-800 rounded-[24px] p-6">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Total Earnings (₹)</p>
            <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">₹{stats.total_earnings.toFixed(2)}</p>
          </div>
          <div className="bg-white dark:bg-[#111812] border border-gray-100 dark:border-gray-800 rounded-[24px] p-6">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Active Delivery</p>
            <p className="text-lg font-black text-[#111812] dark:text-[#E8F3EB]">{stats.active_delivery ? `#${stats.active_delivery.id}` : "None"}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{stats.active_delivery?.status || "No active order"}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#111812] border border-gray-100 dark:border-gray-800 rounded-[28px] p-6 md:p-7">
          <h2 className="text-2xl font-black text-[#111812] dark:text-[#E8F3EB] mb-5 tracking-tight">Recent Earnings</h2>
          {stats.recent_earnings.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">No recent earnings yet.</p>
          ) : (
            <div className="space-y-3">
              {stats.recent_earnings.map((item, index) => (
                <div key={`${item.order_id || index}-${index}`} className="flex items-center justify-between rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-[#1A241A] px-4 py-3">
                  <div>
                    <p className="text-sm font-bold text-[#111812] dark:text-[#E8F3EB]">Order #{item.order_id || item.id || "-"}</p>
                    <p className="text-xs text-gray-500">{item.delivered_at ? new Date(item.delivered_at).toLocaleDateString("en-IN") : "-"}</p>
                  </div>
                  <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">₹{Number(item.amount || 50).toFixed(2)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
