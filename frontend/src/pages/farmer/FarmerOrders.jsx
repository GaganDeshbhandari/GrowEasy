import { useEffect, useMemo, useState } from "react";
import api from "../../api/axios";

const PAGE_SIZE_DEFAULT = 10;

const statusBadgeClass = {
	pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
	confirmed: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
	shipped: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
	delivered: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
	cancelled: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

const FarmerOrders = () => {
	const [orders, setOrders] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	const [count, setCount] = useState(0);
	const [currentPage, setCurrentPage] = useState(1);
	const [pageSize, setPageSize] = useState(PAGE_SIZE_DEFAULT);
	const [hasNext, setHasNext] = useState(false);
	const [hasPrevious, setHasPrevious] = useState(false);

	const fetchFarmerOrders = async (page = 1) => {
		try {
			setLoading(true);
			setError("");

			let res;
			try {
				res = await api.get(`/orders/farmer-orders/?page=${page}`, {
					withCredentials: true,
				});
			} catch {
				res = await api.get(`/orders/orders/farmer-orders/?page=${page}`, {
					withCredentials: true,
				});
			}

			const data = res.data || {};
			const results = Array.isArray(data.results) ? data.results : [];

			setOrders(results);
			setCount(data.count || 0);
			setCurrentPage(page);
			setHasNext(Boolean(data.next));
			setHasPrevious(Boolean(data.previous));

			if (page === 1 && results.length > 0) {
				setPageSize(results.length);
			}
		} catch {
			setError("Failed to load orders. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchFarmerOrders(1);
	}, []);

	const totalPages = useMemo(() => {
		if (!count) return 1;
		return Math.max(1, Math.ceil(count / pageSize));
	}, [count, pageSize]);

	const formatDate = (value) => {
		if (!value) return "-";
		return new Date(value).toLocaleDateString("en-IN", {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
	};

	const formatQuantity = (quantity, unit) => {
		const numericQuantity = Number(quantity || 0);
		const quantityText = Number.isInteger(numericQuantity)
			? String(numericQuantity)
			: String(numericQuantity.toFixed(2)).replace(/\.?0+$/, "");

		if (unit === "kg") {
			return `${quantityText} kg`;
		}

		if (unit === "unit") {
			return `${quantityText} ${numericQuantity === 1 ? "unit" : "units"}`;
		}

		return `${quantityText} qty`;
	};

	if (loading) {
		return (
			<div className="max-w-7xl mx-auto px-4 py-10">
				<div className="h-8 w-52 bg-gray-200 dark:bg-gray-700 rounded mb-8 animate-pulse" />
				<div className="space-y-4">
					{Array.from({ length: 4 }).map((_, index) => (
						<div
							key={index}
							className="h-44 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 animate-pulse"
						/>
					))}
				</div>
			</div>
		);
	}

	if (error && orders.length === 0) {
		return (
			<div className="max-w-4xl mx-auto px-4 py-16 text-center">
				<p className="text-red-600 dark:text-red-400 font-semibold mb-4">{error}</p>
				<button
					onClick={() => fetchFarmerOrders(1)}
					className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition"
				>
					Retry
				</button>
			</div>
		);
	}

	return (
		<div className="max-w-7xl mx-auto px-4 py-10">
			<div className="mb-8">
				<h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Farmer Orders</h1>
				<p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
					Showing {orders.length} of {count} order items
				</p>
			</div>

			{error && (
				<div className="mb-6 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm font-medium rounded-lg px-4 py-3">
					{error}
				</div>
			)}

			{orders.length === 0 ? (
				<div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-6 py-10 text-center text-gray-600 dark:text-gray-300 font-medium">
					No orders yet
				</div>
			) : (
				<>
					<div className="space-y-4">
						{orders.map((item, index) => {
							const statusKey = String(item.status || "").toLowerCase();
							const address = item.address || {};

							return (
								<div
									key={`${item.order_date || "date"}-${item.product_name || "product"}-${index}`}
									className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5"
								>
									<div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
										<div className="space-y-2">
											<p className="text-base font-extrabold text-gray-900 dark:text-white">{item.product_name}</p>
											<p className="text-sm text-gray-700 dark:text-gray-200">Quantity: {formatQuantity(item.quantity, item.unit)}</p>
											<p className="text-sm text-gray-700 dark:text-gray-200 font-semibold">
												Total: ₹{Number(item.total || 0).toFixed(2)}
											</p>
											<p className="text-sm text-gray-500 dark:text-gray-400">Order date: {formatDate(item.order_date)}</p>
										</div>

										<div className="flex flex-col items-start lg:items-end gap-2">
											<span
												className={`text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wide ${
													statusBadgeClass[statusKey] ||
													"bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
												}`}
											>
												{item.status || "unknown"}
											</span>
										</div>
									</div>

									<div className="mt-4 grid md:grid-cols-2 gap-4">
										<div className="rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-4">
											<p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Customer</p>
											<p className="text-sm text-gray-800 dark:text-gray-200">Name: {item.customer_name || "-"}</p>
											<p className="text-sm text-gray-800 dark:text-gray-200">Phone: {item.customer_phone || "-"}</p>
											<p className="text-sm text-gray-800 dark:text-gray-200">Email: {item.customer_email || "-"}</p>
										</div>

										<div className="rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-4">
											<p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Delivery Address</p>
											<p className="text-sm text-gray-800 dark:text-gray-200">{address.full_name || "-"}</p>
											<p className="text-sm text-gray-800 dark:text-gray-200">{address.phone || "-"}</p>
											<p className="text-sm text-gray-800 dark:text-gray-200">{address.address || "-"}</p>
											<p className="text-sm text-gray-800 dark:text-gray-200">
												{address.city || "-"}, {address.state || "-"} - {address.pincode || "-"}
											</p>
										</div>
									</div>
								</div>
							);
						})}
					</div>

					<div className="mt-8 flex items-center justify-center gap-3">
						<button
							onClick={() => fetchFarmerOrders(currentPage - 1)}
							disabled={!hasPrevious || loading}
							className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							Previous
						</button>

						<span className="text-sm text-gray-600 dark:text-gray-300">
							Page {currentPage} of {totalPages}
						</span>

						<button
							onClick={() => fetchFarmerOrders(currentPage + 1)}
							disabled={!hasNext || loading}
							className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							Next
						</button>
					</div>
				</>
			)}
		</div>
	);
};

export default FarmerOrders;
