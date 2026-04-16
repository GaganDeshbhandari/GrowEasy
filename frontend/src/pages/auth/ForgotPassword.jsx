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
    <div className="min-h-screen flex flex-col md:flex-row bg-[#FDFBF7] dark:bg-[#0A0F0D] transition-colors duration-500 font-sans">
      
      {/* Left: Visual Area */}
      <div className="relative w-full md:w-5/12 lg:w-1/2 min-h-[35vh] md:min-h-screen flex flex-col justify-between p-8 md:p-12 lg:p-16 overflow-hidden bg-[#061A10] border-b md:border-b-0 md:border-r border-emerald-900/30">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[#061A10] via-[#0A2617] to-[#04120B] opacity-90"></div>
          <div className="absolute top-[-20%] left-[-10%] w-[80%] h-[80%] rounded-full bg-emerald-600/10 blur-[120px]"></div>
          <div className="absolute bottom-[-10%] right-[-20%] w-[70%] h-[70%] rounded-full bg-yellow-600/5 blur-[100px]"></div>
          <div className="absolute inset-0 opacity-[0.04] mix-blend-overlay" style={{backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')"}}></div>
        </div>
        
        <div className="relative z-10 flex">
          <Link to="/" className="inline-flex items-center gap-3 group">
            <span className="text-4xl filter drop-shadow group-hover:scale-110 transition-transform origin-bottom duration-300">🌱</span>
            <span className="text-white text-2xl font-extrabold tracking-tight">GrowEasy</span>
          </Link>
        </div>

        <div className="relative z-10 mt-auto pb-4 pt-16">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-[1.05] mb-6 tracking-tight">
            Regain <br/>
            <span className="text-emerald-400 font-serif italic font-medium tracking-normal">access.</span>
          </h2>
          <p className="text-emerald-100/70 text-base md:text-lg max-w-sm font-light leading-relaxed">
            Enter your email and we'll send you an OTP to quickly reset your password.
          </p>
        </div>
      </div>

      {/* Right: Form Area */}
      <div className="flex-1 flex flex-col justify-center px-6 py-16 md:py-0 relative z-10">
        <div className="w-full max-w-sm mx-auto">
          
          <div className="mb-12">
            <h1 className="text-3xl font-extrabold text-[#111812] dark:text-[#E8F3EB] tracking-tight mb-3">Forgot Password?</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Reset your account access smoothly.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 rounded-xl text-red-800 dark:text-red-400 text-sm font-medium flex items-start gap-3">
                <span className="text-red-600 dark:text-red-500 mt-0.5">!</span>
                {error}
              </div>
            )}

            <div className="space-y-8 mt-4">
              <div className="relative group mt-4">
                <input
                  type="email"
                  name="email"
                  id="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  placeholder=" "
                  required
                  className="peer w-full bg-transparent border-b-2 border-gray-200 dark:border-gray-800 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500 transition-colors"
                />
                <label 
                  htmlFor="email" 
                  className="absolute left-0 -top-4 text-xs font-medium text-emerald-600 dark:text-emerald-500 transition-all origin-[0]
                             peer-placeholder-shown:text-base peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-gray-400 dark:peer-placeholder-shown:text-gray-500
                             peer-focus:-top-4 peer-focus:text-xs peer-focus:text-emerald-600 dark:peer-focus:text-emerald-400"
                >
                  Email Address
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#111812] hover:bg-[#1A241A] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-bold py-3.5 px-6 rounded-xl transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3 overflow-hidden relative group mt-8"
            >
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  <span>Sending OTP...</span>
                </>
              ) : (
                <span>Send OTP</span>
              )}
            </button>

            <p className="text-center text-sm text-gray-500 dark:text-gray-400 pt-8">
              Remember your password?{" "}
              <Link to="/login" className="text-[#111812] dark:text-[#E8F3EB] font-bold hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors underline decoration-2 decoration-emerald-200 dark:decoration-emerald-900 underline-offset-4">
                Back to sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
