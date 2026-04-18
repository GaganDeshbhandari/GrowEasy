import { useEffect, useState } from "react";
import api from "../../api/axios";

const FarmerPaymentDetails = () => {
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [activeTab, setActiveTab] = useState("bank"); // "bank" or "upi"
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    // Form states
    const [bankForm, setBankForm] = useState({
        account_holder_name: "",
        bank_name: "",
        account_number: "",
        confirm_account_number: "",
        ifsc_code: "",
    });

    const [upiForm, setUpiForm] = useState({
        upi_id: "",
    });

    const showMessage = (msg, isError = false) => {
        if (isError) setError(msg);
        else setMessage(msg);
        setTimeout(() => {
            setMessage("");
            setError("");
        }, 3000);
    };

    const getBackendErrorMessage = (err, fallback = "Something went wrong. Please try again.") => {
        const data = err?.response?.data;

        if (typeof data === "string" && data.trim()) return data;
        if (typeof data?.detail === "string" && data.detail.trim()) return data.detail;
        if (typeof data?.message === "string" && data.message.trim()) return data.message;

        if (Array.isArray(data) && data.length > 0) {
            const first = data[0];
            if (typeof first === "string") return first;
        }

        if (data && typeof data === "object") {
            const firstValue = Object.values(data)[0];
            if (Array.isArray(firstValue) && firstValue.length > 0 && typeof firstValue[0] === "string") {
                return firstValue[0];
            }
            if (typeof firstValue === "string") return firstValue;
        }

        if (typeof err?.message === "string" && err.message.trim()) return err.message;
        return fallback;
    };

    const fetchPaymentMethods = async () => {
        setLoading(true);
        try {
            const response = await api.get("/auth/farmer/bank-details/");
            const methods = Array.isArray(response?.data)
                ? response.data
                : Array.isArray(response?.data?.results)
                    ? response.data.results
                    : [];
            setPaymentMethods(methods);
            setError("");
            return true;
        } catch (err) {
            setError(getBackendErrorMessage(err, "Failed to load payment details."));
            return false;
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPaymentMethods();
    }, []);

    const handleSetPrimary = async (id) => {
        setMessage("");
        setError("");
        try {
            await api.patch(`/auth/farmer/bank-details/${id}/set-primary/`);
            const ok = await fetchPaymentMethods();
            if (ok) showMessage("Primary payment method updated");
        } catch (err) {
            showMessage(getBackendErrorMessage(err, "Failed to set primary payment method."), true);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this payment detail?")) {
            setMessage("");
            setError("");
            try {
                await api.delete(`/auth/farmer/bank-details/${id}/`);
                const ok = await fetchPaymentMethods();
                if (ok) showMessage("Payment method deleted successfully");
            } catch (err) {
                if (err?.response?.status === 400) {
                    showMessage(getBackendErrorMessage(err, "Unable to delete payment method."), true);
                    return;
                }
                showMessage(getBackendErrorMessage(err, "Failed to delete payment method."), true);
            }
        }
    };

    const handleBankSubmit = async (e) => {
        e.preventDefault();
        setMessage("");
        setError("");

        if (bankForm.account_number !== bankForm.confirm_account_number) {
            setError("Account numbers do not match");
            return;
        }

        if (bankForm.ifsc_code.length !== 11) {
            setError("IFSC Code must be exactly 11 characters");
            return;
        }

        try {
            await api.post("/auth/farmer/bank-details/", {
                type: "bank",
                account_holder_name: bankForm.account_holder_name,
                bank_name: bankForm.bank_name,
                account_number: bankForm.account_number,
                ifsc_code: bankForm.ifsc_code.toUpperCase(),
                upi_id: "",
            });

            const ok = await fetchPaymentMethods();
            if (!ok) return;

            setBankForm({ account_holder_name: "", bank_name: "", account_number: "", confirm_account_number: "", ifsc_code: "" });
            setShowAddForm(false);
            showMessage("Bank account added successfully");
        } catch (err) {
            showMessage(getBackendErrorMessage(err, "Failed to add bank account."), true);
        }
    };

    const handleUpiSubmit = async (e) => {
        e.preventDefault();
        setMessage("");
        setError("");

        if (!upiForm.upi_id.includes("@")) {
            setError("Invalid UPI ID. Must contain '@'");
            return;
        }

        try {
            await api.post("/auth/farmer/bank-details/", {
                type: "upi",
                upi_id: upiForm.upi_id,
                account_holder_name: "",
                bank_name: "",
                account_number: "",
                ifsc_code: "",
            });

            const ok = await fetchPaymentMethods();
            if (!ok) return;

            setUpiForm({ upi_id: "" });
            setShowAddForm(false);
            showMessage("UPI ID added successfully");
        } catch (err) {
            showMessage(getBackendErrorMessage(err, "Failed to add UPI ID."), true);
        }
    };

    return (
        <section className="bg-white dark:bg-[#111812] rounded-[32px] border border-gray-100 dark:border-gray-800/60 p-8 sm:p-10 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                    </div>
                    <h2 className="text-xl font-black text-[#111812] dark:text-[#E8F3EB] tracking-tight">Payment Details</h2>
                </div>
                <button
                    type="button"
                    onClick={() => {
                        setShowAddForm((prev) => !prev);
                        setError("");
                        setMessage("");
                    }}
                    className="text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 px-5 py-2.5 rounded-xl active:scale-95"
                >
                    {showAddForm ? "Cancel" : "+ Add New Payment Method"}
                </button>
            </div>

            {message && (
                <div className="mb-6 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200/50 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-400 text-sm font-bold rounded-[16px] px-5 py-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                    <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {message}
                </div>
            )}

            {error && (
                <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200/50 dark:border-red-800/50 text-red-700 dark:text-red-400 text-sm font-bold rounded-[16px] px-5 py-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                    <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {error}
                </div>
            )}

            {showAddForm && (
                <div className="mb-8 border-2 border-gray-100 dark:border-gray-800/60 bg-white dark:bg-[#1A241A]/30 rounded-[24px] p-6 lg:p-8 animate-in fade-in slide-in-from-top-4 duration-500 shadow-sm">
                    <div className="flex gap-2 mb-8 bg-gray-100/50 dark:bg-[#111812] p-1.5 rounded-[16px] max-w-sm">
                        <button
                            onClick={() => setActiveTab("bank")}
                            className={`flex-1 py-2.5 px-4 rounded-[12px] text-sm font-black transition-all ${activeTab === 'bank' ? 'bg-white dark:bg-gray-800 text-[#111812] dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'}`}
                        >
                            Bank Transfer
                        </button>
                        <button
                            onClick={() => setActiveTab("upi")}
                            className={`flex-1 py-2.5 px-4 rounded-[12px] text-sm font-black transition-all ${activeTab === 'upi' ? 'bg-white dark:bg-gray-800 text-[#111812] dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'}`}
                        >
                            UPI ID
                        </button>
                    </div>

                    {activeTab === "bank" ? (
                        <form onSubmit={handleBankSubmit} className="space-y-6">
                            <div className="grid sm:grid-cols-2 gap-5">
                                <div className="space-y-1.5 sm:col-span-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 ml-1">Account Holder Name</label>
                                    <input
                                        type="text"
                                        value={bankForm.account_holder_name}
                                        onChange={(e) => setBankForm({ ...bankForm, account_holder_name: e.target.value })}
                                        placeholder="Name on Bank Account"
                                        required
                                        className="w-full px-5 py-3.5 rounded-[16px] border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-[#111812] text-[#111812] dark:text-white font-medium focus:outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white dark:focus:bg-[#1A241A] transition-all shadow-sm"
                                    />
                                </div>
                                <div className="space-y-1.5 sm:col-span-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 ml-1">Bank Name</label>
                                    <input
                                        type="text"
                                        value={bankForm.bank_name}
                                        onChange={(e) => setBankForm({ ...bankForm, bank_name: e.target.value })}
                                        placeholder="E.g., State Bank of India"
                                        required
                                        className="w-full px-5 py-3.5 rounded-[16px] border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-[#111812] text-[#111812] dark:text-white font-medium focus:outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white dark:focus:bg-[#1A241A] transition-all shadow-sm"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 ml-1">Account Number</label>
                                    <input
                                        type="password"
                                        value={bankForm.account_number}
                                        onChange={(e) => setBankForm({ ...bankForm, account_number: e.target.value })}
                                        placeholder="••••••••••••"
                                        required
                                        className="w-full px-5 py-3.5 rounded-[16px] border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-[#111812] text-[#111812] dark:text-white font-medium focus:outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white dark:focus:bg-[#1A241A] transition-all shadow-sm"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 ml-1">Confirm Account Number</label>
                                    <input
                                        type="text"
                                        value={bankForm.confirm_account_number}
                                        onChange={(e) => setBankForm({ ...bankForm, confirm_account_number: e.target.value })}
                                        placeholder="1234567890"
                                        required
                                        className="w-full px-5 py-3.5 rounded-[16px] border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-[#111812] text-[#111812] dark:text-white font-medium focus:outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white dark:focus:bg-[#1A241A] transition-all shadow-sm"
                                    />
                                </div>
                                <div className="space-y-1.5 sm:col-span-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 ml-1">IFSC Code</label>
                                    <input
                                        type="text"
                                        value={bankForm.ifsc_code}
                                        onChange={(e) => setBankForm({ ...bankForm, ifsc_code: e.target.value.toUpperCase() })}
                                        placeholder="SBIN0001234"
                                        required
                                        maxLength={11}
                                        className="w-full px-5 py-3.5 rounded-[16px] border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-[#111812] text-[#111812] dark:text-white font-medium focus:outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white dark:focus:bg-[#1A241A] transition-all uppercase shadow-sm"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end pt-2">
                                <button
                                    type="submit"
                                    className="bg-[#111812] hover:bg-[#1A241A] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-black px-8 py-3.5 rounded-[16px] transition-all shadow-sm active:scale-95 w-full sm:w-auto"
                                >
                                    Save Bank Details
                                </button>
                            </div>
                        </form>
                    ) : (
                        <form onSubmit={handleUpiSubmit} className="space-y-6">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 ml-1">UPI ID</label>
                                <input
                                    type="text"
                                    value={upiForm.upi_id}
                                    onChange={(e) => setUpiForm({ upi_id: e.target.value.toLowerCase() })}
                                    placeholder="username@bank"
                                    required
                                    className="w-full px-5 py-3.5 rounded-[16px] border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-[#111812] text-[#111812] dark:text-white font-medium focus:outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white dark:focus:bg-[#1A241A] transition-all shadow-sm"
                                />
                            </div>
                            <div className="flex justify-end pt-2">
                                <button
                                    type="submit"
                                    className="bg-[#111812] hover:bg-[#1A241A] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-black px-8 py-3.5 rounded-[16px] transition-all shadow-sm active:scale-95 w-full sm:w-auto"
                                >
                                    Save UPI Detail
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            )}

            {loading ? (
                <div className="grid gap-5">
                    {[1, 2, 3].map((idx) => (
                        <div
                            key={idx}
                            className="border-2 border-gray-100 dark:border-gray-800/60 bg-white dark:bg-[#1A241A]/50 rounded-[24px] p-6 sm:p-8 shadow-sm animate-pulse"
                        >
                            <div className="flex items-start justify-between gap-6">
                                <div className="flex items-start gap-4 flex-1">
                                    <div className="w-12 h-12 rounded-xl bg-gray-200 dark:bg-gray-700 shrink-0" />
                                    <div className="flex-1 space-y-3">
                                        <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700" />
                                        <div className="h-6 w-52 rounded bg-gray-200 dark:bg-gray-700" />
                                        <div className="h-4 w-40 rounded bg-gray-200 dark:bg-gray-700" />
                                    </div>
                                </div>
                                <div className="space-y-2 w-28">
                                    <div className="h-8 rounded-xl bg-gray-200 dark:bg-gray-700" />
                                    <div className="h-8 rounded-xl bg-gray-200 dark:bg-gray-700" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : paymentMethods.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center rounded-[24px] border-2 border-dashed border-gray-200 dark:border-gray-800/60 bg-gray-50/50 dark:bg-[#111812]">
                    <div className="w-16 h-16 bg-white dark:bg-gray-800/50 rounded-full flex items-center justify-center mb-4 shadow-sm">
                        <svg className="w-8 h-8 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-black text-[#111812] dark:text-[#E8F3EB] mb-1">No payment details added yet</h3>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 max-w-sm">Add a bank account or UPI ID to receive payments from your sales.</p>
                </div>
            ) : (
                <div className="grid gap-5">
                    {paymentMethods.map(method => (
                        <div
                            key={method.id}
                            className={`relative border-2 rounded-[24px] p-6 sm:p-8 transition-all duration-300 shadow-sm ${
                                method.is_primary
                                    ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-900/10'
                                    : 'border-gray-100 dark:border-gray-800/60 bg-white dark:bg-[#1A241A]/50 hover:border-emerald-200 dark:hover:border-emerald-800/50'
                            }`}
                        >
                            {method.is_primary && (
                                <div className="absolute -top-3.5 right-6 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5">
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                    Primary
                                </div>
                            )}

                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
                                <div className="flex items-start gap-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${method.is_primary ? 'bg-emerald-100 dark:bg-emerald-800 text-emerald-600 dark:text-emerald-300' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'}`}>
                                        {method.type === 'bank' ? (
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" /><path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18" /></svg>
                                        ) : (
                                            <span className="font-black text-xs tracking-wider">UPI</span>
                                        )}
                                    </div>

                                    <div>
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800/80 px-2 py-0.5 rounded-md">
                                                {method.type === 'bank' ? 'Bank Transfer' : 'UPI Payment'}
                                            </span>
                                        </div>

                                        {method.type === 'bank' ? (
                                            <>
                                                <h3 className="text-xl font-black text-[#111812] dark:text-[#E8F3EB] tracking-tight">{method.bank_name}</h3>
                                                <p className="font-semibold text-gray-600 dark:text-gray-300 mt-1">{method.account_holder_name}</p>
                                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm font-medium">
                                                    <p className="text-gray-500 dark:text-gray-400"><span className="text-gray-400 dark:text-gray-500 font-normal mr-1">AC:</span><span className="font-mono tracking-wider">{method.account_number}</span></p>
                                                    <p className="text-gray-500 dark:text-gray-400"><span className="text-gray-400 dark:text-gray-500 font-normal mr-1">IFSC:</span><span className="font-mono">{method.ifsc_code}</span></p>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <h3 className="text-xl font-black text-[#111812] dark:text-[#E8F3EB] tracking-tight mb-2">{method.upi_id}</h3>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="flex sm:flex-col gap-2 shrink-0">
                                    <button
                                        onClick={() => handleSetPrimary(method.id)}
                                        disabled={method.is_primary}
                                        className={`px-4 py-2 text-xs font-bold rounded-xl transition-all w-full sm:w-auto text-center ${
                                            method.is_primary
                                                ? 'bg-gray-100 dark:bg-gray-800/50 text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-50'
                                                : 'bg-white dark:bg-[#111812] border-2 border-emerald-200 dark:border-emerald-800 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 active:scale-95 shadow-sm'
                                        }`}
                                    >
                                        {method.is_primary ? 'Primary Set' : 'Set Primary'}
                                    </button>
                                    <div className="relative group inline-block w-full sm:w-auto">
                                        <button
                                            onClick={() => handleDelete(method.id)}
                                            disabled={method.is_primary}
                                            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all w-full text-center flex items-center justify-center gap-1.5 ${
                                                method.is_primary
                                                    ? 'bg-gray-100 dark:bg-gray-800/50 text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-50'
                                                    : 'bg-white dark:bg-[#111812] border-2 border-red-100 dark:border-red-900/40 hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 active:scale-95 shadow-sm'
                                            }`}
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            Delete
                                        </button>
                                        {/* Tooltip for disabled delete button */}
                                        {method.is_primary && (
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs font-bold rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap shadow-xl z-10 pointer-events-none">
                                                Set another as primary first
                                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
};

export default FarmerPaymentDetails;
