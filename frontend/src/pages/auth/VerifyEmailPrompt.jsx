import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";

export default function VerifyEmailPrompt() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // If user is already verified and accessed this page manually, redirect them
  if (user && user.is_email_verified) {
    if (user.role === "farmer") navigate("/farmer/dashboard");
    else navigate("/customer/products");
    return null;
  }

  const handleResend = async () => {
    setLoading(true);
    try {
      await api.post("/auth/resend-verification-email/");
      setMessage("A new verification email has been sent to " + user?.email);
    } catch (err) {
      setMessage(err.response?.data?.detail || "Failed to resend. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7] dark:bg-[#0A0F0D] p-6 font-sans">
      <div className="max-w-md w-full bg-white dark:bg-[#111812] rounded-[32px] p-8 text-center border border-gray-100 dark:border-gray-800 shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="w-20 h-20 mx-auto bg-amber-50 dark:bg-amber-900/20 rounded-full flex items-center justify-center mb-6 text-amber-500">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        
        <h2 className="text-3xl font-black text-[#111812] dark:text-[#E8F3EB] mb-4">Email Verification Required</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-8 font-medium">
          Please verify your email address to access your account dashboard. 
          {user?.email && <span className="block mt-2 font-bold text-gray-700 dark:text-gray-300">{user.email}</span>}
        </p>

        {message && (
          <p className={`text-sm font-bold mb-4 ${message.includes("Failed") ? "text-red-500" : "text-emerald-500"}`}>
            {message}
          </p>
        )}

        <div className="flex flex-col gap-3">
          <button
            onClick={handleResend}
            disabled={loading}
            className="w-full bg-[#10B981] hover:bg-[#059669] text-white font-bold py-4 px-6 rounded-xl transition-all shadow-[0_4px_0_#047857] hover:shadow-[0_6px_0_#047857] active:shadow-[0_0px_0_#047857] active:translate-y-1 transform disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Sending..." : "Resend Verification Email"}
          </button>
          
          <button
            onClick={handleLogout}
            className="w-full bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold py-4 px-6 rounded-xl transition-colors border-2 border-transparent hover:border-gray-200 dark:hover:border-gray-700"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
