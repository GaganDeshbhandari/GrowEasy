import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios";

const EditProduct = () => {
	const { id } = useParams();
	const navigate = useNavigate();

	const [loading, setLoading] = useState(true);
	const [notFound, setNotFound] = useState(false);

	const [categories, setCategories] = useState([]);
	const [form, setForm] = useState({
		name: "",
		price: "",
		stock: "",
		unit: "kg",
		categories: [],
		newImages: [],
	});

	const [existingImages, setExistingImages] = useState([]);
	const [deletedImageIds, setDeletedImageIds] = useState([]);
	const [primaryExistingImageId, setPrimaryExistingImageId] = useState(null);
	const [primaryNewImageIndex, setPrimaryNewImageIndex] = useState(null);

	const [submitting, setSubmitting] = useState(false);
	const [generalError, setGeneralError] = useState("");
	const [fieldErrors, setFieldErrors] = useState({});

	const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
	const categoryDropdownRef = useRef(null);

	useEffect(() => {
		const handleOutsideClick = (event) => {
			if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target)) {
				setIsCategoryDropdownOpen(false);
			}
		};

		document.addEventListener("mousedown", handleOutsideClick);
		return () => document.removeEventListener("mousedown", handleOutsideClick);
	}, []);

	const fetchInitialData = async () => {
		try {
			setLoading(true);
			setGeneralError("");
			setNotFound(false);

			const [productRes, categoriesRes] = await Promise.all([
				api.get(`/products/${id}/`),
				api.get("/products/categories/"),
			]);

			const product = productRes.data;
			const categoriesList = Array.isArray(categoriesRes.data) ? categoriesRes.data : [];

			setCategories(categoriesList);
			setForm({
				name: product.name || "",
				price: product.price || "",
				stock: product.stock || "",
				unit: product.unit || "kg",
				categories: (product.categories || []).map((cat) => cat.id),
				newImages: [],
			});

			const productImages = product.images || [];
			setExistingImages(productImages);
			const existingPrimary = productImages.find((img) => img.is_primary);
			setPrimaryExistingImageId(existingPrimary ? existingPrimary.id : null);
			setPrimaryNewImageIndex(null);
			setDeletedImageIds([]);
		} catch (err) {
			if (err?.response?.status === 404) {
				setNotFound(true);
			} else {
				setGeneralError("Failed to load product details.");
			}
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchInitialData();
	}, [id]);

	const newImagePreviews = useMemo(
		() => form.newImages.map((file) => URL.createObjectURL(file)),
		[form.newImages]
	);

	useEffect(() => {
		return () => {
			newImagePreviews.forEach((url) => URL.revokeObjectURL(url));
		};
	}, [newImagePreviews]);

	const setField = (name, value) => {
		setForm((prev) => ({ ...prev, [name]: value }));
		setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
	};

	const handleInputChange = (e) => {
		const { name, value } = e.target;
		setField(name, value);
	};

	const handleCategoryToggle = (categoryId) => {
		setForm((prev) => {
			const exists = prev.categories.includes(categoryId);
			return {
				...prev,
				categories: exists
					? prev.categories.filter((idValue) => idValue !== categoryId)
					: [...prev.categories, categoryId],
			};
		});
		setFieldErrors((prev) => ({ ...prev, categories: undefined }));
	};

	const handleAddNewImages = (e) => {
		const files = Array.from(e.target.files || []);
		if (files.length === 0) return;

		setForm((prev) => ({
			...prev,
			newImages: [...prev.newImages, ...files],
		}));

		if (primaryExistingImageId == null && primaryNewImageIndex == null) {
			setPrimaryNewImageIndex(0);
		}

		e.target.value = "";
	};

	const removeExistingImage = (imageId) => {
		setExistingImages((prev) => {
			const next = prev.filter((img) => img.id !== imageId);
			return next;
		});
		setDeletedImageIds((prev) => [...prev, imageId]);

		if (primaryExistingImageId === imageId) {
			setPrimaryExistingImageId(null);
			if (form.newImages.length > 0) {
				setPrimaryNewImageIndex(0);
			}
		}
	};

	const removeNewImage = (indexToRemove) => {
		setForm((prev) => {
			const nextNewImages = prev.newImages.filter((_, index) => index !== indexToRemove);
			return { ...prev, newImages: nextNewImages };
		});

		if (primaryNewImageIndex === indexToRemove) {
			setPrimaryNewImageIndex(null);
			if (existingImages.length > 0) {
				const fallbackExisting = existingImages.find((img) => img.id !== undefined);
				if (fallbackExisting) {
					setPrimaryExistingImageId(fallbackExisting.id);
				}
			} else if (form.newImages.length - 1 > 0) {
				setPrimaryNewImageIndex(0);
			}
		} else if (primaryNewImageIndex !== null && indexToRemove < primaryNewImageIndex) {
			setPrimaryNewImageIndex(primaryNewImageIndex - 1);
		}
	};

	const chooseExistingPrimary = (imageId) => {
		setPrimaryExistingImageId(imageId);
		setPrimaryNewImageIndex(null);
	};

	const chooseNewPrimary = (index) => {
		setPrimaryNewImageIndex(index);
		setPrimaryExistingImageId(null);
	};

	const selectedCategoryNames = useMemo(() => {
		if (form.categories.length === 0) return "Select categories";
		const names = categories
			.filter((cat) => form.categories.includes(cat.id))
			.map((cat) => cat.name);
		if (names.length <= 2) return names.join(", ");
		return `${names.slice(0, 2).join(", ")} +${names.length - 2} more`;
	}, [categories, form.categories]);

	const renderError = (key) => {
		if (!fieldErrors[key]) return null;
		return <p className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors[key]}</p>;
	};

	const getExistingImageUrl = (imagePath) => {
		if (!imagePath) return null;
		if (String(imagePath).startsWith("http")) return imagePath;
		return `${api.defaults.baseURL}${imagePath}`;
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setGeneralError("");
		setFieldErrors({});

		const payload = new FormData();
		payload.append("name", form.name);
		payload.append("price", form.price);
		payload.append("stock", form.stock);
		payload.append("unit", form.unit);

		form.categories.forEach((categoryId) => payload.append("categories", String(categoryId)));
		deletedImageIds.forEach((imageId) => payload.append("delete_image_ids", String(imageId)));
		form.newImages.forEach((file) => payload.append("images", file));

		if (primaryExistingImageId !== null) {
			payload.append("primary_existing_image_id", String(primaryExistingImageId));
		} else if (primaryNewImageIndex !== null) {
			payload.append("primary_image_index", String(primaryNewImageIndex));
		}

		try {
			setSubmitting(true);
			await api.patch(`/products/${id}/`, payload, {
				headers: {
					"Content-Type": "multipart/form-data",
				},
			});
			navigate("/farmer/dashboard", { replace: true });
		} catch (err) {
			const data = err?.response?.data;

			if (data && typeof data === "object") {
				const mappedErrors = {};
				Object.entries(data).forEach(([key, value]) => {
					mappedErrors[key] = Array.isArray(value) ? value.join(" ") : String(value);
				});
				setFieldErrors(mappedErrors);
			}

			const fallbackMessage =
				err?.response?.data?.detail ||
				err?.response?.data?.non_field_errors?.[0] ||
				"Failed to update product. Please try again.";
			setGeneralError(fallbackMessage);
		} finally {
			setSubmitting(false);
		}
	};

	if (loading) {
		return (
			<div className="max-w-4xl mx-auto px-4 py-10">
				<div className="h-8 w-56 bg-gray-200 dark:bg-gray-700 rounded mb-8 animate-pulse" />
				<div className="h-[520px] bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
			</div>
		);
	}

	if (notFound) {
		return (
			<div className="max-w-4xl mx-auto px-4 py-16 text-center">
				<div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-12">
					<p className="text-6xl mb-4">🔍</p>
					<h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-3">Product not found</h2>
					<button
						onClick={() => navigate("/farmer/dashboard")}
						className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-3 rounded-lg transition"
					>
						Back to Dashboard
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="max-w-4xl mx-auto px-4 py-10">
			<div className="flex items-center justify-between mb-8">
				<h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Edit Product</h1>
				<Link
					to="/farmer/dashboard"
					className="text-sm font-semibold text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
				>
					← Back to Dashboard
				</Link>
			</div>

			{generalError && (
				<div className="mb-6 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm rounded-lg px-4 py-3">
					{generalError}
				</div>
			)}

			<form
				onSubmit={handleSubmit}
				className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-5"
			>
				<div>
					<label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">Product Name</label>
					<input
						type="text"
						name="name"
						value={form.name}
						onChange={handleInputChange}
						required
						className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
					/>
					{renderError("name")}
				</div>

				<div className="grid sm:grid-cols-2 gap-4">
					<div>
						<label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">Price</label>
						<input
							type="number"
							step="0.01"
							min="0"
							name="price"
							value={form.price}
							onChange={handleInputChange}
							required
							className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
						/>
						{renderError("price")}
					</div>

					<div>
						<label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">Stock</label>
						<input
							type="number"
							step="0.01"
							min="0"
							name="stock"
							value={form.stock}
							onChange={handleInputChange}
							required
							className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
						/>
						{renderError("stock")}
					</div>
				</div>

				<div className="grid sm:grid-cols-2 gap-4">
					<div>
						<label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">Unit</label>
						<select
							name="unit"
							value={form.unit}
							onChange={handleInputChange}
							className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
						>
							<option value="kg">kg</option>
							<option value="unit">unit</option>
						</select>
						{renderError("unit")}
					</div>

					<div>
						<label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">Categories</label>
						<div className="relative" ref={categoryDropdownRef}>
							<button
								type="button"
								onClick={() => setIsCategoryDropdownOpen((prev) => !prev)}
								className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-left text-gray-900 dark:text-white flex items-center justify-between"
							>
								<span className="truncate pr-3 text-sm">{selectedCategoryNames}</span>
								<svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
								</svg>
							</button>

							{isCategoryDropdownOpen && (
								<div className="absolute z-20 mt-2 w-full max-h-56 overflow-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg">
									{categories.map((cat) => (
										<label
											key={cat.id}
											className="flex items-center gap-2 px-3 py-2 text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
										>
											<input
												type="checkbox"
												checked={form.categories.includes(cat.id)}
												onChange={() => handleCategoryToggle(cat.id)}
											/>
											<span>{cat.name}</span>
										</label>
									))}
								</div>
							)}
						</div>
						<p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Select one or more categories.</p>
						{renderError("categories")}
					</div>
				</div>

				<div>
					<label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">Existing Images</label>
					{existingImages.length === 0 ? (
						<p className="text-sm text-gray-500 dark:text-gray-400">No existing images.</p>
					) : (
						<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
							{existingImages.map((img) => {
								const imageUrl = getExistingImageUrl(img.image);
								const isPrimary = primaryExistingImageId === img.id;

								return (
									<div
										key={img.id}
										className={`relative border rounded-lg overflow-hidden ${
											isPrimary ? "border-green-600 ring-1 ring-green-600" : "border-gray-300 dark:border-gray-700"
										}`}
									>
										{imageUrl ? (
											<img src={imageUrl} alt={`existing-${img.id}`} className="w-full h-28 object-cover" />
										) : (
											<div className="w-full h-28 bg-gray-100 dark:bg-gray-700" />
										)}

										<button
											type="button"
											onClick={() => removeExistingImage(img.id)}
											className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 hover:bg-black/80 text-white text-xs flex items-center justify-center"
											title="Delete image"
										>
											✕
										</button>

										{isPrimary && (
											<span className="absolute top-1 left-1 text-[10px] font-bold bg-green-600 text-white px-1.5 py-0.5 rounded">
												Primary
											</span>
										)}

										<div className="p-2 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
											<label className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-200">
												<input
													type="radio"
													name="primary_image"
													checked={isPrimary}
													onChange={() => chooseExistingPrimary(img.id)}
												/>
												Primary
											</label>
										</div>
									</div>
								);
							})}
						</div>
					)}
					{renderError("delete_image_ids")}
					{renderError("primary_existing_image_id")}
				</div>

				<div>
					<label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">Upload New Images</label>
					<label className="block cursor-pointer rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 hover:bg-gray-100 dark:hover:bg-gray-900 px-4 py-7 text-center transition">
						<input
							type="file"
							accept="image/*"
							multiple
							onChange={handleAddNewImages}
							className="hidden"
						/>
						<div className="flex flex-col items-center">
							<svg className="w-9 h-9 text-gray-400 dark:text-gray-500 mb-2" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 014-4h.586A4 4 0 0111 9h2a4 4 0 013.414 2H17a4 4 0 010 8H7a4 4 0 01-4-4z" />
								<path strokeLinecap="round" strokeLinejoin="round" d="M12 12v7m0-7l-3 3m3-3l3 3" />
							</svg>
							<p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Click to upload new product images</p>
						</div>
					</label>
					{renderError("images")}

					{form.newImages.length > 0 && (
						<div className="mt-4">
							<div className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">
								{form.newImages.length} new image{form.newImages.length > 1 ? "s" : ""}
							</div>
							<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
								{newImagePreviews.map((src, index) => (
									<div
										key={`${src}-${index}`}
										className={`relative border rounded-lg overflow-hidden ${
											primaryNewImageIndex === index ? "border-green-600 ring-1 ring-green-600" : "border-gray-300 dark:border-gray-700"
										}`}
									>
										<img src={src} alt={`new-${index + 1}`} className="w-full h-28 object-cover" />

										<button
											type="button"
											onClick={() => removeNewImage(index)}
											className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 hover:bg-black/80 text-white text-xs flex items-center justify-center"
											title="Remove image"
										>
											✕
										</button>

										{primaryNewImageIndex === index && (
											<span className="absolute top-1 left-1 text-[10px] font-bold bg-green-600 text-white px-1.5 py-0.5 rounded">
												Primary
											</span>
										)}

										<div className="p-2 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
											<label className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-200">
												<input
													type="radio"
													name="primary_image"
													checked={primaryNewImageIndex === index}
													onChange={() => chooseNewPrimary(index)}
												/>
												Primary
											</label>
										</div>
									</div>
								))}
							</div>
						</div>
					)}
					{renderError("primary_image_index")}
				</div>

				<div className="pt-2">
					<button
						type="submit"
						disabled={submitting}
						className="bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-bold px-6 py-3 rounded-lg transition"
					>
						{submitting ? "Updating Product..." : "Update Product"}
					</button>
				</div>
			</form>
		</div>
	);
};

export default EditProduct;
