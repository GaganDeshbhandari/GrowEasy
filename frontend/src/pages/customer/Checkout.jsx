import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

const initialAddressForm = {
	address_type: "home",
	full_name: "",
	phone: "",
	address: "",
	city: "",
	state: "",
	pincode: "",
	is_default: false,
};

const Checkout = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    // ==========================================
    // 1. STATE MANAGEMENT (Ready for API integration)
    // ==========================================
    const [cartSummary, setCartSummary] = useState(null);
    const [addresses, setAddresses] = useState([]);
    const [selectedAddressId, setSelectedAddressId] = useState(null);

    // Address Form UI State
    const [showAddAddress, setShowAddAddress] = useState(false);
    const [addressForm, setAddressForm] = useState(initialAddressForm);
    const [isAddressingLoading, setIsAddressingLoading] = useState(true);

    // Location picker state
    const [isLocationFetching, setIsLocationFetching] = useState(false);
    const [showMapPicker, setShowMapPicker] = useState(false);
    const [leafletReady, setLeafletReady] = useState(false);
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);

    // Payment State
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('upi');
    const [paymentLoading, setPaymentLoading] = useState(false);
    const [paymentError, setPaymentError] = useState(null);
    const [orderSuccess, setOrderSuccess] = useState(null);

    // Specific Payment Method Forms
    const [upiForm, setUpiForm] = useState("");
    const [cardForm, setCardForm] = useState({ number: "", name: "", expiry: "", cvv: "" });
    const [netBankingBank, setNetBankingBank] = useState("");

    // ==========================================
    // 2. DATA FETCHING
    // ==========================================
    useEffect(() => {
        const fetchCheckoutData = async () => {
            try {
                // TODO: Fetch cart summary
                // GET /api/cart/
                const cartRes = await api.get("/orders/cart/");

                // We extract totals assuming they map to cartSummary requirements
                const items = cartRes.data?.items || [];
                if (items.length === 0) {
                    navigate("/cart", { replace: true });
                    return;
                }

                const subtotal = parseFloat(cartRes.data?.total || 0);
                const delivery_charge = 0; // Assuming free delivery for dummy data

                setCartSummary({
                    id: cartRes.data?.id,
                    items,
                    subtotal,
                    delivery_charge,
                    total: subtotal + delivery_charge
                });

                // TODO: Fetch saved addresses
                // GET /api/customer/addresses/
                const addressRes = await api.get("/auth/addresses/");
                const addressPayload = addressRes.data;
                const addressList = Array.isArray(addressPayload)
                    ? addressPayload
                    : Array.isArray(addressPayload?.results)
                        ? addressPayload.results
                        : [];

                setAddresses(addressList);
                const defaultAddress = addressList.find((addr) => addr.is_default);
                setSelectedAddressId(defaultAddress ? defaultAddress.id : (addressList[0]?.id ?? null));

            } catch (err) {
                console.error("Failed to load checkout data", err);
            } finally {
                setIsAddressingLoading(false);
            }
        };

        fetchCheckoutData();
    }, [navigate]);

    // Handle Map & Location logic
    useEffect(() => {
        const loadLeaflet = () => {
            if (window.L) {
                setLeafletReady(true);
                return;
            }
            const leafletCssId = "leaflet-css-checkout";
            if (!document.getElementById(leafletCssId)) {
                const link = document.createElement("link");
                link.id = leafletCssId;
                link.rel = "stylesheet";
                link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
                document.head.appendChild(link);
            }
            const existingScript = document.getElementById("leaflet-js-checkout");
            if (existingScript) {
                existingScript.addEventListener("load", () => setLeafletReady(true), { once: true });
                return;
            }
            const script = document.createElement("script");
            script.id = "leaflet-js-checkout";
            script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
            script.async = true;
            script.onload = () => setLeafletReady(true);
            document.body.appendChild(script);
        };
        loadLeaflet();
        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, []);

    // ==========================================
    // 3. HANDLERS
    // ==========================================

    const handleAddressInput = (e) => {
        const { name, value, type, checked } = e.target;
        setAddressForm((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const getCurrentPosition = () =>
        new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error("Geolocation is not supported by your browser."));
                return;
            }
            navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            });
        });

    const reverseGeocode = async (latitude, longitude) => {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
        );
        if (!response.ok) {
            throw new Error("Unable to fetch address from map service.");
        }
        const data = await response.json();
        const addr = data?.address || {};
        const line1Parts = [
            addr.house_number,
            addr.building,
            addr.road,
            addr.suburb,
            addr.neighbourhood,
            addr.residential,
            addr.locality,
            addr.city_district,
            addr.county,
            addr.state_district,
            addr.postcode,
            addr.country,
        ].filter(Boolean);
        const fallbackAddress = line1Parts.join(", ");
        return {
            address: data?.display_name || fallbackAddress || "",
            city: addr.city || addr.town || addr.village || addr.hamlet || addr.municipality || addr.county || "",
            state: addr.state || addr.state_district || addr.region || addr.county || "",
            pincode: addr.postcode || "",
        };
    };

    const initMapPicker = () => {
        if (!leafletReady || !window.L || !mapRef.current) return;

        if (mapInstanceRef.current) {
            mapInstanceRef.current.remove();
            mapInstanceRef.current = null;
        }

        const L = window.L;
        const map = L.map(mapRef.current).setView([20.5937, 78.9629], 5);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "&copy; OpenStreetMap contributors",
        }).addTo(map);

        let marker = null;
        map.on("click", async (event) => {
            try {
                setPaymentError(null);
                const { lat, lng } = event.latlng;
                if (!marker) {
                    marker = L.marker([lat, lng]).addTo(map);
                } else {
                    marker.setLatLng([lat, lng]);
                }

                const locationData = await reverseGeocode(lat, lng);
                setAddressForm((prev) => ({
                    ...prev,
                    address: locationData.address || prev.address,
                    city: locationData.city || prev.city,
                    state: locationData.state || prev.state,
                    pincode: locationData.pincode || prev.pincode,
                }));
                setShowMapPicker(false);
            } catch (error) {
                setPaymentError(error?.message || "Unable to fetch address from map.");
            }
        });

        mapInstanceRef.current = map;
        setTimeout(() => map.invalidateSize(), 0);
    };

    const handleUseMyLocation = async () => {
        setPaymentError(null);
        try {
            setIsLocationFetching(true);
            const position = await getCurrentPosition();
            const { latitude, longitude } = position.coords;
            const locationData = await reverseGeocode(latitude, longitude);

            setAddressForm((prev) => ({
                ...prev,
                address: locationData.address || prev.address,
                city: locationData.city || prev.city,
                state: locationData.state || prev.state,
                pincode: locationData.pincode || prev.pincode,
            }));
        } catch (error) {
            setPaymentError(error?.message || "Unable to fetch location. Please try again.");
        } finally {
            setIsLocationFetching(false);
        }
    };

    const handleAddAddress = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post("/auth/addresses/", addressForm);
            const newAddress = res.data;
            setAddresses((prev) => [newAddress, ...prev]);
            setSelectedAddressId(newAddress.id);
            setAddressForm(initialAddressForm);
            setShowAddAddress(false);
            setShowMapPicker(false);
        } catch {
            setPaymentError("Failed to save address. Please check details and try again.");
        }
    };

    // ----- Payment Validation -----
    const validatePayment = () => {
        if (!selectedAddressId) {
            setPaymentError("Please select a delivery address.");
            return false;
        }

        if (selectedPaymentMethod === "upi") {
            if (!upiForm || !upiForm.includes("@")) {
                setPaymentError("Please enter a valid UPI ID (e.g. yourname@upi).");
                return false;
            }
        }
        else if (selectedPaymentMethod === "card") {
            const rawCardNum = cardForm.number.replace(/\s/g, '');
            if (rawCardNum.length !== 16) {
                setPaymentError("Card number must be exactly 16 digits.");
                return false;
            }
            if (!cardForm.name.trim()) {
                setPaymentError("Cardholder name is required.");
                return false;
            }
            if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(cardForm.expiry)) {
                setPaymentError("Expiry must be in MM/YY format.");
                return false;
            }
            if (cardForm.cvv.length !== 3) {
                setPaymentError("CVV must be exactly 3 digits.");
                return false;
            }
        }
        else if (selectedPaymentMethod === "netbanking") {
            if (!netBankingBank) {
                setPaymentError("Please select a bank for Net Banking.");
                return false;
            }
        }
        return true;
    };

    const isPaymentFormValid = () => {
        if (!selectedAddressId || !cartSummary) return false;
        if (selectedPaymentMethod === "upi") return upiForm.includes("@");
        if (selectedPaymentMethod === "card") {
            return cardForm.number.replace(/\s/g, '').length === 16 &&
                   cardForm.name.trim() !== "" &&
                   cardForm.expiry.length === 5 &&
                   cardForm.cvv.length === 3;
        }
        if (selectedPaymentMethod === "netbanking") return netBankingBank !== "";
        return false;
    };

    const handlePayment = async () => {
        setPaymentError(null);

        if (!validatePayment()) return;

        setPaymentLoading(true);

        try {
            const response = await api.post('/payments/create-order/', {
                cart_id: cartSummary.id,
                address_id: selectedAddressId
            }, { withCredentials: true });

            setPaymentLoading(false);

            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                amount: response.data.amount,
                currency: response.data.currency,
                order_id: response.data.razorpay_order_id,
                name: "GrowEasy",
                description: "Fresh farm products",
                handler: async function (razorpayResponse) {
                    setPaymentLoading(true);
                    try {
                        const verifyResponse = await api.post('/payments/verify/', {
                            razorpay_payment_id: razorpayResponse.razorpay_payment_id,
                            razorpay_order_id: razorpayResponse.razorpay_order_id,
                            razorpay_signature: razorpayResponse.razorpay_signature,
                            order_id: response.data.order_id
                        }, { withCredentials: true });

                        if (verifyResponse.data.success) {
                            setOrderSuccess({
                                orderId: verifyResponse.data.order_id,
                                amount: (response.data.amount / 100).toFixed(2)
                            });
                        } else {
                            setPaymentError("Payment verification failed. Please contact support.");
                            setPaymentLoading(false);
                        }
                    } catch (err) {
                        setPaymentError("Payment verification failed. Please contact support.");
                        setPaymentLoading(false);
                    }
                },
                prefill: {
                    name: user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : (user?.username || ""),
                    email: user?.email || "",
                    contact: user?.phone || ""
                },
                theme: {
                    color: "#16a34a"
                },
                modal: {
                    ondismiss: function () {
                        setPaymentLoading(false);
                        setPaymentError("Payment cancelled. Please try again.");
                    }
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (res) {
                setPaymentLoading(false);
                setPaymentError(res.error.description || "Failed to initiate payment. Please try again.");
            });
            rzp.open();

        } catch (error) {
            const message =
                error?.response?.data?.detail ||
                error?.response?.data?.error ||
                "Failed to initiate payment. Please try again.";
            setPaymentError(message);
            setPaymentLoading(false);
        }
    };

    // ----- Card Formatting -----
    const formatCardNumber = (value) => {
        const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        const matches = v.match(/\d{4,16}/g);
        const match = matches && matches[0] || v;
        const parts = [];
        for (let i = 0, len = match.length; i < len; i += 4) {
            parts.push(match.substring(i, i + 4));
        }
        if (parts.length) {
            return parts.join(' ');
        }
        return value;
    };


    // ==========================================
    // 4. RENDER SUCCESS SCREEN
    // ==========================================
    if (orderSuccess) {
        return (
            <div className="min-h-screen bg-[#FDFBF7] dark:bg-[#0A0F0D] flex items-center justify-center p-4 transition-colors duration-500">
                <div className="bg-white dark:bg-[#111812] rounded-[32px] border border-gray-100 dark:border-gray-800/60 p-10 max-w-lg w-full text-center shadow-2xl animate-in fade-in zoom-in-95 duration-500">
                    <div className="w-24 h-24 mx-auto bg-emerald-100 dark:bg-emerald-900/40 rounded-full flex items-center justify-center mb-8 border-4 border-emerald-50 dark:border-emerald-900/20">
                        <svg className="w-12 h-12 text-emerald-600 dark:text-emerald-400 drop-shadow-sm" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-3xl font-black text-[#111812] dark:text-[#E8F3EB] tracking-tight mb-2">Payment Successful!</h2>
                    <p className="text-gray-500 dark:text-gray-400 font-medium mb-6">Your order has been placed securely.</p>

                    <div className="bg-gray-50 dark:bg-[#1A241A] rounded-[20px] p-5 mb-8 border border-gray-100 dark:border-gray-800 flex flex-col items-center gap-2">
                        <div className="w-full flex justify-between">
                            <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">Order ID</span>
                            <span className="text-sm font-black text-[#111812] dark:text-white">{orderSuccess.orderId}</span>
                        </div>
                        <div className="w-full flex justify-between">
                            <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">Amount Paid</span>
                            <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">₹{parseFloat(orderSuccess.amount).toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <button onClick={() => navigate(`/orders`)} className="w-full bg-[#111812] hover:bg-[#1A241A] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-black px-8 py-4 rounded-[16px] transition-all active:scale-95 shadow-sm">
                            View Order
                        </button>
                        <button onClick={() => navigate(`/products`)} className="w-full bg-white dark:bg-transparent border-2 border-gray-200 dark:border-gray-700 hover:border-emerald-500 text-[#111812] dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 font-black px-8 py-4 rounded-[16px] transition-all active:scale-95">
                            Continue Shopping
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ==========================================
    // 5. RENDER MAIN CHECKOUT
    // ==========================================
    return (
        <div className="min-h-screen bg-[#FDFBF7] dark:bg-[#0A0F0D] transition-colors duration-500 py-12 md:py-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
                    <div>
                        <Link to="/cart" className="inline-flex items-center gap-2 text-xs font-black text-gray-400 hover:text-[#111812] dark:hover:text-white uppercase tracking-widest transition-colors mb-3 group">
                            <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                            Back to Cart
                        </Link>
                        <h1 className="text-4xl md:text-5xl font-black text-[#111812] dark:text-[#E8F3EB] tracking-tight leading-none">
                            Secure Checkout
                        </h1>
                    </div>
                </div>

                <div className="grid lg:grid-cols-12 gap-8 lg:gap-12">
                    {/* LEFT COLUMN: Order Summary (60%) + Delivery Address */}
                    <div className="lg:col-span-7 flex flex-col gap-8">

                        {/* ======================= ORDER SUMMARY ======================= */}
                        <section className="bg-white dark:bg-[#111812] rounded-[24px] border border-gray-100 dark:border-gray-800/60 p-6 sm:p-8 shadow-[0_4px_20px_rgb(0,0,0,0.02)]">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                                </div>
                                <h2 className="text-xl font-black text-[#111812] dark:text-[#E8F3EB] tracking-tight">Order Summary</h2>
                            </div>

                            {!cartSummary ? (
                                <div className="space-y-4">
                                    {[1, 2].map(i => (
                                        <div key={i} className="flex justify-between items-center bg-gray-50 dark:bg-[#1A241A]/50 p-4 rounded-[16px] animate-pulse">
                                            <div className="w-32 h-4 bg-gray-200 dark:bg-gray-800 rounded"></div>
                                            <div className="w-16 h-4 bg-gray-200 dark:bg-gray-800 rounded"></div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {cartSummary.items.map((item) => (
                                        <div key={item.id} className="flex items-center justify-between gap-4 p-4 rounded-[16px] border border-gray-100 dark:border-gray-800/60 bg-gray-50/50 dark:bg-[#1A241A]/30">
                                            <div className="flex-1 min-w-0">
                                                <p className="font-black text-sm text-[#111812] dark:text-[#E8F3EB] truncate">{item.product?.name}</p>
                                                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-wider">
                                                    By {item.product?.farmer_name || "GrowEasy Farmer"} • QTY: {parseFloat(item.quantity)}kg
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-black text-sm text-emerald-700 dark:text-emerald-400 shrink-0">
                                                    ₹{parseFloat(item.total || 0).toFixed(2)}
                                                </p>
                                                <p className="text-xs font-bold text-gray-400 dark:text-gray-500 mt-0.5">
                                                    ₹{parseFloat(item.product?.price || 0).toFixed(2)}/kg
                                                </p>
                                            </div>
                                        </div>
                                    ))}

                                    <div className="mt-4 pt-4 border-t-2 border-dashed border-gray-200 dark:border-gray-800 flex flex-col gap-2">
                                        <div className="flex justify-between text-sm font-bold text-gray-500 dark:text-gray-400">
                                            <span>Subtotal</span>
                                            <span>₹{cartSummary.subtotal.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm font-bold text-gray-500 dark:text-gray-400">
                                            <span>Delivery Charges</span>
                                            <span className="text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Free</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </section>

                        {/* ======================= DELIVERY ADDRESS ======================= */}
                        <section className="bg-white dark:bg-[#111812] rounded-[24px] border border-gray-100 dark:border-gray-800/60 p-6 sm:p-8 shadow-[0_4px_20px_rgb(0,0,0,0.02)]">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                    </div>
                                    <h2 className="text-xl font-black text-[#111812] dark:text-[#E8F3EB] tracking-tight">Delivery Address</h2>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowAddAddress(!showAddAddress)}
                                    className="text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2 rounded-xl"
                                >
                                    {showAddAddress ? "Cancel" : "+ Add New Address"}
                                </button>
                            </div>

                            {isAddressingLoading ? (
                                <div className="h-32 bg-gray-100 dark:bg-[#1A241A] rounded-[20px] animate-pulse" />
                            ) : addresses.length === 0 && !showAddAddress ? (
                                <div className="text-center py-8 bg-gray-50 dark:bg-[#1A241A] rounded-2xl border border-dashed border-gray-200 dark:border-gray-800/60">
                                    <p className="text-sm font-bold text-gray-500 dark:text-gray-400">
                                        No saved address found. Please add one to continue.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {addresses.map((addr) => (
                                        <label
                                            key={addr.id}
                                            className={`block rounded-[20px] border-2 p-5 cursor-pointer transition-all ${
                                                selectedAddressId === addr.id
                                                    ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10 shadow-sm"
                                                    : "border-gray-100 dark:border-gray-800/60 hover:border-emerald-200 dark:hover:border-emerald-800/50"
                                            }`}
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className="mt-1 relative flex items-center justify-center">
                                                    <input
                                                        type="radio"
                                                        name="selected_address"
                                                        className="peer appearance-none w-5 h-5 border-2 border-gray-300 dark:border-gray-600 rounded-full checked:border-emerald-500 checked:bg-emerald-500 transition-all cursor-pointer"
                                                        checked={selectedAddressId === addr.id}
                                                        onChange={() => setSelectedAddressId(addr.id)}
                                                    />
                                                    <div className="absolute w-2 h-2 bg-white rounded-full opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                                        <p className="font-black text-lg text-[#111812] dark:text-[#E8F3EB]">
                                                            {addr.full_name}
                                                        </p>
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/40 px-2 py-0.5 rounded-md">
                                                            {addr.address_type}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm font-medium text-[#111812] dark:text-gray-300 leading-relaxed mb-1">
                                                        {addr.address}, {addr.city}, {addr.state} - <span className="font-bold">{addr.pincode}</span>
                                                    </p>
                                                    <p className="text-sm font-bold text-gray-500 dark:text-gray-400">{addr.phone}</p>
                                                </div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            )}

                            {/* Add Address Form Snippet Retained from previous architecture */}
                            {showAddAddress && (
                                <form onSubmit={handleAddAddress} className="mt-8 border-t-2 border-dashed border-gray-100 dark:border-gray-800/60 pt-8 animate-in fade-in slide-in-from-top-4 duration-500">
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-6 flex items-center gap-2">
                                        Fill Address Details
                                    </h3>

                                    <div className="flex flex-wrap items-center gap-3 mb-6">
                                        <button
                                            type="button"
                                            onClick={handleUseMyLocation}
                                            disabled={isLocationFetching}
                                            className="inline-flex items-center gap-2 rounded-xl bg-[#111812] hover:bg-[#1A241A] dark:bg-emerald-600 dark:hover:bg-emerald-500 disabled:opacity-60 px-5 py-3.5 text-sm font-bold text-white transition-all shadow-sm active:scale-95 group"
                                        >
                                            {isLocationFetching ? "Fetching..." : (
                                                <>
                                                    <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                                    Use My Location
                                                </>
                                            )}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const nextValue = !showMapPicker;
                                                setShowMapPicker(nextValue);
                                                if (nextValue) {
                                                    setTimeout(() => initMapPicker(), 0);
                                                }
                                            }}
                                            className="inline-flex items-center gap-2 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 px-5 py-3 text-sm font-bold text-gray-700 dark:text-gray-200 transition-all active:scale-95 group"
                                        >
                                            <svg className="w-4 h-4 text-emerald-500 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
                                            {showMapPicker ? "Hide Map" : "Choose On Map"}
                                        </button>
                                    </div>

                                    {showMapPicker && (
                                        <div className="mb-8 animate-in zoom-in-95 duration-300">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-2">
                                                Tap on map to auto-fill address details
                                            </p>
                                            <div
                                                ref={mapRef}
                                                className="h-72 w-full rounded-[20px] border-4 border-gray-100 dark:border-gray-800/60 overflow-hidden shadow-sm"
                                            />
                                        </div>
                                    )}

                                    <div className="grid sm:grid-cols-2 gap-5 mb-5">
                                        <input type="text" name="full_name" value={addressForm.full_name} onChange={handleAddressInput} placeholder="Full Name" required className="w-full px-5 py-3.5 rounded-[16px] border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-[#1A241A] text-[#111812] dark:text-white font-medium focus:outline-none focus:ring-4 focus:ring-emerald-500/20" />
                                        <input type="text" name="phone" value={addressForm.phone} onChange={handleAddressInput} placeholder="Phone" required className="w-full px-5 py-3.5 rounded-[16px] border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-[#1A241A] text-[#111812] dark:text-white font-medium focus:outline-none focus:ring-4 focus:ring-emerald-500/20" />
                                        <textarea name="address" value={addressForm.address} onChange={handleAddressInput} placeholder="Street Address" required rows={2} className="col-span-2 w-full px-5 py-4 rounded-[16px] border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-[#1A241A] text-[#111812] dark:text-white font-medium focus:outline-none focus:ring-4 focus:ring-emerald-500/20 resize-none" />
                                        <input type="text" name="city" value={addressForm.city} onChange={handleAddressInput} placeholder="City" required className="w-full px-5 py-3.5 rounded-[16px] border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-[#1A241A] text-[#111812] dark:text-white font-medium focus:outline-none focus:ring-4 focus:ring-emerald-500/20" />
                                        <div className="flex gap-2">
                                           <input type="text" name="state" value={addressForm.state} onChange={handleAddressInput} placeholder="State" required className="w-1/2 px-5 py-3.5 rounded-[16px] border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-[#1A241A] text-[#111812] dark:text-white font-medium focus:outline-none focus:ring-4 focus:ring-emerald-500/20" />
                                           <input type="text" name="pincode" value={addressForm.pincode} onChange={handleAddressInput} placeholder="Pincode" required className="w-1/2 px-5 py-3.5 rounded-[16px] border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-[#1A241A] text-[#111812] dark:text-white font-medium focus:outline-none focus:ring-4 focus:ring-emerald-500/20" />
                                        </div>
                                    </div>
                                    <button type="submit" className="w-full bg-[#111812] dark:bg-emerald-600 text-white font-black py-4 rounded-[16px] active:scale-[0.98] transition-all">Save Address</button>
                                </form>
                            )}
                        </section>
                    </div>

                    {/* RIGHT COLUMN: Payment Section (40%) */}
                    <aside className="lg:col-span-5">
                        <div className="bg-white dark:bg-[#111812] rounded-[32px] border border-gray-100 dark:border-gray-800/60 p-6 sm:p-8 shadow-[0_4px_20px_rgb(0,0,0,0.02)] sticky top-[104px]">

                            {/* Break Down */}
                            <div className="bg-gray-50 dark:bg-[#1A241A]/50 rounded-[20px] p-6 mb-8 border border-gray-200/50 dark:border-gray-800">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-4">Price Breakdown</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center text-sm font-bold text-gray-600 dark:text-gray-400">
                                        <span>Subtotal</span>
                                        <span>{cartSummary ? `₹${cartSummary.subtotal.toFixed(2)}` : '—'}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm font-bold text-gray-600 dark:text-gray-400">
                                        <span>Delivery Charges</span>
                                        <span className="text-emerald-500 uppercase">FREE</span>
                                    </div>
                                    <div className="border-t-2 border-dashed border-gray-200 dark:border-gray-700/80 my-2"></div>
                                    <div className="flex justify-between items-end">
                                        <span className="text-sm font-black uppercase tracking-widest text-[#111812] dark:text-white">Total</span>
                                        <span className="text-3xl font-black text-[#111812] dark:text-white">
                                            {cartSummary ? `₹${cartSummary.total.toFixed(2)}` : '—'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <h2 className="text-xl font-black text-[#111812] dark:text-[#E8F3EB] tracking-tight mb-4 hidden lg:block">Payment Method</h2>
                            <p className="text-sm font-bold text-gray-500 mb-6 lg:hidden">Select Payment Method</p>

                            {/* Payment Method Selector */}
                            <div className="space-y-4 mb-8">
                                {/* UPI Option */}
                                <div className={`border-2 rounded-[20px] p-4 transition-all overflow-hidden ${selectedPaymentMethod === 'upi' ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-900/10' : 'border-gray-100 dark:border-gray-800/60 hover:border-emerald-200 hover:bg-gray-50/50 dark:hover:bg-[#1A241A]/50 cursor-pointer'}`} onClick={() => setSelectedPaymentMethod('upi')}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${selectedPaymentMethod === 'upi' ? 'border-emerald-500' : 'border-gray-300 dark:border-gray-600'}`}>
                                            {selectedPaymentMethod === 'upi' && <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full"/>}
                                        </div>
                                        <div className="flex-1 font-black text-[#111812] dark:text-white tracking-tight flex items-center gap-2">
                                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                            UPI Delivery
                                        </div>
                                    </div>
                                    {selectedPaymentMethod === 'upi' && (
                                        <div className="mt-4 pt-4 border-t border-emerald-100 dark:border-emerald-800/50 animate-in fade-in slide-in-from-top-2">
                                            <input type="text" value={upiForm} onChange={e => {setUpiForm(e.target.value); setPaymentError(null);}} placeholder="yourname@upi" className="w-full px-5 py-3 rounded-[12px] border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#111812] text-sm font-bold focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" />
                                        </div>
                                    )}
                                </div>

                                {/* Card Option */}
                                <div className={`border-2 rounded-[20px] p-4 transition-all overflow-hidden ${selectedPaymentMethod === 'card' ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-900/10' : 'border-gray-100 dark:border-gray-800/60 hover:border-emerald-200 hover:bg-gray-50/50 dark:hover:bg-[#1A241A]/50 cursor-pointer'}`} onClick={() => setSelectedPaymentMethod('card')}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${selectedPaymentMethod === 'card' ? 'border-emerald-500' : 'border-gray-300 dark:border-gray-600'}`}>
                                            {selectedPaymentMethod === 'card' && <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full"/>}
                                        </div>
                                        <div className="flex-1 font-black text-[#111812] dark:text-white tracking-tight flex items-center gap-2">
                                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                                            Credit / Debit Card
                                        </div>
                                    </div>
                                    {selectedPaymentMethod === 'card' && (
                                        <div className="mt-4 pt-4 border-t border-emerald-100 dark:border-emerald-800/50 animate-in fade-in slide-in-from-top-2 grid grid-cols-2 gap-3">
                                            <input type="text" value={cardForm.number} onChange={e => {setCardForm({...cardForm, number: formatCardNumber(e.target.value)}); setPaymentError(null);}} placeholder="XXXX XXXX XXXX XXXX" maxLength="19" className="col-span-2 px-4 py-3 rounded-[12px] border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#111812] text-sm font-mono focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" />
                                            <input type="text" value={cardForm.name} onChange={e => {setCardForm({...cardForm, name: e.target.value.toUpperCase()}); setPaymentError(null);}} placeholder="Cardholder Name" className="col-span-2 px-4 py-3 rounded-[12px] border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#111812] text-sm font-bold uppercase focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" />
                                            <input type="text" value={cardForm.expiry} onChange={e => {setCardForm({...cardForm, expiry: e.target.value}); setPaymentError(null);}} placeholder="MM/YY" maxLength="5" className="px-4 py-3 rounded-[12px] border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#111812] text-sm font-mono focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" />
                                            <input type="password" value={cardForm.cvv} onChange={e => {setCardForm({...cardForm, cvv: e.target.value.replace(/\D/g, '')}); setPaymentError(null);}} placeholder="CVV" maxLength="3" className="px-4 py-3 rounded-[12px] border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#111812] text-sm font-mono focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" />
                                        </div>
                                    )}
                                </div>

                                {/* NetBanking Option */}
                                <div className={`border-2 rounded-[20px] p-4 transition-all overflow-hidden ${selectedPaymentMethod === 'netbanking' ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-900/10' : 'border-gray-100 dark:border-gray-800/60 hover:border-emerald-200 hover:bg-gray-50/50 dark:hover:bg-[#1A241A]/50 cursor-pointer'}`} onClick={() => setSelectedPaymentMethod('netbanking')}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${selectedPaymentMethod === 'netbanking' ? 'border-emerald-500' : 'border-gray-300 dark:border-gray-600'}`}>
                                            {selectedPaymentMethod === 'netbanking' && <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full"/>}
                                        </div>
                                        <div className="flex-1 font-black text-[#111812] dark:text-white tracking-tight flex items-center gap-2">
                                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" /><path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18" /></svg>
                                            Net Banking
                                        </div>
                                    </div>
                                    {selectedPaymentMethod === 'netbanking' && (
                                        <div className="mt-4 pt-4 border-t border-emerald-100 dark:border-emerald-800/50 animate-in fade-in slide-in-from-top-2">
                                            <select value={netBankingBank} onChange={e => {setNetBankingBank(e.target.value); setPaymentError(null);}} className="w-full px-5 py-3 rounded-[12px] border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#111812] text-sm font-bold focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none appearance-none cursor-pointer">
                                                <option value="" disabled>Select your Bank</option>
                                                <option value="sbi">State Bank of India</option>
                                                <option value="icici">ICICI Bank</option>
                                                <option value="hdfc">HDFC Bank</option>
                                                <option value="axis">Axis Bank</option>
                                                <option value="kotak">Kotak Mahindra</option>
                                                <option value="other">Other Banks</option>
                                            </select>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Pay Button */}
                            <button
                                onClick={handlePayment}
                                disabled={paymentLoading || !isPaymentFormValid()}
                                className={`w-full py-5 px-6 rounded-[20px] shadow-sm transition-all flex items-center justify-center gap-2 font-black text-lg ${
                                    paymentLoading || !isPaymentFormValid()
                                        ? "bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-70"
                                        : "bg-emerald-600 hover:bg-emerald-500 text-white active:scale-[0.98]"
                                }`}
                            >
                                {paymentLoading ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        Pay {cartSummary ? `₹${cartSummary.total.toFixed(2)}` : '₹—'}
                                        <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                    </>
                                )}
                            </button>

                            {/* Error Inline Message */}
                            {paymentError && (
                                <p className="mt-4 text-center text-sm font-bold text-red-500 animate-in fade-in slide-in-from-top-1">
                                    {paymentError}
                                </p>
                            )}

                            <p className="mt-6 text-center flex items-center justify-center gap-1.5 text-[10px] uppercase font-black tracking-widest text-gray-400 dark:text-gray-600">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                SSL Secured Payment
                            </p>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
};

export default Checkout;
