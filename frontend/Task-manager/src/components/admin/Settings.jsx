import { useState, useEffect } from "react";
import axios from "axios";
import "./Settings.css";
import { API_BASE_URL } from "../../config/api";

const ADMIN_API_BASE = `${API_BASE_URL}/api/admin`;

function Settings() {

    const [settings, setSettings] = useState({

        name: "",
        email: "",
        allowRegistration: true,
        maintenanceMode: false

    });

    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");

    // =========================
    // Change Password (inline OTP modal)
    // =========================

    const [showPasswordModal, setShowPasswordModal] = useState(false);

    // "email" -> confirm email + send otp
    // "otp"   -> enter otp + new password + confirm password
    const [passwordStep, setPasswordStep] = useState("email");

    const [pwEmail, setPwEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [passwordError, setPasswordError] = useState("");
    const [passwordSuccess, setPasswordSuccess] = useState("");
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);

    const authHeaders = () => ({
        Authorization: `Bearer ${localStorage.getItem("token")}`,
    });

    // Fetch logged-in admin details + system settings
    useEffect(() => {

    const fetchProfileAndSettings = async () => {

        try {

            const token = localStorage.getItem("token");

            const [profileRes, settingsRes] = await Promise.all([

                axios.get(
                    `${API_BASE_URL}/api/admin/profile`,
                    {
                        headers:{
                            Authorization:`Bearer ${token}`
                        }
                    }
                ),

                axios.get(
                    `${API_BASE_URL}/api/admin/system-settings`,
                    {
                        headers:{
                            Authorization:`Bearer ${token}`
                        }
                    }
                )

            ]);


            setSettings((prev)=>({

                ...prev,

                name: profileRes.data.name || "",

                email: profileRes.data.email || "",

                allowRegistration:
                settingsRes.data.allow_registration,

                maintenanceMode:
                settingsRes.data.maintenance_mode

            }));


        } catch(error){

            console.log(error);

        }

    };


    fetchProfileAndSettings();


},[]);

    const handleChange = (e) => {

        const { name, value, type, checked } = e.target;

        setSettings({

            ...settings,

            [name]: type === "checkbox" ? checked : value

        });

    };

    const saveSettings = async () => {

    setSaving(true);
    setMessage("");

    try {

        const token = localStorage.getItem("token");

        const headers = {
            Authorization:`Bearer ${token}`
        };

        // Save profile (name/email) and system settings together
        await Promise.all([

            axios.put(
                `${API_BASE_URL}/api/admin/profile`,
                {
                    name: settings.name,
                    email: settings.email
                },
                { headers }
            ),

            axios.put(
                `${API_BASE_URL}/api/admin/system-settings`,
                {
                    allow_registration:
                    settings.allowRegistration,

                    maintenance_mode:
                    settings.maintenanceMode
                },
                { headers }
            )

        ]);


        setMessage("Settings updated successfully");


    }
    catch(error){

        console.log(error);

        setMessage(
            error.response?.data?.message || "Failed to update settings"
        );

    }
    finally {

        setSaving(false);

    }

};

    // =========================
    // Open Password Modal
    // =========================

    const openPasswordModal = () => {

        setPasswordStep("email");

        setPwEmail(settings.email || "");
        setOtp("");
        setNewPassword("");
        setConfirmPassword("");

        setPasswordError("");
        setPasswordSuccess("");

        setShowPasswordModal(true);
    };


    // =========================
    // Close Password Modal
    // =========================

    const closePasswordModal = () => {

        if (passwordLoading || resendLoading) return;

        setShowPasswordModal(false);

        setPasswordStep("email");

        setPwEmail("");
        setOtp("");
        setNewPassword("");
        setConfirmPassword("");

        setPasswordError("");
        setPasswordSuccess("");
    };


    // =========================
    // Step 1: Send OTP
    // =========================

    const handleSendOtp = async () => {

        setPasswordError("");
        setPasswordSuccess("");

        if (!pwEmail) {
            setPasswordError("Please enter your email.");
            return;
        }

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(pwEmail)) {
            setPasswordError("Please enter a valid email address.");
            return;
        }

        try {

            setPasswordLoading(true);

            const response = await axios.post(
                `${ADMIN_API_BASE}/send-change-password-otp`,
                { email: pwEmail },
                { headers: authHeaders() }
            );

            setPasswordSuccess(response.data.message || "OTP sent to your email.");
            setPasswordStep("otp");

        } catch (error) {

            console.log(error);

            setPasswordError(
                error.response?.data?.message || "Unable to send OTP."
            );

        } finally {
            setPasswordLoading(false);
        }
    };


    // =========================
    // Resend OTP
    // =========================

    const handleResendOtp = async () => {

        setPasswordError("");
        setPasswordSuccess("");

        try {

            setResendLoading(true);

            const response = await axios.post(
                `${ADMIN_API_BASE}/send-change-password-otp`,
                { email: pwEmail },
                { headers: authHeaders() }
            );

            setPasswordSuccess(response.data.message || "A new OTP has been sent.");

        } catch (error) {

            console.log(error);

            setPasswordError(
                error.response?.data?.message || "Unable to resend OTP."
            );

        } finally {
            setResendLoading(false);
        }
    };


    // =========================
    // Step 2: Verify OTP + set new password
    // =========================

    const handleVerifyAndChangePassword = async () => {

        setPasswordError("");
        setPasswordSuccess("");

        if (!otp || !newPassword || !confirmPassword) {
            setPasswordError("Please fill all fields.");
            return;
        }

        if (newPassword.length < 6) {
            setPasswordError("New password must be at least 6 characters.");
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordError("New password and confirm password do not match.");
            return;
        }

        try {

            setPasswordLoading(true);

            const response = await axios.put(
                `${ADMIN_API_BASE}/change-password`,
                { email: pwEmail, otp, newPassword },
                { headers: authHeaders() }
            );

            setPasswordSuccess(response.data.message || "Password changed successfully.");

            setOtp("");
            setNewPassword("");
            setConfirmPassword("");

            setTimeout(() => {
                setShowPasswordModal(false);
                setPasswordStep("email");
                setPasswordSuccess("");
            }, 1500);

        } catch (error) {

            console.log(error);

            setPasswordError(
                error.response?.data?.message || "Unable to change password."
            );

        } finally {
            setPasswordLoading(false);
        }
    };


    return (

        <div className="settings-page">

            <div className="settings-header">

                <h1>Settings</h1>

                <p>
                    Manage your Task Manager system preferences.
                </p>

            </div>

            <div className="settings-grid">

                {/* Profile Settings */}

                <div className="settings-card">

                    <h2>Profile Settings</h2>

                    <label>Admin Name</label>

                    <input
                        type="text"
                        name="name"
                        value={settings.name}
                        onChange={handleChange}
                    />

                    <label>Email</label>

                    <input
                        type="email"
                        name="email"
                        value={settings.email}
                        onChange={handleChange}
                    />

                </div>

                {/* Security Settings */}

                <div className="settings-card">

                    <h2>Security Settings</h2>

                    <p>
                        Password changes require OTP verification.
                    </p>

                    <button
                        className="change-password-btn"
                        onClick={openPasswordModal}
                    >
                        Change Password
                    </button>

                </div>

                {/* System Settings */}

                <div className="settings-card">

                    <h2>System Settings</h2>

                    <div className="setting-option">

                        <input
                            type="checkbox"
                            name="allowRegistration"
                            checked={settings.allowRegistration}
                            onChange={handleChange}
                        />

                        <span>
                            Allow New User Registration
                        </span>

                    </div>

                    <div className="setting-option">

                        <input
                            type="checkbox"
                            name="maintenanceMode"
                            checked={settings.maintenanceMode}
                            onChange={handleChange}
                        />

                        <span>
                            Maintenance Mode
                        </span>

                    </div>

                </div>

            </div>

            <button
                className="settings-save-btn"
                onClick={saveSettings}
                disabled={saving}
            >
                {saving ? "Saving..." : "Save Changes"}
            </button>

            {message && (
                <p className="settings-message">
                    {message}
                </p>
            )}


            {/* =====================================================
                CHANGE PASSWORD MODAL (OTP FLOW, INLINE)
            ===================================================== */}

            {showPasswordModal && (

                <div className="settings-modal-overlay" onClick={closePasswordModal}>

                    <div className="modal-card" onClick={(e) => e.stopPropagation()}>

                        <h3>Change Password</h3>

                        {passwordStep === "email" && (
                            <p className="modal-description">
                                Confirm your admin email. We'll send a one-time
                                password (OTP) to verify it's you.
                            </p>
                        )}

                        {passwordStep === "otp" && (
                            <p className="modal-description">
                                Enter the OTP sent to <strong>{pwEmail}</strong>, then
                                choose a new password.
                            </p>
                        )}

                        {passwordError && (
                            <p className="error-text">{passwordError}</p>
                        )}

                        {passwordSuccess && (
                            <p className="success-text">{passwordSuccess}</p>
                        )}


                        {/* STEP 1: EMAIL */}
                        {passwordStep === "email" && (
                            <div className="modal-input-group">
                                <label>Email</label>
                                <input
                                    type="email"
                                    placeholder="Enter your admin email"
                                    value={pwEmail}
                                    onChange={(e) => setPwEmail(e.target.value)}
                                />
                            </div>
                        )}


                        {/* STEP 2: OTP + NEW PASSWORD */}
                        {passwordStep === "otp" && (
                            <>
                                <div className="modal-input-group">
                                    <label>OTP</label>
                                    <input
                                        type="text"
                                        placeholder="Enter the 6-digit OTP"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                    />
                                </div>

                                <div className="modal-input-group">
                                    <label>New Password</label>
                                    <input
                                        type="password"
                                        placeholder="Enter new password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                    />
                                </div>

                                <div className="modal-input-group">
                                    <label>Confirm New Password</label>
                                    <input
                                        type="password"
                                        placeholder="Confirm new password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                    />
                                </div>

                                <span
                                    className={`modal-resend${resendLoading ? " disabled" : ""}`}
                                    onClick={!resendLoading ? handleResendOtp : undefined}
                                >
                                    {resendLoading ? "Resending OTP..." : "Didn't get the code? Resend OTP"}
                                </span>
                            </>
                        )}


                        <div className="modal-actions">

                            <button
                                onClick={closePasswordModal}
                                disabled={passwordLoading || resendLoading}
                                className="modal-cancel-btn"
                            >
                                Cancel
                            </button>

                            {passwordStep === "email" && (
                                <button
                                    onClick={handleSendOtp}
                                    disabled={passwordLoading}
                                    className="settings-save-btn"
                                >
                                    {passwordLoading ? "Sending..." : "Send OTP"}
                                </button>
                            )}

                            {passwordStep === "otp" && (
                                <button
                                    onClick={handleVerifyAndChangePassword}
                                    disabled={passwordLoading}
                                    className="settings-save-btn"
                                >
                                    {passwordLoading ? "Changing..." : "Confirm"}
                                </button>
                            )}

                        </div>

                    </div>

                </div>

            )}

        </div>

    );

}

export default Settings;
