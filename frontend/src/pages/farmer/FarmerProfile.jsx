import { useEffect, useMemo, useState } from "react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

const emptyCertificationForm = {
	certificate_name: "",
	issued_by: "",
	issued_date: "",
	certificate_image: null,
};

const FarmerProfile = () => {
	const { user, login } = useAuth();

	const [loading, setLoading] = useState(true);

	const [profile, setProfile] = useState(null);
	const [profileForm, setProfileForm] = useState({
		first_name: "",
		last_name: "",
		email: "",
		phone: "",
		gender: "",
		location: "",
	});
	const [pictureFile, setPictureFile] = useState(null);
	const [profileSubmitting, setProfileSubmitting] = useState(false);
	const [profileMessage, setProfileMessage] = useState("");
	const [profileError, setProfileError] = useState("");

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
			const certificationsData = Array.isArray(certRes.data) ? certRes.data : [];

			setProfile(profileData);
			setCertifications(certificationsData);

			setProfileForm({
				first_name: profileData.first_name || user?.first_name || "",
				last_name: profileData.last_name || user?.last_name || "",
				email: profileData.email || user?.email || "",
				phone: profileData.phone || user?.phone || "",
				gender: profileData.gender || "",
				location: profileData.location || "",
			});
		} catch {
			setProfileError("Failed to load profile details.");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchProfileAndCertifications();
	}, []);

	const profilePictureUrl = useMemo(() => {
		if (!profile?.picture) return null;
		if (String(profile.picture).startsWith("http")) return profile.picture;
		return `${api.defaults.baseURL}${profile.picture}`;
	}, [profile]);

	const handleProfileInput = (e) => {
		const { name, value } = e.target;
		setProfileForm((prev) => ({ ...prev, [name]: value }));
		setProfileFieldErrors((prev) => ({ ...prev, [name]: undefined }));
	};

	const handlePictureChange = (e) => {
		const file = e.target.files?.[0] || null;
		setPictureFile(file);
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
		if (pictureFile) {
			payload.append("picture", pictureFile);
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
		payload.append("certificate_name", certForm.certificate_name);
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
		if (!path) return null;
		if (String(path).startsWith("http")) return path;
		return `${api.defaults.baseURL}${path}`;
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
			<div className="max-w-6xl mx-auto px-4 py-10">
				<div className="h-8 w-56 bg-gray-200 dark:bg-gray-700 rounded mb-8 animate-pulse" />
				<div className="space-y-5">
					<div className="h-72 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
					<div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
				</div>
			</div>
		);
	}

	return (
		<div className="max-w-6xl mx-auto px-4 py-10 space-y-8">
			<h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Farmer Profile</h1>

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
					<div className="flex flex-col sm:flex-row sm:items-center gap-5">
						<div className="mx-auto sm:mx-0 shrink-0">
							<div className="relative w-28 h-28 rounded-full overflow-hidden border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
								{profilePictureUrl ? (
									<img src={profilePictureUrl} alt="Profile" className="w-full h-full object-cover" />
								) : (
									<div className="w-full h-full flex items-center justify-center text-3xl">👨‍🌾</div>
								)}

								<label className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-black/70 hover:bg-black/80 text-white flex items-center justify-center cursor-pointer transition border border-white/30">
									<input type="file" accept="image/*" onChange={handlePictureChange} className="hidden" />
									<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
									</svg>
								</label>
							</div>
						</div>

						<div className="flex-1 text-center sm:text-left">
							<p className="text-sm font-semibold text-gray-900 dark:text-white">Profile Picture</p>
							<p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Upload a clear photo for better trust.</p>
							{pictureFile && (
								<p className="mt-2 text-xs text-green-600 dark:text-green-400 font-medium">Selected: {pictureFile.name}</p>
							)}
						</div>
					</div>

					<div className="grid sm:grid-cols-2 gap-3">
						<div>
							<input
								type="text"
								name="first_name"
								value={profileForm.first_name}
								onChange={handleProfileInput}
								placeholder="First Name"
								required
								className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
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
								className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
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
								className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
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
								className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
							/>
							{renderProfileError("phone")}
						</div>

						<div>
							<select
								name="gender"
								value={profileForm.gender}
								onChange={handleProfileInput}
								className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
							>
								<option value="">Select Gender</option>
								<option value="male">male</option>
								<option value="female">female</option>
								<option value="other">other</option>
							</select>
							{renderProfileError("gender")}
						</div>

						<div>
							<input
								type="text"
								name="location"
								value={profileForm.location}
								onChange={handleProfileInput}
								placeholder="Location"
								className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
							/>
							{renderProfileError("location")}
						</div>
					</div>

					<button
						type="submit"
						disabled={profileSubmitting}
						className="bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold px-5 py-2.5 rounded-lg transition"
					>
						{profileSubmitting ? "Saving..." : "Save Profile"}
					</button>
				</form>
			</section>

			<section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
				<div className="flex items-center justify-between gap-3 mb-4">
					<h2 className="text-lg font-extrabold text-gray-900 dark:text-white">Certifications</h2>
					<button
						type="button"
						onClick={() => {
							setShowAddCertForm((prev) => !prev);
							setCertError("");
							setCertMessage("");
						}}
						className="text-sm font-semibold text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
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
					<form onSubmit={handleAddCertification} className="mb-6 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
						<h3 className="text-base font-bold text-gray-900 dark:text-white mb-3">Add Certification</h3>

						<div className="grid sm:grid-cols-2 gap-3">
							<div>
								<input
									type="text"
									name="certificate_name"
									value={certForm.certificate_name}
									onChange={handleCertInput}
									placeholder="Certificate Name"
									required
									className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
								/>
								{renderCertError("certificate_name")}
							</div>

							<div>
								<input
									type="text"
									name="issued_by"
									value={certForm.issued_by}
									onChange={handleCertInput}
									placeholder="Issued By"
									required
									className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
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
									className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
								/>
								{renderCertError("issued_date")}
							</div>

							<div>
								<label className="block cursor-pointer rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 hover:bg-gray-100 dark:hover:bg-gray-900 px-4 py-6 text-center transition">
									<input
										type="file"
										accept="image/*"
										onChange={handleCertImage}
										required
										className="hidden"
									/>
									<div className="flex flex-col items-center">
										<svg className="w-8 h-8 text-gray-400 dark:text-gray-500 mb-2" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 014-4h.586A4 4 0 0111 9h2a4 4 0 013.414 2H17a4 4 0 010 8H7a4 4 0 01-4-4z" />
											<path strokeLinecap="round" strokeLinejoin="round" d="M12 12v7m0-7l-3 3m3-3l3 3" />
										</svg>
										<p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Upload certificate image</p>
										<p className="text-xs text-gray-500 dark:text-gray-400 mt-1">PNG, JPG or JPEG (clear text preferred)</p>
									</div>
								</label>
								{certForm.certificate_image && (
									<p className="mt-2 text-xs text-green-600 dark:text-green-400 font-medium">
										Selected: {certForm.certificate_image.name}
									</p>
								)}
								{renderCertError("certificate_image")}
							</div>
						</div>

						<div className="mt-4">
							<button
								type="submit"
								disabled={addingCert}
								className="bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold px-5 py-2.5 rounded-lg transition"
							>
								{addingCert ? "Saving..." : "Save Certification"}
							</button>
						</div>
					</form>
				)}

				{certifications.length === 0 ? (
					<p className="text-sm text-gray-500 dark:text-gray-400">No certifications added yet.</p>
				) : (
					<div className="space-y-3">
						{certifications.map((cert) => {
							const imageUrl = certImageUrl(cert.certificate_image);

							return (
								<div key={cert.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
									<div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
										<div className="space-y-1">
											<p className="font-bold text-gray-900 dark:text-white">{cert.certificate_name}</p>
											<p className="text-sm text-gray-600 dark:text-gray-300">Issued by: {cert.issued_by || "-"}</p>
											<p className="text-sm text-gray-600 dark:text-gray-300">Issued date: {formatDate(cert.issued_date)}</p>

											{cert.is_verified ? (
												<span className="inline-block mt-1 text-xs font-semibold bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 px-2.5 py-1 rounded-full">
													Verified
												</span>
											) : (
												<span className="inline-block mt-1 text-xs font-semibold bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 px-2.5 py-1 rounded-full">
													Pending Verification
												</span>
											)}
										</div>

										<div className="flex items-start gap-3">
											{imageUrl ? (
												<img src={imageUrl} alt={cert.certificate_name} className="w-28 h-20 rounded-lg object-cover border border-gray-200 dark:border-gray-700" />
											) : (
												<div className="w-28 h-20 rounded-lg bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700" />
											)}

											<button
												type="button"
												onClick={() => handleDeleteCertification(cert.id)}
												disabled={deletingCertId === cert.id}
												className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-xs font-semibold"
											>
												{deletingCertId === cert.id ? "Deleting..." : "Delete"}
											</button>
										</div>
									</div>
								</div>
							);
						})}
					</div>
				)}
			</section>
		</div>
	);
};

export default FarmerProfile;
