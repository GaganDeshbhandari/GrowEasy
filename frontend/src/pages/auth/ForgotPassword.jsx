import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api/axios";

const ForgotPassword = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await api.post("/auth/forgot-password/", { email });
      navigate("/reset-password", { state: { email } });
    } catch (err) {
      const data = err.response?.data;
      if (data?.email) {
        setError(data.email[0]);
      } else if (data?.detail) {
        setError(data.detail);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-amber-50 via-white to-orange-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 transition-colors duration-300">

      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg dark:shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-300">

          <div className="px-8 pt-10 pb-6 text-center">
            <span className="inline-block text-4xl mb-4">🔑</span>
            <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Forgot Password?</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Enter your email and we'll send you an OTP</p>
          </div>

          <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-5">

            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm font-medium rounded-lg px-4 py-3">
                ⚠️ {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition shadow-sm disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Sending OTP...
                </>
              ) : "Send OTP"}
            </button>

            <p className="text-center text-sm text-gray-500 dark:text-gray-400 pt-4 border-t border-gray-100 dark:border-gray-700">
              Remember your password?{" "}
              <Link to="/login" className="text-green-600 dark:text-green-400 font-bold hover:underline">Back to Login</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
