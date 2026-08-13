import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";

import Home          from "./pages/Home";
import Shop          from "./pages/Shop";
import ProductDetail from "./pages/ProductDetail";
import Login         from "./pages/Login";
import Register      from "./pages/Register";
import VerifyOtp     from "./pages/VerifyOtp";

import Cart          from "./pages/Cart";
import Checkout      from "./pages/Checkout";
import OrderSuccess  from "./pages/OrderSuccess";
import Wishlist      from "./pages/Wishlist";
import Profile       from "./pages/Profile";


function App() {
  return (
    <Routes>
      {/* Root — pick a default department instead of a dead top-level page */}
      <Route path="/" element={<Navigate to="/women" replace />} />

      {/* ── WOMEN ── */}
      <Route path="/women"               element={<Home />} />
      <Route path="/women/shop"          element={<Shop />} />
      <Route path="/women/product/:slug" element={<ProductDetail />} />
      <Route path="/women/cart"     element={<ProtectedRoute><Cart /></ProtectedRoute>} />
      <Route path="/women/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
      <Route path="/women/success"  element={<ProtectedRoute><OrderSuccess /></ProtectedRoute>} />
      <Route path="/women/wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />

      {/* ── MEN ── */}
      <Route path="/men"               element={<Home />} />
      <Route path="/men/shop"          element={<Shop />} />
      <Route path="/men/product/:slug" element={<ProductDetail />} />
      <Route path="/men/cart"     element={<ProtectedRoute><Cart /></ProtectedRoute>} />
      <Route path="/men/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
      <Route path="/men/success"  element={<ProtectedRoute><OrderSuccess /></ProtectedRoute>} />
      <Route path="/men/wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />

      {/* ── SHARED / DEPARTMENT-AGNOSTIC ── */}
      <Route path="/login"      element={<Login />} />
      <Route path="/register"   element={<Register />} />
      <Route path="/verify-otp" element={<VerifyOtp />} />
      <Route path="/profile"    element={<ProtectedRoute><Profile /></ProtectedRoute>} />
    </Routes>
  );
}

export default App;