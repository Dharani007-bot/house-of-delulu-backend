import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "../styles/Profile.css";

const BASE = `${import.meta.env.VITE_API_URL}`;
const ORDERS_PER_PAGE = 5;

const STATUS_STEPS = ["pending", "confirmed", "shipped", "delivered"];

function OrderTimeline({ status }) {
  if (status === "cancelled") {
    return <div className="order-timeline cancelled">❌ This order was cancelled</div>;
  }
  const currentIndex = STATUS_STEPS.indexOf(status);
  return (
    <div className="order-timeline">
      {STATUS_STEPS.map((step, i) => (
        <div key={step} className={`timeline-step ${i <= currentIndex ? "done" : ""}`}>
          <span className="timeline-dot" />
          <span className="timeline-label">{step.toUpperCase()}</span>
          {i < STATUS_STEPS.length - 1 && <span className={`timeline-line ${i < currentIndex ? "done" : ""}`} />}
        </div>
      ))}
    </div>
  );
}

function Profile() {
  const { user, logout, login } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [activeTab, setActiveTab] = useState("profile");

  // Profile state
  const [profile,        setProfile]        = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [editMode,       setEditMode]       = useState(false);
  const [profileForm,    setProfileForm]    = useState({ first_name: "", last_name: "", phone: "" });
  const [profileMsg,     setProfileMsg]     = useState({ type: "", text: "" });
  const [profileSaving,  setProfileSaving]  = useState(false);

  // Avatar upload state
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageMsg,       setImageMsg]        = useState({ type: "", text: "" });

  // Password state
  const [passForm,    setPassForm]    = useState({ current_password: "", new_password: "", confirm_password: "" });
  const [passMsg,     setPassMsg]     = useState({ type: "", text: "" });
  const [passSaving,  setPassSaving]  = useState(false);
  const [showPass,    setShowPass]    = useState({ current: false, new: false, confirm: false });

  // Orders state
  const [orders,        setOrders]        = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [ordersPage,    setOrdersPage]    = useState(1);

  // Delete account state
  const [deletePass,     setDeletePass]    = useState("");
  const [deleteMsg,      setDeleteMsg]     = useState("");
  const [deleteConfirm,  setDeleteConfirm] = useState(false);

  // Load profile on mount
  useEffect(() => {
    if (!user) return;
    fetch(`${BASE}/api/profile/?username=${user.username}`)
      .then((r) => r.json())
      .then((data) => {
        setProfile(data);
        setProfileForm({
          first_name: data.first_name || "",
          last_name:  data.last_name  || "",
          phone:      data.phone      || "",
        });
        setProfileLoading(false);
      })
      .catch(() => setProfileLoading(false));
  }, [user]);

  // Load orders when tab switches
  useEffect(() => {
    if (activeTab !== "orders" || !user) return;
    setOrdersLoading(true);
    fetch(`${BASE}/api/profile/orders/?username=${user.username}`)
      .then((r) => r.json())
      .then((data) => { setOrders(data); setOrdersLoading(false); })
      .catch(() => setOrdersLoading(false));
  }, [activeTab, user]);

  // ── UPDATE PROFILE ──
  async function handleUpdateProfile() {
    setProfileSaving(true);
    setProfileMsg({ type: "", text: "" });
    try {
      const res  = await fetch(`${BASE}/api/profile/update/`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ username: user.username, ...profileForm }),
      });
      const data = await res.json();
      if (res.ok) {
        setProfileMsg({ type: "success", text: data.message });
        setEditMode(false);
        login({ ...user, phone: profileForm.phone });
        setProfile((p) => ({ ...p, ...profileForm }));
      } else {
        setProfileMsg({ type: "error", text: data.error });
      }
    } catch {
      setProfileMsg({ type: "error", text: "Cannot connect to server." });
    } finally {
      setProfileSaving(false);
    }
  }

  // ── UPLOAD PROFILE PHOTO ──
  async function handleImageSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setImageMsg({ type: "", text: "" });

    const formData = new FormData();
    formData.append("username", user.username);
    formData.append("profile_image", file);

    try {
      const res  = await fetch(`${BASE}/api/profile/upload-image/`, {
        method: "POST",
        body:   formData,
      });
      const data = await res.json();
      if (res.ok) {
        setProfile((p) => ({ ...p, profile_image: data.profile_image }));
        login({ ...user, profile_image: data.profile_image });
        setImageMsg({ type: "success", text: data.message });
      } else {
        setImageMsg({ type: "error", text: data.error });
      }
    } catch {
      setImageMsg({ type: "error", text: "Cannot connect to server." });
    } finally {
      setUploadingImage(false);
      setTimeout(() => setImageMsg({ type: "", text: "" }), 3000);
    }
  }

  // ── CHANGE PASSWORD ──
  async function handleChangePassword() {
    setPassSaving(true);
    setPassMsg({ type: "", text: "" });
    try {
      const res  = await fetch(`${BASE}/api/profile/change-password/`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ username: user.username, ...passForm }),
      });
      const data = await res.json();
      if (res.ok) {
        setPassMsg({ type: "success", text: data.message });
        setPassForm({ current_password: "", new_password: "", confirm_password: "" });
        // refresh "last changed" text
        setProfile((p) => ({ ...p, password_changed_at: "Just now" }));
      } else {
        setPassMsg({ type: "error", text: data.error });
      }
    } catch {
      setPassMsg({ type: "error", text: "Cannot connect to server." });
    } finally {
      setPassSaving(false);
    }
  }

  // ── DELETE ACCOUNT ──
  async function handleDeleteAccount() {
    if (!deleteConfirm || !deletePass) return;
    try {
      const res  = await fetch(`${BASE}/api/profile/delete/`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ username: user.username, password: deletePass }),
      });
      const data = await res.json();
      if (res.ok) {
        logout();
        navigate("/");
      } else {
        setDeleteMsg(data.error || "Failed to delete.");
      }
    } catch {
      setDeleteMsg("Cannot connect to server.");
    }
  }

  const STATUS_COLORS = {
    pending:   { bg: "#fef9c3", color: "#854d0e" },
    confirmed: { bg: "#dbeafe", color: "#1e40af" },
    shipped:   { bg: "#f3e8ff", color: "#6b21a8" },
    delivered: { bg: "#dcfce7", color: "#166534" },
    cancelled: { bg: "#fee2e2", color: "#991b1b" },
  };

  if (!user) return null;

  // Pagination slice
  const totalPages   = Math.max(1, Math.ceil(orders.length / ORDERS_PER_PAGE));
  const pagedOrders  = orders.slice((ordersPage - 1) * ORDERS_PER_PAGE, ordersPage * ORDERS_PER_PAGE);

  return (
    <>
      <Header />
      <section className="profile-page">

        {/* ── SIDEBAR ── */}
        <div className="profile-sidebar">
          <div className="profile-avatar">
            <div className="avatar-upload-wrap" onClick={() => fileInputRef.current?.click()}>
              {profile?.profile_image ? (
                <img src={profile.profile_image} alt="Profile" className="avatar-img" />
              ) : (
                <div className="avatar-circle">
                  {user.username[0].toUpperCase()}
                </div>
              )}
              <div className="avatar-edit-overlay">
                {uploadingImage ? "..." : "📷"}
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: "none" }}
              onChange={handleImageSelect}
            />
            {imageMsg.text && (
              <p className={`avatar-msg ${imageMsg.type}`}>{imageMsg.text}</p>
            )}
            <h3>{user.username}</h3>
            <p>{user.email}</p>
          </div>

          <nav className="profile-nav">
            {[
              { id: "profile",  icon: "👤", label: "My Profile" },
              { id: "orders",   icon: "📦", label: "My Orders" },
              { id: "security", icon: "🔒", label: "Security" },
              { id: "danger",   icon: "⚠️", label: "Delete Account" },
            ].map(({ id, icon, label }) => (
              <button
                key={id}
                className={`profile-nav-item ${activeTab === id ? "active" : ""} ${id === "danger" ? "danger" : ""}`}
                onClick={() => setActiveTab(id)}
              >
                <span>{icon}</span>
                <span>{label}</span>
              </button>
            ))}
          </nav>

          <button className="profile-logout-btn" onClick={() => { logout(); navigate("/"); }}>
            LOGOUT
          </button>
        </div>

        {/* ── MAIN CONTENT ── */}
        <div className="profile-content">

          {/* ── MY PROFILE TAB ── */}
          {activeTab === "profile" && (
            <div className="profile-section">
              <div className="profile-section-header">
                <h2>MY PROFILE</h2>
                <button className="edit-btn" onClick={() => setEditMode(!editMode)}>
                  {editMode ? "CANCEL" : "✏️ EDIT"}
                </button>
              </div>

              {profileLoading ? (
                <div className="skeleton-line" />
              ) : (
                <div className="profile-fields">
                  <div className="profile-field-row">
                    <div className="profile-field">
                      <label>USERNAME</label>
                      <p className="field-value">{profile?.username}</p>
                      <span className="field-note">Cannot be changed</span>
                    </div>
                    <div className="profile-field">
                      <label>EMAIL</label>
                      <p className="field-value">{profile?.email}</p>
                      <span className="field-note">
                        {profile?.is_verified ? "✅ Verified" : "❌ Not verified"}
                      </span>
                    </div>
                  </div>

                  <div className="profile-field-row">
                    <div className="profile-field">
                      <label>FIRST NAME</label>
                      {editMode ? (
                        <input
                          type="text"
                          value={profileForm.first_name}
                          onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })}
                          placeholder="Your first name"
                        />
                      ) : (
                        <p className="field-value">{profile?.first_name || "—"}</p>
                      )}
                    </div>

                    <div className="profile-field">
                      <label>LAST NAME</label>
                      {editMode ? (
                        <input
                          type="text"
                          value={profileForm.last_name}
                          onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })}
                          placeholder="Your last name"
                        />
                      ) : (
                        <p className="field-value">{profile?.last_name || "—"}</p>
                      )}
                    </div>
                  </div>

                  <div className="profile-field-row">
                    <div className="profile-field">
                      <label>PHONE</label>
                      {editMode ? (
                        <input
                          type="text"
                          value={profileForm.phone}
                          onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                          placeholder="10-digit number"
                        />
                      ) : (
                        <p className="field-value">{profile?.phone || "—"}</p>
                      )}
                    </div>
                    <div className="profile-field">
                      <label>MEMBER SINCE</label>
                      <p className="field-value">{profile?.date_joined}</p>
                    </div>
                  </div>

                  {profileMsg.text && (
                    <div className={`profile-msg ${profileMsg.type}`}>
                      {profileMsg.text}
                    </div>
                  )}

                  {editMode && (
                    <button className="save-btn" onClick={handleUpdateProfile} disabled={profileSaving}>
                      {profileSaving ? "SAVING..." : "SAVE CHANGES →"}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── MY ORDERS TAB ── */}
          {activeTab === "orders" && (
            <div className="profile-section">
              <div className="profile-section-header">
                <h2>MY ORDERS</h2>
                <p>{orders.length} order{orders.length !== 1 ? "s" : ""}</p>
              </div>

              {ordersLoading ? (
                <div className="skeleton-line" />
              ) : orders.length === 0 ? (
                <div className="orders-empty">
                  <p>📦 No orders yet.</p>
                  <button onClick={() => navigate("/shop")}>SHOP NOW</button>
                </div>
              ) : (
                <>
                  <div className="orders-list">
                    {pagedOrders.map((order) => {
                      const sc = STATUS_COLORS[order.status] || STATUS_COLORS.pending;
                      const isExpanded = expandedOrder === order.id;
                      return (
                        <div className="order-card" key={order.id}>
                          <div
                            className="order-card-header clickable"
                            onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                          >
                            <div>
                              <p className="order-id">Order #{order.id}</p>
                              <p className="order-date">
                                {new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                              </p>
                            </div>
                            <div className="order-right">
                              <span className="order-status" style={{ background: sc.bg, color: sc.color }}>
                                {order.status.toUpperCase()}
                              </span>
                              <p className="order-total">₹{order.total}</p>
                              <span className="expand-arrow">{isExpanded ? "▲" : "▼"}</span>
                            </div>
                          </div>

                          {isExpanded && <OrderTimeline status={order.status} />}

                          <div className="order-items-list">
                            {order.items?.map((item) => (
                              <div key={item.id} className="order-item-row">
                                <span>{item.product_name}</span>
                                {item.size && <span className="item-size">({item.size})</span>}
                                <span>×{item.quantity}</span>
                                <span>₹{item.price}</span>
                              </div>
                            ))}
                          </div>

                          {order.discount_amount > 0 && (
                            <div className="order-discount-row">
                              🎟️ Coupon ({order.coupon_code}): − ₹{order.discount_amount}
                            </div>
                          )}

                          <div className="order-footer">
                            <span className="payment-method-tag">
                              {order.payment_method === "cod" ? "💵 Cash on Delivery" : "💳 Online"}
                            </span>
                            <span className="payment-status-tag" style={{
                              color: order.payment_status ? "#166534" : "#854d0e"
                            }}>
                              {order.payment_status ? "✅ Paid" : "⏳ Pending"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {totalPages > 1 && (
                    <div className="orders-pagination">
                      <button
                        disabled={ordersPage === 1}
                        onClick={() => setOrdersPage((p) => p - 1)}
                      >← PREV</button>
                      <span>PAGE {ordersPage} OF {totalPages}</span>
                      <button
                        disabled={ordersPage === totalPages}
                        onClick={() => setOrdersPage((p) => p + 1)}
                      >NEXT →</button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── SECURITY TAB ── */}
          {activeTab === "security" && (
            <div className="profile-section">
              <div className="profile-section-header">
                <h2>SECURITY</h2>
              </div>

              <div className="security-info">
                <div className="security-item">
                  <span>✅</span>
                  <div>
                    <p>Email Verified</p>
                    <small>{user.email}</small>
                  </div>
                </div>
                <div className="security-item">
                  <span>🔒</span>
                  <div>
                    <p>Password Protected</p>
                    <small>Last changed: {profile?.password_changed_at || "Loading..."}</small>
                  </div>
                </div>
              </div>

              <h3 className="sub-section-title">CHANGE PASSWORD</h3>

              {passMsg.text && (
                <div className={`profile-msg ${passMsg.type}`}>{passMsg.text}</div>
              )}

              <div className="pass-form">
                {[
                  { key: "current_password", label: "Current Password",  ph: "Your current password" },
                  { key: "new_password",     label: "New Password",      ph: "Min 8 chars, 1 uppercase, 1 number" },
                  { key: "confirm_password", label: "Confirm New Password", ph: "Repeat new password" },
                ].map(({ key, label, ph }) => (
                  <div className="profile-field" key={key}>
                    <label>{label}</label>
                    <div className="pass-input-wrap">
                      <input
                        type={showPass[key.split("_")[0]] ? "text" : "password"}
                        value={passForm[key]}
                        onChange={(e) => setPassForm({ ...passForm, [key]: e.target.value })}
                        placeholder={ph}
                      />
                      <button
                        className="show-pass-btn"
                        onClick={() => {
                          const k = key.split("_")[0];
                          setShowPass({ ...showPass, [k]: !showPass[k] });
                        }}
                        type="button"
                      >
                        {showPass[key.split("_")[0]] ? "🙈" : "👁️"}
                      </button>
                    </div>
                  </div>
                ))}

                <button className="save-btn" onClick={handleChangePassword} disabled={passSaving}>
                  {passSaving ? "UPDATING..." : "UPDATE PASSWORD →"}
                </button>
              </div>
            </div>
          )}

          {/* ── DELETE ACCOUNT TAB ── */}
          {activeTab === "danger" && (
            <div className="profile-section">
              <div className="profile-section-header danger-header">
                <h2>DELETE ACCOUNT</h2>
              </div>

              <div className="danger-zone">
                <div className="danger-warning">
                  <h3>⚠️ This action cannot be undone</h3>
                  <p>Deleting your account will:</p>
                  <ul>
                    <li>Permanently deactivate your profile</li>
                    <li>Remove access to your account</li>
                    <li>Your order history will be retained for business records</li>
                    <li>Your wishlist and saved data will be cleared</li>
                  </ul>
                </div>

                <div className="danger-confirm">
                  <label className="confirm-check">
                    <input
                      type="checkbox"
                      checked={deleteConfirm}
                      onChange={(e) => setDeleteConfirm(e.target.checked)}
                    />
                    I understand this is permanent and cannot be undone
                  </label>

                  {deleteConfirm && (
                    <>
                      <div className="profile-field">
                        <label>CONFIRM WITH YOUR PASSWORD</label>
                        <input
                          type="password"
                          placeholder="Enter your password to confirm"
                          value={deletePass}
                          onChange={(e) => setDeletePass(e.target.value)}
                        />
                      </div>
                      {deleteMsg && <p className="delete-error">{deleteMsg}</p>}
                      <button className="delete-btn" onClick={handleDeleteAccount} disabled={!deletePass}>
                        DELETE MY ACCOUNT
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </section>
      <Footer />
    </>
  );
}

export default Profile;

