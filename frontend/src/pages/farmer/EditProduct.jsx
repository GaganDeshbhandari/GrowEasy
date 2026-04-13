import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios";

// Using Heroicons for a premium SaaS look
import { 
    PhotoIcon, 
    XMarkIcon, 
    ArrowUpTrayIcon,
    ChevronDownIcon,
    FaceFrownIcon,
    ExclamationCircleIcon,
    StarIcon as StarOutline
} from "@heroicons/react/24/outline";
import { StarIcon as StarSolid } from "@heroicons/react/24/solid";

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

	const [isUnitDropdownOpen, setIsUnitDropdownOpen] = useState(false);
	const unitDropdownRef = useRef(null);

	useEffect(() => {
		const handleOutsideClick = (event) => {
			if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target)) {
				setIsCategoryDropdownOpen(false);
			}
			if (unitDropdownRef.current && !unitDropdownRef.current.contains(event.target)) {
				setIsUnitDropdownOpen(false);
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

	const handleUnitChange = (unitValue) => {
		setField("unit", unitValue);
		setIsUnitDropdownOpen(false);
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
		if (form.categories.length === 0) return "Select categories...";
		const names = categories
			.filter((cat) => form.categories.includes(cat.id))
			.map((cat) => cat.name);
		if (names.length <= 2) return names.join(", ");
		return `${names.slice(0, 2).join(", ")} +${names.length - 2} more`;
	}, [categories, form.categories]);

	const renderError = (key) => {
		if (!fieldErrors[key]) return null;
		return (
            <p className="mt-1.5 text-xs font-bold text-red-500 uppercase tracking-widest flex items-center gap-1">
                <ExclamationCircleIcon className="w-4 h-4" />
                {fieldErrors[key]}
            </p>
        );
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
			<div className="min-h-screen bg-[#FDFBF7] dark:bg-[#0A0F0D] py-16 px-4 md:px-8 transition-colors duration-500">
				<div className="max-w-4xl mx-auto space-y-12">
					<div className="h-10 w-56 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
					<div className="h-[600px] bg-white dark:bg-[#111812] rounded-[32px] animate-pulse border border-gray-100 dark:border-gray-800/60 shadow-sm" />
				</div>
			</div>
		);
	}

	if (notFound) {
		return (
			<div className="min-h-screen bg-[#FDFBF7] dark:bg-[#0A0F0D] flex items-center justify-center p-4">
				<div className="max-w-xl w-full bg-white dark:bg-[#111812] rounded-[32px] p-12 text-center border border-gray-100 dark:border-gray-800 shadow-xl">
					<p className="text-6xl mb-6 grayscale opacity-50">🔍</p>
					<h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-3 tracking-tight">Product missing</h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-8 font-medium">The product you are trying to edit could not be found or has been deleted.</p>
					<button
						onClick={() => navigate("/farmer/dashboard")}
						className="inline-flex items-center gap-2 bg-[#111812] hover:bg-[#1A241A] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-bold px-8 py-4 rounded-xl transition-all"
					>
						Back to Dashboard
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-[#FDFBF7] dark:bg-[#0A0F0D] py-16 transition-colors duration-500 font-sans">
			<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
				
                <div className="flex items-center justify-between mb-10">
                    <div>
                        <h1 className="text-4xl sm:text-5xl font-black text-[#111812] dark:text-[#E8F3EB] tracking-tight mb-2">
                            Edit Listing
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">
                            Update your crop's details, pricing, and imagery.
                        </p>
                    </div>
					<Link
						to="/farmer/dashboard"
						className="text-sm font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
					>
						← Back
					</Link>
				</div>

				{generalError && (
					<div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 rounded-xl text-red-800 dark:text-red-400 text-sm font-medium flex items-center gap-3">
						<FaceFrownIcon className="w-5 h-5" />
                        {generalError}
					</div>
				)}

				<form
					onSubmit={handleSubmit}
					className="bg-white dark:bg-[#111812] rounded-[32px] border border-gray-100 dark:border-gray-800/80 p-8 sm:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none space-y-8"
				>
                    {/* Basic Info */}
					<div className="space-y-6">
                        <h3 className="text-xl font-black text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-3">Basic Information</h3>
                        
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2">Product Title</label>
                            <input
                                type="text"
                                name="name"
                                value={form.name}
                                onChange={handleInputChange}
                                required
                                className="w-full px-5 py-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-[#0A0F0D] text-gray-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all placeholder:text-gray-400"
                                placeholder="e.g. Organic Heritage Tomatoes"
                            />
                            {renderError("name")}
                        </div>

                        <div className="grid sm:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2">Price (₹)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    name="price"
                                    value={form.price}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-5 py-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-[#0A0F0D] text-gray-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                                    placeholder="0.00"
                                />
                                {renderError("price")}
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2">Stock Volume</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    name="stock"
                                    value={form.stock}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-5 py-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-[#0A0F0D] text-gray-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                                    placeholder="0"
                                />
                                {renderError("stock")}
                            </div>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2">Measuring Unit</label>
                                <div className="relative" ref={unitDropdownRef}>
                                    <button
                                        type="button"
                                        onClick={() => setIsUnitDropdownOpen((prev) => !prev)}
                                        className="w-full px-5 py-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-[#0A0F0D] text-left text-gray-900 dark:text-white font-medium flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                                    >
                                        <span className="truncate pr-3">
                                            {form.unit === "unit" ? "Individual Units (ea)" : "Kilograms (kg)"}
                                        </span>
                                        <ChevronDownIcon className={`w-5 h-5 transition-transform duration-300 ${isUnitDropdownOpen ? "rotate-180 text-emerald-500" : "text-gray-400"}`} />
                                    </button>

                                    {isUnitDropdownOpen && (
                                        <div className="absolute z-30 mt-2 w-full rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-[#111812] shadow-2xl p-2 cursor-pointer origin-top animate-in fade-in slide-in-from-top-2">
                                            {["kg", "unit"].map((unitValue) => {
                                                const isSelected = form.unit === unitValue;
                                                const label = unitValue === "unit" ? "Individual Units (ea)" : "Kilograms (kg)";
                                                return (
                                                    <div
                                                        key={unitValue}
                                                        onClick={() => handleUnitChange(unitValue)}
                                                        className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                                                            isSelected 
                                                            ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-100" 
                                                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/80"
                                                        }`}
                                                    >
                                                        {label}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>
                                {renderError("unit")}
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2">Categories</label>
                                <div className="relative" ref={categoryDropdownRef}>
                                    <button
                                        type="button"
                                        onClick={() => setIsCategoryDropdownOpen((prev) => !prev)}
                                        className="w-full px-5 py-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-[#0A0F0D] text-left text-gray-900 dark:text-white font-medium flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                                    >
                                        <span className={`truncate pr-3 ${form.categories.length === 0 ? "text-gray-400" : ""}`}>
                                            {selectedCategoryNames}
                                        </span>
                                        <ChevronDownIcon className={`w-5 h-5 transition-transform duration-300 ${isCategoryDropdownOpen ? "rotate-180 text-emerald-500" : "text-gray-400"}`} />
                                    </button>

                                    {isCategoryDropdownOpen && (
                                        <div className="absolute z-30 mt-2 w-full max-h-60 overflow-auto rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-[#111812] shadow-2xl p-2 cursor-pointer origin-top animate-in fade-in slide-in-from-top-2">
                                            {categories.map((cat) => {
                                                const isSelected = form.categories.includes(cat.id);
                                                return (
                                                    <label
                                                        key={cat.id}
                                                        className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                                                            isSelected 
                                                            ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-100" 
                                                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/80"
                                                        }`}
                                                    >
                                                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                                                            isSelected ? "bg-emerald-500 border-emerald-500" : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900"
                                                        }`}>
                                                            {isSelected && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>}
                                                        </div>
                                                        <span>{cat.name}</span>
                                                    </label>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>
                                <p className="mt-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Assign multiple categories if applicable.</p>
                                {renderError("categories")}
                            </div>
                        </div>
                    </div>

                    {/* Image Management */}
                    <div className="space-y-6 pt-6">
                        <div className="flex items-end justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
                            <h3 className="text-xl font-black text-gray-900 dark:text-white">Media Gallery</h3>
                        </div>

                        {/* Existing Images */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-4">Current Photos</label>
                            {existingImages.length === 0 ? (
                                <div className="py-6 text-center border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50/50 dark:bg-[#0A0F0D]">
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No existing images found for this product.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {existingImages.map((img) => {
                                        const imageUrl = getExistingImageUrl(img.image);
                                        const isPrimary = primaryExistingImageId === img.id;

                                        return (
                                            <div
                                                key={img.id}
                                                className={`group relative rounded-2xl overflow-hidden aspect-square border-2 transition-all ${
                                                    isPrimary ? "border-emerald-500" : "border-gray-200 dark:border-gray-800"
                                                }`}
                                            >
                                                {imageUrl ? (
                                                    <img src={imageUrl} alt={`existing-${img.id}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                                ) : (
                                                    <div className="w-full h-full bg-gray-100 dark:bg-[#0A0F0D]" />
                                                )}

                                                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                                                {/* Delete Button */}
                                                <button
                                                    type="button"
                                                    onClick={() => removeExistingImage(img.id)}
                                                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100 shadow-lg"
                                                    title="Delete image"
                                                >
                                                    <XMarkIcon className="w-4 h-4 stroke-2" />
                                                </button>

                                                {/* Primary Toggle UI */}
                                                {isPrimary ? (
                                                    <div className="absolute bottom-2 left-2 right-2 px-3 py-1.5 bg-emerald-500 text-white rounded-lg flex items-center justify-center gap-1.5 shadow-lg">
                                                        <StarSolid className="w-4 h-4" />
                                                        <span className="text-[10px] font-black uppercase tracking-widest">Primary</span>
                                                    </div>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => chooseExistingPrimary(img.id)}
                                                        className="absolute bottom-2 left-2 right-2 px-3 py-1.5 bg-gray-900/80 backdrop-blur text-white hover:bg-gray-800 rounded-lg flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100"
                                                    >
                                                        <StarOutline className="w-4 h-4" />
                                                        <span className="text-[10px] font-bold uppercase tracking-widest">Set Primary</span>
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                            {renderError("delete_image_ids")}
                            {renderError("primary_existing_image_id")}
                        </div>

                        {/* New Images */}
                        <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-4">Add More Photos</label>
                            
                            <label className="group relative block cursor-pointer rounded-[24px] border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-emerald-500 dark:hover:border-emerald-500 bg-gray-50/50 dark:bg-[#0A0F0D] px-4 py-12 text-center transition-all">
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handleAddNewImages}
                                    className="hidden"
                                />
                                <div className="absolute inset-0 bg-emerald-50 dark:bg-emerald-500/5 opacity-0 group-hover:opacity-100 rounded-[24px] transition-opacity"></div>
                                <div className="relative z-10 flex flex-col items-center">
                                    <div className="w-14 h-14 bg-white dark:bg-[#111812] border border-gray-200 dark:border-gray-800 shadow-sm rounded-full flex items-center justify-center mb-4 group-hover:-translate-y-1 transition-transform">
                                        <ArrowUpTrayIcon className="w-6 h-6 text-emerald-500" />
                                    </div>
                                    <p className="text-base font-bold text-gray-900 dark:text-white mb-1">Click to upload new photos</p>
                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">PNG, JPG up to 10MB each</p>
                                </div>
                            </label>
                            {renderError("images")}

                            {form.newImages.length > 0 && (
                                <div className="mt-6">
                                    <div className="mb-4 text-[10px] font-bold tracking-widest text-emerald-600 dark:text-emerald-400 uppercase">
                                        {form.newImages.length} New file{form.newImages.length > 1 ? "s" : ""} securely attached
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {newImagePreviews.map((src, index) => {
                                            const isPrimary = primaryNewImageIndex === index;
                                            return (
                                                <div
                                                key={`${src}-${index}`}
                                                className={`group relative rounded-2xl overflow-hidden aspect-square border-2 transition-all ${
                                                    isPrimary ? "border-emerald-500" : "border-gray-200 dark:border-gray-800"
                                                }`}
                                            >
                                                <img src={src} alt={`new-${index + 1}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />

                                                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                                                {/* Remove Button */}
                                                <button
                                                    type="button"
                                                    onClick={() => removeNewImage(index)}
                                                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100 shadow-lg"
                                                    title="Remove image"
                                                >
                                                    <XMarkIcon className="w-4 h-4 stroke-2" />
                                                </button>

                                                {/* Primary Toggle UI */}
                                                {isPrimary ? (
                                                    <div className="absolute bottom-2 left-2 right-2 px-3 py-1.5 bg-emerald-500 text-white rounded-lg flex items-center justify-center gap-1.5 shadow-lg">
                                                        <StarSolid className="w-4 h-4" />
                                                        <span className="text-[10px] font-black uppercase tracking-widest">Primary</span>
                                                    </div>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => chooseNewPrimary(index)}
                                                        className="absolute bottom-2 left-2 right-2 px-3 py-1.5 bg-gray-900/80 backdrop-blur text-white hover:bg-gray-800 rounded-lg flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100"
                                                    >
                                                        <StarOutline className="w-4 h-4" />
                                                        <span className="text-[10px] font-bold uppercase tracking-widest">Set Primary</span>
                                                    </button>
                                                )}
                                            </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}
                            {renderError("primary_image_index")}
                        </div>
                    </div>

					<div className="pt-8 border-t border-gray-100 dark:border-gray-800 flex justify-end">
						<button
							type="submit"
							disabled={submitting}
							className="w-full md:w-auto flex items-center justify-center gap-2 bg-[#111812] hover:bg-[#1A241A] dark:bg-emerald-600 dark:hover:bg-emerald-500 disabled:opacity-60 text-white font-bold px-10 py-4 rounded-xl transition-all shadow-[0_4px_12px_rgba(0,0,0,0.1)] active:scale-95"
						>
							{submitting ? (
                                <>
                                    <svg className="animate-spin w-5 h-5 text-white" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"/><path fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" className="opacity-75"/></svg>
                                    <span>Syncing...</span>
                                </>
                            ) : (
                                "Update Listing"
                            )}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

export default EditProduct;
