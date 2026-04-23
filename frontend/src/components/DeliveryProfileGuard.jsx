import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import api from "../api/axios";

const DeliveryProfileGuard = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [canAccept, setCanAccept] = useState(false);

  useEffect(() => {
    let mounted = true;

    const checkCompletion = async () => {
      try {
        const res = await api.get("/delivery/me/");
        if (!mounted) return;
        setCanAccept(Boolean(res.data?.is_profile_complete));
      } catch {
        if (!mounted) return;
        setCanAccept(false);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    checkCompletion();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] dark:bg-[#0A0F0D] py-16 px-4 md:px-8 transition-colors duration-500">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="h-12 w-80 bg-gray-200 dark:bg-[#1A241A] rounded-2xl animate-pulse" />
          <div className="h-48 bg-white dark:bg-[#111812] border border-gray-100 dark:border-gray-800/60 rounded-[28px] animate-pulse" />
          <div className="h-48 bg-white dark:bg-[#111812] border border-gray-100 dark:border-gray-800/60 rounded-[28px] animate-pulse" />
        </div>
      </div>
    );
  }

  if (!canAccept) {
    return <Navigate to="/delivery/complete-profile" replace />;
  }

  return children;
};

export default DeliveryProfileGuard;
