import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import api from "../../api/axios";

export default function VerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const ranEffect = useRef(false);

  useEffect(() => {
    if (ranEffect.current) return;
    ranEffect.current = true;

    if (!token) {
      setError("Invalid verification link");
      setLoading(false);
      return;
    }

    const verifyToken = async () => {
      try {
        await api.get(`/auth/verify-email/?token=${token}`);
        setSuccess(true);
      } catch (err) {
        setError(err.response?.data?.detail || "This verification link has expired or already been used.");
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleResend = async () => {
    setResendLoading(true);
    try {
      await api.post("/auth/resend-verification-email/");
      setResendMessage("A new verification email has been sent");
    } catch (err) {
      setResendMessage(err.response?.data?.detail || "Failed to resend. Please try again.");
    } finally {
      setResendLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7] dark:bg-[#0A0F0D]">
        <svg className="animate-spin h-10 w-10 text-emerald-600" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7] dark:bg-[#0A0F0D] p-6 font-sans">
      <div className="max-w-md w-full bg-white dark:bg-[#111812] rounded-[32px] p-8 text-center border border-gray-100 dark:border-gray-800 shadow-2xl animate-in zoom-in-95 duration-300">
        
        {success ? (
          <>
            <div className="w-20 h-20 mx-auto bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-6 text-green-500">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-3xl font-black text-[#111812] dark:text-[#E8F3EB] mb-4">Email Verified Successfully!</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8 font-medium">
              Your account is now active. You can now use GrowEasy.
            </p>
            <button
              onClick={() => navigate("/login")}
              className="w-full bg-[#10B981] hover:bg-[#059669] text-white font-bold py-4 px-6 rounded-xl transition-all shadow-[0_4px_0_#047857] hover:shadow-[0_6px_0_#047857] active:shadow-[0_0px_0_#047857] active:translate-y-1 transform"
            >
              Go to Login
            </button>
          </>
        ) : (
          <>
            <div className="w-20 h-20 mx-auto bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-6 text-red-500">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-3xl font-black text-[#111812] dark:text-[#E8F3EB] mb-4">Invalid or Expired Link</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8 font-medium">
              {error}
            </p>
            {resendMessage && (
              <p className={`text-sm font-bold mb-4 ${resendMessage.includes("Failed") ? "text-red-500" : "text-emerald-500"}`}>
                {resendMessage}
              </p>
            )}
            <button
              onClick={handleResend}
              disabled={resendLoading}
              className="w-full bg-[#111812] hover:bg-[#1A241A] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-bold py-3.5 px-6 rounded-xl transition-all mb-4 disabled:opacity-50 flex justify-center items-center"
            >
              {resendLoading ? "Sending..." : "Resend Verification Email"}
            </button>
            <Link to="/login" className="text-sm font-bold text-gray-500 hover:text-[#111812] dark:hover:text-white transition-colors underline decoration-2 underline-offset-4">
              Return to Login
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
