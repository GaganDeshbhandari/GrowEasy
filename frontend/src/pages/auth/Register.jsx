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
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  const roleOptions = [
    { value: "customer", label: "Customer", desc: "Buy fresh products", icon: "🛒" },
    { value: "farmer", label: "Farmer", desc: "Sell your harvest", icon: "🌾" }
  ];

  const handleRoleSelect = (roleValue) => {
    setFormData({ ...formData, role: roleValue });
    setShowRoleDropdown(false);
    setErrors((prev) => ({ ...prev, role: null }));
  };

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
      <p className="text-xs font-semibold text-red-500 dark:text-red-400 mt-1.5 ml-0.5">{Array.isArray(errors[name]) ? errors[name][0] : errors[name]}</p>
    ) : null;

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#FDFBF7] dark:bg-[#0A0F0D] transition-colors duration-500 font-sans">
      
      {/* Left: Visual Area */}
      <div className="relative w-full md:w-5/12 lg:w-5/12 min-h-[25vh] md:min-h-screen flex flex-col justify-between p-8 md:p-12 lg:p-16 overflow-hidden bg-[#061A10] border-b md:border-b-0 md:border-r border-emerald-900/30">
        {/* Abstract Dark Organic Elements */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[#061A10] via-[#0A2617] to-[#04120B] opacity-90"></div>
          <div className="absolute top-[-20%] left-[-10%] w-[80%] h-[80%] rounded-full bg-emerald-600/10 blur-[120px]"></div>
          <div className="absolute bottom-[-10%] right-[-20%] w-[70%] h-[70%] rounded-full bg-yellow-600/5 blur-[100px]"></div>
          {/* Noise texture for premium tactile feel */}
          <div className="absolute inset-0 opacity-[0.04] mix-blend-overlay" style={{backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')"}}></div>
        </div>
        
        <div className="relative z-10 flex">
          <Link to="/" className="inline-flex items-center gap-3 group">
            <span className="text-4xl filter drop-shadow group-hover:scale-110 transition-transform origin-bottom duration-300">🌱</span>
            <span className="text-white text-2xl font-extrabold tracking-tight">GrowEasy</span>
          </Link>
        </div>

        <div className="relative z-10 mt-auto pb-4 md:pb-0 pt-10">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-[1.05] mb-6 tracking-tight">
            Join the <br/>
            <span className="text-emerald-400 font-serif italic font-medium tracking-normal">ecosystem.</span>
          </h2>
          <p className="text-emerald-100/70 text-base md:text-lg max-w-sm font-light leading-relaxed">
            Create your account to start buying fresh produce or selling your harvest on GrowEasy.
          </p>
        </div>
      </div>

      {/* Right: Form Area */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 md:py-16 overflow-y-auto relative z-10">
        <div className="w-full max-w-lg mx-auto">
          
          <div className="mb-10">
            <h1 className="text-3xl font-extrabold text-[#111812] dark:text-[#E8F3EB] tracking-tight mb-3">Create Account</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Please fill in the details below to get started.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-7">
            
            {(errors.non_field_errors || errors.detail) && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 rounded-xl text-red-800 dark:text-red-400 text-sm font-medium flex items-start gap-3">
                <span className="text-red-600 dark:text-red-500 mt-0.5">!</span>
                {Array.isArray(errors.non_field_errors) ? errors.non_field_errors[0] : errors.non_field_errors || errors.detail}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
              <div className="relative group">
                <input
                  type="text"
                  name="first_name"
                  id="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  placeholder=" "
                  required
                  className="peer w-full bg-transparent border-b-2 border-gray-200 dark:border-gray-800 py-2.5 text-gray-900 dark:text-white  focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500 transition-colors"
                />
                <label htmlFor="first_name" className="absolute left-0 -top-4 text-xs font-medium text-emerald-600 dark:text-emerald-500 transition-all origin-[0] peer-placeholder-shown:text-base peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-gray-400 dark:peer-placeholder-shown:text-gray-500 peer-focus:-top-4 peer-focus:text-xs peer-focus:text-emerald-600 dark:peer-focus:text-emerald-400">
                  First Name
                </label>
                <FieldError name="first_name" />
              </div>
              <div className="relative group">
                <input
                  type="text"
                  name="last_name"
                  id="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  placeholder=" "
                  required
                  className="peer w-full bg-transparent border-b-2 border-gray-200 dark:border-gray-800 py-2.5 text-gray-900 dark:text-white  focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500 transition-colors"
                />
                <label htmlFor="last_name" className="absolute left-0 -top-4 text-xs font-medium text-emerald-600 dark:text-emerald-500 transition-all origin-[0] peer-placeholder-shown:text-base peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-gray-400 dark:peer-placeholder-shown:text-gray-500 peer-focus:-top-4 peer-focus:text-xs peer-focus:text-emerald-600 dark:peer-focus:text-emerald-400">
                  Last Name
                </label>
                <FieldError name="last_name" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
              <div className="relative group">
                <input
                  type="email"
                  name="email"
                  id="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder=" "
                  required
                  className="peer w-full bg-transparent border-b-2 border-gray-200 dark:border-gray-800 py-2.5 text-gray-900 dark:text-white  focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500 transition-colors"
                />
                <label htmlFor="email" className="absolute left-0 -top-4 text-xs font-medium text-emerald-600 dark:text-emerald-500 transition-all origin-[0] peer-placeholder-shown:text-base peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-gray-400 dark:peer-placeholder-shown:text-gray-500 peer-focus:-top-4 peer-focus:text-xs peer-focus:text-emerald-600 dark:peer-focus:text-emerald-400">
                  Email Address
                </label>
                <FieldError name="email" />
              </div>
              <div className="relative group">
                <input
                  type="tel"
                  name="phone"
                  id="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder=" "
                  required
                  className="peer w-full bg-transparent border-b-2 border-gray-200 dark:border-gray-800 py-2.5 text-gray-900 dark:text-white  focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500 transition-colors"
                />
                <label htmlFor="phone" className="absolute left-0 -top-4 text-xs font-medium text-emerald-600 dark:text-emerald-500 transition-all origin-[0] peer-placeholder-shown:text-base peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-gray-400 dark:peer-placeholder-shown:text-gray-500 peer-focus:-top-4 peer-focus:text-xs peer-focus:text-emerald-600 dark:peer-focus:text-emerald-400">
                  Phone Number
                </label>
                <FieldError name="phone" />
              </div>
            </div>

            <div className="relative pt-2">
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Account Type</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                  className="w-full flex items-center justify-between bg-[#F3EFE9] dark:bg-[#111812] border-0 py-3 pl-4 pr-5 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 transition-all shadow-sm text-left relative z-20"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{roleOptions.find(opt => opt.value === formData.role)?.icon}</span>
                    <span className="font-semibold text-sm">
                      {roleOptions.find(opt => opt.value === formData.role)?.label}
                    </span>
                  </div>
                  <svg className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${showRoleDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Custom Dropdown Menu */}
                <div className={`absolute left-0 right-0 top-[calc(100%+8px)] bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-xl overflow-hidden z-30 transition-all duration-300 origin-top ${showRoleDropdown ? 'opacity-100 scale-100 translate-y-0 visible' : 'opacity-0 scale-95 -translate-y-2 invisible'}`}>
                  <div className="flex flex-col p-1.5 z-30">
                    {roleOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleRoleSelect(option.value)}
                        className={`flex items-start gap-3 p-3 w-full text-left rounded-lg transition-colors ${formData.role === option.value ? 'bg-emerald-50 dark:bg-emerald-900/20 shadow-[inset_0_0_0_1px_rgba(16,185,129,0.2)]' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}
                      >
                        <span className="text-2xl leading-none mt-0.5">{option.icon}</span>
                        <div className="flex flex-col">
                          <span className={`text-sm font-bold ${formData.role === option.value ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-900 dark:text-white'}`}>
                            {option.label}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">
                            {option.desc}
                          </span>
                        </div>
                        {formData.role === option.value && (
                          <div className="ml-auto flex shrink-0 self-center">
                            <svg className="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Click-away overlay */}
              {showRoleDropdown && (
                <div className="fixed inset-0 z-20" onClick={() => setShowRoleDropdown(false)} />
              )}
              
              <FieldError name="role" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-7 pt-2">
              <div className="relative group">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  id="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder=" "
                  required
                  className="peer w-full bg-transparent border-b-2 border-gray-200 dark:border-gray-800 py-2.5 pr-10 text-gray-900 dark:text-white  focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500 transition-colors"
                />
                <label htmlFor="password" className="absolute left-0 -top-4 text-xs font-medium text-emerald-600 dark:text-emerald-500 transition-all origin-[0] peer-placeholder-shown:text-base peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-gray-400 dark:peer-placeholder-shown:text-gray-500 peer-focus:-top-4 peer-focus:text-xs peer-focus:text-emerald-600 dark:peer-focus:text-emerald-400">
                  Password
                </label>
                <button type="button" onClick={() => setShowPassword(!showPassword)} tabIndex={-1} className="absolute right-0 top-3 -translate-y-1/2 text-gray-400 hover:text-emerald-600 transition-colors p-1">
                  {showPassword ? "🙈" : "👁️"}
                </button>
                <FieldError name="password" />
              </div>
              <div className="relative group">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirm_password"
                  id="confirm_password"
                  value={formData.confirm_password}
                  onChange={handleChange}
                  placeholder=" "
                  required
                  className="peer w-full bg-transparent border-b-2 border-gray-200 dark:border-gray-800 py-2.5 pr-10 text-gray-900 dark:text-white  focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500 transition-colors"
                />
                <label htmlFor="confirm_password" className="absolute left-0 -top-4 text-xs font-medium text-emerald-600 dark:text-emerald-500 transition-all origin-[0] peer-placeholder-shown:text-base peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-gray-400 dark:peer-placeholder-shown:text-gray-500 peer-focus:-top-4 peer-focus:text-xs peer-focus:text-emerald-600 dark:peer-focus:text-emerald-400">
                  Confirm Password
                </label>
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} tabIndex={-1} className="absolute right-0 top-3 -translate-y-1/2 text-gray-400 hover:text-emerald-600 transition-colors p-1">
                  {showConfirmPassword ? "🙈" : "👁️"}
                </button>
                <FieldError name="confirm_password" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#111812] hover:bg-[#1A241A] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3 overflow-hidden relative group mt-6"
            >
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  <span>Creating Account...</span>
                </>
              ) : (
                <span>Create Account</span>
              )}
            </button>

            <p className="text-center text-sm text-gray-500 dark:text-gray-400 pt-6">
              Already have an account?{" "}
              <Link to="/login" className="text-[#111812] dark:text-[#E8F3EB] font-bold hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors underline decoration-2 decoration-emerald-200 dark:decoration-emerald-900 underline-offset-4">
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
