import { useEffect, useMemo, useRef, useState } from "react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { resolveMediaUrl } from "../../utils/media";

const emptyAddressForm = {
	address_type: "home",
	full_name: "",
	phone: "",
	address: "",
	city: "",
	state: "",
	pincode: "",
	is_default: false,
};

const CustomerProfile = () => {
	const { user, login } = useAuth();

	const [loading, setLoading] = useState(true);

	const [profile, setProfile] = useState(null);
	const [profileForm, setProfileForm] = useState({
		first_name: user?.first_name || "",
		last_name: user?.last_name || "",
		email: user?.email || "",
		phone: user?.phone || "",
	});
	const [pictureFile, setPictureFile] = useState(null);
	const [removePicture, setRemovePicture] = useState(false);
	const [profileSubmitting, setProfileSubmitting] = useState(false);
	const [profileMessage, setProfileMessage] = useState("");
	const [profileError, setProfileError] = useState("");
	const [detectedLocation, setDetectedLocation] = useState("");
	const [isDetectingLocation, setIsDetectingLocation] = useState(false);
	const [locationDetectError, setLocationDetectError] = useState("");
	const [showMapPicker, setShowMapPicker] = useState(false);
	const [leafletReady, setLeafletReady] = useState(false);
	const mapRef = useRef(null);
	const mapInstanceRef = useRef(null);
	const addressMapRef = useRef(null);
	const addressMapInstanceRef = useRef(null);

	const [addresses, setAddresses] = useState([]);
	const [addressMessage, setAddressMessage] = useState("");
	const [addressError, setAddressError] = useState("");

	const [showAddAddress, setShowAddAddress] = useState(false);
	const [newAddressForm, setNewAddressForm] = useState(emptyAddressForm);
	const [creatingAddress, setCreatingAddress] = useState(false);
	const [showAddressMapPicker, setShowAddressMapPicker] = useState(false);
	const [isDetectingAddressLocation, setIsDetectingAddressLocation] = useState(false);

	const [editingAddressId, setEditingAddressId] = useState(null);
	const [editAddressForm, setEditAddressForm] = useState(emptyAddressForm);
	const [updatingAddressId, setUpdatingAddressId] = useState(null);
	const [deletingAddressId, setDeletingAddressId] = useState(null);
	const [confirmDeleteAddressId, setConfirmDeleteAddressId] = useState(null);
	const [settingDefaultId, setSettingDefaultId] = useState(null);

	const fetchProfileAndAddresses = async () => {
		try {
			setLoading(true);
			setProfileError("");

			const [profileRes, addressRes] = await Promise.all([
				api.get("/auth/customer/profile/"),
				api.get("/auth/addresses/"),
			]);

			const profileData = profileRes.data;
			const addressPayload = addressRes.data;
			const addressList = Array.isArray(addressPayload)
				? addressPayload
				: Array.isArray(addressPayload?.results)
					? addressPayload.results
					: [];

			setProfile(profileData);
			setAddresses(addressList);
			setProfileForm({
				first_name: user?.first_name || "",
				last_name: user?.last_name || "",
				email: user?.email || "",
				phone: user?.phone || "",
			});
		} catch {
			setProfileError("Failed to load profile details. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchProfileAndAddresses();
	}, []);

	useEffect(() => {
		const loadLeaflet = () => {
			if (window.L) {
				setLeafletReady(true);
				return;
			}

			const leafletCssId = "leaflet-css-customer";
			if (!document.getElementById(leafletCssId)) {
				const link = document.createElement("link");
				link.id = leafletCssId;
				link.rel = "stylesheet";
				link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
				document.head.appendChild(link);
			}

			const existingScript = document.getElementById("leaflet-js-customer");
			if (existingScript) {
				existingScript.addEventListener("load", () => setLeafletReady(true), { once: true });
				return;
			}

			const script = document.createElement("script");
			script.id = "leaflet-js-customer";
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
			if (addressMapInstanceRef.current) {
				addressMapInstanceRef.current.remove();
				addressMapInstanceRef.current = null;
			}
		};
	}, []);

	const profilePictureUrl = useMemo(() => {
		return resolveMediaUrl(profile?.picture);
	}, [profile]);

	const handleProfileInput = (e) => {
		const { name, value } = e.target;
		setProfileForm((prev) => ({ ...prev, [name]: value }));
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

	const reverseGeocodeDetailed = async (latitude, longitude) => {
		const response = await fetch(
			`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
		);
		if (!response.ok) {
			throw new Error("Unable to fetch address from map service.");
		}

		const data = await response.json();
		const address = data?.address || {};
		const line1Parts = [
			address.house_number,
			address.building,
			address.road,
			address.suburb,
			address.neighbourhood,
			address.residential,
			address.city_district,
			address.county,
		].filter(Boolean);
		const line1 = line1Parts.join(", ");
		const locality = address.locality || "";
		const city = address.city || address.town || address.village || address.hamlet || "";
		const state = address.state || address.state_district || address.county || "";
		const postcode = address.postcode || "";
		const country = address.country || "";

		const detailedAddress = [line1, locality, city, state, postcode, country]
			.filter(Boolean)
			.join(", ");

		return {
			fullAddress: data?.display_name || detailedAddress || "",
			line1: [line1, locality].filter(Boolean).join(", "),
			city: city || address.municipality || address.county || "",
			state,
			pincode: postcode,
		};
	};

	const reverseGeocode = async (latitude, longitude) => {
		const details = await reverseGeocodeDetailed(latitude, longitude);
		return details.fullAddress;
	};

	const handleUseMyLocation = async () => {
		setLocationDetectError("");
		try {
			setIsDetectingLocation(true);
			const position = await getCurrentPosition();
			const { latitude, longitude } = position.coords;
			const locationLabel = await reverseGeocode(latitude, longitude);
			setDetectedLocation(locationLabel || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
		} catch (error) {
			setLocationDetectError(error?.message || "Unable to fetch location. Please try again.");
		} finally {
			setIsDetectingLocation(false);
		}
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
				setLocationDetectError("");
				const { lat, lng } = event.latlng;
				if (!marker) {
					marker = L.marker([lat, lng]).addTo(map);
				} else {
					marker.setLatLng([lat, lng]);
				}
				const locationLabel = await reverseGeocode(lat, lng);
				setDetectedLocation(locationLabel || `Lat ${lat.toFixed(5)}, Lng ${lng.toFixed(5)}`);
				setShowMapPicker(false);
			} catch (error) {
				setLocationDetectError(error?.message || "Unable to set location from map.");
			}
		});

		mapInstanceRef.current = map;
		setTimeout(() => map.invalidateSize(), 0);
	};

	const initAddressMapPicker = () => {
		if (!leafletReady || !window.L || !addressMapRef.current) return;

		if (addressMapInstanceRef.current) {
			addressMapInstanceRef.current.remove();
			addressMapInstanceRef.current = null;
		}

		const L = window.L;
		const map = L.map(addressMapRef.current).setView([20.5937, 78.9629], 5);
		L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
			attribution: "&copy; OpenStreetMap contributors",
		}).addTo(map);

		let marker = null;
		map.on("click", async (event) => {
			try {
				setAddressError("");
				const { lat, lng } = event.latlng;
				if (!marker) {
					marker = L.marker([lat, lng]).addTo(map);
				} else {
					marker.setLatLng([lat, lng]);
				}

				const details = await reverseGeocodeDetailed(lat, lng);
				setNewAddressForm((prev) => ({
					...prev,
					address: details.fullAddress || details.line1 || prev.address,
					city: details.city || prev.city,
					state: details.state || prev.state,
					pincode: details.pincode || prev.pincode,
				}));
				setAddressMessage("Address fields updated from map selection.");
				setShowAddressMapPicker(false);
			} catch (error) {
				setAddressError(error?.message || "Unable to fetch address from map.");
			}
		});

		addressMapInstanceRef.current = map;
		setTimeout(() => map.invalidateSize(), 0);
	};

	const handleUseCurrentLocationForAddress = async () => {
		setAddressError("");
		setAddressMessage("");

		try {
			setIsDetectingAddressLocation(true);
			const position = await getCurrentPosition();
			const { latitude, longitude } = position.coords;
			const details = await reverseGeocodeDetailed(latitude, longitude);

			setNewAddressForm((prev) => ({
				...prev,
				address: details.fullAddress || details.line1 || prev.address,
				city: details.city || prev.city,
				state: details.state || prev.state,
				pincode: details.pincode || prev.pincode,
			}));
			setAddressMessage("Address fields updated from current location.");
		} catch (error) {
			setAddressError(error?.message || "Unable to fetch current location for address.");
		} finally {
			setIsDetectingAddressLocation(false);
		}
	};

	const handleProfilePicture = (e) => {
		const file = e.target.files?.[0] || null;
		if (file) {
			setPictureFile(file);
			setRemovePicture(false);
		}
	};

	const handleRemovePicture = () => {
		setPictureFile(null);
		setRemovePicture(true);
	};

	const handleSaveProfile = async (e) => {
		e.preventDefault();
		setProfileMessage("");
		setProfileError("");

		try {
			setProfileSubmitting(true);

			const formData = new FormData();
			formData.append("first_name", profileForm.first_name);
			formData.append("last_name", profileForm.last_name);
			formData.append("email", profileForm.email);
			formData.append("phone", profileForm.phone);
			if (pictureFile) {
				formData.append("picture", pictureFile);
			} else if (removePicture) {
				formData.append("picture", "");
			}

			const res = await api.patch("/auth/customer/profile/", formData, {
				headers: {
					"Content-Type": "multipart/form-data",
				},
			});

			setProfile(res.data);
			setPictureFile(null);
			setRemovePicture(false);
			setProfileMessage("Profile updated successfully.");

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
			const detail = err?.response?.data?.detail;
			setProfileError(detail || "Failed to update profile. Please check your details and try again.");
		} finally {
			setProfileSubmitting(false);
		}
	};

	const handleAddressInput = (setter) => (e) => {
		const { name, value, type, checked } = e.target;
		setter((prev) => ({
			...prev,
			[name]: type === "checkbox" ? checked : value,
		}));
	};

	const handleCreateAddress = async (e) => {
		e.preventDefault();
		setAddressError("");
		setAddressMessage("");

		try {
			setCreatingAddress(true);
			const res = await api.post("/auth/addresses/", newAddressForm);
			const created = res.data;

			setAddresses((prev) => {
				const next = created.is_default
					? prev.map((addr) => ({ ...addr, is_default: false }))
					: prev;
				return [created, ...next];
			});

			setNewAddressForm(emptyAddressForm);
			setShowAddAddress(false);
			setShowAddressMapPicker(false);
			setAddressMessage("Address added successfully.");
		} catch (err) {
			const detail = err?.response?.data?.detail;
			setAddressError(detail || "Failed to add address.");
		} finally {
			setCreatingAddress(false);
		}
	};

	const startEditAddress = (address) => {
		setAddressError("");
		setAddressMessage("");
		setEditingAddressId(address.id);
		setEditAddressForm({
			address_type: address.address_type,
			full_name: address.full_name,
			phone: address.phone,
			address: address.address,
			city: address.city,
			state: address.state,
			pincode: address.pincode,
			is_default: address.is_default,
		});
	};

	const handleUpdateAddress = async (e) => {
		e.preventDefault();
		if (!editingAddressId) return;

		setAddressError("");
		setAddressMessage("");

		try {
			setUpdatingAddressId(editingAddressId);
			const res = await api.patch(`/auth/addresses/${editingAddressId}/`, editAddressForm);
			const updated = res.data;

			setAddresses((prev) => {
				let next = prev.map((addr) => (addr.id === updated.id ? updated : addr));
				if (updated.is_default) {
					next = next.map((addr) => ({
						...addr,
						is_default: addr.id === updated.id,
					}));
				}
				return next;
			});

			setEditingAddressId(null);
			setEditAddressForm(emptyAddressForm);
			setAddressMessage("Address updated successfully.");
		} catch (err) {
			const detail = err?.response?.data?.detail;
			setAddressError(detail || "Failed to update address.");
		} finally {
			setUpdatingAddressId(null);
		}
	};

	const handleDeleteAddress = async (addressId) => {
		setAddressError("");
		setAddressMessage("");

		try {
			setDeletingAddressId(addressId);
			await api.delete(`/auth/addresses/${addressId}/`);
			setAddresses((prev) => prev.filter((addr) => addr.id !== addressId));
			setAddressMessage("Address deleted successfully.");
			setConfirmDeleteAddressId(null);

			if (editingAddressId === addressId) {
				setEditingAddressId(null);
			}
		} catch (err) {
			const detail = err?.response?.data?.detail;
			setAddressError(detail || "Failed to delete address.");
		} finally {
			setDeletingAddressId(null);
		}
	};

	const handleSetDefault = async (addressId) => {
		setAddressError("");
		setAddressMessage("");

		try {
			setSettingDefaultId(addressId);
			const res = await api.patch(`/auth/addresses/${addressId}/default/`);
			const defaultAddress = res.data;

			setAddresses((prev) =>
				prev.map((addr) => ({
					...addr,
					is_default: addr.id === defaultAddress.id,
				}))
			);
			setAddressMessage("Default address updated.");
		} catch (err) {
			const detail = err?.response?.data?.detail;
			setAddressError(detail || "Failed to set default address.");
		} finally {
			setSettingDefaultId(null);
		}
	};

	if (loading) {
		return (
			<div className="max-w-6xl mx-auto px-4 py-10">
				<div className="h-8 w-56 bg-gray-200 dark:bg-gray-700 rounded mb-8 animate-pulse" />
				<div className="space-y-5">
					<div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
					<div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
				</div>
			</div>
		);
	}

	if (profileError && !profile) {
		return (
			<div className="max-w-4xl mx-auto px-4 py-16 text-center">
				<p className="text-red-600 dark:text-red-400 font-semibold mb-4">{profileError}</p>
				<button
					onClick={fetchProfileAndAddresses}
					className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition"
				>
					Retry
				</button>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-[#FDFBF7] dark:bg-[#0A0F0D] py-16 transition-colors duration-500 font-sans">
			<div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
				<div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gray-200 dark:border-gray-800/80 pb-8">
					<div className="max-w-2xl">
						<h1 className="text-4xl sm:text-5xl font-black text-[#111812] dark:text-[#E8F3EB] tracking-tight mb-2">My Profile</h1>
						<p className="text-gray-500 dark:text-gray-400 text-lg font-medium">Manage your personal details and saved addresses.</p>
					</div>
				</div>

				<section className="bg-white dark:bg-[#111812] rounded-[32px] border border-gray-100 dark:border-gray-800/60 p-8 sm:p-10 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
					<h2 className="text-xl font-black text-[#111812] dark:text-[#E8F3EB] tracking-tight mb-8">Profile Details</h2>

					{profileMessage && (
						<div className="mb-8 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-sm font-medium rounded-2xl px-5 py-4">
							{profileMessage}
						</div>
					)}
					{profileError && (
						<div className="mb-8 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm font-medium rounded-2xl px-5 py-4">
							{profileError}
						</div>
					)}

					<form onSubmit={handleSaveProfile} className="space-y-6">
						<div className="flex flex-col sm:flex-row sm:items-center gap-8 mb-10">
							<div className="mx-auto sm:mx-0 shrink-0 relative">
								<div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-white dark:border-[#1A241A] bg-emerald-50 dark:bg-emerald-900/20 shadow-lg flex items-center justify-center">
									{pictureFile ? (
										<img src={URL.createObjectURL(pictureFile)} alt="Profile" className="w-full h-full object-cover" />
									) : profilePictureUrl && !removePicture ? (
										<img src={profilePictureUrl} alt="Profile" className="w-full h-full object-cover" />
									) : (
										<svg className="w-12 h-12 text-emerald-300 dark:text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
										</svg>
									)}
								</div>

								<label className="absolute bottom-1 right-1 w-10 h-10 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center cursor-pointer transition-all shadow-lg ring-4 ring-white dark:ring-[#111812] hover:scale-105">
									<input
										type="file"
										accept="image/*"
										onChange={handleProfilePicture}
										className="hidden"
									/>
									<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
										<path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
									</svg>
								</label>
							</div>

							<div className="flex-1 text-center sm:text-left">
								<p className="text-lg font-bold text-[#111812] dark:text-[#E8F3EB]">Profile Picture</p>
								<p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">Upload a high-res photo for best results.</p>
								<div className="mt-4 flex flex-wrap items-center gap-3 justify-center sm:justify-start">
									{pictureFile && (
										<span className="text-sm text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2 rounded-lg inline-block">Selected: {pictureFile.name}</span>
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
							</div>
							<div>
								<input
									type="email"
									name="email"
									value={profileForm.email}
									onChange={handleProfileInput}
									placeholder="Email Address"
									required
									className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-gray-800/60 bg-gray-50 dark:bg-[#1A241A] text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 focus:bg-white dark:focus:bg-[#111812] outline-none transition-all placeholder-gray-400"
								/>
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
								</div>
							</div>

								<div className="mt-5 rounded-2xl border border-gray-200 dark:border-gray-800/60 bg-gray-50 dark:bg-[#1A241A] p-4">
									<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
										<p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Current Location</p>
										<div className="flex flex-col sm:flex-row gap-2">
											<button
												type="button"
												onClick={handleUseMyLocation}
												disabled={isDetectingLocation}
												className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40 disabled:opacity-60 px-4 py-2 text-sm font-bold text-emerald-700 dark:text-emerald-400 transition-colors"
											>
												{isDetectingLocation ? "Fetching..." : "Use Current Location"}
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
												className="inline-flex items-center justify-center rounded-xl border border-emerald-300 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 px-4 py-2 text-sm font-bold text-emerald-700 dark:text-emerald-400 transition-colors"
											>
												Select On Map
											</button>
										</div>
									</div>
									{showMapPicker && (
										<div className="mt-3">
											<p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
												Tap on map to set your location.
											</p>
											<div
												ref={mapRef}
												className="h-64 w-full rounded-xl border border-gray-200 dark:border-gray-800/60 overflow-hidden"
											/>
										</div>
									)}
									<p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
										{detectedLocation || "Location not fetched yet."}
									</p>
								{locationDetectError && (
									<p className="mt-2 text-xs font-medium text-red-600 dark:text-red-400">{locationDetectError}</p>
								)}
							</div>

							<div className="pt-6">
							<button
								type="submit"
								disabled={profileSubmitting}
								className="w-full sm:w-auto bg-[#111812] hover:bg-[#1A241A] dark:bg-emerald-600 dark:hover:bg-emerald-500 disabled:opacity-60 text-white font-bold px-8 py-3.5 rounded-2xl transition-all shadow-sm active:scale-95"
							>
								{profileSubmitting ? "Saving..." : "Save Profile"}
							</button>
						</div>
					</form>
				</section>

				<section className="bg-white dark:bg-[#111812] rounded-[32px] border border-gray-100 dark:border-gray-800/60 p-8 sm:p-10 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
					<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
						<h2 className="text-xl font-black text-[#111812] dark:text-[#E8F3EB] tracking-tight">Saved Addresses</h2>
						<button
							type="button"
							onClick={() => {
								setShowAddAddress((prev) => !prev);
								setShowAddressMapPicker(false);
								setAddressError("");
								setAddressMessage("");
							}}
							className="text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 px-5 py-2.5 rounded-xl transition-colors"
						>
							{showAddAddress ? "Cancel" : "+ Add New Address"}
						</button>
					</div>

					{addressMessage && (
						<div className="mb-8 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-sm font-medium rounded-2xl px-5 py-4">
							{addressMessage}
						</div>
					)}
					{addressError && (
						<div className="mb-8 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm font-medium rounded-2xl px-5 py-4">
							{addressError}
						</div>
					)}

					{addresses.length === 0 && !showAddAddress && (
						<div className="text-center py-10 border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
							<p className="text-gray-500 dark:text-gray-400 font-medium">No addresses saved yet.</p>
						</div>
					)}

					{showAddAddress && (
						<form onSubmit={handleCreateAddress} className="mb-10 bg-gray-50/50 dark:bg-gray-900/20 border border-gray-100 dark:border-gray-800/80 rounded-[20px] p-6">
							<div className="mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
								<h3 className="text-lg font-bold text-[#111812] dark:text-white">Add Address</h3>
								<div className="flex flex-col sm:flex-row gap-2">
									<button
										type="button"
										onClick={handleUseCurrentLocationForAddress}
										disabled={isDetectingAddressLocation}
										className="inline-flex items-center justify-center rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40 disabled:opacity-60 px-4 py-2 text-sm font-bold text-emerald-700 dark:text-emerald-400 transition-colors"
									>
										{isDetectingAddressLocation ? "Fetching..." : "Use Current Location"}
									</button>
									<button
										type="button"
										onClick={() => {
											const nextValue = !showAddressMapPicker;
											setShowAddressMapPicker(nextValue);
											if (nextValue) {
												setTimeout(() => initAddressMapPicker(), 0);
											}
										}}
										className="inline-flex items-center justify-center rounded-xl border border-emerald-300 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 px-4 py-2 text-sm font-bold text-emerald-700 dark:text-emerald-400 transition-colors"
									>
										{showAddressMapPicker ? "Hide Map" : "Choose On Map"}
									</button>
								</div>
							</div>
							{showAddressMapPicker && (
								<div className="mb-5">
									<p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
										Tap on map to auto-fill address, city, state and pincode.
									</p>
									<div
										ref={addressMapRef}
										className="h-64 w-full rounded-xl border border-gray-200 dark:border-gray-800/60 overflow-hidden"
									/>
								</div>
							)}
							<div className="grid sm:grid-cols-2 gap-4">
								<input type="text" name="full_name" value={newAddressForm.full_name} onChange={handleAddressInput(setNewAddressForm)} placeholder="Full Name" required className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-gray-800/60 bg-gray-50 dark:bg-[#1A241A] text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 focus:bg-white dark:focus:bg-[#111812] outline-none transition-all placeholder-gray-400" />
								<input type="text" name="phone" value={newAddressForm.phone} onChange={handleAddressInput(setNewAddressForm)} placeholder="Phone" required className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-gray-800/60 bg-gray-50 dark:bg-[#1A241A] text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 focus:bg-white dark:focus:bg-[#111812] outline-none transition-all placeholder-gray-400" />
								<select name="address_type" value={newAddressForm.address_type} onChange={handleAddressInput(setNewAddressForm)} className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-gray-800/60 bg-gray-50 dark:bg-[#1A241A] text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 focus:bg-white dark:focus:bg-[#111812] outline-none transition-all placeholder-gray-400 appearance-none">
									<option value="home">Home</option>
									<option value="work">Work</option>
									<option value="other">Other</option>
								</select>
								<input type="text" name="pincode" value={newAddressForm.pincode} onChange={handleAddressInput(setNewAddressForm)} placeholder="Pincode" required className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-gray-800/60 bg-gray-50 dark:bg-[#1A241A] text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 focus:bg-white dark:focus:bg-[#111812] outline-none transition-all placeholder-gray-400" />
							</div>
							<textarea name="address" value={newAddressForm.address} onChange={handleAddressInput(setNewAddressForm)} placeholder="Address" required rows={3} className="mt-4 w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-gray-800/60 bg-gray-50 dark:bg-[#1A241A] text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 focus:bg-white dark:focus:bg-[#111812] outline-none transition-all placeholder-gray-400" />
							<div className="grid sm:grid-cols-2 gap-4 mt-4">
								<input type="text" name="city" value={newAddressForm.city} onChange={handleAddressInput(setNewAddressForm)} placeholder="City" required className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-gray-800/60 bg-gray-50 dark:bg-[#1A241A] text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 focus:bg-white dark:focus:bg-[#111812] outline-none transition-all placeholder-gray-400" />
								<input type="text" name="state" value={newAddressForm.state} onChange={handleAddressInput(setNewAddressForm)} placeholder="State" required className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-gray-800/60 bg-gray-50 dark:bg-[#1A241A] text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 focus:bg-white dark:focus:bg-[#111812] outline-none transition-all placeholder-gray-400" />
							</div>
							<label className="mt-5 inline-flex items-center gap-3 text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
								<input type="checkbox" name="is_default" checked={newAddressForm.is_default} onChange={handleAddressInput(setNewAddressForm)} className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
								Set as default address
							</label>
							<div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
								<button type="submit" disabled={creatingAddress} className="bg-[#111812] hover:bg-[#1A241A] dark:bg-emerald-600 dark:hover:bg-emerald-500 disabled:opacity-60 text-white font-bold px-8 py-3.5 rounded-2xl transition-all shadow-sm active:scale-95">
									{creatingAddress ? "Saving..." : "Save Address"}
								</button>
							</div>
						</form>
					)}

					<div className="space-y-4">
						{addresses.map((addr) => {
							const isEditing = editingAddressId === addr.id;
							const isUpdatingThis = updatingAddressId === addr.id;
							const isDeletingThis = deletingAddressId === addr.id;
							const isSettingDefaultThis = settingDefaultId === addr.id;

							if (isEditing) {
								return (
									<form key={addr.id} onSubmit={handleUpdateAddress} className="bg-gray-50/50 dark:bg-gray-900/20 border border-gray-100 dark:border-gray-800/80 rounded-[20px] p-6">
										<h3 className="text-lg font-bold text-[#111812] dark:text-white mb-5">Edit Address</h3>
										<div className="grid sm:grid-cols-2 gap-4">
											<input type="text" name="full_name" value={editAddressForm.full_name} onChange={handleAddressInput(setEditAddressForm)} placeholder="Full Name" required className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-gray-800/60 bg-gray-50 dark:bg-[#1A241A] text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 focus:bg-white dark:focus:bg-[#111812] outline-none transition-all placeholder-gray-400" />
											<input type="text" name="phone" value={editAddressForm.phone} onChange={handleAddressInput(setEditAddressForm)} placeholder="Phone" required className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-gray-800/60 bg-gray-50 dark:bg-[#1A241A] text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 focus:bg-white dark:focus:bg-[#111812] outline-none transition-all placeholder-gray-400" />
											<select name="address_type" value={editAddressForm.address_type} onChange={handleAddressInput(setEditAddressForm)} className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-gray-800/60 bg-gray-50 dark:bg-[#1A241A] text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 focus:bg-white dark:focus:bg-[#111812] outline-none transition-all placeholder-gray-400 appearance-none">
												<option value="home">Home</option>
												<option value="work">Work</option>
												<option value="other">Other</option>
											</select>
											<input type="text" name="pincode" value={editAddressForm.pincode} onChange={handleAddressInput(setEditAddressForm)} placeholder="Pincode" required className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-gray-800/60 bg-gray-50 dark:bg-[#1A241A] text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 focus:bg-white dark:focus:bg-[#111812] outline-none transition-all placeholder-gray-400" />
										</div>
										<textarea name="address" value={editAddressForm.address} onChange={handleAddressInput(setEditAddressForm)} placeholder="Address" required rows={3} className="mt-4 w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-gray-800/60 bg-gray-50 dark:bg-[#1A241A] text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 focus:bg-white dark:focus:bg-[#111812] outline-none transition-all placeholder-gray-400" />
										<div className="grid sm:grid-cols-2 gap-4 mt-4">
											<input type="text" name="city" value={editAddressForm.city} onChange={handleAddressInput(setEditAddressForm)} placeholder="City" required className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-gray-800/60 bg-gray-50 dark:bg-[#1A241A] text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 focus:bg-white dark:focus:bg-[#111812] outline-none transition-all placeholder-gray-400" />
											<input type="text" name="state" value={editAddressForm.state} onChange={handleAddressInput(setEditAddressForm)} placeholder="State" required className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-gray-800/60 bg-gray-50 dark:bg-[#1A241A] text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 focus:bg-white dark:focus:bg-[#111812] outline-none transition-all placeholder-gray-400" />
										</div>
										<label className="mt-5 inline-flex items-center gap-3 text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
											<input type="checkbox" name="is_default" checked={editAddressForm.is_default} onChange={handleAddressInput(setEditAddressForm)} className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
											Set as default address
										</label>

										<div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800 flex items-center gap-3">
											<button type="submit" disabled={isUpdatingThis} className="bg-[#111812] hover:bg-[#1A241A] dark:bg-emerald-600 dark:hover:bg-emerald-500 disabled:opacity-60 text-white font-bold px-6 py-3 rounded-2xl transition-all shadow-sm active:scale-95">
												{isUpdatingThis ? "Saving..." : "Save Changes"}
											</button>
											<button type="button" onClick={() => setEditingAddressId(null)} className="px-6 py-3 rounded-2xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-sm font-bold text-gray-700 dark:text-gray-300 transition-colors">
												Cancel
											</button>
										</div>
									</form>
								);
							}

							return (
								<div key={addr.id} className="border border-gray-100 dark:border-gray-800/80 rounded-[20px] p-5 sm:p-6 hover:border-emerald-500/30 dark:hover:border-emerald-500/30 transition-colors shadow-sm">
									<div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
										<div>
											<p className="text-lg font-black text-[#111812] dark:text-[#E8F3EB] leading-tight">
												{addr.full_name}
												<span className="ml-2 text-xs font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-full uppercase tracking-wider">
													{addr.address_type}
												</span>
											</p>
											<p className="text-sm font-medium text-gray-600 dark:text-gray-400 mt-2">{addr.phone}</p>
											<p className="text-sm font-medium text-gray-600 dark:text-gray-400 mt-1">
												{addr.address}, {addr.city}, {addr.state} - {addr.pincode}
											</p>
											{addr.is_default && (
												<span className="inline-block mt-3 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1.5 rounded-lg border border-emerald-200/50 dark:border-emerald-800/50">
													✓ Default Address
												</span>
											)}
										</div>

										<div className="flex flex-wrap gap-2">
											{!addr.is_default && (
												<button
													type="button"
													onClick={() => handleSetDefault(addr.id)}
													disabled={isSettingDefaultThis}
													className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 disabled:opacity-60 text-gray-700 dark:text-gray-300 text-sm font-bold transition-colors"
												>
													{isSettingDefaultThis ? "Setting..." : "Set Default"}
												</button>
											)}
											<button
												type="button"
												onClick={() => startEditAddress(addr)}
												className="px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-sm font-bold transition-colors"
											>
												Edit
											</button>
											<button
												type="button"
												onClick={() => setConfirmDeleteAddressId(addr.id)}
												disabled={isDeletingThis}
												className="px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 disabled:opacity-60 text-red-600 dark:text-red-400 text-sm font-bold transition-colors"
											>
												{isDeletingThis ? "Deleting..." : "Delete"}
											</button>
										</div>
									</div>
								</div>
							);
						})}
					</div>
				</section>
			</div>

			{confirmDeleteAddressId && (
				<div className="fixed inset-0 z-50 flex items-center justify-center px-4">
					<div
						className="absolute inset-0 bg-black/50"
						onClick={() => {
							if (!deletingAddressId) {
								setConfirmDeleteAddressId(null);
							}
						}}
					/>
					<div className="relative w-full max-w-md rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#111812] p-6 shadow-xl">
						<h3 className="text-lg font-black text-[#111812] dark:text-[#E8F3EB]">Delete Address</h3>
						<p className="mt-2 text-sm font-medium text-gray-600 dark:text-gray-400">
							Are you sure you want to delete this address?
						</p>

						<div className="mt-6 flex items-center justify-end gap-3">
							<button
								type="button"
								onClick={() => setConfirmDeleteAddressId(null)}
								disabled={Boolean(deletingAddressId)}
								className="px-5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 disabled:opacity-60 text-sm font-bold text-gray-700 dark:text-gray-300 transition-colors"
							>
								Cancel
							</button>
							<button
								type="button"
								onClick={() => handleDeleteAddress(confirmDeleteAddressId)}
								disabled={Boolean(deletingAddressId)}
								className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-60 text-sm font-bold text-white transition-colors"
							>
								{deletingAddressId === confirmDeleteAddressId ? "Deleting..." : "Delete"}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default CustomerProfile;
