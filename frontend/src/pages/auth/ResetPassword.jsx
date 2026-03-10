import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import api from "../../api/axios";

const ResetPassword = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const email = state?.email || "";

  const [formData, setFormData] = useState({
    otp: "",
    new_password: "",
    confirm_password: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors((prev) => ({ ...prev, [e.target.name]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      await api.post("/auth/reset-password/", formData);
      navigate("/login", { state: { passwordReset: true } });
    } catch (err) {
      const data = err.response?.data;
      if (data) {
        setErrors(data);
      } else {
        setErrors({ non_field_errors: ["Something went wrong. Please try again."] });
      }
    } finally {
      setLoading(false);
    }
  };

  const FieldError = ({ name }) =>
    errors[name] ? (
      <p className="text-xs font-semibold text-red-500 dark:text-red-400 mt-1 ml-1">{Array.isArray(errors[name]) ? errors[name][0] : errors[name]}</p>
    ) : null;

  const inputClass = "w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition";

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-purple-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 transition-colors duration-300">

      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg dark:shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-300">

          <div className="px-8 pt-10 pb-6 text-center">
            <span className="inline-block text-4xl mb-4">🔐</span>
            <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Reset Password</h1>
            {email && (
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
                OTP sent to <span className="font-bold text-gray-700 dark:text-gray-200">{email}</span>
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-5">

            {(errors.non_field_errors || errors.detail) && (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm font-medium rounded-lg px-4 py-3">
                ⚠️ {Array.isArray(errors.non_field_errors) ? errors.non_field_errors[0] : errors.non_field_errors || errors.detail}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">OTP Code</label>
              <input
                type="text"
                name="otp"
                value={formData.otp}
                onChange={handleChange}
                placeholder="Enter 6-digit OTP"
                maxLength={6}
                required
                className={`${inputClass} text-lg tracking-[0.5em] text-center font-mono font-bold`}
              />
              <FieldError name="otp" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">New Password</label>
              <div className="relative">
                <input type={showNewPassword ? "text" : "password"} name="new_password" value={formData.new_password} onChange={handleChange} placeholder="Min 8 characters" required className={`${inputClass} pr-12`} />
                <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} tabIndex={-1} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition p-1">
                  {showNewPassword ? "🙈" : "👁️"}
                </button>
              </div>
              <FieldError name="new_password" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Confirm Password</label>
              <div className="relative">
                <input type={showConfirmPassword ? "text" : "password"} name="confirm_password" value={formData.confirm_password} onChange={handleChange} placeholder="Re-enter new password" required className={`${inputClass} pr-12`} />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} tabIndex={-1} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition p-1">
                  {showConfirmPassword ? "🙈" : "👁️"}
                </button>
              </div>
              <FieldError name="confirm_password" />
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
                  Resetting...
                </>
              ) : "Reset Password"}
            </button>

            <p className="text-center text-sm text-gray-500 dark:text-gray-400 pt-4 border-t border-gray-100 dark:border-gray-700">
              Didn't receive the OTP?{" "}
              <Link to="/forgot-password" className="text-green-600 dark:text-green-400 font-bold hover:underline">Resend OTP</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
