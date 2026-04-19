import { useState, useRef, useEffect } from "react";
import api from "../api/axios";

const ChangePasswordSettings = () => {
  const [step, setStep] = useState(1); // 1: Request OTP, 2: Enter OTP & New Password
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Step 2 state
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resendTimer, setResendTimer] = useState(0);

  const inputRefs = useRef([]);

  useEffect(() => {
    let interval = null;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [resendTimer]);

  const handleRequestOtp = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await api.post("/auth/password-change/request-otp/");
      setStep(2);
      setResendTimer(30);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (index, value) => {
    if (isNaN(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Focus next input
    if (value !== "" && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Focus previous input on backspace
    if (e.key === "Backspace" && index > 0 && otp[index] === "") {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text/plain").slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = [...otp];
    pastedData.split("").forEach((char, index) => {
      newOtp[index] = char;
    });
    setOtp(newOtp);

    const nextIndex = Math.min(pastedData.length, 5);
    if(inputRefs.current[nextIndex]) inputRefs.current[nextIndex].focus();
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return setError("Passwords do not match.");
    }

    const otpString = otp.join("");
    if (otpString.length !== 6) {
      return setError("Please enter a valid 6-digit OTP.");
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await api.post("/auth/password-change/verify/", {
        otp: otpString,
        new_password: newPassword,
      });
      setSuccess("Password changed successfully");
      setTimeout(() => {
        setStep(1);
        setOtp(["", "", "", "", "", ""]);
        setNewPassword("");
        setConfirmPassword("");
        setSuccess("");
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.otp?.[0] || "Invalid OTP or error updating password.");
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = () => {
    if (!newPassword) return null;
    if (newPassword.length < 8) return { label: "Weak", color: "text-red-500", bg: "bg-red-500" };
    const hasUpper = /[A-Z]/.test(newPassword);
    const hasNumber = /\d/.test(newPassword);
    if (hasUpper && hasNumber) return { label: "Strong", color: "text-green-500", bg: "bg-green-500" };
    return { label: "Medium", color: "text-orange-500", bg: "bg-orange-500" };
  };

  const strength = getPasswordStrength();

  return (
    <div className="bg-white dark:bg-[#1A231C] rounded-[24px] p-6 lg:p-8 shadow-sm mt-8 border border-gray-100 dark:border-[#2C3B2F]">
      <h2 className="text-2xl font-black text-[#111812] dark:text-[#E8F3EB] mb-6 tracking-tight">Security</h2>
      
      {step === 1 ? (
        <div>
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">Change Password</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 max-w-sm">
            We'll send an OTP to your registered email address to verify your identity.
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 rounded-xl text-red-800 dark:text-red-400 text-sm font-medium">
              {error}
            </div>
          )}

          <button
            onClick={handleRequestOtp}
            disabled={loading}
            className="w-full sm:w-auto bg-[#111812] hover:bg-[#1A241A] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 disabled:opacity-70 flex items-center justify-center gap-3"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                <span>Sending...</span>
              </>
            ) : (
              <span>Send OTP</span>
            )}
          </button>
        </div>
      ) : (
        <form onSubmit={handleVerify} className="max-w-md">
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 rounded-xl text-red-800 dark:text-red-400 text-sm font-medium">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/30 rounded-xl text-green-800 dark:text-green-400 text-sm font-medium">
              {success}
            </div>
          )}

          <div className="space-y-3 mb-8">
            <label className="text-sm font-bold text-[#111812] dark:text-[#E8F3EB] tracking-tight">Enter OTP</label>
            <div className="flex justify-between gap-2" onPaste={handlePaste}>
              {otp.map((data, index) => (
                <input
                  key={index}
                  type="text"
                  maxLength="1"
                  ref={(el) => (inputRefs.current[index] = el)}
                  value={data}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-14 text-center text-xl font-black bg-transparent border-2 border-gray-200 dark:border-[#2C3B2F] rounded-xl text-gray-900 dark:text-white focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500 focus:bg-emerald-50 dark:focus:bg-emerald-900/10 transition-colors"
                  placeholder="·"
                />
              ))}
            </div>
          </div>

          <div className="relative group mb-8">
            <input 
              type="password" 
              id="newPasswordChange"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder=" "
              required
              className="peer w-full bg-transparent border-b-2 border-gray-200 dark:border-[#2C3B2F] py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500 transition-colors font-mono tracking-wider"
            />
            <label 
              htmlFor="newPasswordChange"
              className="absolute left-0 -top-4 text-xs font-medium text-emerald-600 dark:text-emerald-500 transition-all origin-[0] peer-placeholder-shown:text-base peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-gray-400 dark:peer-placeholder-shown:text-gray-500 peer-focus:-top-4 peer-focus:text-xs peer-focus:text-emerald-600 dark:peer-focus:text-emerald-400"
            >
              New Password
            </label>
            {strength && (
              <div className="mt-2 flex items-center justify-between text-xs font-medium">
                <span className="text-gray-400">Strength: <span className={strength.color}>{strength.label}</span></span>
                <div className="flex gap-1 h-1.5 w-16">
                  <div className={`flex-1 rounded-full ${strength.bg}`}></div>
                  <div className={`flex-1 rounded-full ${newPassword.length >= 8 && strength.label !== 'Weak' ? strength.bg : 'bg-gray-200 dark:bg-gray-700'}`}></div>
                  <div className={`flex-1 rounded-full ${strength.label === 'Strong' ? strength.bg : 'bg-gray-200 dark:bg-gray-700'}`}></div>
                </div>
              </div>
            )}
          </div>

          <div className="relative group mb-8">
            <input 
              type="password" 
              id="confirmPasswordChange"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder=" "
              required
              className="peer w-full bg-transparent border-b-2 border-gray-200 dark:border-[#2C3B2F] py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500 transition-colors font-mono tracking-wider"
            />
            <label 
              htmlFor="confirmPasswordChange"
              className="absolute left-0 -top-4 text-xs font-medium text-emerald-600 dark:text-emerald-500 transition-all origin-[0] peer-placeholder-shown:text-base peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-gray-400 dark:peer-placeholder-shown:text-gray-500 peer-focus:-top-4 peer-focus:text-xs peer-focus:text-emerald-600 dark:peer-focus:text-emerald-400"
            >
              Confirm Password
            </label>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto flex-1 bg-[#111812] hover:bg-[#1A241A] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 disabled:opacity-70 flex items-center justify-center gap-3"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  <span>Updating...</span>
                </>
              ) : (
                <span>Change Password</span>
              )}
            </button>

            <button
              type="button"
              disabled={resendTimer > 0 || loading}
              onClick={handleRequestOtp}
              className="text-sm font-bold text-gray-500 hover:text-[#111812] dark:hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : "Resend OTP"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ChangePasswordSettings;
