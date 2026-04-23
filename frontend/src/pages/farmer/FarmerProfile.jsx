import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { resolveMediaUrl } from "../../utils/media";
import FarmerPaymentDetails from "./FarmerPaymentDetails";

const emptyCertificationForm = {
	title: "",
	issued_by: "",
	issued_date: "",
	certificate_image: null,
};

const FarmerProfile = () => {
	const { user, login } = useAuth();
	const routerLocation = useLocation();

	const [loading, setLoading] = useState(true);

	const [profile, setProfile] = useState(null);
	const [profileForm, setProfileForm] = useState({
		first_name: "",
		last_name: "",
		email: "",
		phone: "",
		gender: "",
		location: "",
		latitude: "",
		longitude: "",
	});
	const [isGenderDropdownOpen, setIsGenderDropdownOpen] = useState(false);
	const [pictureFile, setPictureFile] = useState(null);
	const [removePicture, setRemovePicture] = useState(false);
	const [profileSubmitting, setProfileSubmitting] = useState(false);
	const [profileMessage, setProfileMessage] = useState("");
	const [profileError, setProfileError] = useState("");
	const [isLocationFetching, setIsLocationFetching] = useState(false);
	const [locationFetchError, setLocationFetchError] = useState("");
	const [showCompleteProfileModal, setShowCompleteProfileModal] = useState(false);
	const [mustCompleteProfile, setMustCompleteProfile] = useState(false);
	const [showMapPicker, setShowMapPicker] = useState(false);
	const [showProfileMapPicker, setShowProfileMapPicker] = useState(false);
	const [locationSaveLoading, setLocationSaveLoading] = useState(false);
	const [completeProfileError, setCompleteProfileError] = useState("");
	const [leafletReady, setLeafletReady] = useState(false);
	const modalMapRef = useRef(null);
	const profileMapRef = useRef(null);
	const mapInstancesRef = useRef({ modal: null, profile: null });

	const [certifications, setCertifications] = useState([]);
	const [certMessage, setCertMessage] = useState("");
	const [certError, setCertError] = useState("");
	const [showAddCertForm, setShowAddCertForm] = useState(false);
	const [certForm, setCertForm] = useState(emptyCertificationForm);
	const [addingCert, setAddingCert] = useState(false);
	const [deletingCertId, setDeletingCertId] = useState(null);
	const [certDateInputType, setCertDateInputType] = useState("text");

	const [profileFieldErrors, setProfileFieldErrors] = useState({});
	const [certFieldErrors, setCertFieldErrors] = useState({});

	const fetchProfileAndCertifications = async () => {
		try {
			setLoading(true);
			setProfileError("");

			const [profileRes, certRes] = await Promise.all([
				api.get("/auth/farmer/profile/"),
				api.get("/auth/farmer/certifications/"),
			]);

			const profileData = profileRes.data;
			const certificationsData = Array.isArray(certRes.data?.results)
    ? certRes.data.results
    : certRes.data;

			setProfile(profileData);
			setCertifications(certificationsData);

			setProfileForm({
				first_name: profileData.first_name || user?.first_name || "",
				last_name: profileData.last_name || user?.last_name || "",
				email: profileData.email || user?.email || "",
				phone: profileData.phone || user?.phone || "",
				gender: profileData.gender || "",
				location: profileData.location || "",
				latitude: profileData.latitude || "",
				longitude: profileData.longitude || "",
			});

			const forceCompleteFromRegister = Boolean(routerLocation.state?.forceCompleteProfile);
			const hasCoordinates = Boolean(profileData.latitude) && Boolean(profileData.longitude);
			const mustComplete = forceCompleteFromRegister || !hasCoordinates;
			setMustCompleteProfile(mustComplete);
			setShowCompleteProfileModal(mustComplete);
		} catch {
			setProfileError("Failed to load profile details.");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchProfileAndCertifications();
	}, []);

	useEffect(() => {
		const loadLeaflet = async () => {
			if (window.L) {
				setLeafletReady(true);
				return;
			}

			const leafletCssId = "leaflet-css";
			if (!document.getElementById(leafletCssId)) {
				const link = document.createElement("link");
				link.id = leafletCssId;
				link.rel = "stylesheet";
				link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
				document.head.appendChild(link);
			}

			const existingScript = document.getElementById("leaflet-js");
			if (existingScript) {
				existingScript.addEventListener("load", () => setLeafletReady(true), { once: true });
				return;
			}

			const script = document.createElement("script");
			script.id = "leaflet-js";
			script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
			script.async = true;
			script.onload = () => setLeafletReady(true);
			document.body.appendChild(script);
		};

		loadLeaflet();

		return () => {
			if (mapInstancesRef.current.modal) {
				mapInstancesRef.current.modal.remove();
				mapInstancesRef.current.modal = null;
			}
			if (mapInstancesRef.current.profile) {
				mapInstancesRef.current.profile.remove();
				mapInstancesRef.current.profile = null;
			}
		};
	}, []);

	const profilePictureUrl = useMemo(() => {
		return resolveMediaUrl(profile?.picture);
	}, [profile]);

	const handleProfileInput = (e) => {
		const { name, value } = e.target;
		setProfileForm((prev) => ({ ...prev, [name]: value }));
		setProfileFieldErrors((prev) => ({ ...prev, [name]: undefined }));
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
		const address = data?.address || {};
		const line1 = [address.house_number, address.road].filter(Boolean).join(" ");
		const locality = address.neighbourhood || address.suburb || address.residential || "";
		const city = address.city || address.town || address.village || address.hamlet || "";
		const state = address.state || address.county || "";
		const postcode = address.postcode || "";
		const country = address.country || "";

		const detailedAddress = [line1, locality, city, state, postcode, country]
			.filter(Boolean)
			.join(", ");

		return detailedAddress || data?.display_name || "";
	};

	const setLocationFromCoordinates = async (latitude, longitude) => {
		const fallbackLocation = `Lat ${latitude.toFixed(5)}, Lng ${longitude.toFixed(5)}`;

		// Always persist coordinates immediately so profile save is not blocked.
		setProfileForm((prev) => ({
			...prev,
			location: prev.location || fallbackLocation,
			latitude: latitude.toFixed(6),
			longitude: longitude.toFixed(6),
		}));

		try {
			const locationLabel = await reverseGeocode(latitude, longitude);
			setProfileForm((prev) => ({
				...prev,
				location: locationLabel || fallbackLocation,
				latitude: latitude.toFixed(6),
				longitude: longitude.toFixed(6),
			}));
		} catch {
			setProfileForm((prev) => ({
				...prev,
				location: prev.location || fallbackLocation,
				latitude: latitude.toFixed(6),
				longitude: longitude.toFixed(6),
			}));
		}
	};

	const handleUseMyLocation = async () => {
		setLocationFetchError("");
		try {
			setIsLocationFetching(true);
			const position = await getCurrentPosition();
			const { latitude, longitude } = position.coords;
			await setLocationFromCoordinates(latitude, longitude);
		} catch (error) {
			setLocationFetchError(error?.message || "Unable to fetch location. Please try again.");
		} finally {
			setIsLocationFetching(false);
		}
	};

	const initMapPicker = (target) => {
		if (!leafletReady || !window.L) return;
		const container = target === "modal" ? modalMapRef.current : profileMapRef.current;
		if (!container) return;

		const prevMap = mapInstancesRef.current[target];
		if (prevMap) {
			prevMap.remove();
			mapInstancesRef.current[target] = null;
		}

		const L = window.L;
		const initialLat = Number(profileForm.latitude) || 20.5937;
		const initialLng = Number(profileForm.longitude) || 78.9629;
		const initialZoom = profileForm.latitude && profileForm.longitude ? 13 : 5;

		const map = L.map(container).setView([initialLat, initialLng], initialZoom);
		L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
			attribution: "&copy; OpenStreetMap contributors",
		}).addTo(map);

		let marker = L.marker([initialLat, initialLng]).addTo(map);

		map.on("click", async (event) => {
			try {
				setLocationFetchError("");
				const { lat, lng } = event.latlng;
				marker.setLatLng([lat, lng]);
				await setLocationFromCoordinates(lat, lng);
				if (target === "modal") {
					setShowMapPicker(false);
				} else {
					setShowProfileMapPicker(false);
				}
			} catch (error) {
				setLocationFetchError(error?.message || "Unable to set location from map.");
			}
		});

		mapInstancesRef.current[target] = map;
		setTimeout(() => map.invalidateSize(), 0);
	};

	const handleCompleteProfileLocation = async () => {
		setCompleteProfileError("");
		if (!profileForm.location || !profileForm.latitude || !profileForm.longitude) {
			setCompleteProfileError("Set your farm location first using current location or map.");
			return;
		}

		const payload = new FormData();
		payload.append("location", profileForm.location);
		payload.append("latitude", profileForm.latitude);
		payload.append("longitude", profileForm.longitude);

		try {
			setLocationSaveLoading(true);
			const res = await api.patch("/auth/farmer/profile/", payload, {
				headers: { "Content-Type": "multipart/form-data" },
			});
			setProfile(res.data);
			setShowCompleteProfileModal(false);
			setMustCompleteProfile(false);
			setProfileMessage("Profile location completed. You can now sell products.");
		} catch (error) {
			setCompleteProfileError(error?.response?.data?.detail || "Failed to save location. Please retry.");
		} finally {
			setLocationSaveLoading(false);
		}
	};

	const handlePictureChange = (e) => {
		const file = e.target.files?.[0] || null;
		setPictureFile(file);
		if (file) {
			setRemovePicture(false);
		}
	};

	const handleRemovePicture = () => {
		setPictureFile(null);
		setRemovePicture(true);
	};

	const handleSaveProfile = async (e) => {
		e.preventDefault();
		setProfileError("");
		setProfileMessage("");
		setProfileFieldErrors({});

		const payload = new FormData();
		payload.append("first_name", profileForm.first_name);
		payload.append("last_name", profileForm.last_name);
		payload.append("email", profileForm.email);
		payload.append("phone", profileForm.phone);
		payload.append("gender", profileForm.gender);
		payload.append("location", profileForm.location);
		if (profileForm.latitude) {
			payload.append("latitude", profileForm.latitude);
		}
		if (profileForm.longitude) {
			payload.append("longitude", profileForm.longitude);
		}
		if (pictureFile) {
			payload.append("picture", pictureFile);
		} else if (removePicture) {
			payload.append("picture", "");
		}

		try {
			setProfileSubmitting(true);
			const res = await api.patch("/auth/farmer/profile/", payload, {
				headers: {
					"Content-Type": "multipart/form-data",
				},
			});

			setProfile(res.data);
			setPictureFile(null);
					setRemovePicture(false);
			if (user) {
				login({
					...user,
					first_name: profileForm.first_name,
					last_name: profileForm.last_name,
					email: profileForm.email,
					phone: profileForm.phone,
				});
			}
		} catch (err) {
			const data = err?.response?.data;
			if (data && typeof data === "object") {
				const mapped = {};
				Object.entries(data).forEach(([key, value]) => {
					mapped[key] = Array.isArray(value) ? value.join(" ") : String(value);
				});
				setProfileFieldErrors(mapped);
			}

			const fallback = err?.response?.data?.detail || "Failed to update profile.";
			setProfileError(fallback);
		} finally {
			setProfileSubmitting(false);
		}
	};

	const handleCertInput = (e) => {
		const { name, value } = e.target;
		setCertForm((prev) => ({ ...prev, [name]: value }));
		setCertFieldErrors((prev) => ({ ...prev, [name]: undefined }));

		if (name === "issued_date" && value) {
			setCertDateInputType("date");
		}
	};

	const handleCertImage = (e) => {
		const file = e.target.files?.[0] || null;
		setCertForm((prev) => ({ ...prev, certificate_image: file }));
		setCertFieldErrors((prev) => ({ ...prev, certificate_image: undefined }));
	};

	const handleAddCertification = async (e) => {
		e.preventDefault();
		setCertError("");
		setCertMessage("");
		setCertFieldErrors({});

		const payload = new FormData();
		payload.append("title", certForm.title);
		payload.append("issued_by", certForm.issued_by);
		payload.append("issued_date", certForm.issued_date);
		if (certForm.certificate_image) {
			payload.append("certificate_image", certForm.certificate_image);
		}

		try {
			setAddingCert(true);
			const res = await api.post("/auth/farmer/certifications/", payload, {
				headers: {
					"Content-Type": "multipart/form-data",
				},
			});

			setCertifications((prev) => [res.data, ...prev]);
			setCertForm(emptyCertificationForm);
			setCertDateInputType("text");
			setShowAddCertForm(false);
			setCertMessage("Certification added successfully.");
		} catch (err) {
			const data = err?.response?.data;
			if (data && typeof data === "object") {
				const mapped = {};
				Object.entries(data).forEach(([key, value]) => {
					mapped[key] = Array.isArray(value) ? value.join(" ") : String(value);
				});
				setCertFieldErrors(mapped);
			}
			const fallback = err?.response?.data?.detail || "Failed to add certification.";
			setCertError(fallback);
		} finally {
			setAddingCert(false);
		}
	};

	const handleDeleteCertification = async (certId) => {
		const confirmed = window.confirm("Are you sure you want to delete this certification?");
		if (!confirmed) return;

		setCertError("");
		setCertMessage("");

		try {
			setDeletingCertId(certId);
			await api.delete(`/auth/farmer/certifications/${certId}/`);
			setCertifications((prev) => prev.filter((item) => item.id !== certId));
			setCertMessage("Certification deleted successfully.");
		} catch (err) {
			const fallback = err?.response?.data?.detail || "Failed to delete certification.";
			setCertError(fallback);
		} finally {
			setDeletingCertId(null);
		}
	};

	const certImageUrl = (path) => {
		return resolveMediaUrl(path);
	};

	const formatDate = (value) => {
		if (!value) return "-";
		return new Date(value).toLocaleDateString("en-IN", {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
	};

	const renderProfileError = (key) => {
		if (!profileFieldErrors[key]) return null;
		return <p className="mt-1 text-xs text-red-600 dark:text-red-400">{profileFieldErrors[key]}</p>;
	};

	const renderCertError = (key) => {
		if (!certFieldErrors[key]) return null;
		return <p className="mt-1 text-xs text-red-600 dark:text-red-400">{certFieldErrors[key]}</p>;
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-[#FDFBF7] dark:bg-[#0A0F0D] py-16 px-4 md:px-8 transition-colors duration-500">
				<div className="max-w-4xl mx-auto space-y-8">
					<div className="h-10 w-64 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
					<div className="space-y-6">
						<div className="h-96 bg-white dark:bg-[#111812] border border-gray-100 dark:border-gray-800/60 rounded-[32px] overflow-hidden animate-pulse shadow-sm" />
						<div className="h-64 bg-white dark:bg-[#111812] border border-gray-100 dark:border-gray-800/60 rounded-[32px] overflow-hidden animate-pulse shadow-sm" />
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-[#FDFBF7] dark:bg-[#0A0F0D] py-16 transition-colors duration-500 font-sans">
			{showCompleteProfileModal && mustCompleteProfile && (
				<div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
					<div className="absolute inset-0 bg-black/55 backdrop-blur-sm" />
					<div className="relative z-10 w-full max-w-xl rounded-3xl border border-gray-200 dark:border-gray-800/70 bg-white dark:bg-[#111812] p-6 sm:p-8 shadow-2xl">
						<h3 className="text-2xl font-black text-[#111812] dark:text-[#E8F3EB] tracking-tight">Complete Profile To Sell</h3>
						<p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
							Set your farm location to start listing products for nearby customers.
						</p>

						<div className="mt-6 flex flex-col sm:flex-row gap-3">
							<button
								type="button"
								onClick={handleUseMyLocation}
								disabled={isLocationFetching}
								className="inline-flex items-center justify-center rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 px-4 py-2.5 text-sm font-bold text-white transition-colors"
							>
								{isLocationFetching ? "Detecting..." : "Use Current Location"}
							</button>
							<button
								type="button"
								onClick={() => {
									const nextValue = !showMapPicker;
									setShowMapPicker(nextValue);
									if (nextValue) {
										setTimeout(() => initMapPicker("modal"), 0);
									}
								}}
								className="inline-flex items-center justify-center rounded-xl border border-emerald-300 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 px-4 py-2.5 text-sm font-bold text-emerald-700 dark:text-emerald-400 transition-colors"
							>
								Choose On Map
							</button>
						</div>

						{showMapPicker && (
							<div className="mt-4 rounded-2xl border border-gray-200 dark:border-gray-800/60 p-4 bg-gray-50 dark:bg-[#1A241A]">
								<p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
									Tap on map to set your farm location.
								</p>
								<div
									ref={modalMapRef}
									className="mt-3 h-72 w-full rounded-xl border border-gray-200 dark:border-gray-800/60 overflow-hidden"
								/>
							</div>
						)}

						<p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
							{profileForm.location || "Location not selected yet."}
						</p>
						{locationFetchError && (
							<p className="mt-2 text-xs font-medium text-red-600 dark:text-red-400">{locationFetchError}</p>
						)}
						{completeProfileError && (
							<p className="mt-2 text-xs font-medium text-red-600 dark:text-red-400">{completeProfileError}</p>
						)}

						<button
							type="button"
							onClick={handleCompleteProfileLocation}
							disabled={locationSaveLoading}
							className="mt-6 w-full rounded-xl bg-[#111812] hover:bg-[#1A241A] dark:bg-emerald-600 dark:hover:bg-emerald-500 disabled:opacity-60 px-5 py-3 text-sm font-bold text-white transition-colors"
						>
							{locationSaveLoading ? "Saving..." : "Complete Profile"}
						</button>
					</div>
				</div>
			)}
			<div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">

                {/* Premium Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gray-200 dark:border-gray-800/80 pb-8">
					<div className="max-w-2xl">
						<h1 className="text-4xl sm:text-5xl font-black text-[#111812] dark:text-[#E8F3EB] tracking-tight mb-2">
							Farmer Profile
						</h1>
						<p className="text-gray-500 dark:text-gray-400 text-lg font-medium">
							Manage your public identity and farm certifications.
						</p>
					</div>
				</div>

				<section className="bg-white dark:bg-[#111812] rounded-[32px] border border-gray-100 dark:border-gray-800/60 p-8 sm:p-10 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
					<h2 className="text-xl font-black text-[#111812] dark:text-[#E8F3EB] tracking-tight mb-8">Profile Details</h2>

				{profileMessage && (
					<div className="mb-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 text-sm rounded-lg px-3 py-2">
						{profileMessage}
					</div>
				)}
				{profileError && (
					<div className="mb-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm rounded-lg px-3 py-2">
						{profileError}
					</div>
				)}

				<form onSubmit={handleSaveProfile} className="space-y-4">
					<div className="flex flex-col sm:flex-row sm:items-center gap-6 mb-8">
						<div className="mx-auto sm:mx-0 shrink-0 relative">
							<div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-white dark:border-[#1A241A] bg-emerald-50 dark:bg-emerald-900/20 shadow-lg flex items-center justify-center">
								{pictureFile ? (
									<img src={URL.createObjectURL(pictureFile)} alt="Profile" className="w-full h-full object-cover" />
								) : profilePictureUrl && !removePicture ? (
									<img src={profilePictureUrl} alt="Profile" className="w-full h-full object-cover" />
								) : (
                                    <svg className="w-12 h-12 text-emerald-300 dark:text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
								)}
							</div>

                            <label className="absolute bottom-1 right-1 w-10 h-10 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center cursor-pointer transition-all shadow-lg ring-4 ring-white dark:ring-[#111812] hover:scale-105">
                                <input type="file" accept="image/*" onChange={handlePictureChange} className="hidden" />
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </label>
						</div>

						<div className="flex-1 text-center sm:text-left">
							<h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Profile Picture</h3>
							<p className="text-sm text-gray-500 dark:text-gray-400">Upload a clear photo to build trust with your buyers. Max size 2MB.</p>
							<div className="mt-4 flex flex-wrap items-center gap-3 justify-center sm:justify-start">
								{pictureFile && (
									<span className="text-sm text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2 rounded-lg inline-block">Ready to upload: {pictureFile.name}</span>
								)}
								{(profilePictureUrl || pictureFile) && !removePicture && (
									<button type="button" onClick={handleRemovePicture} className="text-sm font-bold text-red-600 dark:text-red-400 hover:text-red-700 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 px-4 py-2 rounded-lg transition-colors border border-red-100 dark:border-red-900/30">
										Remove Photo
									</button>
								)}
							</div>
						</div>
					</div>

					<div className="grid sm:grid-cols-2 gap-5">
						<div>
							<input
								type="text"
								name="first_name"
								value={profileForm.first_name}
								onChange={handleProfileInput}
								placeholder="First Name"
								required
								className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-gray-800/60 bg-gray-50 dark:bg-[#1A241A] text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 focus:bg-white dark:focus:bg-[#111812] outline-none transition-all placeholder-gray-400"
							/>
							{renderProfileError("first_name")}
						</div>

						<div>
							<input
								type="text"
								name="last_name"
								value={profileForm.last_name}
								onChange={handleProfileInput}
								placeholder="Last Name"
								className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-gray-800/60 bg-gray-50 dark:bg-[#1A241A] text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 focus:bg-white dark:focus:bg-[#111812] outline-none transition-all placeholder-gray-400"
							/>
							{renderProfileError("last_name")}
						</div>

						<div>
							<input
								type="email"
								name="email"
								value={profileForm.email}
								onChange={handleProfileInput}
								placeholder="Email"
								required
								className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-gray-800/60 bg-gray-50 dark:bg-[#1A241A] text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 focus:bg-white dark:focus:bg-[#111812] outline-none transition-all placeholder-gray-400"
							/>
							{renderProfileError("email")}
						</div>

						<div>
							<input
								type="text"
								name="phone"
								value={profileForm.phone}
								onChange={handleProfileInput}
								placeholder="Phone"
								required
								className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-gray-800/60 bg-gray-50 dark:bg-[#1A241A] text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 focus:bg-white dark:focus:bg-[#111812] outline-none transition-all placeholder-gray-400"
							/>
							{renderProfileError("phone")}
						</div>

						{/* Custom Gender Dropdown */}
						<div className="relative block cursor-pointer">
                            {isGenderDropdownOpen && (
                                <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => setIsGenderDropdownOpen(false)}
                                />
                            )}
                            <button
                                type="button"
                                onClick={() => setIsGenderDropdownOpen(!isGenderDropdownOpen)}
                                className={`relative z-50 w-full flex items-center justify-between px-5 py-4 border rounded-2xl transition-all outline-none text-left font-medium ${
                                    isGenderDropdownOpen
                                        ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-white dark:bg-[#111812]'
                                        : 'border-gray-200 dark:border-gray-800/60 bg-gray-50 dark:bg-[#1A241A] hover:bg-white dark:hover:bg-[#111812]'
                                }`}
                            >
                                <span className={`block truncate ${!profileForm.gender ? 'text-gray-400 dark:text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                                    {profileForm.gender === "male" ? "Male" :
                                     profileForm.gender === "female" ? "Female" :
                                     profileForm.gender === "other" ? "Other" : "Select Gender"}
                                </span>
                                <div className="absolute inset-y-0 right-0 pr-5 flex items-center pointer-events-none">
                                    <svg className={`h-5 w-5 text-gray-400 transition-transform duration-300 ${isGenderDropdownOpen ? 'rotate-180 text-emerald-500' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </button>

                            <div
                                className={`absolute z-50 left-0 right-0 mt-2 bg-white dark:bg-[#1A241A] border border-gray-200 dark:border-gray-800/60 rounded-2xl shadow-xl overflow-hidden transition-all duration-300 origin-top
                                ${isGenderDropdownOpen ? 'opacity-100 scale-y-100 translate-y-0 visible' : 'opacity-0 scale-y-95 -translate-y-2 invisible'}`}
                            >
                                <div className="py-2 flex flex-col gap-1 px-2">
                                    {[
                                        { value: 'male', label: 'Male' },
                                        { value: 'female', label: 'Female' },
                                        { value: 'other', label: 'Other' }
                                    ].map((option) => (
                                        <button
                                            key={option.value}
                                            type="button"
                                            onClick={() => {
                                                handleProfileInput({ target: { name: 'gender', value: option.value }});
                                                setIsGenderDropdownOpen(false);
                                            }}
                                            className={`w-full text-left px-4 py-3 text-sm font-bold rounded-xl transition-colors
                                                ${profileForm.gender === option.value
                                                    ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-gray-200'
                                                }
                                            `}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
							{renderProfileError("gender")}
						</div>

						</div>

						<div className="mt-5 rounded-2xl border border-gray-200 dark:border-gray-800/60 bg-gray-50 dark:bg-[#1A241A] p-4">
							<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
								<p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Current Location</p>
								<div className="flex flex-col sm:flex-row gap-2">
									<button
										type="button"
										onClick={handleUseMyLocation}
										disabled={isLocationFetching}
										className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40 disabled:opacity-60 px-4 py-2 text-sm font-bold text-emerald-700 dark:text-emerald-400 transition-colors"
									>
										{isLocationFetching ? "Fetching..." : "Use Current Location"}
									</button>
									<button
										type="button"
										onClick={() => {
											const nextValue = !showProfileMapPicker;
											setShowProfileMapPicker(nextValue);
											if (nextValue) {
												setTimeout(() => initMapPicker("profile"), 0);
											}
										}}
										className="inline-flex items-center justify-center rounded-xl border border-emerald-300 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 px-4 py-2 text-sm font-bold text-emerald-700 dark:text-emerald-400 transition-colors"
									>
										Select On Map
									</button>
								</div>
							</div>
							{showProfileMapPicker && (
								<div className="mt-3">
									<p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
										Tap on map to set your farm location.
									</p>
									<div
										ref={profileMapRef}
										className="h-64 w-full rounded-xl border border-gray-200 dark:border-gray-800/60 overflow-hidden"
									/>
								</div>
							)}
							<p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
								{profileForm.location || "Location not fetched yet."}
							</p>
						{locationFetchError && (
							<p className="mt-2 text-xs font-medium text-red-600 dark:text-red-400">{locationFetchError}</p>
						)}
						{renderProfileError("location")}
					</div>

					<div className="pt-4">
						<button
							type="submit"
							disabled={profileSubmitting}
							className="bg-[#111812] hover:bg-[#1A241A] dark:bg-emerald-600 dark:hover:bg-emerald-500 disabled:opacity-60 text-white font-bold px-8 py-3.5 rounded-2xl transition-all shadow-sm active:scale-95"
						>
							{profileSubmitting ? "Saving..." : "Save Profile Details"}
						</button>
					</div>
				</form>
			</section>

			<section className="bg-white dark:bg-[#111812] rounded-[32px] border border-gray-100 dark:border-gray-800/60 p-8 sm:p-10 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 mb-8">
					<h2 className="text-xl font-black text-[#111812] dark:text-[#E8F3EB] tracking-tight">Certifications</h2>
					<button
						type="button"
						onClick={() => {
							setShowAddCertForm((prev) => !prev);
							setCertError("");
							setCertMessage("");
						}}
						className="text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 px-5 py-2.5 rounded-xl transition-colors"
					>
						{showAddCertForm ? "Cancel" : "+ Add New Certification"}
					</button>
				</div>

				{certMessage && (
					<div className="mb-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 text-sm rounded-lg px-3 py-2">
						{certMessage}
					</div>
				)}
				{certError && (
					<div className="mb-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm rounded-lg px-3 py-2">
						{certError}
					</div>
				)}

				{showAddCertForm && (
					<form onSubmit={handleAddCertification} className="mb-8 border border-gray-200 dark:border-gray-800/60 bg-gray-50 dark:bg-[#1A241A] rounded-[24px] p-6 lg:p-8">
						<h3 className="text-lg font-extrabold text-gray-900 dark:text-white mb-6">Add Certification</h3>

						<div className="grid sm:grid-cols-2 gap-5">
							<div className="sm:col-span-2">
								<input
									type="text"
									name="title"
									value={certForm.title}
									onChange={handleCertInput}
									placeholder="Certificate Name"
									required
									className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-gray-800/60 bg-white dark:bg-[#111812] text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all placeholder-gray-400 shadow-sm"
								/>
								{renderCertError("title")}
							</div>

							<div>
								<input
									type="text"
									name="issued_by"
									value={certForm.issued_by}
									onChange={handleCertInput}
									placeholder="Issued By"
									required
									className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-gray-800/60 bg-white dark:bg-[#111812] text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all placeholder-gray-400 shadow-sm"
								/>
								{renderCertError("issued_by")}
							</div>

							<div>
								<input
									type={certDateInputType}
									name="issued_date"
									value={certForm.issued_date}
									onChange={handleCertInput}
									onFocus={() => setCertDateInputType("date")}
									onBlur={() => {
										if (!certForm.issued_date) {
											setCertDateInputType("text");
										}
									}}
									placeholder="Issued Date"
									required
									className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-gray-800/60 bg-white dark:bg-[#111812] text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all placeholder-gray-400 shadow-sm"
								/>
								{renderCertError("issued_date")}
							</div>

							<div className="sm:col-span-2">
								<label className="block w-full cursor-pointer rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700/80 bg-white dark:bg-[#111812] hover:bg-gray-50 dark:hover:bg-[#1A241A] px-6 py-8 text-center transition-all group">
									<input
										type="file"
										accept="image/*"
										onChange={handleCertImage}
										required
										className="hidden"
									/>
									<div className="flex flex-col items-center">
										<div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                            </svg>
                                        </div>
										<p className="text-sm font-black text-gray-900 dark:text-white">Upload Certificate Document</p>
										<p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">PNG, JPG or JPEG allowed (Clear text preferred)</p>
									</div>
								</label>
								{certForm.certificate_image && (
									<p className="mt-3 text-sm text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2 rounded-lg inline-block">
										Ready to upload: {certForm.certificate_image.name}
									</p>
								)}
								{renderCertError("certificate_image")}
							</div>
						</div>

						<div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-800/80 flex justify-end">
							<button
								type="submit"
								disabled={addingCert}
								className="bg-[#111812] hover:bg-[#1A241A] dark:bg-emerald-600 dark:hover:bg-emerald-500 disabled:opacity-60 text-white font-bold px-8 py-3.5 rounded-2xl transition-all shadow-sm active:scale-95 w-full sm:w-auto"
							>
								{addingCert ? "Uploading..." : "Save Certification"}
							</button>
						</div>
					</form>
				)}

				{certifications.length === 0 ? (
					<div className="flex flex-col items-center justify-center p-12 text-center">
                        <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800/50 rounded-full flex items-center justify-center mb-4">
                            <svg className="w-8 h-8 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">No certifications yet</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">Upload verifiable credentials to increase trust with buyers</p>
					</div>
				) : (
					<div className="space-y-4">
						{certifications.map((cert) => {
							const imageUrl = certImageUrl(cert.certificate_image);

							return (
								<div key={cert.id} className="border border-gray-100 dark:border-gray-800/80 rounded-[20px] p-5 sm:p-6 hover:border-emerald-500/30 dark:hover:border-emerald-500/30 transition-colors shadow-sm">
									<div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
										<div className="space-y-2 flex-1">
											<p className="text-lg font-black text-gray-900 dark:text-white leading-tight">{cert.title}</p>
											<div className="flex flex-wrap gap-x-4 gap-y-2 mt-2">
                                                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                                                    <span className="text-gray-400 dark:text-gray-500 font-normal mr-1">Issued by</span>
                                                    {cert.issued_by || "-"}
                                                </p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                                                    <span className="text-gray-400 dark:text-gray-500 font-normal mr-1">Date</span>
                                                    {formatDate(cert.issued_date)}
                                                </p>
                                            </div>

											<div className="pt-2">
                                                {cert.is_verified ? (
                                                    <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-3 py-1.5 rounded-full border border-emerald-100 dark:border-emerald-800/50">
                                                        <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                                        VERIFIED
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-3 py-1.5 rounded-full border border-orange-100 dark:border-orange-800/50">
                                                        <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>
                                                        PENDING VERIFICATION
                                                    </span>
                                                )}
                                            </div>
										</div>

										<div className="flex sm:flex-col items-center sm:items-end gap-4 sm:ml-4 shrink-0">
											{imageUrl ? (
												<img src={imageUrl} alt={cert.title} className="w-32 h-20 sm:w-24 sm:h-16 rounded-xl object-cover border border-gray-200 dark:border-gray-800" />
											) : (
												<div className="w-32 h-20 sm:w-24 sm:h-16 rounded-xl bg-gray-50 dark:bg-[#1A241A] border border-gray-200 dark:border-gray-800/60 flex items-center justify-center">
                                                    <svg className="w-6 h-6 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                </div>
											)}

											<button
												type="button"
												onClick={() => handleDeleteCertification(cert.id)}
												disabled={deletingCertId === cert.id}
                                                className="flex items-center gap-1.5 text-xs font-bold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 disabled:opacity-50 transition-colors"
											>
												{deletingCertId === cert.id ? "Deleting..." : (
                                                    <>
                                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                        REMOVE
                                                    </>
                                                )}
											</button>
										</div>
									</div>
								</div>
							);
						})}
					</div>
				)}
			</section>

			{/* Payment Details Section */}
			<FarmerPaymentDetails />

			</div>
		</div>
	);
};

export default FarmerProfile;
