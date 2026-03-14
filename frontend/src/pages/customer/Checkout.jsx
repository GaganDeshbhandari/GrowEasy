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

			const addressList = Array.isArray(addressRes.data) ? addressRes.data : [];
			const defaultAddress = addressList.find((addr) => addr.is_default);

			setCart(cartData);
			setAddresses(addressList);
			setSelectedAddressId(defaultAddress ? defaultAddress.id : null);
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

								{addressError && (
									<div className="mb-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm rounded-lg px-3 py-2">
										{addressError}
									</div>
								)}

								<div className="grid sm:grid-cols-2 gap-3">
									<input
										type="text"
										name="full_name"
										value={addressForm.full_name}
										onChange={handleAddressInput}
										placeholder="Full Name"
										required
										className="px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
									/>
									<input
										type="text"
										name="phone"
										value={addressForm.phone}
										onChange={handleAddressInput}
										placeholder="Phone"
										required
										className="px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
									/>
									<select
										name="address_type"
										value={addressForm.address_type}
										onChange={handleAddressInput}
										className="px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
									>
										<option value="home">home</option>
										<option value="work">work</option>
										<option value="other">other</option>
									</select>
									<input
										type="text"
										name="pincode"
										value={addressForm.pincode}
										onChange={handleAddressInput}
										placeholder="Pincode"
										required
										className="px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
									/>
								</div>

								<textarea
									name="address"
									value={addressForm.address}
									onChange={handleAddressInput}
									placeholder="Address Line"
									required
									rows={3}
									className="mt-3 w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
								/>

								<div className="grid sm:grid-cols-2 gap-3 mt-3">
									<input
										type="text"
										name="city"
										value={addressForm.city}
										onChange={handleAddressInput}
										placeholder="City"
										required
										className="px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
									/>
									<input
										type="text"
										name="state"
										value={addressForm.state}
										onChange={handleAddressInput}
										placeholder="State"
										required
										className="px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
									/>
								</div>

								<label className="mt-3 inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
									<input
										type="checkbox"
										name="is_default"
										checked={addressForm.is_default}
										onChange={handleAddressInput}
									/>
									Set as default address
								</label>

								<div className="mt-4">
									<button
										type="submit"
										className="bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-2.5 rounded-lg transition"
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
