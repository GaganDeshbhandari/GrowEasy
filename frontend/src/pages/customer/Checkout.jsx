import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api/axios";

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

	const [loading, setLoading] = useState(true);
	const [placingOrder, setPlacingOrder] = useState(false);

	const [cart, setCart] = useState(null);
	const [addresses, setAddresses] = useState([]);
	const [selectedAddressId, setSelectedAddressId] = useState(null);

	const [showAddAddress, setShowAddAddress] = useState(false);
	const [addressForm, setAddressForm] = useState(initialAddressForm);
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const [isLocationFetching, setIsLocationFetching] = useState(false);
	const [showMapPicker, setShowMapPicker] = useState(false);
	const [leafletReady, setLeafletReady] = useState(false);
	const mapRef = useRef(null);
	const mapInstanceRef = useRef(null);

	const [pageError, setPageError] = useState("");
	const [addressError, setAddressError] = useState("");
	const [submitError, setSubmitError] = useState("");

	const fetchCheckoutData = async () => {
		try {
			setLoading(true);
			setPageError("");

			const [cartRes, addressRes] = await Promise.all([
				api.get("/orders/cart/"),
				api.get("/auth/addresses/"),
			]);

			const cartData = cartRes.data;
			const cartItems = cartData?.items || [];

			if (cartItems.length === 0) {
				navigate("/cart", { replace: true });
				return;
			}

			const addressPayload = addressRes.data;
			const addressList = Array.isArray(addressPayload)
				? addressPayload
				: Array.isArray(addressPayload?.results)
					? addressPayload.results
					: [];
			const defaultAddress = addressList.find((addr) => addr.is_default);

			setCart(cartData);
			setAddresses(addressList);
			setSelectedAddressId(defaultAddress ? defaultAddress.id : (addressList[0]?.id ?? null));
		} catch {
			setPageError("Failed to load checkout details. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchCheckoutData();
	}, []);

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

	const selectedAddress = useMemo(
		() => addresses.find((addr) => addr.id === selectedAddressId) || null,
		[addresses, selectedAddressId]
	);

	const cartItems = cart?.items || [];
	const totalPrice = parseFloat(cart?.total || 0);

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
			city:
				addr.city ||
				addr.town ||
				addr.village ||
				addr.hamlet ||
				addr.municipality ||
				addr.county ||
				"",
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
				setAddressError("");
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
				setAddressError(error?.message || "Unable to fetch address from map.");
			}
		});

		mapInstanceRef.current = map;
		setTimeout(() => map.invalidateSize(), 0);
	};

	const handleUseMyLocation = async () => {
		setAddressError("");
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
			setAddressError(error?.message || "Unable to fetch location. Please try again.");
		} finally {
			setIsLocationFetching(false);
		}
	};

	const handleAddAddress = async (e) => {
		e.preventDefault();
		setAddressError("");

		try {
			const res = await api.post("/auth/addresses/", addressForm);
			const newAddress = res.data;

			setAddresses((prev) => [newAddress, ...prev]);
			setSelectedAddressId(newAddress.id);
			setAddressForm(initialAddressForm);
			setShowAddAddress(false);
			setShowMapPicker(false);
		} catch {
			setAddressError("Failed to save address. Please check details and try again.");
		}
	};

	const placeOrderWithSelectedAddress = async () => {
		if (!selectedAddress) {
			setSubmitError("Please select a delivery address");
			return;
		}

		setSubmitError("");
		setPlacingOrder(true);

		try {
			try {
				await api.post("/orders/orders/", { address_id: selectedAddress.id });
			} catch {
				await api.post("/orders/orders/", {
					address_full_name: selectedAddress.full_name,
					address_phone: selectedAddress.phone,
					address_line: selectedAddress.address,
					address_city: selectedAddress.city,
					address_state: selectedAddress.state,
					address_pincode: selectedAddress.pincode,
					address_type: selectedAddress.address_type,
				});
			}

			setCart((prev) => ({ ...(prev || {}), items: [], total: 0 }));
			navigate("/orders", { replace: true });
		} catch {
			setSubmitError("Failed to place order. Please try again.");
		} finally {
			setPlacingOrder(false);
		}
	};

	if (loading) {
		return (
			<div className="max-w-7xl mx-auto px-4 py-12 md:py-20 text-gray-900 dark:text-gray-100 transition-colors duration-300">
				<div className="h-10 w-48 bg-gray-200 dark:bg-[#1A241A] rounded-2xl animate-pulse mb-8" />
				<div className="grid lg:grid-cols-12 gap-8 lg:gap-12">
					<div className="lg:col-span-8 space-y-6">
						<div className="h-40 bg-gray-200 dark:bg-[#111812] rounded-[24px] animate-pulse" />
					</div>
					<div className="lg:col-span-4">
						<div className="h-96 bg-gray-200 dark:bg-[#111812] rounded-[24px] animate-pulse" />
					</div>
				</div>
			</div>
		);
	}

	if (pageError) {
		return (
			<div className="max-w-4xl mx-auto px-4 py-24 text-center">
				<p className="text-xl font-black text-red-600 dark:text-red-400 mb-6">{pageError}</p>
				<button
					onClick={fetchCheckoutData}
					className="px-8 py-3.5 bg-[#111812] hover:bg-[#1A241A] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-sm active:scale-95"
				>
					Retry
				</button>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-[#FDFBF7] dark:bg-[#0A0F0D] transition-colors duration-500 py-12 md:py-20">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				
				<div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
					<div>
						<Link
							to="/cart"
							className="inline-flex items-center gap-2 text-xs font-black text-gray-400 hover:text-[#111812] dark:hover:text-white uppercase tracking-widest transition-colors mb-3 group"
						>
							<svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
							Back to Cart
						</Link>
						<h1 className="text-4xl md:text-5xl font-black text-[#111812] dark:text-[#E8F3EB] tracking-tight leading-none">
							Checkout
						</h1>
					</div>
				</div>

			{submitError && (
				<div className="mb-6 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm font-medium rounded-lg px-4 py-3">
					{submitError}
				</div>
			)}

			<div className="grid lg:grid-cols-12 gap-8 lg:gap-12">
				<div className="lg:col-span-8 space-y-8">
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
								onClick={() => {
									setShowAddAddress((prev) => !prev);
									setShowMapPicker(false);
								}}
								className="text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2 rounded-xl"
							>
								{showAddAddress ? "Cancel" : "+ Add New Address"}
							</button>
						</div>

						{addresses.length === 0 && !showAddAddress && (
							<div className="text-center py-8 bg-gray-50 dark:bg-[#1A241A] rounded-2xl border border-dashed border-gray-200 dark:border-gray-800/60">
								<p className="text-sm font-bold text-gray-500 dark:text-gray-400">
									No saved address found. Please add one to continue.
								</p>
							</div>
						)}

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
												onChange={() => {
													setSelectedAddressId(addr.id);
													setSubmitError("");
												}}
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
												{addr.is_default && (
													<span className="text-[10px] font-black uppercase tracking-widest text-[#111812] dark:text-[#E8F3EB] bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-md">
														Default
													</span>
												)}
											</div>
											<p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">{addr.phone}</p>
											<p className="text-sm font-medium text-[#111812] dark:text-gray-300 leading-relaxed">
												{addr.address}, <br/>{addr.city}, {addr.state} - <span className="font-bold">{addr.pincode}</span>
											</p>
										</div>
									</div>
								</label>
							))}
						</div>

							{showAddAddress && (
								<form onSubmit={handleAddAddress} className="mt-8 border-t-2 border-dashed border-gray-100 dark:border-gray-800/60 pt-8 animate-in fade-in slide-in-from-top-4 duration-500">
									<h3 className="text-xl font-black text-[#111812] dark:text-[#E8F3EB] tracking-tight mb-6 flex items-center gap-2">
										<svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
										Add New Address
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

									{addressError && (
										<div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200/50 dark:border-red-800/50 text-red-700 dark:text-red-400 text-sm font-bold rounded-[16px] px-5 py-4 flex items-start gap-3">
											<svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
											{addressError}
										</div>
									)}

									<div className="grid sm:grid-cols-2 gap-5 mb-5">
										<div className="space-y-1.5">
											<label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 ml-1">Full Name</label>
											<input
												type="text"
												name="full_name"
												value={addressForm.full_name}
												onChange={handleAddressInput}
												placeholder="Jane Doe"
												required
												className="w-full px-5 py-3.5 rounded-[16px] border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-[#1A241A] text-[#111812] dark:text-white font-medium focus:outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all"
											/>
										</div>
										<div className="space-y-1.5">
											<label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 ml-1">Phone</label>
											<input
												type="text"
												name="phone"
												value={addressForm.phone}
												onChange={handleAddressInput}
												placeholder="+91 9876543210"
												required
												className="w-full px-5 py-3.5 rounded-[16px] border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-[#1A241A] text-[#111812] dark:text-white font-medium focus:outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all"
											/>
										</div>

										<div className="space-y-1.5 relative">
											<label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 ml-1">Address Type</label>
											<div
												onClick={() => setIsDropdownOpen(!isDropdownOpen)}
												className={`w-full flex items-center justify-between px-5 py-3.5 rounded-[16px] border bg-gray-50/50 dark:bg-[#1A241A] text-[#111812] dark:text-white font-bold cursor-pointer transition-all outline-none ${
													isDropdownOpen 
														? "border-emerald-500 ring-4 ring-emerald-500/20 bg-white" 
														: "border-gray-200 dark:border-gray-800"
												}`}
												tabIndex={0}
											>
												<span className="capitalize">{addressForm.address_type}</span>
												<svg
													className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${isDropdownOpen ? "rotate-180" : ""}`}
													fill="none"
													stroke="currentColor"
													viewBox="0 0 24 24"
												>
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
												</svg>
											</div>

											{isDropdownOpen && (
												<>
													<div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
													<div className="absolute z-50 w-full mt-2 p-2 bg-white dark:bg-[#111812] border border-gray-100 dark:border-gray-800 rounded-[16px] shadow-[0_8px_30px_rgb(0,0,0,0.12)] animate-in fade-in slide-in-from-top-2 duration-200 flex flex-col gap-1">
														{["home", "work", "other"].map((type) => (
															<button
																key={type}
																type="button"
																onClick={() => {
																	setAddressForm(prev => ({ ...prev, address_type: type }));
																	setIsDropdownOpen(false);
																}}
																className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-colors capitalize ${
																	addressForm.address_type === type 
																	? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' 
																	: 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1A241A]'
																}`}
															>
																{type}
																{addressForm.address_type === type && (
																	<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
																		<path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
																	</svg>
																)}
															</button>
														))}
													</div>
												</>
											)}
										</div>
										<div className="space-y-1.5">
											<label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 ml-1">Pincode</label>
											<input
												type="text"
												name="pincode"
												value={addressForm.pincode}
												onChange={handleAddressInput}
												placeholder="110001"
												required
												className="w-full px-5 py-3.5 rounded-[16px] border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-[#1A241A] text-[#111812] dark:text-white font-medium focus:outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all"
											/>
										</div>
									</div>

									<div className="mb-5 space-y-1.5">
										<label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 ml-1">Address Line</label>
										<textarea
											name="address"
											value={addressForm.address}
											onChange={handleAddressInput}
											placeholder="Street address, P.O. box, company name, c/o"
											required
											rows={3}
											className="w-full px-5 py-4 rounded-[16px] border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-[#1A241A] text-[#111812] dark:text-white font-medium focus:outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all resize-none"
										/>
									</div>

									<div className="grid sm:grid-cols-2 gap-5 mb-6">
										<div className="space-y-1.5">
											<label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 ml-1">City</label>
											<input
												type="text"
												name="city"
												value={addressForm.city}
												onChange={handleAddressInput}
												placeholder="City"
												required
												className="w-full px-5 py-3.5 rounded-[16px] border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-[#1A241A] text-[#111812] dark:text-white font-medium focus:outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all"
											/>
										</div>
										<div className="space-y-1.5">
											<label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 ml-1">State</label>
											<input
												type="text"
												name="state"
												value={addressForm.state}
												onChange={handleAddressInput}
												placeholder="State"
												required
												className="w-full px-5 py-3.5 rounded-[16px] border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-[#1A241A] text-[#111812] dark:text-white font-medium focus:outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all"
											/>
										</div>
									</div>

									<div className="mb-8 p-5 rounded-[16px] border border-gray-200/60 dark:border-gray-800/60 bg-gray-50/50 dark:bg-[#1A241A]/50 flex items-center gap-3 cursor-pointer group" onClick={() => handleAddressInput({ target: { name: 'is_default', type: 'checkbox', checked: !addressForm.is_default }})}>
										<div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${addressForm.is_default ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 group-hover:border-emerald-400'}`}>
											{addressForm.is_default && <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
										</div>
										<span className="text-sm font-bold text-gray-700 dark:text-gray-300 select-none">
											Set as default delivery address
										</span>
									</div>

									<div className="flex flex-col sm:flex-row gap-4">
										<button
											type="submit"
											className="flex-1 bg-[#111812] hover:bg-[#1A241A] dark:bg-emerald-600 dark:hover:bg-emerald-500 active:scale-[0.98] text-white font-black text-lg py-4 px-8 rounded-[20px] shadow-sm transition-all flex items-center justify-center gap-3 group"
										>
											<svg className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
											Save Target Address
										</button>
									</div>
								</form>
							)}
					</section>
				</div>

				<aside className="lg:col-span-4">
					<div className="bg-white dark:bg-[#111812] rounded-[24px] border border-gray-100 dark:border-gray-800/60 p-6 sm:p-8 shadow-[0_4px_20px_rgb(0,0,0,0.02)] sticky top-[104px]">
						<h2 className="text-xl font-black text-[#111812] dark:text-[#E8F3EB] tracking-tight mb-6">Order Summary</h2>

						<div className="space-y-4">
							{cartItems.map((item) => (
								<div key={item.id} className="flex items-start justify-between gap-4">
									<div className="flex-1 min-w-0">
										<p className="font-bold text-sm text-[#111812] dark:text-[#E8F3EB] truncate">{item.product?.name}</p>
										<p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mt-1">
											{parseFloat(item.quantity)} × ₹{parseFloat(item.product?.price || 0).toFixed(2)}
										</p>
									</div>
									<p className="font-black text-sm text-emerald-700 dark:text-emerald-400 shrink-0">
										₹{parseFloat(item.total || 0).toFixed(2)}
									</p>
								</div>
							))}
						</div>

						<div className="border-t-2 border-dashed border-gray-100 dark:border-gray-800/60 my-6" />

						<div className="flex items-end justify-between mb-8">
							<span className="text-base font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Total</span>
							<span className="text-4xl font-black text-[#111812] dark:text-[#E8F3EB] tracking-tight leading-none">
								<span className="text-xl text-emerald-600 mr-1">₹</span>{totalPrice.toFixed(2)}
							</span>
						</div>

						<button
							onClick={placeOrderWithSelectedAddress}
							disabled={placingOrder}
							className="w-full bg-[#111812] hover:bg-[#1A241A] dark:bg-emerald-600 dark:hover:bg-emerald-500 disabled:opacity-60 text-white font-black text-lg py-5 px-6 rounded-[20px] shadow-sm transition-all active:scale-[0.98] flex items-center justify-center gap-3 group"
						>
							{placingOrder ? (
								<span className="animate-pulse">Processing...</span>
							) : (
								<>
									Place Order Now
									<svg className="w-6 h-6 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
								</>
							)}
						</button>
					</div>
				</aside>
			</div>
		</div>
		</div>
	);
};

export default Checkout;
