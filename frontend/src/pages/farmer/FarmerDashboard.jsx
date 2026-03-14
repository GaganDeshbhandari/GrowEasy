import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";

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
			<div className="max-w-7xl mx-auto px-4 py-10">
				<div className="h-8 w-56 bg-gray-200 dark:bg-gray-700 rounded mb-8 animate-pulse" />
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
					{Array.from({ length: 6 }).map((_, i) => (
						<div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-pulse">
							<div className="h-48 bg-gray-200 dark:bg-gray-700" />
							<div className="p-4 space-y-3">
								<div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
								<div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
								<div className="h-9 bg-gray-200 dark:bg-gray-700 rounded" />
							</div>
						</div>
					))}
				</div>
			</div>
		);
	}

	if (error && count === 0 && products.length === 0) {
		return (
			<div className="max-w-4xl mx-auto px-4 py-16 text-center">
				<p className="text-red-600 dark:text-red-400 font-semibold mb-4">{error}</p>
				<button
					onClick={() => fetchMyProducts(1)}
					className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition"
				>
					Retry
				</button>
			</div>
		);
	}

	if (!loading && products.length === 0) {
		return (
			<div className="max-w-5xl mx-auto px-4 py-16 text-center">
				<div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-12">
					<p className="text-6xl mb-4">🌾</p>
					<h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-2">No products yet</h2>
					<p className="text-gray-500 dark:text-gray-400 mb-8">Start by adding your first product.</p>
					<button
						onClick={() => navigate("/farmer/products/add")}
						className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-3 rounded-lg transition"
					>
						Add First Product
					</button>
				</div>
			</div>
		);
	}

	return (
		<>
		<div className="max-w-7xl mx-auto px-4 py-10">
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
				<div>
					<h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Farmer Dashboard</h1>
					<p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
						Showing {products.length} of {count} products
					</p>
				</div>
				<button
					onClick={() => navigate("/farmer/products/add")}
					className="inline-flex items-center justify-center bg-green-600 hover:bg-green-700 text-white font-bold px-5 py-2.5 rounded-lg transition"
				>
					+ Add New Product
				</button>
			</div>

			{error && (
				<div className="mb-6 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm font-medium rounded-lg px-4 py-3">
					{error}
				</div>
			)}

			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
				{products.map((product) => {
					const imageUrl = getPrimaryImage(product.images);
					const isDeleting = deletingId === product.id;
					const isToggling = togglingId === product.id;

					return (
						<div
							key={product.id}
							className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm"
						>
							<div className="h-48 bg-gray-100 dark:bg-gray-700">
								{imageUrl ? (
									<img
										src={imageUrl}
										alt={product.name}
										className="w-full h-full object-cover"
										onError={(e) => {
											e.target.style.display = "none";
										}}
									/>
								) : (
									<div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
										<svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
										</svg>
									</div>
								)}
							</div>

							<div className="p-4 space-y-3">
								<div>
									<h3 className="font-bold text-gray-900 dark:text-white truncate">{product.name}</h3>
									<p className="text-sm text-gray-600 dark:text-gray-300">
										₹{parseFloat(product.price || 0).toFixed(2)} / {product.unit}
									</p>
									<p className="text-sm text-gray-600 dark:text-gray-300">
										Stock: {parseFloat(product.stock || 0)} {product.unit}
									</p>
								</div>

								<div className="flex items-center justify-between">
									<span
										className={`text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wide ${
											product.is_active
												? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
												: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
										}`}
									>
										{product.is_active ? "active" : "inactive"}
									</span>
								</div>

								<div className="flex flex-wrap gap-2 pt-1">
									<button
										onClick={() => navigate(`/farmer/products/edit/${product.id}`)}
										className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
									>
										Edit
									</button>

									<button
										onClick={() => setDeleteTargetId(product.id)}
										disabled={isDeleting}
										className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-xs font-semibold"
									>
										{isDeleting ? "Deleting..." : "Delete"}
									</button>

									<button
										onClick={() => handleToggleActive(product)}
										disabled={isToggling}
										className="px-3 py-1.5 rounded-lg bg-gray-900 hover:bg-black dark:bg-gray-100 dark:hover:bg-white text-white dark:text-gray-900 disabled:opacity-60 text-xs font-semibold"
									>
										{isToggling ? "Updating..." : product.is_active ? "Set Inactive" : "Set Active"}
									</button>
								</div>
							</div>
						</div>
					);
				})}
			</div>

			<div className="mt-8 flex items-center justify-center gap-3">
				<button
					onClick={() => fetchMyProducts(currentPage - 1)}
					disabled={!hasPrevious || loading}
					className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					Previous
				</button>

				<span className="text-sm text-gray-600 dark:text-gray-300">
					Page {currentPage} of {totalPages}
				</span>

				<button
					onClick={() => fetchMyProducts(currentPage + 1)}
					disabled={!hasNext || loading}
					className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					Next
				</button>
			</div>
		</div>

		{deleteTargetId !== null && (
			<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
				<div className="w-full max-w-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-xl">
					<div className="flex items-start gap-3 mb-4">
						<div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-300 flex items-center justify-center shrink-0">
							<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z" />
							</svg>
						</div>
						<div>
							<h3 className="text-lg font-extrabold text-gray-900 dark:text-white">Delete Product</h3>
							<p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
								Are you sure you want to delete this product? This action cannot be undone.
							</p>
						</div>
					</div>

					<div className="flex items-center justify-end gap-3">
						<button
							type="button"
							onClick={() => setDeleteTargetId(null)}
							disabled={deletingId !== null}
							className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-200 disabled:opacity-60"
						>
							Cancel
						</button>
						<button
							type="button"
							onClick={() => handleDelete(deleteTargetId)}
							disabled={deletingId !== null}
							className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold disabled:opacity-60"
						>
							{deletingId !== null ? "Deleting..." : "Yes, Delete"}
						</button>
					</div>
				</div>
			</div>
		)}
		</>
	);
};

export default FarmerDashboard;
