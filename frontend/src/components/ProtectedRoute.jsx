import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // ← Wait for localStorage to load before deciding
  if (loading) {
    return (
      <div style={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f7f2e8",
        fontFamily: "Georgia, serif",
        letterSpacing: "4px",
        color: "#888",
        fontSize: "13px"
      }}>
        LOADING...
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        state={{
          from: location.pathname,
          message: "Please login to continue"
        }}
        replace
      />
    );
  }

  return children;
}

export default ProtectedRoute;