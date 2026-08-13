import "../styles/Auth.css";
import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function VerifyOtp() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { login } = useAuth();

  const userId = location.state?.userId;
  const email  = location.state?.email;

  const [otp,      setOtp]      = useState("");
  const [loading,  setLoading]  = useState(false);
  const [apiError, setApiError] = useState("");
  const [success,  setSuccess]  = useState("");

  // Resend countdown timer (60 seconds)
  const [timer,     setTimer]     = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (!userId) {
      navigate("/register");
      return;
    }
    const interval = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) {
          clearInterval(interval);
          setCanResend(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  async function handleVerify() {
    if (!otp.trim() || otp.length !== 6) {
      setApiError("Enter the 6-digit OTP.");
      return;
    }
    setLoading(true);
    setApiError("");
    try {
      const res  = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/verify-otp/`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ user_id: userId, otp }),
      });
      const data = await res.json();
      if (res.ok) {
        login(data.user);
        localStorage.setItem("atix_token", data.token);
        navigate("/", { replace: true });
      } else {
        setApiError(data.error || "Invalid OTP.");
      }
    } catch {
      setApiError("Cannot connect to server.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (!canResend) return;
    setApiError("");
    setSuccess("");
    try {
      const res  = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/resend-otp/`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ user_id: userId }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess("New OTP sent! Check your email.");
        setTimer(60);
        setCanResend(false);
        // restart timer
        const interval = setInterval(() => {
          setTimer((t) => {
            if (t <= 1) { clearInterval(interval); setCanResend(true); return 0; }
            return t - 1;
          });
        }, 1000);
      } else {
        setApiError(data.error || "Failed to resend.");
      }
    } catch {
      setApiError("Cannot connect to server.");
    }
  }

  return (
    <section className="auth-page">
      <div className="auth-left">
        <div className="auth-brand">
          <h1>HOUSE OF DELULU</h1>
          <p>CONFIDENCE • STYLE • LUXURY</p>
          <div className="auth-quote">
            <h2>"One step away from your wardrobe upgrade."</h2>
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-box">
          <p className="auth-tag">EMAIL VERIFICATION</p>
          <h2>ENTER OTP</h2>

          <p className="auth-sub">
            We sent a 6-digit code to<br />
            <strong>{email || "your email"}</strong>
          </p>

          {apiError && <div className="api-err-box">{apiError}</div>}
          {success  && <div className="success-msg-box">{success}</div>}

          <div className="auth-form">
            <div className="auth-group">
              <label>6-DIGIT OTP</label>
              <input
                type="text"
                placeholder="1 2 3 4 5 6"
                value={otp}
                maxLength={6}
                onChange={(e) => {
                  setOtp(e.target.value.replace(/\D/g, "")); // numbers only
                  setApiError("");
                }}
                className={`otp-input ${apiError ? "error" : ""}`}
                onKeyDown={(e) => e.key === "Enter" && handleVerify()}
              />
            </div>

            <button
              className="auth-btn"
              onClick={handleVerify}
              disabled={loading}
            >
              {loading ? "VERIFYING..." : "VERIFY EMAIL →"}
            </button>

            {/* Resend section */}
            <div className="resend-section">
              {canResend ? (
                <button className="resend-btn" onClick={handleResend}>
                  📧 RESEND OTP
                </button>
              ) : (
                <p className="resend-timer">
                  Resend OTP in <span className="gold-text">{timer}s</span>
                </p>
              )}
            </div>

            <p className="auth-sub" style={{ textAlign: "center" }}>
              Wrong email? <Link to="/register">Go back →</Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default VerifyOtp;

