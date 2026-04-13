import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api/axios";

import { 
    XMarkIcon, 
    ArrowUpTrayIcon,
    ChevronDownIcon,
    FaceFrownIcon,
    ExclamationCircleIcon,
    StarIcon as StarOutline
} from "@heroicons/react/24/outline";
import { StarIcon as StarSolid } from "@heroicons/react/24/solid";

const AddProduct = () => {
	const navigate = useNavigate();

	const [categories, setCategories] = useState([]);
	const [loadingCategories, setLoadingCategories] = useState(true);

	const [form, setForm] = useState({
		name: "",
		price: "",
		stock: "",
		unit: "kg",
		categories: [],
		images: [],
		primaryImageIndex: 0,
	});

	const [submitting, setSubmitting] = useState(false);
	const [generalError, setGeneralError] = useState("");
	const [fieldErrors, setFieldErrors] = useState({});
	
    const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
	const categoryDropdownRef = useRef(null);

    const [isUnitDropdownOpen, setIsUnitDropdownOpen] = useState(false);
	const unitDropdownRef = useRef(null);

	const fetchCategories = async () => {
		try {
			setLoadingCategories(true);
			const res = await api.get("/products/categories/");
			setCategories(Array.isArray(res.data) ? res.data : []);
		} catch {
			setGeneralError("Failed to load categories.");
		} finally {
			setLoadingCategories(false);
		}
	};

	useEffect(() => {
		fetchCategories();
	}, []);

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

	const imagePreviews = useMemo(
		() => form.images.map((file) => URL.createObjectURL(file)),
		[form.images]
	);

	useEffect(() => {
		return () => {
			imagePreviews.forEach((url) => URL.revokeObjectURL(url));
		};
	}, [imagePreviews]);

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
					? prev.categories.filter((id) => id !== categoryId)
					: [...prev.categories, categoryId],
			};
		});
		setFieldErrors((prev) => ({ ...prev, categories: undefined }));
	};

	const handleImageChange = (e) => {
		const files = Array.from(e.target.files || []);
		if (files.length === 0) return;

		setForm((prev) => {
			const mergedImages = [...prev.images, ...files];
			return {
				...prev,
				images: mergedImages,
				primaryImageIndex: prev.images.length === 0 ? 0 : prev.primaryImageIndex,
			};
		});
		setFieldErrors((prev) => ({ ...prev, images: undefined }));
		e.target.value = "";
	};

	const handleRemoveImage = (indexToRemove) => {
		setForm((prev) => {
			const nextImages = prev.images.filter((_, index) => index !== indexToRemove);
			let nextPrimaryIndex = prev.primaryImageIndex;

			if (nextImages.length === 0) {
				nextPrimaryIndex = 0;
			} else if (indexToRemove === prev.primaryImageIndex) {
				nextPrimaryIndex = 0;
			} else if (indexToRemove < prev.primaryImageIndex) {
				nextPrimaryIndex = prev.primaryImageIndex - 1;
			}

			return {
				...prev,
				images: nextImages,
				primaryImageIndex: nextPrimaryIndex,
			};
		});
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
		form.images.forEach((file) => payload.append("images", file));
		payload.append("primary_image_index", String(form.primaryImageIndex));

		try {
			setSubmitting(true);
			await api.post("/products/", payload, {
				headers: {
					"Content-Type": "multipart/form-data",
				},
			});
			navigate("/farmer/dashboard", { replace: true });
		} catch (err) {
			const data = err?.response?.data;

			if (data && typeof data === "object") {
				const mapped = {};
				Object.entries(data).forEach(([key, value]) => {
					mapped[key] = Array.isArray(value) ? value.join(" ") : String(value);
				});
				setFieldErrors(mapped);
			}

			const fallbackMessage =
				err?.response?.data?.detail ||
				err?.response?.data?.non_field_errors?.[0] ||
				"Failed to create product. Please try again.";
			setGeneralError(fallbackMessage);
		} finally {
			setSubmitting(false);
		}
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

	return (
		<div className="min-h-screen bg-[#FDFBF7] dark:bg-[#0A0F0D] py-16 transition-colors duration-500 font-sans">
			<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex items-center justify-between mb-10">
                    <div>
                        <h1 className="text-4xl sm:text-5xl font-black text-[#111812] dark:text-[#E8F3EB] tracking-tight mb-2">
                            Add Listing
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">
                            Create a new crop listing for customers to purchase.
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
                                placeholder="e.g. Fresh Oranges"
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
                                        disabled={loadingCategories}
                                        className="w-full px-5 py-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-[#0A0F0D] text-left text-gray-900 dark:text-white font-medium flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                                    >
                                        <span className={`truncate pr-3 ${form.categories.length === 0 ? "text-gray-400" : ""}`}>
                                            {loadingCategories ? "Loading categories..." : selectedCategoryNames}
                                        </span>
                                        <ChevronDownIcon className={`w-5 h-5 transition-transform duration-300 ${isCategoryDropdownOpen ? "rotate-180 text-emerald-500" : "text-gray-400"}`} />
                                    </button>

                                    {isCategoryDropdownOpen && !loadingCategories && (
                                        <div className="absolute z-30 mt-2 w-full max-h-60 overflow-auto rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-[#111812] shadow-2xl p-2 cursor-pointer origin-top animate-in fade-in slide-in-from-top-2">
                                            {categories.length === 0 ? (
                                                <p className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">No categories available.</p>
                                            ) : (
                                                categories.map((cat) => {
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
                                                })
                                            )}
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

                        <div className="pt-4">
                            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-4">Add Photos</label>
                            
                            <label className="group relative block cursor-pointer rounded-[24px] border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-emerald-500 dark:hover:border-emerald-500 bg-gray-50/50 dark:bg-[#0A0F0D] px-4 py-12 text-center transition-all">
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handleImageChange}
                                    className="hidden"
                                />
                                <div className="absolute inset-0 bg-emerald-50 dark:bg-emerald-500/5 opacity-0 group-hover:opacity-100 rounded-[24px] transition-opacity"></div>
                                <div className="relative z-10 flex flex-col items-center">
                                    <div className="w-14 h-14 bg-white dark:bg-[#111812] border border-gray-200 dark:border-gray-800 shadow-sm rounded-full flex items-center justify-center mb-4 group-hover:-translate-y-1 transition-transform">
                                        <ArrowUpTrayIcon className="w-6 h-6 text-emerald-500" />
                                    </div>
                                    <p className="text-base font-bold text-gray-900 dark:text-white mb-1">Click to upload product photos</p>
                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">PNG, JPG up to 10MB each</p>
                                </div>
                            </label>
                            {renderError("images")}

                            {form.images.length > 0 && (
                                <div className="mt-6">
                                    <div className="mb-4 text-[10px] font-bold tracking-widest text-emerald-600 dark:text-emerald-400 uppercase">
                                        {form.images.length} file{form.images.length > 1 ? "s" : ""} securely attached
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {imagePreviews.map((src, index) => {
                                            const isPrimary = form.primaryImageIndex === index;
                                            return (
                                                <div
                                                key={`${src}-${index}`}
                                                className={`group relative rounded-2xl overflow-hidden aspect-square border-2 transition-all ${
                                                    isPrimary ? "border-emerald-500" : "border-gray-200 dark:border-gray-800"
                                                }`}
                                            >
                                                <img src={src} alt={`upload-${index + 1}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />

                                                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                                                {/* Remove Button */}
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        handleRemoveImage(index);
                                                    }}
                                                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100 shadow-lg z-10"
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
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            setField("primaryImageIndex", index);
                                                        }}
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
                                "Create Listing"
                            )}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

export default AddProduct;
