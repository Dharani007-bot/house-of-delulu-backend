// Hook — checks if logged in before doing protected action
// Usage: const requireAuth = useRequireAuth();
//        requireAuth(() => addToCart(item));

import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function useRequireAuth() {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const location   = useLocation();

  function requireAuth(action) {
    if (!user) {
      navigate("/login", {
        state: {
          from: location.pathname,
          message: "Please login to add items to cart or wishlist",
        },
      });
      return;
    }
    action(); // user is logged in → run the action
  }

  return requireAuth;
}

export default useRequireAuth;