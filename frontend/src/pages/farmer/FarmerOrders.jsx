import { useEffect, useMemo, useState } from "react";
import api from "../../api/axios";
import { 
    UserIcon,
    MapPinIcon,
    ShoppingBagIcon,
    FaceFrownIcon,
    TruckIcon
} from "@heroicons/react/24/outline";
import { 
    ClockIcon as ClockSolid, 
    CheckCircleIcon as CheckSolid, 
    TruckIcon as TruckSolid, 
    HomeIcon as HomeSolid, 
    XCircleIcon as XSolid,
    ExclamationCircleIcon as DefaultSolid
} from "@heroicons/react/24/solid";

const PAGE_SIZE_DEFAULT = 10;

const getStatusConfig = (statusString) => {
    const status = String(statusString || "").toLowerCase();
    
    const config = {
        pending: {
            bg: "bg-yellow-50 dark:bg-yellow-500/10",
            text: "text-yellow-700 dark:text-yellow-400",
            border: "border-yellow-200 dark:border-yellow-500/20",
            icon: ClockSolid,
        },
        confirmed: {
            bg: "bg-blue-50 dark:bg-blue-500/10",
            text: "text-blue-700 dark:text-blue-400",
            border: "border-blue-200 dark:border-blue-500/20",
            icon: CheckSolid,
        },
        shipped: {
            bg: "bg-purple-50 dark:bg-purple-500/10",
            text: "text-purple-700 dark:text-purple-400",
            border: "border-purple-200 dark:border-purple-500/20",
            icon: TruckSolid,
        },
        delivered: {
            bg: "bg-green-50 dark:bg-emerald-500/10",
            text: "text-green-700 dark:text-emerald-400",
            border: "border-green-200 dark:border-emerald-500/20",
            icon: HomeSolid,
        },
        cancelled: {
            bg: "bg-red-50 dark:bg-red-500/10",
            text: "text-red-700 dark:text-red-400",
            border: "border-red-200 dark:border-red-500/20",
            icon: XSolid,
        },
    };

    return config[status] || {
        bg: "bg-gray-50 dark:bg-gray-500/10",
        text: "text-gray-700 dark:text-gray-400",
        border: "border-gray-200 dark:border-gray-500/20",
        icon: DefaultSolid,
    };
};

const FarmerOrders = () => {
	const [orders, setOrders] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");
	const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

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

	const filteredOrders = useMemo(() => {
		return orders.filter(order => {
			const matchesSearch = order.customer_name?.toLowerCase().includes(searchQuery.toLowerCase());
			const matchesStatus = statusFilter === "all" || String(order.status).toLowerCase() === statusFilter;
			return matchesSearch && matchesStatus;
		});
	}, [orders, searchQuery, statusFilter]);

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
			<div className="min-h-screen bg-[#FDFBF7] dark:bg-[#0A0F0D] py-16 px-4 md:px-8 transition-colors duration-500">
				<div className="max-w-7xl mx-auto space-y-12">
					<div className="h-10 w-64 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
					<div className="space-y-6">
						{Array.from({ length: 4 }).map((_, i) => (
							<div key={i} className="h-48 bg-white dark:bg-[#111812] border border-gray-100 dark:border-gray-800/60 rounded-[24px] overflow-hidden animate-pulse shadow-sm" />
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
						onClick={() => fetchFarmerOrders(1)}
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
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				
                {/* Premium Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-gray-200 dark:border-gray-800/80 pb-8">
					<div className="max-w-2xl">
						<h1 className="text-4xl sm:text-5xl font-black text-[#111812] dark:text-[#E8F3EB] tracking-tight mb-2">
							Fulfillment Orders
						</h1>
						<p className="text-gray-500 dark:text-gray-400 text-lg font-medium">
							Review and manage incoming purchases from customers.
						</p>
					</div>
				</div>

				{/* Search & Filters */}
				<div className="flex flex-col sm:flex-row gap-4 mb-8 bg-white dark:bg-[#111812] p-4 rounded-[20px] border border-gray-100 dark:border-gray-800 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
					{/* Search */}
					<div className="flex-1 relative group">
						<div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
							<svg className="h-5 w-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" viewBox="0 0 20 20" fill="currentColor">
								<path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
							</svg>
						</div>
						<input
							type="text"
							placeholder="Search by customer name..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="block w-full pl-11 pr-4 py-3 border border-gray-200 dark:border-gray-800/60 rounded-xl bg-gray-50 dark:bg-[#1A241A] text-sm font-medium focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 text-gray-900 dark:text-gray-100 outline-none transition-all placeholder-gray-400"
						/>
					</div>
					
					{/* Status Filter Custom Dropdown */}
					<div className="sm:w-56 relative block cursor-pointer">
                        {/* Backdrop overlay for closing */}
                        {isStatusDropdownOpen && (
                            <div 
                                className="fixed inset-0 z-40" 
                                onClick={() => setIsStatusDropdownOpen(false)}
                            />
                        )}
						<button 
                            type="button"
                            onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                            className="relative z-50 w-full flex items-center justify-between pl-4 pr-10 py-3 text-sm font-bold border border-gray-200 dark:border-gray-800/60 rounded-xl bg-gray-50 dark:bg-[#1A241A] focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 text-gray-700 dark:text-gray-200 outline-none transition-all text-left"
                        >
                            <span className="block truncate">
                                {statusFilter === "all" ? "All Statuses" : 
                                 statusFilter === "pending" ? "Pending" : 
                                 statusFilter === "completed" ? "Completed" : 
                                 statusFilter === "cancelled" ? "Cancelled" : "All Statuses"}
                            </span>
                            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                                <svg className={`h-4 w-4 text-gray-400 transition-transform duration-300 ${isStatusDropdownOpen ? 'rotate-180 text-emerald-500' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </button>

                        {/* Dropdown Menu */}
                        <div 
                            className={`absolute z-50 left-0 right-0 mt-2 bg-white dark:bg-[#1A241A] border border-gray-200 dark:border-gray-800/60 rounded-xl shadow-xl overflow-hidden transition-all duration-300 origin-top
                            ${isStatusDropdownOpen ? 'opacity-100 scale-y-100 translate-y-0 visible' : 'opacity-0 scale-y-95 -translate-y-2 invisible'}`}
                        >
                            <div className="py-2 flex flex-col gap-1 px-2">
                                {[
                                    { value: 'all', label: 'All Statuses' },
                                    { value: 'pending', label: 'Pending' },
                                    { value: 'completed', label: 'Completed' },
                                    { value: 'cancelled', label: 'Cancelled' }
                                ].map((option) => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => {
                                            setStatusFilter(option.value);
                                            setIsStatusDropdownOpen(false);
                                        }}
                                        className={`w-full text-left px-3 py-2 text-sm font-bold rounded-lg transition-colors
                                            ${statusFilter === option.value 
                                                ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' 
                                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-gray-200'
                                            }
                                        `}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </div>
					</div>
				</div>

				{error && (
					<div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 rounded-xl text-red-800 dark:text-red-400 text-sm font-medium flex items-center gap-3">
						<FaceFrownIcon className="w-5 h-5" />
                        {error}
					</div>
				)}

				{filteredOrders.length === 0 ? (
					<div className="flex flex-col items-center justify-center p-12 md:p-24 rounded-[32px] bg-white dark:bg-[#111812] border border-gray-100 dark:border-gray-800 shadow-sm text-center">
                        <ShoppingBagIcon className="w-16 h-16 text-gray-300 dark:text-gray-700 mb-6" />
                        <h2 className="text-2xl font-extrabold text-[#111812] dark:text-[#E8F3EB] mb-2 tracking-tight">No orders found</h2>
                        <p className="text-gray-500 dark:text-gray-400 max-w-sm">Try adjusting your search or filters to find what you're looking for.</p>
					</div>
				) : (
					<>
						<div className="space-y-6">
							{filteredOrders.map((item, index) => {
								const address = item.address || {};
                                const sc = getStatusConfig(item.status);
                                const StatusIcon = sc.icon;

								return (
									<div
										key={`${item.order_date || "date"}-${item.product_name || "product"}-${index}`}
										className="group bg-white dark:bg-[#111812] border border-gray-100 dark:border-gray-800 rounded-[28px] p-6 sm:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.02)] transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:hover:border-emerald-900/40 relative overflow-hidden flex flex-col xl:flex-row gap-6 lg:gap-10"
									>
                                        <div className="absolute top-0 left-0 w-1.5 h-full bg-gray-100 dark:bg-gray-800 group-hover:bg-emerald-500 transition-colors duration-500"></div>

                                        {/* Segment 1: Product overview */}
										<div className="flex-1 space-y-5">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                                                        <ShoppingBagIcon className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-lg font-black text-gray-900 dark:text-white leading-tight">{item.product_name}</h3>
                                                        <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{formatDate(item.order_date)}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="pl-14">
                                                <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                                                    <div>
                                                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Volume</p>
                                                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{formatQuantity(item.quantity, item.unit)}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Payout</p>
                                                        <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">₹{Number(item.total || 0).toFixed(2)}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="pl-14 pt-2">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider border shadow-sm ${sc.bg} ${sc.text} ${sc.border}`}>
                                                    <StatusIcon className="w-4 h-4" />
                                                    {item.status || "Unknown"}
                                                </span>
                                            </div>
										</div>

                                        <div className="hidden xl:block w-px bg-gray-100 dark:bg-gray-800/80 relative"></div>

                                        {/* Segment 2: Customer */}
                                        <div className="flex-1 space-y-4 pt-4 border-t border-gray-100 dark:border-gray-800 xl:border-none xl:pt-0">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                                                    <UserIcon className="w-4 h-4" />
                                                </div>
                                                <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-widest">Customer Profile</h4>
                                            </div>
                                            <div className="pl-11 space-y-3">
                                                <div>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Name</p>
                                                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{item.customer_name || "-"}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Phone</p>
                                                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{item.customer_phone || "-"}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Email</p>
                                                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{item.customer_email || "-"}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="hidden xl:block w-px bg-gray-100 dark:bg-gray-800/80 relative"></div>

                                        {/* Segment 3: Delivery Address */}
                                        <div className="flex-1 space-y-4 pt-4 border-t border-gray-100 dark:border-gray-800 xl:border-none xl:pt-0">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-8 h-8 rounded-full bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
                                                    <MapPinIcon className="w-4 h-4" />
                                                </div>
                                                <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-widest">Shipping Route</h4>
                                            </div>
                                            <div className="pl-11 space-y-3">
                                                <div>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Recipient</p>
                                                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{address.full_name || "-"}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Destination</p>
                                                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-1 leading-snug">{address.address || "-"}</p>
                                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 text-xs">
                                                        {address.city || "-"}, {address.state || "-"} {address.pincode || "-"}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Contact Node</p>
                                                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{address.phone || "-"}</p>
                                                </div>
                                            </div>
                                            
                                            <div className="pt-2">
                                                <button className="w-full flex items-center justify-center gap-2 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-extrabold text-[13px] py-3 rounded-xl transition-all duration-300 border border-emerald-200/60 dark:border-emerald-500/30 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-95 group/dispatch">
                                                    <TruckIcon className="w-4 h-4 group-hover/dispatch:translate-x-1 transition-transform" />
                                                    DISPATCH ORDER
                                                </button>
                                            </div>
                                        </div>

									</div>
								);
							})}
						</div>

						{/* Pagination */}
                        <div className="mt-16 flex items-center justify-center gap-6">
                            <button
                                onClick={() => fetchFarmerOrders(currentPage - 1)}
                                disabled={!hasPrevious || loading}
                                className="px-6 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-800 text-sm font-bold text-[#111812] dark:text-[#E8F3EB] hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 disabled:opacity-30 disabled:hover:border-gray-200 dark:disabled:hover:border-gray-800 disabled:hover:text-[#111812] dark:disabled:hover:text-[#E8F3EB] transition-all"
                            >
                                Previous
                            </button>

                            <span className="text-sm font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                                Page <span className="text-gray-900 dark:text-white mx-1">{currentPage}</span> of {totalPages}
                            </span>

                            <button
                                onClick={() => fetchFarmerOrders(currentPage + 1)}
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

export default FarmerOrders;
