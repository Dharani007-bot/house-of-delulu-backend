import "../styles/Auth.css";
import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";

function Register() {
  const navigate = useNavigate();
  const location = useLocation();
  const from     = location.state?.from || "/";

  const [form, setForm] = useState({
    username: "", email: "", phone: "",
    password: "", confirmPassword: "",
  });
  const [errors,   setErrors]   = useState({});
  const [loading,  setLoading]  = useState(false);
  const [apiError, setApiError] = useState("");

  function validate() {
    const e = {};
    if (!form.username.trim())  e.username = "Required";
    if (!form.email.trim())     e.email    = "Required";
    if (!form.phone.trim())     e.phone    = "Required";
    if (form.password.length < 6)
      e.password = "Min 6 characters";
    if (form.password !== form.confirmPassword)
      e.confirmPassword = "Passwords don't match";
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
      const res  = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/register/`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.username,
          email:    form.email,
          phone:    form.phone,
          password: form.password,
        }),
      });
      const data = await res.json();
       if (data.debug_otp) {
        console.log(`🔑 DEV OTP (email failed): ${data.debug_otp}`);
      }
      if (res.ok) {
        // Go to OTP verification
        navigate("/verify-otp", {
          state: {
            userId: data.user_id,
            email:  data.email,
            from,
          },
        });
      } else {
        setApiError(data.error || "Registration failed.");
      }
    } catch {
      setApiError("Cannot connect to server. Is Django running?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="auth-page">
      <div className="auth-left">
        <div className="auth-brand">
          <h1>HOUSE OF DELULU</h1>
          <p>CONFIDENCE • STYLE • LUXURY</p>
          <div className="auth-quote">
            <h2>"Fashion is what you buy.<br />Style is what you do with it."</h2>
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-box">
          <p className="auth-tag">JOIN THE MOVEMENT</p>
          <h2>CREATE ACCOUNT</h2>
          <p className="auth-sub">
            Already have an account?{" "}
            <Link to="/login" state={{ from }}>Sign in →</Link>
          </p>

          {apiError && <div className="api-err-box">{apiError}</div>}

          <div className="auth-form">
            {[
              { label: "Username",         name: "username",        type: "text",     ph: "johndoe" },
              { label: "Email Address",    name: "email",           type: "email",    ph: "john@example.com" },
              { label: "Phone Number",     name: "phone",           type: "text",     ph: "9876543210" },
              { label: "Password",         name: "password",        type: "password", ph: "Min 6 characters" },
              { label: "Confirm Password", name: "confirmPassword", type: "password", ph: "Repeat password" },
            ].map(({ label, name, type, ph }) => (
              <div className="auth-group" key={name}>
                <label>{label}</label>
                <input
                  type={type}
                  name={name}
                  placeholder={ph}
                  value={form[name]}
                  onChange={handleChange}
                  className={errors[name] ? "error" : ""}
                />
                {errors[name] && <span className="err-msg">{errors[name]}</span>}
              </div>
            ))}

            <button className="auth-btn" onClick={handleSubmit} disabled={loading}>
              {loading ? "SENDING OTP..." : "CREATE ACCOUNT →"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Register;

