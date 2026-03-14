import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api/axios";
const DEFAULT_PAGE_SIZE = 12;

const statusStyles = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  shipped: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  delivered: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
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
        nextThumbs[productId] = `${api.defaults.baseURL}${primary.image}`;
      }
    });

    if (Object.keys(nextThumbs).length > 0) {
      setProductThumbs((prev) => ({ ...prev, ...nextThumbs }));
    }
  };

  useEffect(() => {
    fetchOrders(1);
  }, []);

  useEffect(() => {
    if (orders.length > 0) {
      fetchThumbnailsForOrders(orders);
    }
  }, [orders]);

  const totalPages = useMemo(() => {
    if (!totalCount) return 1;
    return Math.max(1, Math.ceil(totalCount / pageSize));
  }, [totalCount, pageSize]);

  const statusClass = (status) => statusStyles[status] || "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200";

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
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="h-8 w-44 bg-gray-200 dark:bg-gray-700 rounded mb-8 animate-pulse" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <p className="text-red-600 dark:text-red-400 font-semibold mb-4">{error}</p>
        <button
          onClick={() => fetchOrders(currentPage)}
          className="px-6 py-2.5 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium transition"
        >
          Retry
        </button>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-12">
          <p className="text-6xl mb-4">📦</p>
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-2">No orders yet</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">Start shopping and place your first order.</p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-3 rounded-lg transition"
          >
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">My Orders</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Showing {orders.length} of {totalCount} orders
        </p>
      </div>

      <div className="space-y-4">
        {orders.map((order) => {
          const items = order.order_items || [];
          const firstThumbs = items.slice(0, 4);

          return (
            <div
              key={order.id}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5"
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                <div className="space-y-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Order #{order.id}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Placed on {formatDate(order.created_at)}</p>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wide ${statusClass(
                        order.status
                      )}`}
                    >
                      {order.status}
                    </span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      ₹{parseFloat(order.total_price || 0).toFixed(2)}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-300">{items.length} items</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex -space-x-2">
                    {firstThumbs.map((item) => {
                      const thumb = productThumbs[item.product];

                      return (
                        <div
                          key={item.id}
                          title={item.product_name}
                          className="w-10 h-10 rounded-full border-2 border-white dark:border-gray-800 bg-gray-100 dark:bg-gray-700 overflow-hidden"
                        >
                          {thumb ? (
                            <img src={thumb} alt={item.product_name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-200">
                              {(item.product_name || "P").charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => navigate(`/orders/${order.id}`)}
                    className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex items-center justify-center gap-3">
        <button
          onClick={() => fetchOrders(currentPage - 1)}
          disabled={!hasPrevious || loading}
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>

        <span className="text-sm text-gray-600 dark:text-gray-300">
          Page {currentPage} of {totalPages}
        </span>

        <button
          onClick={() => fetchOrders(currentPage + 1)}
          disabled={!hasNext || loading}
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Orders;