import axios from "axios";

// 1. Create a custom axios instance with default settings
const api = axios.create({
  baseURL: "http://localhost:8000",
  withCredentials: true, // sends cookies with every request (critical for JWT in cookies)
  headers: {
    "Content-Type": "application/json",
  },
});

// Flag to prevent multiple refresh attempts at the same time
let isRefreshing = false;

// Queue of failed requests waiting for the token refresh to finish
let failedQueue = [];

// When refresh finishes, retry all queued requests or reject them
const processQueue = (error) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve();
    }
  });
  failedQueue = [];
};

// 2. Response Interceptor — handles 401 errors automatically
api.interceptors.response.use(
  // If the response is successful, just return it as-is
  (response) => response,

  // If the response is an error...
  async (error) => {
    const originalRequest = error.config;

    // Only attempt refresh on 401 (Unauthorized) and only once per request
    if (error.response?.status === 401 && !originalRequest._retry) {
      // If we're already refreshing, queue this request until refresh is done
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => api(originalRequest));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Call the backend refresh endpoint to get new tokens
        await axios.post(
          "http://localhost:8000/auth/refreshToken/",
          {},
          { withCredentials: true }
        );

        // Refresh succeeded — retry all queued requests
        processQueue(null);

        // Retry the original failed request
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed — reject all queued requests
        processQueue(refreshError);

        // Redirect to login page (user's session is fully expired)
        window.location.href = "/login";

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // For all other errors, just pass them through
    return Promise.reject(error);
  }
);

export default api;
