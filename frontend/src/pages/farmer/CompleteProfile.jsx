import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

const isFarmerProfileComplete = (profile, bankDetails) => {
  const hasCoordinates = Boolean(profile?.latitude) && Boolean(profile?.longitude);
  const hasGender = Boolean(profile?.gender);
  const hasPayout = Array.isArray(bankDetails) && bankDetails.length > 0;
  return hasCoordinates && hasGender && hasPayout;
};

const CompleteProfile = () => {
  const { updateLocationInContext } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [locationTab, setLocationTab] = useState("detect");
  const [payoutType, setPayoutType] = useState("");
  const [geoLoading, setGeoLoading] = useState(false);
  const [leafletReady, setLeafletReady] = useState(false);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [hasExistingPayout, setHasExistingPayout] = useState(false);

  const [form, setForm] = useState({
    gender: "",
    location: "",
    latitude: "",
    longitude: "",
    account_holder_name: "",
    bank_name: "",
    account_number: "",
    ifsc_code: "",
    upi_id: "",
  });

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        const [profileRes, bankRes] = await Promise.all([
          api.get("/auth/farmer/profile/"),
          api.get("/auth/farmer/bank-details/").catch(() => ({ data: [] })),
        ]);

        const profile = profileRes.data || {};
        const bankDetails = Array.isArray(bankRes.data) ? bankRes.data : [];

        if (!mounted) return;

        if (isFarmerProfileComplete(profile, bankDetails)) {
          navigate("/farmer/dashboard", { replace: true });
          return;
        }

        const primary = bankDetails.find((item) => item.is_primary) || bankDetails[0] || {};
        setHasExistingPayout(bankDetails.length > 0);
        setPayoutType(primary.type || "");
        setForm({
          gender: profile.gender || "",
          location: profile.location || "",
          latitude: profile.latitude ? String(profile.latitude) : "",
          longitude: profile.longitude ? String(profile.longitude) : "",
          account_holder_name: primary.account_holder_name || "",
          bank_name: primary.bank_name || "",
          account_number: "",
          ifsc_code: primary.ifsc_code || "",
          upi_id: primary.upi_id || "",
        });
      } catch {
        if (mounted) setError("Unable to load farmer profile.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    init();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  useEffect(() => {
    const loadLeaflet = async () => {
      if (window.L) {
        setLeafletReady(true);
        return;
      }

      const cssId = "leaflet-css-farmer-complete";
      if (!document.getElementById(cssId)) {
        const link = document.createElement("link");
        link.id = cssId;
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }

      const existingScript = document.getElementById("leaflet-js-farmer-complete");
      if (existingScript) {
        existingScript.addEventListener("load", () => setLeafletReady(true), { once: true });
        return;
      }

      const script = document.createElement("script");
      script.id = "leaflet-js-farmer-complete";
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

  useEffect(() => {
    if (locationTab !== "map" || !leafletReady || !window.L || !mapRef.current) {
      return;
    }

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const L = window.L;
    const lat = Number(form.latitude) || 20.5937;
    const lng = Number(form.longitude) || 78.9629;
    const zoom = form.latitude && form.longitude ? 13 : 5;

    const map = L.map(mapRef.current).setView([lat, lng], zoom);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    const marker = L.marker([lat, lng], { draggable: true }).addTo(map);

    const setFromMap = async (nextLat, nextLng) => {
      const locationLabel = await reverseGeocode(nextLat, nextLng);
      setForm((prev) => ({
        ...prev,
        latitude: nextLat.toFixed(6),
        longitude: nextLng.toFixed(6),
        location: locationLabel || `Lat ${nextLat.toFixed(5)}, Lng ${nextLng.toFixed(5)}`,
      }));
    };

    marker.on("dragend", async (event) => {
      const pos = event.target.getLatLng();
      await setFromMap(pos.lat, pos.lng);
    });

    map.on("click", async (event) => {
      const { lat: nextLat, lng: nextLng } = event.latlng;
      marker.setLatLng([nextLat, nextLng]);
      await setFromMap(nextLat, nextLng);
    });

    mapInstanceRef.current = map;
    setTimeout(() => map.invalidateSize(), 0);
  }, [leafletReady, locationTab, form.latitude, form.longitude]);

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
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
      );
      if (!response.ok) return "";
      const data = await response.json();
      return data?.display_name || "";
    } catch {
      return "";
    }
  };

  const detectLocation = async () => {
    setGeoLoading(true);
    setError("");
    try {
      const pos = await getCurrentPosition();
      const latitude = pos.coords.latitude;
      const longitude = pos.coords.longitude;
      const locationLabel = await reverseGeocode(latitude, longitude);

      setForm((prev) => ({
        ...prev,
        latitude: latitude.toFixed(6),
        longitude: longitude.toFixed(6),
        location: locationLabel || `Lat ${latitude.toFixed(5)}, Lng ${longitude.toFixed(5)}`,
      }));
    } catch {
      setError("Unable to detect location. Please set location manually or from map.");
    } finally {
      setGeoLoading(false);
    }
  };

  const validate = () => {
    const lat = Number(form.latitude);
    const lng = Number(form.longitude);
    const hasBank =
      form.account_holder_name.trim() &&
      form.bank_name.trim() &&
      form.account_number.trim() &&
      form.ifsc_code.trim();
    const hasUpi = form.upi_id.trim();

    if (!form.gender) return "Please select your gender.";

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return "Please enter valid latitude and longitude.";
    }
    if (lat < -90 || lat > 90) {
      return "Latitude must be between -90 and 90.";
    }
    if (lng < -180 || lng > 180) {
      return "Longitude must be between -180 and 180.";
    }
    if (!hasExistingPayout && !payoutType) {
      return "Please select Bank Details or UPI Details.";
    }
    if (payoutType === "bank" && !hasBank) {
      return "Please fill all required bank details.";
    }
    if (payoutType === "upi" && !hasUpi) {
      return "Please enter your UPI ID.";
    }

    return "";
  };

  const completeProfile = async () => {
    setError("");
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    const hasBank =
      form.account_holder_name.trim() &&
      form.bank_name.trim() &&
      form.account_number.trim() &&
      form.ifsc_code.trim();
    const hasUpi = form.upi_id.trim();

    try {
      setSubmitting(true);
      const payload = new FormData();
      payload.append("gender", form.gender);
      payload.append("location", form.location || `Lat ${form.latitude}, Lng ${form.longitude}`);
      payload.append("latitude", form.latitude);
      payload.append("longitude", form.longitude);

      await api.patch("/auth/farmer/profile/", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (payoutType === "bank" && hasBank) {
        await api.post("/auth/farmer/bank-details/", {
          type: "bank",
          account_holder_name: form.account_holder_name,
          bank_name: form.bank_name,
          account_number: form.account_number,
          ifsc_code: form.ifsc_code.toUpperCase(),
          is_primary: !hasUpi,
        });
      }

      if (payoutType === "upi" && hasUpi) {
        await api.post("/auth/farmer/bank-details/", {
          type: "upi",
          upi_id: form.upi_id,
          is_primary: true,
        });
      }

      updateLocationInContext(form.latitude, form.longitude);
      navigate("/farmer/dashboard", { replace: true });
    } catch (err) {
      const detail = err?.response?.data?.detail;
      if (detail) {
        setError(detail);
        return;
      }
      const firstFieldError = err?.response?.data && typeof err.response.data === "object"
        ? Object.values(err.response.data)[0]
        : "";
      setError(Array.isArray(firstFieldError) ? firstFieldError[0] : firstFieldError || "Failed to complete profile. Please retry.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] dark:bg-[#0A0F0D] py-16 px-4 md:px-8 transition-colors duration-500">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="h-12 w-80 bg-gray-200 dark:bg-[#1A241A] rounded-2xl animate-pulse" />
          <div className="h-[520px] bg-white dark:bg-[#111812] border border-gray-100 dark:border-gray-800/60 rounded-[28px] animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] dark:bg-[#0A0F0D] py-12 transition-colors duration-500 font-sans">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h1 className="text-4xl sm:text-5xl font-black text-[#111812] dark:text-[#E8F3EB] tracking-tight mb-2">Complete Farmer Profile</h1>
          <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">Add gender, farm location, and payout details to start selling.</p>
        </div>

        <div className="bg-white dark:bg-[#111812] border border-gray-100 dark:border-gray-800 rounded-[28px] p-6 sm:p-8 md:p-10 shadow-[0_4px_20px_rgba(0,0,0,0.02)] space-y-8">
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 rounded-xl text-red-700 dark:text-red-400 text-sm font-semibold">
              {error}
            </div>
          )}

          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Gender</label>
            <select
              value={form.gender}
              onChange={(e) => setForm((prev) => ({ ...prev, gender: e.target.value }))}
              className="mt-2 w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#1A241A] border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:border-emerald-500"
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <h2 className="text-xl font-black text-[#111812] dark:text-[#E8F3EB] mb-4">Farm Location</h2>
            <div className="flex flex-wrap gap-2 mb-6">
              {[
                { key: "detect", label: "Detect Current Location" },
                { key: "map", label: "Choose on Map" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setLocationTab(tab.key)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${locationTab === tab.key ? "bg-emerald-600 text-white" : "bg-gray-100 dark:bg-[#1A241A] text-gray-700 dark:text-gray-300"}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {locationTab === "detect" && (
              <div className="bg-gray-50 dark:bg-[#1A241A] border border-gray-200 dark:border-gray-800 rounded-2xl p-5 mb-6">
                <button
                  type="button"
                  onClick={detectLocation}
                  disabled={geoLoading}
                  className="bg-[#111812] hover:bg-[#1A241A] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-bold px-6 py-2.5 rounded-xl disabled:opacity-70"
                >
                  {geoLoading ? "Detecting..." : "Detect Current Location"}
                </button>
              </div>
            )}

            {locationTab === "map" && (
              <div className="bg-gray-50 dark:bg-[#1A241A] border border-gray-200 dark:border-gray-800 rounded-2xl p-4 mb-6">
                <div ref={mapRef} className="w-full h-[320px] rounded-xl overflow-hidden" />
                <p className="text-xs text-gray-500 mt-3">Tap map or drag marker to set exact farm location.</p>
              </div>
            )}

            <div className="mt-5">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Detected Location</label>
              <div className="mt-2 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#1A241A] text-gray-800 dark:text-gray-200 text-sm">
                {form.location || "Location not selected yet."}
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-black text-[#111812] dark:text-[#E8F3EB] mb-4">Payout Details</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Select one payout method and fill details.</p>
            <div className="flex flex-wrap gap-2 mb-5">
              {[
                { key: "bank", label: "Bank Details" },
                { key: "upi", label: "UPI Details" },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setPayoutType(item.key)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${payoutType === item.key ? "bg-emerald-600 text-white" : "bg-gray-100 dark:bg-[#1A241A] text-gray-700 dark:text-gray-300"}`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {payoutType === "bank" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <input
                  type="text"
                  placeholder="Account Holder Name"
                  value={form.account_holder_name}
                  onChange={(e) => setForm((prev) => ({ ...prev, account_holder_name: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#1A241A] border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:border-emerald-500"
                />
                <input
                  type="text"
                  placeholder="Bank Name"
                  value={form.bank_name}
                  onChange={(e) => setForm((prev) => ({ ...prev, bank_name: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#1A241A] border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:border-emerald-500"
                />
                <input
                  type="text"
                  placeholder="Account Number"
                  value={form.account_number}
                  onChange={(e) => setForm((prev) => ({ ...prev, account_number: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#1A241A] border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:border-emerald-500"
                />
                <input
                  type="text"
                  placeholder="IFSC Code"
                  value={form.ifsc_code}
                  onChange={(e) => setForm((prev) => ({ ...prev, ifsc_code: e.target.value.toUpperCase() }))}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#1A241A] border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:border-emerald-500"
                />
              </div>
            )}

            {payoutType === "upi" && (
              <input
                type="text"
                placeholder="UPI ID (example@upi)"
                value={form.upi_id}
                onChange={(e) => setForm((prev) => ({ ...prev, upi_id: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#1A241A] border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:border-emerald-500"
              />
            )}

            {!payoutType && (
              <p className="text-sm text-gray-500 dark:text-gray-400">Choose Bank Details or UPI Details to continue.</p>
            )}
            {hasExistingPayout && !payoutType && (
              <p className="text-xs mt-2 text-emerald-600 dark:text-emerald-400">Existing payout method found. You can keep it or add a new one.</p>
            )}
          </div>

          <div className="pt-1">
            <button
              type="button"
              onClick={completeProfile}
              disabled={submitting}
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-black px-8 py-3 rounded-xl disabled:opacity-70"
            >
              {submitting ? "Saving..." : "Complete Profile"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompleteProfile;
