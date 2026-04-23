import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { resolveMediaUrl } from "../../utils/media";

import {
    ClockIcon as ClockSolid,
    CheckCircleIcon as CheckSolid,
    TruckIcon as TruckSolid,
    HomeIcon as HomeSolid,
    XCircleIcon as XSolid,
    ExclamationCircleIcon as DefaultSolid
} from "@heroicons/react/24/solid";
import {
    ShoppingBagIcon,
    FaceFrownIcon,
    ArrowRightIcon
} from "@heroicons/react/24/outline";

const DEFAULT_PAGE_SIZE = 12;

const getStatusConfig = (statusString) => {
    const status = String(statusString || "").toLowerCase();

    const config = {
		ready_for_pickup: {
			bg: "bg-indigo-50 dark:bg-indigo-500/10",
			text: "text-indigo-700 dark:text-indigo-400",
			border: "border-indigo-200 dark:border-indigo-500/20",
			icon: TruckSolid,
			label: "Finding Delivery Partner",
		},
		out_for_delivery: {
			bg: "bg-purple-50 dark:bg-purple-500/10",
			text: "text-purple-700 dark:text-purple-400",
			border: "border-purple-200 dark:border-purple-500/20",
			icon: TruckSolid,
			label: "Out for Delivery 🚚",
		},
        pending: {
            bg: "bg-yellow-50 dark:bg-yellow-500/10",
            text: "text-yellow-700 dark:text-yellow-400",
            border: "border-yellow-200 dark:border-yellow-500/20",
            icon: ClockSolid,
			label: "Pending",
        },
        confirmed: {
            bg: "bg-blue-50 dark:bg-blue-500/10",
            text: "text-blue-700 dark:text-blue-400",
            border: "border-blue-200 dark:border-blue-500/20",
            icon: CheckSolid,
			label: "Confirmed",
        },
        shipped: {
            bg: "bg-purple-50 dark:bg-purple-500/10",
            text: "text-purple-700 dark:text-purple-400",
            border: "border-purple-200 dark:border-purple-500/20",
            icon: TruckSolid,
			label: "Shipped",
        },
        delivered: {
            bg: "bg-green-50 dark:bg-emerald-500/10",
            text: "text-green-700 dark:text-emerald-400",
            border: "border-green-200 dark:border-emerald-500/20",
            icon: HomeSolid,
			label: "Delivered ✅",
        },
        cancelled: {
            bg: "bg-red-50 dark:bg-red-500/10",
            text: "text-red-700 dark:text-red-400",
            border: "border-red-200 dark:border-red-500/20",
            icon: XSolid,
			label: "Cancelled",
        },
    };

    return config[status] || {
        bg: "bg-gray-50 dark:bg-gray-500/10",
        text: "text-gray-700 dark:text-gray-400",
        border: "border-gray-200 dark:border-gray-500/20",
        icon: DefaultSolid,
		label: statusString || "Unknown",
    };
};

const Orders = () => {
	const navigate = useNavigate();

	const [orders, setOrders] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	const [currentPage, setCurrentPage] = useState(1);
	const [totalCount, setTotalCount] = useState(0);
	const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
	const [hasNext, setHasNext] = useState(false);
	const [hasPrevious, setHasPrevious] = useState(false);

	const [productThumbs, setProductThumbs] = useState({});

	const fetchOrders = async (page = 1) => {
		try {
			setLoading(true);
			setError("");

			let response;
			try {
				response = await api.get(`/orders/?page=${page}`);
			} catch {
				response = await api.get(`/orders/orders/?page=${page}`);
			}

			const data = response.data;

			if (Array.isArray(data)) {
				setOrders(data);
				setTotalCount(data.length);
				setCurrentPage(1);
				setHasNext(false);
				setHasPrevious(false);
			} else {
				const results = data?.results || [];
				setOrders(results);
				setTotalCount(data?.count || 0);
				setCurrentPage(page);
				setHasNext(Boolean(data?.next));
				setHasPrevious(Boolean(data?.previous));

				if (page === 1 && results.length > 0) {
					setPageSize(results.length);
				}
			}
		} catch {
			setError("Failed to load orders. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchOrders(1);
	}, []);

	const fetchThumbnailsForOrders = async (ordersList) => {
		const productIds = Array.from(
			new Set(
				ordersList
					.flatMap((order) => order.order_items || [])
					.map((item) => item.product)
					.filter(Boolean)
			)
		);

		const missingIds = productIds.filter((id) => !productThumbs[id]);
		if (missingIds.length === 0) return;

		const results = await Promise.allSettled(
			missingIds.map((id) => api.get(`/products/${id}/`))
		);

		const nextThumbs = {};

		results.forEach((result, index) => {
			if (result.status !== "fulfilled") return;

			const productId = missingIds[index];
			const images = result.value?.data?.images || [];
			const primary = images.find((img) => img.is_primary) || images[0];

			if (primary?.image) {
				nextThumbs[productId] = resolveMediaUrl(primary.image);
			}
		});

		if (Object.keys(nextThumbs).length > 0) {
			setProductThumbs((prev) => ({ ...prev, ...nextThumbs }));
		}
	};

	useEffect(() => {
		if (orders.length > 0) {
			fetchThumbnailsForOrders(orders);
		}
	}, [orders]);

	const totalPages = useMemo(() => {
		if (!totalCount) return 1;
		return Math.max(1, Math.ceil(totalCount / pageSize));
	}, [totalCount, pageSize]);


	const formatDate = (dateString) => {
		if (!dateString) return "-";
		return new Date(dateString).toLocaleDateString("en-IN", {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-[#FDFBF7] dark:bg-[#0A0F0D] py-16 px-4 md:px-8 transition-colors duration-500">
				<div className="max-w-6xl mx-auto space-y-12">
					<div className="h-10 w-64 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
					<div className="space-y-6">
						{Array.from({ length: 4 }).map((_, i) => (
							<div key={i} className="h-32 bg-white dark:bg-[#111812] border border-gray-100 dark:border-gray-800/60 rounded-[24px] overflow-hidden animate-pulse shadow-sm" />
						))}
					</div>
				</div>
			</div>
		);
	}

	if (error && orders.length === 0) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-[#FDFBF7] dark:bg-[#0A0F0D] py-16 px-4">
				<div className="max-w-lg w-full bg-white dark:bg-[#111812] border border-red-100 dark:border-red-900/30 rounded-3xl p-10 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none">
                    <FaceFrownIcon className="w-16 h-16 mx-auto text-red-400 dark:text-red-500 mb-6" />
					<h3 className="text-xl font-extrabold text-gray-900 dark:text-white mb-2">Oops, something went wrong</h3>
					<p className="text-gray-500 dark:text-gray-400 mb-8">{error}</p>
					<button
						onClick={() => fetchOrders(1)}
						className="w-full bg-[#111812] hover:bg-[#1A241A] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-bold px-6 py-3.5 rounded-xl transition-all"
					>
						Try Again
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-[#FDFBF7] dark:bg-[#0A0F0D] py-16 transition-colors duration-500 font-sans">
			<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Premium Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-gray-200 dark:border-gray-800/80 pb-8">
					<div className="max-w-2xl">
						<h1 className="text-4xl sm:text-5xl font-black text-[#111812] dark:text-[#E8F3EB] tracking-tight mb-2">
							Order History
						</h1>
						<p className="text-gray-500 dark:text-gray-400 text-lg font-medium">
							Review passed purchases and track pending deliveries.
						</p>
					</div>
				</div>

				{error && (
					<div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 rounded-xl text-red-800 dark:text-red-400 text-sm font-medium flex items-center gap-3">
						<FaceFrownIcon className="w-5 h-5" />
                        {error}
					</div>
				)}

				{orders.length === 0 ? (
					<div className="flex flex-col items-center justify-center p-12 md:p-24 rounded-[32px] bg-white dark:bg-[#111812] border border-gray-100 dark:border-gray-800 shadow-sm text-center">
                        <ShoppingBagIcon className="w-16 h-16 text-gray-300 dark:text-gray-700 mb-6" />
                        <h2 className="text-2xl font-extrabold text-[#111812] dark:text-[#E8F3EB] mb-2 tracking-tight">No orders yet</h2>
                        <p className="text-gray-500 dark:text-gray-400 max-w-sm mb-8">It seems you haven't bought anything from our farmers yet.</p>
                        <Link
                            to="/products"
                            className="bg-[#111812] hover:bg-[#1A241A] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-bold px-8 py-3.5 rounded-xl transition-all shadow-md active:scale-95"
                        >
                            Browse Marketplace
                        </Link>
					</div>
				) : (
					<>
						<div className="space-y-6">
							{orders.map((order, index) => {
								const items = order.order_items || [];
                                const firstThumbs = items.slice(0, 2);

                                const sc = getStatusConfig(order.status);
                                const StatusIcon = sc.icon;

								return (
									<div
										key={order.id || index}
										onClick={() => navigate(`/orders/${order.id}`)}
										className="group cursor-pointer bg-white dark:bg-[#111812] border border-gray-100 dark:border-gray-800 rounded-[28px] p-6 sm:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.02)] transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:hover:border-emerald-900/40 relative overflow-hidden"
									>
                                        <div className="absolute top-0 left-0 w-1.5 h-full bg-gray-100 dark:bg-gray-800 group-hover:bg-emerald-500 transition-colors duration-500"></div>

                                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                                            {/* Segment 1: Order Meta */}
                                            <div className="space-y-4 w-full">
                                                <div className="flex items-center gap-3">
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider border shadow-sm ${sc.bg} ${sc.text} ${sc.border}`}>
                                                        <StatusIcon className="w-4 h-4" />
														{sc.label}
                                                    </span>
                                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                                                        {formatDate(order.created_at)}
                                                    </p>
                                                </div>

                                                <div className="mt-2">
                                                    <div className="flex items-end gap-3 mb-6">
                                                        <h3 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white leading-tight tracking-tight">
                                                            ₹{parseFloat(order.total_price || 0).toFixed(2)}
                                                        </h3>
                                                    </div>

                                                    {/* Ordered Items List */}
                                                    <div className="space-y-4">
                                                        {firstThumbs.map((item, idx) => {
                                                            const thumb = productThumbs[item.product];

                                                            return (
                                                                <div key={item.id || idx} className="flex items-center gap-4 group/item">
                                                                    <div className="w-14 h-14 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden shrink-0 shadow-sm relative text-gray-400">
                                                                        {thumb ? (
                                                                            <img src={thumb} alt={item.product_name} className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-500" />
                                                                        ) : (
                                                                            <div className="absolute inset-0 flex items-center justify-center text-sm font-black uppercase tracking-widest bg-gray-50 dark:bg-gray-800">
                                                                                {(item.product_name || "P").charAt(0)}
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    <div className="flex-1 min-w-0">
                                                                        <h4 className="text-base font-extrabold text-gray-900 dark:text-white truncate tracking-tight">
                                                                            {item.product_name}
                                                                        </h4>
                                                                        <p className="text-xs font-bold text-emerald-600 dark:text-emerald-500 mt-1 tracking-widest uppercase">
                                                                            {item.quantity} × <span className="text-gray-500 dark:text-gray-400">₹{parseFloat(item.price || 0).toFixed(2)}</span>
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}

                                                        {items.length > 2 && (
                                                            <div className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-500 pt-1 ml-[72px]">
                                                                + {items.length - 2} more item{items.length !== 3 && 's'}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>


                                        </div>

									</div>
								);
							})}
						</div>

						{/* Pagination */}
                        <div className="mt-16 flex items-center justify-center gap-6">
                            <button
                                onClick={() => fetchOrders(currentPage - 1)}
                                disabled={!hasPrevious || loading}
                                className="px-6 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-800 text-sm font-bold text-[#111812] dark:text-[#E8F3EB] hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 disabled:opacity-30 disabled:hover:border-gray-200 dark:disabled:hover:border-gray-800 disabled:hover:text-[#111812] dark:disabled:hover:text-[#E8F3EB] transition-all"
                            >
                                Previous
                            </button>

                            <span className="text-sm font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                                Page <span className="text-gray-900 dark:text-white mx-1">{currentPage}</span> of {totalPages}
                            </span>

                            <button
                                onClick={() => fetchOrders(currentPage + 1)}
                                disabled={!hasNext || loading}
                                className="px-6 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-800 text-sm font-bold text-[#111812] dark:text-[#E8F3EB] hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 disabled:opacity-30 disabled:hover:border-gray-200 dark:disabled:hover:border-gray-800 disabled:hover:text-[#111812] dark:disabled:hover:text-[#E8F3EB] transition-all"
                            >
                                Next
                            </button>
                        </div>
					</>
				)}
			</div>
		</div>
	);
};

export default Orders;
