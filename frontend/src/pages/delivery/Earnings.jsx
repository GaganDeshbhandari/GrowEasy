import { useEffect, useMemo, useState } from "react";
import api from "../../api/axios";

const Earnings = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState({ total_earned: 0, total_deliveries: 0 });
  const [rows, setRows] = useState([]);

  const fetchEarnings = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/delivery/earnings/", { withCredentials: true });
      const data = res.data || {};
      setSummary({
        total_earned: Number(data.total_earnings || 0),
        total_deliveries: Number(data.total_deliveries || 0),
      });
      const list = data.history || data.results || [];
      setRows(Array.isArray(list) ? list : []);
    } catch {
      setError("Failed to load earnings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEarnings();
  }, []);

  const average = useMemo(() => (summary.total_deliveries > 0 ? 50 : 50), [summary.total_deliveries]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] dark:bg-[#0A0F0D] py-16 px-4 md:px-8 transition-colors duration-500">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="h-40 bg-white dark:bg-[#111812] rounded-[24px] border border-gray-100 dark:border-gray-800/60 animate-pulse" />
          <div className="h-20 bg-white dark:bg-[#111812] rounded-[24px] border border-gray-100 dark:border-gray-800/60 animate-pulse" />
          <div className="h-20 bg-white dark:bg-[#111812] rounded-[24px] border border-gray-100 dark:border-gray-800/60 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] dark:bg-[#0A0F0D] py-14 transition-colors duration-500 font-sans">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl sm:text-5xl font-black text-[#111812] dark:text-[#E8F3EB] tracking-tight mb-2">Earnings</h1>
          <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">Track your completed delivery payouts.</p>
        </div>

        {error && (
          <div className="mb-5 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 rounded-xl text-red-700 dark:text-red-400 text-sm font-semibold">
            {error}
          </div>
        )}

        <div className="bg-white dark:bg-[#111812] border border-gray-100 dark:border-gray-800 rounded-[28px] p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-5 mb-7">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Total Earned</p>
            <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">₹{summary.total_earned.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Total Deliveries</p>
            <p className="text-3xl font-black text-[#111812] dark:text-[#E8F3EB]">{summary.total_deliveries}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Average Per Delivery</p>
            <p className="text-3xl font-black text-[#111812] dark:text-[#E8F3EB]">₹{average}</p>
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="bg-white dark:bg-[#111812] border border-gray-100 dark:border-gray-800 rounded-[24px] p-8 text-center text-gray-500 dark:text-gray-400">
            No earnings yet. Start delivering to earn!
          </div>
        ) : (
          <div className="bg-white dark:bg-[#111812] border border-gray-100 dark:border-gray-800 rounded-[24px] overflow-hidden">
            <div className="grid grid-cols-12 gap-3 px-5 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-[#1A241A] text-xs font-bold uppercase tracking-widest text-gray-500">
              <div className="col-span-3">Order ID</div>
              <div className="col-span-4">Customer Area</div>
              <div className="col-span-3">Date</div>
              <div className="col-span-2 text-right">Amount</div>
            </div>
            {rows.map((row, idx) => (
              <div key={`${row.order_id || row.id || idx}-${idx}`} className="grid grid-cols-12 gap-3 px-5 py-4 border-b border-gray-100 dark:border-gray-800 last:border-0 text-sm">
                <div className="col-span-3 font-bold text-[#111812] dark:text-[#E8F3EB]">#{row.order_id || row.id || "-"}</div>
                <div className="col-span-4 text-gray-600 dark:text-gray-300">{row.customer_city || row.city || row.customer_area || "City"}</div>
                <div className="col-span-3 text-gray-600 dark:text-gray-300">{row.delivered_at ? new Date(row.delivered_at).toLocaleDateString("en-IN") : "-"}</div>
                <div className="col-span-2 text-right font-black text-emerald-600 dark:text-emerald-400">₹{Number(row.amount || 50).toFixed(2)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Earnings;
