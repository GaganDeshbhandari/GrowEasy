import { useEffect, useMemo, useRef, useState } from "react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

const DeliveryProfile = () => {
  const { updateLocationInContext } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [editing, setEditing] = useState({
    personal: false,
    location: false,
    vehicle: false,
    bank: false,
  });
  const [locationAddress, setLocationAddress] = useState("");
  const [locationTab, setLocationTab] = useState("detect");
  const [geoLoading, setGeoLoading] = useState(false);
  const [leafletReady, setLeafletReady] = useState(false);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    phone_number: "",
    bio: "",
    profile_picture: null,
    profile_picture_url: "",
    latitude: "",
    longitude: "",
    vehicle_number: "",
    driving_license: null,
    vehicle_rc: null,
    account_holder_name: "",
    bank_name: "",
    account_number: "",
    ifsc_code: "",
    upi_id: "",
  });

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError("");
      const [profileRes, bankRes] = await Promise.all([
        api.get("/delivery/me/", { withCredentials: true }),
        api.get("/delivery/bank-details/", { withCredentials: true }).catch(() => ({ data: [] })),
      ]);

      const p = profileRes.data || {};
      const details = Array.isArray(bankRes.data) ? bankRes.data : [];
      const primary = details.find((item) => item.is_primary) || details[0] || {};

      setForm((prev) => ({
        ...prev,
        first_name: p.first_name || "",
        last_name: p.last_name || "",
        phone_number: p.phone_number || "",
        bio: p.bio || "",
        profile_picture_url: p.profile_picture || "",
        latitude: p.latitude !== null && p.latitude !== undefined ? String(p.latitude) : "",
        longitude: p.longitude !== null && p.longitude !== undefined ? String(p.longitude) : "",
        vehicle_number: p.vehicle_number || "",
        account_holder_name: primary.account_holder_name || "",
        bank_name: primary.bank_name || "",
        account_number: primary.account_number || "",
        ifsc_code: primary.ifsc_code || "",
        upi_id: primary.upi_id || "",
      }));
    } catch {
      setError("Failed to load profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (!editing.location) return;

    if (window.L) {
      setLeafletReady(true);
      return;
    }

    const cssId = "leaflet-css-delivery-profile";
    if (!document.getElementById(cssId)) {
      const link = document.createElement("link");
      link.id = cssId;
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    const scriptId = "leaflet-js-delivery-profile";
    const existingScript = document.getElementById(scriptId);
    if (existingScript) {
      existingScript.addEventListener("load", () => setLeafletReady(true), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.async = true;
    script.onload = () => setLeafletReady(true);
    document.body.appendChild(script);
  }, [editing.location]);

  useEffect(() => {
    if (!editing.location || locationTab !== "map" || !leafletReady || !window.L || !mapRef.current) {
      return;
    }

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const L = window.L;
    const latitude = Number(form.latitude);
    const longitude = Number(form.longitude);
    const initialLat = Number.isFinite(latitude) ? latitude : 20.5937;
    const initialLng = Number.isFinite(longitude) ? longitude : 78.9629;
    const initialZoom = Number.isFinite(latitude) && Number.isFinite(longitude) ? 13 : 5;

    const map = L.map(mapRef.current).setView([initialLat, initialLng], initialZoom);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    const marker = L.marker([initialLat, initialLng], { draggable: true }).addTo(map);
    const updateLocationFromMap = (lat, lng) => {
      setForm((prev) => ({
        ...prev,
        latitude: lat.toFixed(6),
        longitude: lng.toFixed(6),
      }));
    };

    marker.on("dragend", (event) => {
      const pos = event.target.getLatLng();
      updateLocationFromMap(pos.lat, pos.lng);
    });

    map.on("click", (event) => {
      const { lat, lng } = event.latlng;
      marker.setLatLng([lat, lng]);
      updateLocationFromMap(lat, lng);
    });

    mapInstanceRef.current = map;
    setTimeout(() => map.invalidateSize(), 0);
  }, [editing.location, form.latitude, form.longitude, leafletReady, locationTab]);

  useEffect(() => {
    if (editing.location && locationTab === "map") return;
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }
  }, [editing.location, locationTab]);

  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const latitude = Number(form.latitude);
    const longitude = Number(form.longitude);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      setLocationAddress("Address not available.");
      return;
    }

    const controller = new AbortController();

    const loadAddress = async () => {
      try {
        setLocationAddress("Loading address...");
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
          {
            signal: controller.signal,
            headers: {
              Accept: "application/json",
            },
          }
        );
        if (!response.ok) throw new Error("Failed to reverse geocode");
        const data = await response.json();
        const address = data?.display_name || "Address not available.";
        setLocationAddress(address);
      } catch {
        if (!controller.signal.aborted) {
          setLocationAddress("Address not available.");
        }
      }
    };

    loadAddress();
    return () => controller.abort();
  }, [form.latitude, form.longitude]);

  const avatarText = useMemo(() => {
    const words = `${form.first_name} ${form.last_name}`.trim().split(" ").filter(Boolean);
    if (words.length >= 2) return `${words[0][0]}${words[1][0]}`.toUpperCase();
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return "DP";
  }, [form.first_name, form.last_name]);

  const displayName = useMemo(
    () => `${form.first_name || ""} ${form.last_name || ""}`.trim(),
    [form.first_name, form.last_name]
  );

  const updateField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

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
      setForm((prev) => ({
        ...prev,
        latitude: pos.coords.latitude.toFixed(6),
        longitude: pos.coords.longitude.toFixed(6),
      }));
    } catch {
      setError("Unable to detect current location. Please choose on map or enter it manually.");
    } finally {
      setGeoLoading(false);
    }
  };

  const validateLocation = () => {
    const latitude = Number(form.latitude);
    const longitude = Number(form.longitude);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return "Please enter valid latitude and longitude.";
    }

    if (latitude < -90 || latitude > 90) {
      return "Latitude must be between -90 and 90.";
    }

    if (longitude < -180 || longitude > 180) {
      return "Longitude must be between -180 and 180.";
    }

    return "";
  };

  const saveSection = async (section) => {
    try {
      setError("");
      if (section === "personal") {
        const formData = new FormData();
        formData.append("first_name", form.first_name);
        formData.append("last_name", form.last_name);
        formData.append("phone_number", form.phone_number);
        formData.append("bio", form.bio);
        if (form.profile_picture) formData.append("profile_picture", form.profile_picture);
        await api.patch("/delivery/me/", formData, {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      if (section === "vehicle") {
        const formData = new FormData();
        formData.append("vehicle_number", form.vehicle_number.toUpperCase());
        if (form.driving_license) formData.append("driving_license", form.driving_license);
        if (form.vehicle_rc) formData.append("vehicle_rc", form.vehicle_rc);
        await api.patch("/delivery/me/", formData, {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      if (section === "location") {
        const validation = validateLocation();
        if (validation) throw new Error(validation);

        await api.patch(
          "/delivery/me/",
          {
            latitude: form.latitude,
            longitude: form.longitude,
          },
          { withCredentials: true }
        );
        updateLocationInContext(form.latitude, form.longitude);
      }

      if (section === "bank") {
        const hasBank =
          form.account_holder_name?.trim() &&
          form.bank_name?.trim() &&
          form.account_number?.trim() &&
          form.ifsc_code?.trim();
        const hasUpi = form.upi_id?.trim();

        if (!hasBank && !hasUpi) {
          throw new Error("Add bank details or UPI to save.");
        }

        if (hasBank) {
          await api.post(
            "/delivery/bank-details/",
            {
              type: "bank",
              account_holder_name: form.account_holder_name,
              bank_name: form.bank_name,
              account_number: form.account_number,
              ifsc_code: form.ifsc_code,
              is_primary: !hasUpi,
            },
            { withCredentials: true }
          );
        }

        if (hasUpi) {
          await api.post(
            "/delivery/bank-details/",
            {
              type: "upi",
              upi_id: form.upi_id,
              is_primary: true,
            },
            { withCredentials: true }
          );
        }
      }

      setEditing((prev) => ({ ...prev, [section]: false }));
      setToast("Saved successfully.");
      fetchProfile();
    } catch (e) {
      setError(e?.response?.data?.detail || e?.message || "Failed to save changes.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] dark:bg-[#0A0F0D] py-16 px-4 md:px-8 transition-colors duration-500">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="h-36 bg-white dark:bg-[#111812] rounded-[24px] border border-gray-100 dark:border-gray-800/60 animate-pulse" />
          <div className="h-40 bg-white dark:bg-[#111812] rounded-[24px] border border-gray-100 dark:border-gray-800/60 animate-pulse" />
          <div className="h-40 bg-white dark:bg-[#111812] rounded-[24px] border border-gray-100 dark:border-gray-800/60 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] dark:bg-[#0A0F0D] py-14 transition-colors duration-500 font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="bg-white dark:bg-[#111812] border border-gray-100 dark:border-gray-800 rounded-[28px] p-6 md:p-8 flex items-center gap-5">
          <div className="w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center overflow-hidden border border-amber-200 dark:border-amber-800/30">
            {form.profile_picture_url ? (
              <img src={form.profile_picture_url} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xl font-black text-amber-700 dark:text-amber-400">{avatarText}</span>
            )}
          </div>
          <div>
            <h1 className="text-3xl font-black text-[#111812] dark:text-[#E8F3EB] tracking-tight">{displayName || "Delivery Partner"}</h1>
            <p className="text-gray-500 dark:text-gray-400">Manage your delivery profile and account settings.</p>
          </div>
        </div>

        {toast && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/30 rounded-xl text-emerald-700 dark:text-emerald-400 text-sm font-semibold">
            {toast}
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 rounded-xl text-red-700 dark:text-red-400 text-sm font-semibold">
            {error}
          </div>
        )}

        <section className="bg-white dark:bg-[#111812] border border-gray-100 dark:border-gray-800 rounded-[24px] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black text-[#111812] dark:text-[#E8F3EB]">Personal Info</h2>
            <button type="button" onClick={() => setEditing((p) => ({ ...p, personal: !p.personal }))} className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{editing.personal ? "Cancel" : "Edit"}</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input value={form.first_name} onChange={(e) => updateField("first_name", e.target.value)} disabled={!editing.personal} className="px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#1A241A] disabled:opacity-70" placeholder="First Name" />
            <input value={form.last_name} onChange={(e) => updateField("last_name", e.target.value)} disabled={!editing.personal} className="px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#1A241A] disabled:opacity-70" placeholder="Last Name" />
            <input value={form.phone_number} onChange={(e) => updateField("phone_number", e.target.value)} disabled={!editing.personal} className="md:col-span-2 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#1A241A] disabled:opacity-70" placeholder="Phone Number" />
            <textarea value={form.bio} onChange={(e) => updateField("bio", e.target.value)} disabled={!editing.personal} className="md:col-span-2 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#1A241A] disabled:opacity-70" rows={4} placeholder="Bio" />
            {editing.personal && (
              <input type="file" accept="image/*" onChange={(e) => updateField("profile_picture", e.target.files?.[0] || null)} className="md:col-span-2 text-sm" />
            )}
          </div>
          {editing.personal && (
            <div className="mt-4">
              <button type="button" onClick={() => saveSection("personal")} className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black">Save</button>
            </div>
          )}
        </section>

        <section className="bg-white dark:bg-[#111812] border border-gray-100 dark:border-gray-800 rounded-[24px] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black text-[#111812] dark:text-[#E8F3EB]">Location</h2>
            <button type="button" onClick={() => setEditing((p) => ({ ...p, location: !p.location }))} className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{editing.location ? "Cancel" : "Edit"}</button>
          </div>
          <div className="px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#1A241A] text-[#111812] dark:text-[#E8F3EB]">
            {locationAddress || "Address not available."}
          </div>
          {editing.location && (
            <div className="mt-5 space-y-5">
              <div className="flex flex-wrap gap-2">
                {[
                  { key: "detect", label: "Detect Current Location" },
                  { key: "map", label: "Choose on Map" },
                  { key: "manual", label: "Enter Manually" },
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
                <div className="bg-gray-50 dark:bg-[#1A241A] border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
                  <button
                    type="button"
                    onClick={detectLocation}
                    disabled={geoLoading}
                    className="bg-[#111812] hover:bg-[#1A241A] dark:bg-emerald-600 dark:hover:bg-emerald-500 disabled:opacity-70 text-white font-bold px-6 py-2.5 rounded-xl"
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Latitude</label>
                  <input
                    type="text"
                    value={form.latitude}
                    onChange={(e) => updateField("latitude", e.target.value)}
                    className="mt-2 w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#1A241A] text-[#111812] dark:text-[#E8F3EB] outline-none focus:border-emerald-500"
                    placeholder="Latitude"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Longitude</label>
                  <input
                    type="text"
                    value={form.longitude}
                    onChange={(e) => updateField("longitude", e.target.value)}
                    className="mt-2 w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#1A241A] text-[#111812] dark:text-[#E8F3EB] outline-none focus:border-emerald-500"
                    placeholder="Longitude"
                  />
                </div>
              </div>

              <button type="button" onClick={() => saveSection("location")} className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black">Save Location</button>
            </div>
          )}
          {form.latitude && form.longitude && (
            <div className="mt-4 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800">
              <iframe
                title="Delivery Location Preview"
                className="w-full h-56"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${Number(form.longitude) - 0.01}%2C${Number(form.latitude) - 0.01}%2C${Number(form.longitude) + 0.01}%2C${Number(form.latitude) + 0.01}&layer=mapnik&marker=${form.latitude}%2C${form.longitude}`}
              />
            </div>
          )}
        </section>

        <section className="bg-white dark:bg-[#111812] border border-gray-100 dark:border-gray-800 rounded-[24px] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black text-[#111812] dark:text-[#E8F3EB]">Vehicle Details</h2>
            <button type="button" onClick={() => setEditing((p) => ({ ...p, vehicle: !p.vehicle }))} className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{editing.vehicle ? "Cancel" : "Edit"}</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input value={form.vehicle_number} onChange={(e) => updateField("vehicle_number", e.target.value.toUpperCase())} disabled={!editing.vehicle} className="px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#1A241A] disabled:opacity-70" placeholder="Vehicle Number" />
            {editing.vehicle && (
              <>
                <input type="file" accept=".pdf,image/*" onChange={(e) => updateField("driving_license", e.target.files?.[0] || null)} className="text-sm" />
                <input type="file" accept=".pdf,image/*" onChange={(e) => updateField("vehicle_rc", e.target.files?.[0] || null)} className="text-sm" />
              </>
            )}
          </div>
          {editing.vehicle && (
            <div className="mt-4">
              <button type="button" onClick={() => saveSection("vehicle")} className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black">Save</button>
            </div>
          )}
        </section>

        <section className="bg-white dark:bg-[#111812] border border-gray-100 dark:border-gray-800 rounded-[24px] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black text-[#111812] dark:text-[#E8F3EB]">Bank / UPI Details</h2>
            <button type="button" onClick={() => setEditing((p) => ({ ...p, bank: !p.bank }))} className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{editing.bank ? "Cancel" : "Edit"}</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input value={form.account_holder_name} onChange={(e) => updateField("account_holder_name", e.target.value)} disabled={!editing.bank} className="px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#1A241A] disabled:opacity-70" placeholder="Account Holder Name" />
            <input value={form.bank_name} onChange={(e) => updateField("bank_name", e.target.value)} disabled={!editing.bank} className="px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#1A241A] disabled:opacity-70" placeholder="Bank Name" />
            <input value={form.account_number} onChange={(e) => updateField("account_number", e.target.value)} disabled={!editing.bank} className="px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#1A241A] disabled:opacity-70" placeholder="Account Number" />
            <input value={form.ifsc_code} onChange={(e) => updateField("ifsc_code", e.target.value.toUpperCase())} disabled={!editing.bank} className="px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#1A241A] disabled:opacity-70" placeholder="IFSC Code" />
            <input value={form.upi_id} onChange={(e) => updateField("upi_id", e.target.value)} disabled={!editing.bank} className="md:col-span-2 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#1A241A] disabled:opacity-70" placeholder="UPI ID" />
          </div>
          {editing.bank && (
            <div className="mt-4">
              <button type="button" onClick={() => saveSection("bank")} className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black">Save</button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default DeliveryProfile;
