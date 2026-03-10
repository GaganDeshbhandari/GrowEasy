import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import Landing from "./pages/Landing";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

// --- Auth Pages ---
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";

// --- Public Product Pages ---
import ProductList from "./pages/products/ProductList";
import ProductDetail from "./pages/products/ProductDetail";

// --- Customer Pages ---
import Cart from "./pages/customer/Cart";
import Checkout from "./pages/customer/Checkout";
import CustomerOrders from "./pages/customer/CustomerOrders";
import CustomerProfile from "./pages/customer/CustomerProfile";

// --- Farmer Pages ---
import FarmerDashboard from "./pages/farmer/FarmerDashboard";
import AddProduct from "./pages/farmer/AddProduct";
import EditProduct from "./pages/farmer/EditProduct";
import FarmerProfile from "./pages/farmer/FarmerProfile";

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          {/* Navbar sits here so it shows on every single page */}
          <Navbar />
          <Routes>

          {/* ─── Default redirect ─── */}
          <Route path="/" element={<Landing />} />

          {/* ─── Public Routes — anyone can visit ─── */}
          <Route path="/login"           element={<Login />} />
          <Route path="/register"        element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password"  element={<ResetPassword />} />
          <Route path="/products"        element={<ProductList />} />
          <Route path="/products/:id"    element={<ProductDetail />} />

          {/* ─── Customer Protected Routes — must be logged in as customer ─── */}
          <Route path="/cart" element={
            <ProtectedRoute allowedRole="customer">
              <Cart />
            </ProtectedRoute>
          } />
          <Route path="/checkout" element={
            <ProtectedRoute allowedRole="customer">
              <Checkout />
            </ProtectedRoute>
          } />
          <Route path="/orders" element={
            <ProtectedRoute allowedRole="customer">
              <CustomerOrders />
            </ProtectedRoute>
          } />
          <Route path="/profile/customer" element={
            <ProtectedRoute allowedRole="customer">
              <CustomerProfile />
            </ProtectedRoute>
          } />

          {/* ─── Farmer Protected Routes — must be logged in as farmer ─── */}
          <Route path="/farmer/dashboard" element={
            <ProtectedRoute allowedRole="farmer">
              <FarmerDashboard />
            </ProtectedRoute>
          } />
          <Route path="/farmer/products/add" element={
            <ProtectedRoute allowedRole="farmer">
              <AddProduct />
            </ProtectedRoute>
          } />
          <Route path="/farmer/products/edit/:id" element={
            <ProtectedRoute allowedRole="farmer">
              <EditProduct />
            </ProtectedRoute>
          } />
          <Route path="/profile/farmer" element={
            <ProtectedRoute allowedRole="farmer">
              <FarmerProfile />
            </ProtectedRoute>
          } />

        </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
