import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

const steps = ["Personal Info", "Location", "Vehicle Details", "Bank / UPI Details"];

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const CompleteProfile = () => {
  const { user, updateLocationInContext } = useAuth();
  const navigate = useNavigate();

  const [activeStep, setActiveStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successDone, setSuccessDone] = useState(false);

  const [personal, setPersonal] = useState({
    fullName: "",
    phone: "",
    bio: "",
    picture: null,
    picturePreview: "",
  });

  const [locationTab, setLocationTab] = useState("detect");
  const [locationForm, setLocationForm] = useState({
    latitude: "",
    longitude: "",
  });
  const [selectedAddress, setSelectedAddress] = useState("Location not selected yet.");
  const [geoLoading, setGeoLoading] = useState(false);
  const [leafletReady, setLeafletReady] = useState(false);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  const [vehicle, setVehicle] = useState({
    vehicle_number: "",
    driving_license: null,
    vehicle_rc: null,
  });

  const [bankDetails, setBankDetails] = useState({
    account_holder_name: "",
    bank_name: "",
    account_number: "",
    ifsc_code: "",
    upi_id: "",
  });
  const [payoutType, setPayoutType] = useState("");

  const hasBank = useMemo(() => {
    return (
      bankDetails.account_holder_name.trim() &&
      bankDetails.bank_name.trim() &&
      bankDetails.account_number.trim() &&
      bankDetails.ifsc_code.trim()
    );
  }, [bankDetails]);

  const hasUpi = useMemo(() => bankDetails.upi_id.trim(), [bankDetails]);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        const statusRes = await api.get("/delivery/me/", { withCredentials: true });
        if (statusRes.data?.is_profile_complete) {
          navigate("/delivery/dashboard", { replace: true });
          return;
        }

        const profileRes = await api.get("/delivery/me/", { withCredentials: true });
        const profile = profileRes.data || {};
        if (!mounted) return;

        setPersonal((prev) => ({
          ...prev,
          fullName: `${profile.first_name || user?.first_name || ""} ${profile.last_name || user?.last_name || ""}`.trim(),
          phone: profile.phone_number || user?.phone || "",
          bio: profile.bio || "",
          picturePreview: profile.profile_picture || "",
        }));

        setLocationForm({
          latitude: profile.latitude ? String(profile.latitude) : "",
          longitude: profile.longitude ? String(profile.longitude) : "",
        });

        setVehicle((prev) => ({
          ...prev,
          vehicle_number: profile.vehicle_number || "",
        }));
      } catch {
        if (mounted) {
          setPersonal((prev) => ({
            ...prev,
            fullName: `${user?.first_name || ""} ${user?.last_name || ""}`.trim(),
            phone: user?.phone || "",
          }));
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    init();

    return () => {
      mounted = false;
    };
  }, [navigate, user]);

  useEffect(() => {
    const loadLeaflet = async () => {
      if (window.L) {
        setLeafletReady(true);
        return;
      }

      const cssId = "leaflet-css-delivery";
      if (!document.getElementById(cssId)) {
        const link = document.createElement("link");
        link.id = cssId;
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }

      const existingScript = document.getElementById("leaflet-js-delivery");
      if (existingScript) {
        existingScript.addEventListener("load", () => setLeafletReady(true), { once: true });
        return;
      }

      const script = document.createElement("script");
      script.id = "leaflet-js-delivery";
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
    if (activeStep !== 2 || locationTab !== "map" || !leafletReady || !window.L || !mapRef.current) {
      return;
    }

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const L = window.L;
    const lat = Number(locationForm.latitude) || 20.5937;
    const lng = Number(locationForm.longitude) || 78.9629;
    const zoom = locationForm.latitude && locationForm.longitude ? 13 : 5;

    const map = L.map(mapRef.current).setView([lat, lng], zoom);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    const marker = L.marker([lat, lng], { draggable: true }).addTo(map);

    marker.on("dragend", (event) => {
      const pos = event.target.getLatLng();
      setLocationForm({ latitude: pos.lat.toFixed(6), longitude: pos.lng.toFixed(6) });
    });

    map.on("click", (event) => {
      const { lat: nextLat, lng: nextLng } = event.latlng;
      marker.setLatLng([nextLat, nextLng]);
      setLocationForm({ latitude: nextLat.toFixed(6), longitude: nextLng.toFixed(6) });
    });

    mapInstanceRef.current = map;
  }, [activeStep, leafletReady, locationForm.latitude, locationForm.longitude, locationTab]);

  useEffect(() => {
    const lat = Number(locationForm.latitude);
    const lng = Number(locationForm.longitude);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      setSelectedAddress("Location not selected yet.");
      return;
    }

    const controller = new AbortController();

    const loadAddress = async () => {
      try {
        setSelectedAddress("Fetching selected address...");
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
          {
            signal: controller.signal,
            headers: { Accept: "application/json" },
          }
        );
        if (!response.ok) throw new Error("Failed to fetch address");
        const data = await response.json();
        setSelectedAddress(data?.display_name || "Address not available.");
      } catch {
        if (!controller.signal.aborted) {
          setSelectedAddress("Address not available.");
        }
      }
    };

    loadAddress();
    return () => controller.abort();
  }, [locationForm.latitude, locationForm.longitude]);

  const updateProfileStatus = async (field, value) => {
    return Promise.resolve({ field, value });
  };

  const onPictureChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setPersonal((prev) => ({
      ...prev,
      picture: file,
      picturePreview: URL.createObjectURL(file),
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

  const detectLocation = async () => {
    setGeoLoading(true);
    setError("");
    try {
      const pos = await getCurrentPosition();
      setLocationForm({
        latitude: pos.coords.latitude.toFixed(6),
        longitude: pos.coords.longitude.toFixed(6),
      });
    } catch {
      setError("Unable to detect current location. Please try map selection.");
    } finally {
      setGeoLoading(false);
    }
  };

  const validateStep1 = () => {
    if (!personal.fullName.trim()) return "Full name is required.";
    if (!/^\d{10}$/.test(personal.phone.trim())) return "Phone number must be 10 digits.";
    if ((personal.bio || "").trim().length < 20) return "Bio must be at least 20 characters.";
    return "";
  };

  const validateStep2 = () => {
    const lat = Number(locationForm.latitude);
    const lng = Number(locationForm.longitude);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return "Please provide valid latitude and longitude.";
    return "";
  };

  const validateStep3 = () => {
    if (!vehicle.vehicle_number.trim()) return "Vehicle number is required.";
    if (!vehicle.driving_license) return "Driving license file is required.";
    if (!vehicle.vehicle_rc) return "Vehicle RC file is required.";
    if (vehicle.driving_license.size > MAX_FILE_SIZE) return "Driving license file must be under 5MB.";
    if (vehicle.vehicle_rc.size > MAX_FILE_SIZE) return "Vehicle RC file must be under 5MB.";
    return "";
  };

  const saveStep1 = async () => {
    const formData = new FormData();
    const name = personal.fullName.trim();
    const nameParts = name.split(/\s+/);
    const firstName = nameParts.shift() || "";
    const lastName = nameParts.join(" ");

    formData.append("first_name", firstName);
    formData.append("last_name", lastName);
    formData.append("phone_number", personal.phone.trim());
    formData.append("bio", personal.bio.trim());
    if (personal.picture) {
      formData.append("profile_picture", personal.picture);
    }

    await api.patch("/delivery/me/", formData, {
      withCredentials: true,
      headers: { "Content-Type": "multipart/form-data" },
    });
  };

  const saveStep2 = async () => {
    await api.patch(
      "/delivery/me/",
      {
        latitude: locationForm.latitude,
        longitude: locationForm.longitude,
      },
      { withCredentials: true }
    );
    updateLocationInContext(locationForm.latitude, locationForm.longitude);
    await updateProfileStatus("location_set", true);
  };

  const saveStep3 = async () => {
    const formData = new FormData();
    formData.append("vehicle_number", vehicle.vehicle_number.trim().toUpperCase());
    formData.append("driving_license", vehicle.driving_license);
    formData.append("vehicle_rc", vehicle.vehicle_rc);

    await api.patch("/delivery/me/", formData, {
      withCredentials: true,
      headers: { "Content-Type": "multipart/form-data" },
    });
    await updateProfileStatus("vehicle_details_added", true);
  };

  const saveStep4 = async () => {
    if (!payoutType) {
      throw new Error("Select one payout method first: Bank Details or UPI.");
    }

    if (payoutType === "bank") {
      if (!hasBank) {
        throw new Error("Please fill all required bank details.");
      }
      await api.post(
        "/delivery/bank-details/",
        {
          type: "bank",
          account_holder_name: bankDetails.account_holder_name || "",
          bank_name: bankDetails.bank_name || "",
          account_number: bankDetails.account_number || "",
          ifsc_code: bankDetails.ifsc_code || "",
          is_primary: true,
        },
        { withCredentials: true }
      );
    }

    if (payoutType === "upi") {
      if (!hasUpi) {
        throw new Error("Please enter a valid UPI ID.");
      }
      await api.post(
        "/delivery/bank-details/",
        {
          type: "upi",
          upi_id: bankDetails.upi_id || "",
          is_primary: true,
        },
        { withCredentials: true }
      );
    }
    await updateProfileStatus("bank_details_added", true);
  };

  const handleNext = async () => {
    setError("");
    setSubmitting(true);
    try {
      if (activeStep === 1) {
        const validation = validateStep1();
        if (validation) throw new Error(validation);
        await saveStep1();
        setActiveStep(2);
      } else if (activeStep === 2) {
        const validation = validateStep2();
        if (validation) throw new Error(validation);
        await saveStep2();
        setActiveStep(3);
      } else if (activeStep === 3) {
        const validation = validateStep3();
        if (validation) throw new Error(validation);
        await saveStep3();
        setActiveStep(4);
      } else {
        await saveStep4();
        setSuccessDone(true);
        setTimeout(() => navigate("/delivery/dashboard", { replace: true }), 2000);
      }
    } catch (e) {
      setError(e?.response?.data?.detail || e?.message || "Unable to save. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const onVehicleFile = (key, file) => {
    if (!file) return;
    setVehicle((prev) => ({ ...prev, [key]: file }));
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

  if (successDone) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7] dark:bg-[#0A0F0D] px-4">
        <div className="max-w-xl w-full bg-white dark:bg-[#111812] border border-gray-100 dark:border-gray-800/60 rounded-[28px] p-10 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none">
          <div className="text-6xl mb-4 animate-bounce">🚚</div>
          <h1 className="text-3xl font-black text-[#111812] dark:text-[#E8F3EB] tracking-tight mb-3">You’re all set!</h1>
          <p className="text-gray-500 dark:text-gray-400 text-lg">Welcome to GrowEasy Delivery 🚚</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] dark:bg-[#0A0F0D] py-12 transition-colors duration-500 font-sans">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h1 className="text-4xl sm:text-5xl font-black text-[#111812] dark:text-[#E8F3EB] tracking-tight mb-2">Complete Delivery Profile</h1>
          <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">Finish your setup to start accepting delivery orders.</p>
        </div>

        <div className="bg-white dark:bg-[#111812] border border-gray-100 dark:border-gray-800 rounded-[28px] p-6 sm:p-8 md:p-10 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
            {steps.map((label, index) => {
              const stepNo = index + 1;
              const active = stepNo === activeStep;
              const done = stepNo < activeStep;
              return (
                <div
                  key={label}
                  className={`rounded-2xl border px-3 py-3 text-center transition-all ${
                    active
                      ? "border-emerald-300 dark:border-emerald-500/40 bg-emerald-50 dark:bg-emerald-900/20"
                      : done
                      ? "border-emerald-200 dark:border-emerald-700/40 bg-emerald-50/60 dark:bg-emerald-900/10"
                      : "border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-[#1A241A]"
                  }`}
                >
                  <div className={`w-8 h-8 mx-auto mb-2 rounded-full flex items-center justify-center text-sm font-black ${done || active ? "bg-emerald-600 text-white" : "bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300"}`}>
                    {stepNo}
                  </div>
                  <p className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">{label}</p>
                </div>
              );
            })}
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 rounded-xl text-red-700 dark:text-red-400 text-sm font-semibold">
              {error}
            </div>
          )}

          {activeStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-black text-[#111812] dark:text-[#E8F3EB] tracking-tight">Step 1: Personal Info</h2>

              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-700/20 overflow-hidden flex items-center justify-center">
                  {personal.picturePreview ? (
                    <img src={personal.picturePreview} alt="profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl">👤</span>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Profile Picture</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={onPictureChange}
                    className="block text-sm text-gray-700 dark:text-gray-300 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-emerald-600 file:text-white file:font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Full Name</label>
                  <input
                    type="text"
                    value={personal.fullName}
                    onChange={(e) => setPersonal((prev) => ({ ...prev, fullName: e.target.value }))}
                    className="mt-2 w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#1A241A] border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Phone Number</label>
                  <input
                    type="tel"
                    value={personal.phone}
                    onChange={(e) => setPersonal((prev) => ({ ...prev, phone: e.target.value.replace(/\D/g, "").slice(0, 10) }))}
                    className="mt-2 w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#1A241A] border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Bio</label>
                <textarea
                  rows={5}
                  value={personal.bio}
                  onChange={(e) => setPersonal((prev) => ({ ...prev, bio: e.target.value }))}
                  className="mt-2 w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#1A241A] border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:border-emerald-500"
                />
                <p className="text-xs text-gray-500 mt-2">Minimum 20 characters.</p>
              </div>
            </div>
          )}

          {activeStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-black text-[#111812] dark:text-[#E8F3EB] tracking-tight">Step 2: Location</h2>

              <div className="flex flex-wrap gap-2">
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
                <div className="bg-gray-50 dark:bg-[#1A241A] border border-gray-200 dark:border-gray-800 rounded-2xl p-5 space-y-4">
                  <p className="text-sm text-gray-600 dark:text-gray-300">Use your browser location to auto-fill latitude and longitude.</p>
                  <button
                    type="button"
                    onClick={detectLocation}
                    disabled={geoLoading}
                    className="bg-[#111812] hover:bg-[#1A241A] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-bold px-6 py-2.5 rounded-xl"
                  >
                    {geoLoading ? "Detecting..." : "Detect Current Location"}
                  </button>
                </div>
              )}

              {locationTab === "map" && (
                <div className="bg-gray-50 dark:bg-[#1A241A] border border-gray-200 dark:border-gray-800 rounded-2xl p-4">
                  <div ref={mapRef} className="w-full h-[320px] rounded-xl overflow-hidden" />
                  <p className="text-xs text-gray-500 mt-3">Tap map to place pin or drag marker to exact point.</p>
                </div>
              )}

              <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#1A241A] px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Selected Address</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 break-words">{selectedAddress}</p>
              </div>
            </div>
          )}

          {activeStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-black text-[#111812] dark:text-[#E8F3EB] tracking-tight">Step 3: Vehicle Details</h2>
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Vehicle Number</label>
                <input
                  type="text"
                  value={vehicle.vehicle_number}
                  onChange={(e) => setVehicle((prev) => ({ ...prev, vehicle_number: e.target.value.toUpperCase() }))}
                  className="mt-2 w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#1A241A] border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:border-emerald-500"
                  placeholder="MH12AB1234"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Driving License (PDF/Image)</label>
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    onChange={(e) => onVehicleFile("driving_license", e.target.files?.[0])}
                    className="mt-2 block w-full text-sm text-gray-700 dark:text-gray-300 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-emerald-600 file:text-white file:font-semibold"
                  />
                  {vehicle.driving_license && <p className="text-xs text-gray-500 mt-2">{vehicle.driving_license.name}</p>}
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Vehicle RC (PDF/Image)</label>
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    onChange={(e) => onVehicleFile("vehicle_rc", e.target.files?.[0])}
                    className="mt-2 block w-full text-sm text-gray-700 dark:text-gray-300 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-emerald-600 file:text-white file:font-semibold"
                  />
                  {vehicle.vehicle_rc && <p className="text-xs text-gray-500 mt-2">{vehicle.vehicle_rc.name}</p>}
                </div>
              </div>
              <p className="text-xs text-gray-500">Each file must be less than 5MB.</p>
            </div>
          )}

          {activeStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-black text-[#111812] dark:text-[#E8F3EB] tracking-tight">Step 4: Bank / UPI Details</h2>

              <div className="flex flex-wrap gap-2">
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

              {!payoutType && (
                <p className="text-sm text-gray-500 dark:text-gray-400">Select one payout method to continue.</p>
              )}

              {payoutType === "bank" && (
                <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-5 bg-gray-50 dark:bg-[#1A241A]">
                  <h3 className="text-lg font-black text-[#111812] dark:text-[#E8F3EB] mb-4">Bank Account</h3>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Account Holder Name"
                      value={bankDetails.account_holder_name}
                      onChange={(e) => setBankDetails((prev) => ({ ...prev, account_holder_name: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl bg-white dark:bg-[#111812] border border-gray-200 dark:border-gray-800"
                    />
                    <input
                      type="text"
                      placeholder="Bank Name"
                      value={bankDetails.bank_name}
                      onChange={(e) => setBankDetails((prev) => ({ ...prev, bank_name: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl bg-white dark:bg-[#111812] border border-gray-200 dark:border-gray-800"
                    />
                    <input
                      type="text"
                      placeholder="Account Number"
                      value={bankDetails.account_number}
                      onChange={(e) => setBankDetails((prev) => ({ ...prev, account_number: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl bg-white dark:bg-[#111812] border border-gray-200 dark:border-gray-800"
                    />
                    <input
                      type="text"
                      placeholder="IFSC Code"
                      value={bankDetails.ifsc_code}
                      onChange={(e) => setBankDetails((prev) => ({ ...prev, ifsc_code: e.target.value.toUpperCase() }))}
                      className="w-full px-4 py-3 rounded-xl bg-white dark:bg-[#111812] border border-gray-200 dark:border-gray-800"
                    />
                  </div>
                </div>
              )}

              {payoutType === "upi" && (
                <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-5 bg-gray-50 dark:bg-[#1A241A]">
                  <h3 className="text-lg font-black text-[#111812] dark:text-[#E8F3EB] mb-4">UPI</h3>
                  <input
                    type="text"
                    placeholder="yourname@upi"
                    value={bankDetails.upi_id}
                    onChange={(e) => setBankDetails((prev) => ({ ...prev, upi_id: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-white dark:bg-[#111812] border border-gray-200 dark:border-gray-800"
                  />
                </div>
              )}
            </div>
          )}

          <div className="mt-10 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setActiveStep((prev) => Math.max(1, prev - 1))}
              disabled={activeStep === 1 || submitting}
              className="px-5 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold disabled:opacity-40"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={submitting}
              className="px-6 py-3 rounded-xl bg-[#111812] hover:bg-[#1A241A] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-black disabled:opacity-70"
            >
              {submitting ? "Saving..." : activeStep === 4 ? "Complete Profile" : "Save & Continue"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompleteProfile;
