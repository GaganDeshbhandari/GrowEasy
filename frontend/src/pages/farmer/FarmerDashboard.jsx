import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";

// Using Heroicons for a premium SaaS look (newly added to dependencies)
import { PencilSquareIcon, TrashIcon, PowerIcon, PlusIcon, FaceFrownIcon } from "@heroicons/react/24/outline";

const PAGE_SIZE_DEFAULT = 12;

const FarmerDashboard = () => {
	const navigate = useNavigate();

	const [products, setProducts] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	const [currentPage, setCurrentPage] = useState(1);
	const [count, setCount] = useState(0);
	const [pageSize, setPageSize] = useState(PAGE_SIZE_DEFAULT);
	const [hasNext, setHasNext] = useState(false);
	const [hasPrevious, setHasPrevious] = useState(false);

	const [deletingId, setDeletingId] = useState(null);
	const [togglingId, setTogglingId] = useState(null);
	const [deleteTargetId, setDeleteTargetId] = useState(null);

	const fetchMyProducts = async (page = 1) => {
		try {
			setLoading(true);
			setError("");

			const res = await api.get(`/products/my-products/?page=${page}`);
			const data = res.data;

			if (Array.isArray(data)) {
				setProducts(data);
				setCount(data.length);
				setCurrentPage(1);
				setHasNext(false);
				setHasPrevious(false);
			} else {
				const results = data?.results || [];
				setProducts(results);
				setCount(data?.count || 0);
				setCurrentPage(page);
				setHasNext(Boolean(data?.next));
				setHasPrevious(Boolean(data?.previous));

				if (page === 1 && results.length > 0) {
					setPageSize(results.length);
				}
			}
		} catch {
			setError("Failed to load your products. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchMyProducts(1);
	}, []);

	const totalPages = useMemo(() => {
		if (!count) return 1;
		return Math.max(1, Math.ceil(count / pageSize));
	}, [count, pageSize]);

	const getPrimaryImage = (images) => {
		if (!images || images.length === 0) return null;
		const primary = images.find((img) => img.is_primary) || images[0];
		if (!primary?.image) return null;
		if (String(primary.image).startsWith("http")) return primary.image;
		return `${api.defaults.baseURL}${primary.image}`;
	};

	const handleDelete = async (productId) => {
		try {
			setDeletingId(productId);
			await api.delete(`/products/${productId}/`);

			setProducts((prev) => prev.filter((product) => product.id !== productId));
			setCount((prev) => Math.max(0, prev - 1));
			setDeleteTargetId(null);
		} catch {
			setError("Failed to delete product.");
		} finally {
			setDeletingId(null);
		}
	};

	const handleToggleActive = async (product) => {
		try {
			setTogglingId(product.id);
			const res = await api.patch(`/products/${product.id}/`, {
				is_active: !product.is_active,
			});

			setProducts((prev) =>
				prev.map((item) => (item.id === product.id ? res.data : item))
			);
		} catch {
			setError("Failed to update product status.");
		} finally {
			setTogglingId(null);
		}
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-[#FDFBF7] dark:bg-[#0A0F0D] py-16 px-4 md:px-8 transition-colors duration-500">
				<div className="max-w-7xl mx-auto space-y-12">
					<div className="h-10 w-64 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
						{Array.from({ length: 8 }).map((_, i) => (
							<div key={i} className="bg-white dark:bg-[#111812] rounded-2xl border border-gray-100 dark:border-gray-800/60 overflow-hidden animate-pulse shadow-sm">
								<div className="h-56 bg-gray-100 dark:bg-gray-800" />
								<div className="p-6 space-y-4">
									<div className="h-5 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
									<div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/2" />
								</div>
								<div className="h-14 bg-gray-50 dark:bg-gray-800/30 border-t border-gray-100 dark:border-gray-800 flex divide-x divide-gray-100 dark:divide-gray-800" />
							</div>
						))}
					</div>
				</div>
			</div>
		);
	}

	if (error && count === 0 && products.length === 0) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-[#FDFBF7] dark:bg-[#0A0F0D] py-16 px-4">
				<div className="max-w-lg w-full bg-white dark:bg-[#111812] border border-red-100 dark:border-red-900/30 rounded-3xl p-10 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none">
                    <FaceFrownIcon className="w-16 h-16 mx-auto text-red-400 dark:text-red-500 mb-6" />
					<h3 className="text-xl font-extrabold text-gray-900 dark:text-white mb-2">Oops, something went wrong</h3>
					<p className="text-gray-500 dark:text-gray-400 mb-8">{error}</p>
					<button
						onClick={() => fetchMyProducts(1)}
						className="w-full bg-[#111812] hover:bg-[#1A241A] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-bold px-6 py-3.5 rounded-xl transition-all"
					>
						Try Again
					</button>
				</div>
			</div>
		);
	}

	if (!loading && products.length === 0) {
		return (
			<div className="min-h-screen bg-[#FDFBF7] dark:bg-[#0A0F0D] flex items-center justify-center p-4">
				<div className="max-w-2xl w-full relative overflow-hidden bg-[#061A10] dark:bg-[#111812] rounded-[32px] p-12 md:p-16 text-center border border-emerald-900/30 dark:border-gray-800 shadow-2xl">
					{/* Abstract blur elements for premium feel */}
					<div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-emerald-600/20 blur-[100px] pointer-events-none"></div>
					<div className="absolute bottom-[-10%] right-[-20%] w-[60%] h-[60%] rounded-full bg-green-500/10 blur-[80px] pointer-events-none"></div>
					
					<div className="relative z-10">
						<span className="text-7xl drop-shadow-lg inline-block mb-6 filter hover:scale-110 transition-transform origin-bottom duration-500">🌾</span>
						<h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4 tracking-tight">Your fields are empty.</h2>
						<p className="text-emerald-100/70 text-lg max-w-md mx-auto mb-10 font-light">
							It looks like you haven't added any harvest to your dashboard yet. List your first crop to reach customers today.
						</p>
						<button
							onClick={() => navigate("/farmer/products/add")}
							className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-[#061A10] font-black px-8 py-4 rounded-full transition-all duration-300 shadow-[0_4px_14px_0_rgba(16,185,129,0.39)] hover:shadow-[0_6px_20px_rgba(16,185,129,0.23)] hover:-translate-y-1"
						>
							<PlusIcon className="w-5 h-5 stroke-2" />
							Add Your First Crop
						</button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<>
		<div className="min-h-screen bg-[#FDFBF7] dark:bg-[#0A0F0D] py-16 transition-colors duration-500 font-sans">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				
				{/* Premium Header */}
				<div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-gray-200 dark:border-gray-800/80 pb-8">
					<div className="max-w-2xl">
						<h1 className="text-4xl sm:text-5xl font-black text-[#111812] dark:text-[#E8F3EB] tracking-tight mb-2">
							Crop Inventory
						</h1>
						<p className="text-gray-500 dark:text-gray-400 text-lg font-medium">
							Manage your listings, adjust prices, and track your active inventory.
						</p>
					</div>
					<div className="flex items-center gap-4 shrink-0">
						<button
							onClick={() => navigate("/farmer/products/add")}
							className="group inline-flex items-center gap-2 bg-[#111812] hover:bg-[#1A241A] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-[0_4px_12px_rgba(0,0,0,0.1)] active:scale-95"
						>
                            <PlusIcon className="w-5 h-5 stroke-[2.5]" />
							<span>List New Crop</span>
						</button>
					</div>
				</div>

				{error && (
					<div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 rounded-xl text-red-800 dark:text-red-400 text-sm font-medium flex items-center gap-3">
						<FaceFrownIcon className="w-5 h-5" />
                        {error}
					</div>
				)}

				{/* Bento-style Grid */}
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 xl:gap-8">
					{products.map((product) => {
						const imageUrl = getPrimaryImage(product.images);
						const isDeleting = deletingId === product.id;
						const isToggling = togglingId === product.id;
                        const stockFloat = parseFloat(product.stock || 0);

						return (
							<div
								key={product.id}
								className="group flex flex-col bg-white dark:bg-[#111812] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-none overflow-hidden transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:-translate-y-1 dark:hover:border-emerald-900/50"
							>
								{/* Image Canvas */}
								<div className="relative h-56 bg-gray-50 dark:bg-gray-900 overflow-hidden">
									{imageUrl ? (
										<img
											src={imageUrl}
											alt={product.name}
											className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
											onError={(e) => {
												e.target.style.display = "none";
											}}
										/>
									) : (
										<div className="absolute inset-0 flex flex-col items-center justify-center text-gray-300 dark:text-gray-700 bg-gray-50 dark:bg-[#0A0F0D]">
											<div className="text-4xl mb-2 grayscale opacity-20">🌾</div>
                                            <span className="text-xs font-semibold uppercase tracking-widest">No Image</span>
										</div>
									)}

                                    {/* Floating Glass Status Badge */}
                                    <div className="absolute top-4 right-4">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider backdrop-blur-md shadow-sm border ${
                                            product.is_active 
                                            ? "bg-white/80 dark:bg-black/40 text-emerald-700 dark:text-emerald-400 border-white/40 dark:border-emerald-500/30"
                                            : "bg-white/80 dark:bg-black/40 text-gray-500 dark:text-gray-400 border-white/40 dark:border-gray-600/30"
                                        }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${product.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400 shadow-inner'}`}></span>
                                            {product.is_active ? "Active" : "Hidden"}
                                        </span>
                                    </div>
								</div>

								{/* Content */}
								<div className="p-6 flex-1 flex flex-col justify-between">
                                    <div>
                                        <h3 className="text-lg font-extrabold text-[#111812] dark:text-[#E8F3EB] group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1 leading-tight">
                                            {product.name}
                                        </h3>
                                        
                                        <div className="mt-3 flex items-end gap-2">
                                            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 leading-none">
                                                ₹{parseFloat(product.price || 0).toFixed(2)}
                                            </span>
                                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-0.5">
                                                / {product.unit}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mt-6 pt-5 border-t border-gray-100 dark:border-gray-800">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="font-semibold text-gray-500 dark:text-gray-400">In Stock:</span>
                                            <span className={`font-black ${stockFloat <= 0 ? 'text-red-500' : 'text-[#111812] dark:text-[#E8F3EB]'}`}>
                                                {stockFloat} {product.unit}
                                            </span>
                                        </div>
                                    </div>
								</div>

                                {/* Minimal Tool Bar */}
								<div className="bg-gray-50/80 dark:bg-gray-900/30 border-t border-gray-100 dark:border-gray-800 grid grid-cols-3 divide-x divide-gray-200 dark:divide-gray-800">
                                    {/* Edit Area */}
									<button
										onClick={() => navigate(`/farmer/products/edit/${product.id}`)}
										className="flex flex-col items-center justify-center py-3.5 gap-1.5 text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-colors group/btn"
                                        title="Edit Listing"
									>
                                        <PencilSquareIcon className="w-5 h-5 group-hover/btn:-translate-y-0.5 transition-transform" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">Edit</span>
									</button>

                                    {/* Visibility Toggle Area */}
                                    <button
                                        onClick={() => handleToggleActive(product)}
                                        disabled={isToggling}
                                        className="flex flex-col items-center justify-center py-3.5 gap-1.5 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors disabled:opacity-50 disabled:hover:bg-transparent group/btn"
                                        title={product.is_active ? "Hide from marketplace" : "Show on marketplace"}
                                    >
                                        {isToggling ? (
                                            <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"/><path fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" className="opacity-75"/></svg>
                                        ) : (
                                            <PowerIcon className={`w-5 h-5 group-hover/btn:-translate-y-0.5 transition-transform ${product.is_active ? 'text-gray-400' : 'text-blue-500'}`} />
                                        )}
                                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">
                                            {product.is_active ? "Hide" : "Publish"}
                                        </span>
                                    </button>

                                    {/* Delete Area */}
									<button
										onClick={() => setDeleteTargetId(product.id)}
										disabled={isDeleting}
										className="flex flex-col items-center justify-center py-3.5 gap-1.5 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors disabled:opacity-50 disabled:hover:bg-transparent group/btn"
                                        title="Delete Listing"
									>
                                        {isDeleting ? (
                                            <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"/><path fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" className="opacity-75"/></svg>
                                        ) : (
                                            <TrashIcon className="w-5 h-5 group-hover/btn:-translate-y-0.5 transition-transform" />
                                        )}
                                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">Delete</span>
									</button>
								</div>
							</div>
						);
					})}
				</div>

                {/* Pagination */}
				<div className="mt-16 flex items-center justify-center gap-6">
					<button
						onClick={() => fetchMyProducts(currentPage - 1)}
						disabled={!hasPrevious || loading}
						className="px-6 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-800 text-sm font-bold text-[#111812] dark:text-[#E8F3EB] hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 disabled:opacity-30 disabled:hover:border-gray-200 dark:disabled:hover:border-gray-800 disabled:hover:text-[#111812] dark:disabled:hover:text-[#E8F3EB] transition-all"
					>
						Previous
					</button>

					<span className="text-sm font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
						Page <span className="text-gray-900 dark:text-white mx-1">{currentPage}</span> of {totalPages}
					</span>

					<button
						onClick={() => fetchMyProducts(currentPage + 1)}
						disabled={!hasNext || loading}
						className="px-6 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-800 text-sm font-bold text-[#111812] dark:text-[#E8F3EB] hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 disabled:opacity-30 disabled:hover:border-gray-200 dark:disabled:hover:border-gray-800 disabled:hover:text-[#111812] dark:disabled:hover:text-[#E8F3EB] transition-all"
					>
						Next
					</button>
				</div>
			</div>
		</div>

        {/* Custom Delete Modal */}
		{deleteTargetId !== null && (
			<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-gray-900/30 dark:bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setDeleteTargetId(null)}></div>
				
                <div className="relative w-full max-w-sm bg-white dark:bg-[#111812] rounded-[24px] shadow-2xl p-8 overflow-hidden border border-gray-100 dark:border-gray-800 animate-in fade-in zoom-in-95 duration-200">
                    <div className="absolute top-0 left-0 w-full h-2 bg-red-500"></div>
					
                    <div className="flex flex-col items-center text-center">
						<div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-500/10 text-red-500 flex items-center justify-center mb-6">
                            <TrashIcon className="w-8 h-8" />
						</div>
						
                        <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">Delete Product?</h3>
						<p className="text-sm text-gray-500 dark:text-gray-400 font-medium leading-relaxed mb-8">
							Are you sure? This action is permanent and cannot be undone. All related data will be lost.
						</p>
					</div>

					<div className="flex flex-col gap-3">
                        <button
							type="button"
							onClick={() => handleDelete(deleteTargetId)}
							disabled={deletingId !== null}
							className="w-full flex justify-center py-4 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold transition-all disabled:opacity-70"
						>
							{deletingId !== null ? "Deleting..." : "Yes, perfectly sure"}
						</button>
						<button
							type="button"
							onClick={() => setDeleteTargetId(null)}
							disabled={deletingId !== null}
							className="w-full py-4 rounded-xl text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
						>
							Cancel
						</button>
					</div>
				</div>
			</div>
		)}
		</>
	);
};

export default FarmerDashboard;
