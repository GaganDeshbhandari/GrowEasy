import { useEffect, useMemo, useState } from "react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

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
	const [profileSubmitting, setProfileSubmitting] = useState(false);
	const [profileMessage, setProfileMessage] = useState("");
	const [profileError, setProfileError] = useState("");

	const [addresses, setAddresses] = useState([]);
	const [addressMessage, setAddressMessage] = useState("");
	const [addressError, setAddressError] = useState("");

	const [showAddAddress, setShowAddAddress] = useState(false);
	const [newAddressForm, setNewAddressForm] = useState(emptyAddressForm);
	const [creatingAddress, setCreatingAddress] = useState(false);

	const [editingAddressId, setEditingAddressId] = useState(null);
	const [editAddressForm, setEditAddressForm] = useState(emptyAddressForm);
	const [updatingAddressId, setUpdatingAddressId] = useState(null);
	const [deletingAddressId, setDeletingAddressId] = useState(null);
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
			const addressList = Array.isArray(addressRes.data) ? addressRes.data : [];

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

	const profilePictureUrl = useMemo(() => {
		if (!profile?.picture) return null;
		if (String(profile.picture).startsWith("http")) return profile.picture;
		return `${api.defaults.baseURL}${profile.picture}`;
	}, [profile]);

	const handleProfileInput = (e) => {
		const { name, value } = e.target;
		setProfileForm((prev) => ({ ...prev, [name]: value }));
	};

	const handleProfilePicture = (e) => {
		const file = e.target.files?.[0] || null;
		setPictureFile(file);
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
			}

			const res = await api.patch("/auth/customer/profile/", formData, {
				headers: {
					"Content-Type": "multipart/form-data",
				},
			});

			setProfile(res.data);
			setPictureFile(null);
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
		const confirmed = window.confirm("Are you sure you want to delete this address?");
		if (!confirmed) return;

		setAddressError("");
		setAddressMessage("");

		try {
			setDeletingAddressId(addressId);
			await api.delete(`/auth/addresses/${addressId}/`);
			setAddresses((prev) => prev.filter((addr) => addr.id !== addressId));
			setAddressMessage("Address deleted successfully.");

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
		<div className="max-w-6xl mx-auto px-4 py-10 space-y-8">
			<h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">My Profile</h1>

			<section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
				<h2 className="text-lg font-extrabold text-gray-900 dark:text-white mb-4">Profile Details</h2>

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
						<div className="mx-auto sm:mx-0 shrink-0">
							<div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white dark:border-gray-800 shadow-lg bg-gray-100 dark:bg-gray-800">
								{profilePictureUrl ? (
									<img src={profilePictureUrl} alt="Profile" className="w-full h-full object-cover" />
								) : (
									<div className="w-full h-full flex items-center justify-center text-4xl">👤</div>
								)}

								<label className="absolute bottom-1 right-1 w-9 h-9 rounded-full bg-black/70 hover:bg-black/90 text-white flex items-center justify-center cursor-pointer transition-colors backdrop-blur-sm border border-white/20 shadow-sm">
									<input
										type="file"
										accept="image/*"
										onChange={handleProfilePicture}
										className="hidden"
									/>
									<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
									</svg>
								</label>
							</div>
						</div>

						<div className="flex-1 text-center sm:text-left">
							<p className="text-base font-bold text-gray-900 dark:text-white">Profile Picture</p>
							<p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Upload a square photo for best results.</p>
							{pictureFile && (
								<p className="mt-2 text-sm text-green-600 dark:text-green-400 font-semibold bg-green-50 dark:bg-green-900/30 inline-block px-3 py-1 rounded-full">Selected: {pictureFile.name}</p>
							)}
						</div>
					</div>

					<div className="grid sm:grid-cols-2 gap-5">
						<div className="space-y-1">
							<label className="text-sm font-semibold text-gray-700 dark:text-gray-300">First Name</label>
							<input
								type="text"
								name="first_name"
								value={profileForm.first_name}
								onChange={handleProfileInput}
								placeholder="First Name"
								required
								className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500/50 shadow-sm transition-all"
							/>
						</div>
						<div className="space-y-1">
							<label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Last Name</label>
							<input
								type="text"
								name="last_name"
								value={profileForm.last_name}
								onChange={handleProfileInput}
								placeholder="Last Name"
								className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500/50 shadow-sm transition-all"
							/>
						</div>
						<div className="space-y-1">
							<label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Email Address</label>
							<input
								type="email"
								name="email"
								value={profileForm.email}
								onChange={handleProfileInput}
								placeholder="Email"
								required
								className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500/50 shadow-sm transition-all"
							/>
						</div>
						<div className="space-y-1">
							<label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Phone</label>
							<input
								type="text"
								name="phone"
								value={profileForm.phone}
								onChange={handleProfileInput}
								placeholder="Phone"
								required
								className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500/50 shadow-sm transition-all"
							/>
						</div>
					</div>

					<div className="mt-8">
						<button
							type="submit"
							disabled={profileSubmitting}
							className="w-full sm:w-auto bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-bold px-8 py-3 rounded-xl transition-all shadow-md hover:shadow-lg focus:ring-2 focus:ring-green-500/50 focus:outline-none"
						>
							{profileSubmitting ? "Saving..." : "Save Profile"}
						</button>
					</div>
				</form>
			</section>

			<section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
				<div className="flex items-center justify-between gap-3 mb-4">
					<h2 className="text-lg font-extrabold text-gray-900 dark:text-white">Saved Addresses</h2>
					<button
						type="button"
						onClick={() => {
							setShowAddAddress((prev) => !prev);
							setAddressError("");
							setAddressMessage("");
						}}
						className="text-sm font-semibold text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
					>
						{showAddAddress ? "Cancel" : "+ Add New Address"}
					</button>
				</div>

				{addressMessage && (
					<div className="mb-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 text-sm rounded-lg px-3 py-2">
						{addressMessage}
					</div>
				)}
				{addressError && (
					<div className="mb-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm rounded-lg px-3 py-2">
						{addressError}
					</div>
				)}

				{addresses.length === 0 && !showAddAddress && (
					<p className="text-sm text-gray-500 dark:text-gray-400 mb-4">No address saved yet.</p>
				)}

				{showAddAddress && (
					<form onSubmit={handleCreateAddress} className="mb-6 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
						<h3 className="text-base font-bold text-gray-900 dark:text-white mb-3">Add Address</h3>
						<div className="grid sm:grid-cols-2 gap-3">
							<input type="text" name="full_name" value={newAddressForm.full_name} onChange={handleAddressInput(setNewAddressForm)} placeholder="Full Name" required className="px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white" />
							<input type="text" name="phone" value={newAddressForm.phone} onChange={handleAddressInput(setNewAddressForm)} placeholder="Phone" required className="px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white" />
							<select name="address_type" value={newAddressForm.address_type} onChange={handleAddressInput(setNewAddressForm)} className="px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
								<option value="home">home</option>
								<option value="work">work</option>
								<option value="other">other</option>
							</select>
							<input type="text" name="pincode" value={newAddressForm.pincode} onChange={handleAddressInput(setNewAddressForm)} placeholder="Pincode" required className="px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white" />
						</div>
						<textarea name="address" value={newAddressForm.address} onChange={handleAddressInput(setNewAddressForm)} placeholder="Address" required rows={3} className="mt-3 w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white" />
						<div className="grid sm:grid-cols-2 gap-3 mt-3">
							<input type="text" name="city" value={newAddressForm.city} onChange={handleAddressInput(setNewAddressForm)} placeholder="City" required className="px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white" />
							<input type="text" name="state" value={newAddressForm.state} onChange={handleAddressInput(setNewAddressForm)} placeholder="State" required className="px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white" />
						</div>
						<label className="mt-3 inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
							<input type="checkbox" name="is_default" checked={newAddressForm.is_default} onChange={handleAddressInput(setNewAddressForm)} />
							Set as default
						</label>
						<div className="mt-4">
							<button type="submit" disabled={creatingAddress} className="bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold px-5 py-2.5 rounded-lg transition">
								{creatingAddress ? "Saving..." : "Save Address"}
							</button>
						</div>
					</form>
				)}

				<div className="space-y-3">
					{addresses.map((addr) => {
						const isEditing = editingAddressId === addr.id;
						const isUpdatingThis = updatingAddressId === addr.id;
						const isDeletingThis = deletingAddressId === addr.id;
						const isSettingDefaultThis = settingDefaultId === addr.id;

						if (isEditing) {
							return (
								<form key={addr.id} onSubmit={handleUpdateAddress} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
									<h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Edit Address</h3>
									<div className="grid sm:grid-cols-2 gap-3">
										<input type="text" name="full_name" value={editAddressForm.full_name} onChange={handleAddressInput(setEditAddressForm)} placeholder="Full Name" required className="px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white" />
										<input type="text" name="phone" value={editAddressForm.phone} onChange={handleAddressInput(setEditAddressForm)} placeholder="Phone" required className="px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white" />
										<select name="address_type" value={editAddressForm.address_type} onChange={handleAddressInput(setEditAddressForm)} className="px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
											<option value="home">home</option>
											<option value="work">work</option>
											<option value="other">other</option>
										</select>
										<input type="text" name="pincode" value={editAddressForm.pincode} onChange={handleAddressInput(setEditAddressForm)} placeholder="Pincode" required className="px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white" />
									</div>
									<textarea name="address" value={editAddressForm.address} onChange={handleAddressInput(setEditAddressForm)} placeholder="Address" required rows={3} className="mt-3 w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white" />
									<div className="grid sm:grid-cols-2 gap-3 mt-3">
										<input type="text" name="city" value={editAddressForm.city} onChange={handleAddressInput(setEditAddressForm)} placeholder="City" required className="px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white" />
										<input type="text" name="state" value={editAddressForm.state} onChange={handleAddressInput(setEditAddressForm)} placeholder="State" required className="px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white" />
									</div>
									<label className="mt-3 inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
										<input type="checkbox" name="is_default" checked={editAddressForm.is_default} onChange={handleAddressInput(setEditAddressForm)} />
										Set as default
									</label>

									<div className="mt-4 flex items-center gap-2">
										<button type="submit" disabled={isUpdatingThis} className="bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold px-4 py-2 rounded-lg transition">
											{isUpdatingThis ? "Saving..." : "Save Changes"}
										</button>
										<button type="button" onClick={() => setEditingAddressId(null)} className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-300">
											Cancel
										</button>
									</div>
								</form>
							);
						}

						return (
							<div key={addr.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
								<div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
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

									<div className="flex flex-wrap gap-2">
										{!addr.is_default && (
											<button
												type="button"
												onClick={() => handleSetDefault(addr.id)}
												disabled={isSettingDefaultThis}
												className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-semibold"
											>
												{isSettingDefaultThis ? "Setting..." : "Set Default"}
											</button>
										)}
										<button
											type="button"
											onClick={() => startEditAddress(addr)}
											className="px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-semibold"
										>
											Edit
										</button>
										<button
											type="button"
											onClick={() => handleDeleteAddress(addr.id)}
											disabled={isDeletingThis}
											className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-xs font-semibold"
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
	);
};

export default CustomerProfile;
