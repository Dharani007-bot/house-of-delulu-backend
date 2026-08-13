import "../styles/Auth.css";
import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Login() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { login } = useAuth();

  // Where they came from (e.g. /cart) + message
  const from    = location.state?.from || "/";
  const message = location.state?.message || null;

  const [form, setForm]         = useState({ username: "", password: "" });
  const [errors, setErrors]     = useState({});
  const [loading, setLoading]   = useState(false);
  const [apiError, setApiError] = useState("");

  function validate() {
    const e = {};
    if (!form.username.trim()) e.username = "Required";
    if (!form.password.trim()) e.password = "Required";
    return e;
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: "" });
    setApiError("");
  }

  async function handleSubmit() {
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    setLoading(true);
    try {
      const res  = await fetch("http://localhost:8000/api/auth/login/", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        login(data.user);
        navigate(from, { replace: true }); // ← go back to where they came from
      } else {
        setApiError(data.error || "Invalid username or password.");
      }
    } catch {
      setApiError("Cannot connect to server. Is Django running?");
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") handleSubmit();
  }

  return (
    <section className="auth-page">
      <div className="auth-left">
        <div className="auth-brand">
          <h1>HOUSE OF DELULU</h1>
          <p>CONFIDENCE • STYLE • LUXURY</p>
          <div className="auth-quote">
            <h2>"Dress like you're already famous."</h2>
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-box">
          <p className="auth-tag">WELCOME BACK</p>
          <h2>SIGN IN</h2>

          {/* Show redirect message */}
          {message && (
            <div className="redirect-msg">
              🔒 {message}
            </div>
          )}

          <p className="auth-sub">
            New here? <Link to="/register">Create an account →</Link>
          </p>

          {apiError && <div className="api-err-box">{apiError}</div>}

          <div className="auth-form">
            <div className="auth-group">
              <label>Username</label>
              <input
                type="text"
                name="username"
                placeholder="johndoe"
                value={form.username}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                className={errors.username ? "error" : ""}
              />
              {errors.username && <span className="err-msg">{errors.username}</span>}
            </div>

            <div className="auth-group">
              <label>Password</label>
              <input
                type="password"
                name="password"
                placeholder="Your password"
                value={form.password}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                className={errors.password ? "error" : ""}
              />
              {errors.password && <span className="err-msg">{errors.password}</span>}
            </div>

            <button className="auth-btn" onClick={handleSubmit} disabled={loading}>
              {loading ? "SIGNING IN..." : "SIGN IN →"}
            </button>

            <p className="auth-or">— OR —</p>

            <p className="auth-sub" style={{ textAlign: "center" }}>
              Don't have an account?{" "}
              <Link to="/register" state={{ from }}>Create one →</Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Login;