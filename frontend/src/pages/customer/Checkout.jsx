import { useEffect, useMemo, useState } from "react";
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
		return {
			address: [addr.road, addr.suburb, addr.neighbourhood].filter(Boolean).join(", "),
			city: addr.city || addr.town || addr.village || addr.hamlet || "",
			state: addr.state || addr.county || "",
			pincode: addr.postcode || "",
		};
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
			<div className="max-w-6xl mx-auto px-4 py-10">
				<div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-6" />
				<div className="grid lg:grid-cols-3 gap-8">
					<div className="lg:col-span-2 space-y-4">
						<div className="h-28 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
						<div className="h-28 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
					</div>
					<div className="h-80 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
				</div>
			</div>
		);
	}

	if (pageError) {
		return (
			<div className="max-w-4xl mx-auto px-4 py-16 text-center">
				<p className="text-red-600 dark:text-red-400 font-semibold mb-4">{pageError}</p>
				<button
					onClick={fetchCheckoutData}
					className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition"
				>
					Retry
				</button>
			</div>
		);
	}

	return (
		<div className="max-w-6xl mx-auto px-4 py-10">
			<div className="flex items-center justify-between mb-8">
				<h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Checkout</h1>
				<Link
					to="/cart"
					className="text-sm font-semibold text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
				>
					Back to Cart
				</Link>
			</div>

			{submitError && (
				<div className="mb-6 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm font-medium rounded-lg px-4 py-3">
					{submitError}
				</div>
			)}

			<div className="grid lg:grid-cols-3 gap-8">
				<div className="lg:col-span-2 space-y-6">
					<section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
						<div className="flex items-center justify-between mb-4">
							<h2 className="text-lg font-extrabold text-gray-900 dark:text-white">Delivery Address</h2>
							<button
								type="button"
								onClick={() => setShowAddAddress((prev) => !prev)}
								className="text-sm font-semibold text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
							>
								{showAddAddress ? "Cancel" : "+ Add New Address"}
							</button>
						</div>

						{addresses.length === 0 && !showAddAddress && (
							<p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
								No saved address found. Please add one to continue.
							</p>
						)}

						<div className="space-y-3">
							{addresses.map((addr) => (
								<label
									key={addr.id}
									className={`block rounded-lg border p-4 cursor-pointer transition ${
										selectedAddressId === addr.id
											? "border-green-600 bg-green-50 dark:bg-green-900/20"
											: "border-gray-200 dark:border-gray-700 hover:border-green-400"
									}`}
								>
									<div className="flex items-start gap-3">
										<input
											type="radio"
											name="selected_address"
											className="mt-1"
											checked={selectedAddressId === addr.id}
											onChange={() => {
												setSelectedAddressId(addr.id);
												setSubmitError("");
											}}
										/>
										<div>
											<p className="font-bold text-gray-900 dark:text-white">
												{addr.full_name} ({addr.address_type})
											</p>
											<p className="text-sm text-gray-600 dark:text-gray-300">{addr.phone}</p>
											<p className="text-sm text-gray-600 dark:text-gray-300">
												{addr.address}, {addr.city}, {addr.state} - {addr.pincode}
											</p>
											{addr.is_default && (
												<span className="inline-block mt-2 text-xs font-semibold text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/40 px-2 py-1 rounded">
													Default
												</span>
											)}
										</div>
									</div>
								</label>
							))}
						</div>

							{showAddAddress && (
								<form onSubmit={handleAddAddress} className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
									<h3 className="text-base font-bold text-gray-900 dark:text-white mb-4">Add New Address</h3>
									<button
										type="button"
										onClick={handleUseMyLocation}
										disabled={isLocationFetching}
										className="mb-4 inline-flex items-center gap-2 rounded-xl bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/40 disabled:opacity-60 px-4 py-2 text-sm font-bold text-green-700 dark:text-green-400 transition-colors"
									>
										{isLocationFetching ? "Fetching..." : "Use My Location"}
									</button>

									{addressError && (
										<div className="mb-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm rounded-lg px-3 py-2">
										{addressError}
									</div>
								)}

								<div className="grid sm:grid-cols-2 gap-4">
									<div className="space-y-1">
										<label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Full Name</label>
										<input
											type="text"
											name="full_name"
											value={addressForm.full_name}
											onChange={handleAddressInput}
											placeholder="Jane Doe"
											required
											className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500/50 shadow-sm transition-all"
										/>
									</div>
									<div className="space-y-1">
										<label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Phone</label>
										<input
											type="text"
											name="phone"
											value={addressForm.phone}
											onChange={handleAddressInput}
											placeholder="+91 9876543210"
											required
											className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500/50 shadow-sm transition-all"
										/>
									</div>

									<div className="space-y-1 relative">
										<label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Address Type</label>
										<button
											type="button"
											onClick={() => setIsDropdownOpen(!isDropdownOpen)}
											className="w-full flex items-center justify-between px-4 py-3 text-left rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white hover:border-gray-400 dark:hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all shadow-sm"
										>
											<span className="capitalize">{addressForm.address_type}</span>
											<svg
												className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${isDropdownOpen ? "rotate-180" : ""}`}
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
											</svg>
										</button>

										{isDropdownOpen && (
											<>
												<div
													className="fixed inset-0 z-10"
													onClick={() => setIsDropdownOpen(false)}
												></div>
												<div className="absolute z-20 w-full mt-2 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
													{["home", "work", "other"].map((type) => (
														<button
															key={type}
															type="button"
															onClick={() => {
																setAddressForm(prev => ({ ...prev, address_type: type }));
																setIsDropdownOpen(false);
															}}
															className={`w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors capitalize ${
																addressForm.address_type === type ? 'text-green-600 dark:text-green-400 font-semibold' : 'text-gray-700 dark:text-gray-200'
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
									<div className="space-y-1">
										<label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Pincode</label>
										<input
											type="text"
											name="pincode"
											value={addressForm.pincode}
											onChange={handleAddressInput}
											placeholder="110001"
											required
											className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500/50 shadow-sm transition-all"
										/>
									</div>
								</div>

								<div className="mt-4 space-y-1">
									<label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Address Line</label>
									<textarea
										name="address"
										value={addressForm.address}
										onChange={handleAddressInput}
										placeholder="Street address, P.O. box, company name, c/o"
										required
										rows={3}
										className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500/50 shadow-sm transition-all resize-none"
									/>
								</div>

								<div className="grid sm:grid-cols-2 gap-4 mt-4">
									<div className="space-y-1">
										<label className="text-sm font-semibold text-gray-700 dark:text-gray-300">City</label>
										<input
											type="text"
											name="city"
											value={addressForm.city}
											onChange={handleAddressInput}
											placeholder="City"
											required
											className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500/50 shadow-sm transition-all"
										/>
									</div>
									<div className="space-y-1">
										<label className="text-sm font-semibold text-gray-700 dark:text-gray-300">State</label>
										<input
											type="text"
											name="state"
											value={addressForm.state}
											onChange={handleAddressInput}
											placeholder="State"
											required
											className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500/50 shadow-sm transition-all"
										/>
									</div>
								</div>

								<div className="mt-5 flex items-center">
									<input
										type="checkbox"
										id="is_default"
										name="is_default"
										checked={addressForm.is_default}
										onChange={handleAddressInput}
										className="w-5 h-5 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 dark:focus:ring-green-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 transition-colors cursor-pointer"
									/>
									<label htmlFor="is_default" className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
										Set as default delivery address
									</label>
								</div>

								<div className="mt-6">
									<button
										type="submit"
										className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white font-bold px-8 py-3.5 rounded-xl transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 focus:ring-2 focus:ring-green-500/50 focus:outline-none"
									>
										Save Address
									</button>
								</div>
							</form>
						)}
					</section>
				</div>

				<aside className="lg:col-span-1">
					<div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 sticky top-24">
						<h2 className="text-lg font-extrabold text-gray-900 dark:text-white mb-4">Order Summary</h2>

						<div className="space-y-3">
							{cartItems.map((item) => (
								<div key={item.id} className="flex items-start justify-between gap-3 text-sm">
									<div className="text-gray-600 dark:text-gray-300">
										<p className="font-medium text-gray-900 dark:text-white">{item.product?.name}</p>
										<p>
											Qty: {parseFloat(item.quantity)} × ₹{parseFloat(item.product?.price || 0).toFixed(2)}
										</p>
									</div>
									<p className="font-bold text-gray-900 dark:text-white whitespace-nowrap">
										₹{parseFloat(item.total || 0).toFixed(2)}
									</p>
								</div>
							))}
						</div>

						<div className="border-t border-gray-200 dark:border-gray-700 my-5" />

						<div className="flex items-center justify-between mb-5">
							<span className="font-bold text-gray-900 dark:text-white">Total</span>
							<span className="text-2xl font-black text-green-600 dark:text-green-400">
								₹{totalPrice.toFixed(2)}
							</span>
						</div>

						<button
							onClick={placeOrderWithSelectedAddress}
							disabled={placingOrder}
							className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-bold py-3 rounded-lg transition"
						>
							{placingOrder ? "Placing Order..." : "Place Order"}
						</button>
					</div>
				</aside>
			</div>
		</div>
	);
};

export default Checkout;
