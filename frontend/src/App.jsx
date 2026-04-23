import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import Landing from "./pages/Landing";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import DeliveryProfileGuard from "./components/DeliveryProfileGuard";
import FarmerProfileGuard from "./components/FarmerProfileGuard";

// --- Auth Pages ---
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";

// --- Public Product Pages ---
import ProductList from "./pages/products/ProductList";
import ProductDetail from "./pages/products/ProductDetail";
import FarmerPublicProfile from "./pages/farmer/FarmerPublicProfile";

// --- Customer Pages ---
import Cart from "./pages/customer/Cart";
import Checkout from "./pages/customer/Checkout";
import Orders from "./pages/customer/Orders";
import OrderDetail from "./pages/customer/OrderDetail";
import CustomerProfile from "./pages/customer/CustomerProfile";

// --- Farmer Pages ---
import FarmerDashboard from "./pages/farmer/FarmerDashboard";
import FarmerOrders from "./pages/farmer/FarmerOrders";
import AddProduct from "./pages/farmer/AddProduct";
import EditProduct from "./pages/farmer/EditProduct";
import FarmerProfile from "./pages/farmer/FarmerProfile";
import FarmerCompleteProfile from "./pages/farmer/CompleteProfile";

// --- Delivery Partner Pages ---
import CompleteProfile from "./pages/delivery/CompleteProfile";
import Dashboard from "./pages/delivery/Dashboard";
import AvailableOrders from "./pages/delivery/AvailableOrders";
import MyDeliveries from "./pages/delivery/MyDeliveries";
import Earnings from "./pages/delivery/Earnings";
import DeliveryProfile from "./pages/delivery/DeliveryProfile";

function App() {
  return (
    <ThemeProvider>
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
          <Route path="/farmers/:id"     element={<FarmerPublicProfile />} />

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
              <Orders />
            </ProtectedRoute>
          } />
          <Route path="/orders/:id" element={
            <ProtectedRoute allowedRole="customer">
              <OrderDetail />
            </ProtectedRoute>
          } />
          <Route path="/profile/customer" element={
            <ProtectedRoute allowedRole="customer">
              <CustomerProfile />
            </ProtectedRoute>
          } />

          {/* ─── Farmer Protected Routes — must be logged in as farmer ─── */}
          <Route path="/farmer/complete-profile" element={
            <ProtectedRoute allowedRole="farmer">
              <FarmerCompleteProfile />
            </ProtectedRoute>
          } />
          <Route path="/farmer/dashboard" element={
            <ProtectedRoute allowedRole="farmer">
              <FarmerProfileGuard>
                <FarmerDashboard />
              </FarmerProfileGuard>
            </ProtectedRoute>
          } />
          <Route path="/farmer/orders" element={
            <ProtectedRoute allowedRole="farmer">
              <FarmerProfileGuard>
                <FarmerOrders />
              </FarmerProfileGuard>
            </ProtectedRoute>
          } />
          <Route path="/farmer/products/add" element={
            <ProtectedRoute allowedRole="farmer">
              <FarmerProfileGuard>
                <AddProduct />
              </FarmerProfileGuard>
            </ProtectedRoute>
          } />
          <Route path="/farmer/products/edit/:id" element={
            <ProtectedRoute allowedRole="farmer">
              <FarmerProfileGuard>
                <EditProduct />
              </FarmerProfileGuard>
            </ProtectedRoute>
          } />
          <Route path="/profile/farmer" element={
            <ProtectedRoute allowedRole="farmer">
              <FarmerProfileGuard>
                <FarmerProfile />
              </FarmerProfileGuard>
            </ProtectedRoute>
          } />

          {/* ─── Delivery Partner Routes ─── */}
          <Route
            path="/delivery/complete-profile"
            element={
              <ProtectedRoute allowedRole="delivery_partner">
                <CompleteProfile />
              </ProtectedRoute>
            }
          />

          <Route
            path="/delivery/dashboard"
            element={
              <ProtectedRoute allowedRole="delivery_partner">
                <DeliveryProfileGuard>
                  <Dashboard />
                </DeliveryProfileGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/delivery/orders"
            element={
              <ProtectedRoute allowedRole="delivery_partner">
                <DeliveryProfileGuard>
                  <AvailableOrders />
                </DeliveryProfileGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/delivery/my-deliveries"
            element={
              <ProtectedRoute allowedRole="delivery_partner">
                <DeliveryProfileGuard>
                  <MyDeliveries />
                </DeliveryProfileGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/delivery/earnings"
            element={
              <ProtectedRoute allowedRole="delivery_partner">
                <DeliveryProfileGuard>
                  <Earnings />
                </DeliveryProfileGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/delivery/profile"
            element={
              <ProtectedRoute allowedRole="delivery_partner">
                <DeliveryProfileGuard>
                  <DeliveryProfile />
                </DeliveryProfileGuard>
              </ProtectedRoute>
            }
          />

        </Routes>
        <Footer />
        </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
