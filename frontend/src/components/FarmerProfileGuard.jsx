import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import api from "../api/axios";

const FarmerProfileGuard = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    let mounted = true;

    const checkCompletion = async () => {
      try {
        const [profileRes, bankRes] = await Promise.all([
          api.get("/auth/farmer/profile/"),
          api.get("/auth/farmer/bank-details/").catch(() => ({ data: [] })),
        ]);
        if (!mounted) return;
        const hasCoordinates = Boolean(profileRes.data?.latitude) && Boolean(profileRes.data?.longitude);
        const hasGender = Boolean(profileRes.data?.gender);
        const bankDetails = Array.isArray(bankRes.data) ? bankRes.data : [];
        const hasPayout = bankDetails.length > 0;
        setIsComplete(hasCoordinates && hasGender && hasPayout);
      } catch {
        if (!mounted) return;
        setIsComplete(false);
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

  if (!isComplete) {
    return <Navigate to="/farmer/complete-profile" replace />;
  }

  return children;
};

export default FarmerProfileGuard;
