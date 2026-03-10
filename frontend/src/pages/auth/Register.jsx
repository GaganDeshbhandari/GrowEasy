import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";

const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    password: "",
    confirm_password: "",
    role: "customer",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
      const response = await api.post("/auth/register/", formData);
      const userData = response.data.user;
      login(userData);

      if (userData.role === "farmer") {
        navigate("/farmer/dashboard");
      } else {
        navigate("/products");
      }
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
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 transition-colors duration-300">

      <div className="w-full max-w-xl">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg dark:shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-300">

          <div className="px-8 pt-10 pb-6 text-center">
            <Link to="/" className="inline-block mb-4">
              <span className="text-4xl">🌱</span>
            </Link>
            <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Join GrowEasy</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Create your account to start buying and selling</p>
          </div>

          <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-5">

            {(errors.non_field_errors || errors.detail) && (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm font-medium rounded-lg px-4 py-3">
                ⚠️ {Array.isArray(errors.non_field_errors) ? errors.non_field_errors[0] : errors.non_field_errors || errors.detail}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">First Name</label>
                <input type="text" name="first_name" value={formData.first_name} onChange={handleChange} required className={inputClass} />
                <FieldError name="first_name" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Last Name</label>
                <input type="text" name="last_name" value={formData.last_name} onChange={handleChange} required className={inputClass} />
                <FieldError name="last_name" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Email Address</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="you@example.com" required className={inputClass} />
                <FieldError name="email" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Phone</label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="your-phone-number" required className={inputClass} />
                <FieldError name="phone" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">I am a...</label>
              <div className="relative">
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full pl-4 pr-10 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-medium text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition cursor-pointer appearance-none"
                >
                  <option value="customer">🛒 Customer (Buy fresh products)</option>
                  <option value="farmer">🌾 Farmer (Sell my products)</option>
                </select>
                <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              <FieldError name="role" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Password</label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleChange} placeholder="Min 8 characters" required className={`${inputClass} pr-12`} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} tabIndex={-1} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition p-1">
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>
                <FieldError name="password" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Confirm Password</label>
                <div className="relative">
                  <input type={showConfirmPassword ? "text" : "password"} name="confirm_password" value={formData.confirm_password} onChange={handleChange} placeholder="Re-enter password" required className={`${inputClass} pr-12`} />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} tabIndex={-1} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition p-1">
                    {showConfirmPassword ? "🙈" : "👁️"}
                  </button>
                </div>
                <FieldError name="confirm_password" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition shadow-sm disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Creating account...
                </>
              ) : "Create Account"}
            </button>

            <p className="text-center text-sm text-gray-500 dark:text-gray-400 pt-4 border-t border-gray-100 dark:border-gray-700">
              Already have an account?{" "}
              <Link to="/login" className="text-green-600 dark:text-green-400 font-bold hover:underline">Sign in</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
