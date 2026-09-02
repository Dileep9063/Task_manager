import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./UserSettings.css";
import { API_BASE_URL } from "../../config/api";

const API_BASE = `${API_BASE_URL}/api/user`;
const AUTH_API_BASE = `${API_BASE_URL}/api/auth`; // adjust if your authRoutes.js is mounted elsewhere

const getAuthToken = () => localStorage.getItem("token");

const authFetch = (path, options = {}) => {
    return fetch(`${API_BASE}${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getAuthToken()}`,
            ...(options.headers || {}),
        },
    });
};

// Same as authFetch, but targets authRoutes.js (register/login/forgot-password/etc.)
const authFetchAuth = (path, options = {}) => {
    return fetch(`${AUTH_API_BASE}${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getAuthToken()}`,
            ...(options.headers || {}),
        },
    });
};

function UserSettings() {

    const navigate = useNavigate();

    // =========================
    // Change Password (OTP flow)
    // =========================

    const [showPasswordModal, setShowPasswordModal] = useState(false);

    // "email" -> enter email + send otp
    // "otp"   -> enter otp + new password + confirm password
    const [passwordStep, setPasswordStep] = useState("email");

    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [passwordError, setPasswordError] = useState("");
    const [passwordSuccess, setPasswordSuccess] = useState("");
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);


    // =========================
    // Delete Account
    // =========================

    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const [deleteError, setDeleteError] = useState("");
    const [deleteLoading, setDeleteLoading] = useState(false);


    // =========================
    // Export Data
    // =========================

    const [exportLoading, setExportLoading] = useState(false);
    const [exportError, setExportError] = useState("");


    // =========================
    // Open Password Modal
    // =========================

    const openPasswordModal = () => {

        setPasswordStep("email");

        setEmail("");
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

        setEmail("");
        setOtp("");
        setNewPassword("");
        setConfirmPassword("");

        setPasswordError("");
        setPasswordSuccess("");
    };


    // =========================
    // Step 1: Send OTP to email
    // =========================

    const handleSendOtp = async () => {

        setPasswordError("");
        setPasswordSuccess("");

        if (!email) {
            setPasswordError("Please enter your email.");
            return;
        }

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(email)) {
            setPasswordError("Please enter a valid email address.");
            return;
        }

        try {

            setPasswordLoading(true);

            const response = await authFetchAuth("/send-change-password-otp", {
                method: "POST",
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (!response.ok) {
                setPasswordError(data.message || "Unable to send OTP.");
                return;
            }

            setPasswordSuccess("OTP sent to your email.");
            setPasswordStep("otp");

        } catch (error) {

            console.error("Send OTP Error:", error);
            setPasswordError("Something went wrong. Please try again.");

        } finally {
            setPasswordLoading(false);
        }
    };


    // =========================
    // Resend OTP (step 2)
    // =========================

    const handleResendOtp = async () => {

        setPasswordError("");
        setPasswordSuccess("");

        try {

            setResendLoading(true);

            const response = await authFetchAuth("/send-change-password-otp", {
                method: "POST",
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (!response.ok) {
                setPasswordError(data.message || "Unable to resend OTP.");
                return;
            }

            setPasswordSuccess("A new OTP has been sent to your email.");

        } catch (error) {

            console.error("Resend OTP Error:", error);
            setPasswordError("Something went wrong. Please try again.");

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

            const response = await authFetchAuth("/change-password", {
                method: "PUT",
                body: JSON.stringify({ email, otp, newPassword }),
            });

            const data = await response.json();

            if (!response.ok) {
                setPasswordError(data.message || "Unable to change password.");
                return;
            }

            setPasswordSuccess("Password changed successfully.");

            setOtp("");
            setNewPassword("");
            setConfirmPassword("");

            setTimeout(() => {
                setShowPasswordModal(false);
                setPasswordStep("email");
                setPasswordSuccess("");
            }, 1500);

        } catch (error) {

            console.error("Change Password Error:", error);
            setPasswordError("Something went wrong. Please try again.");

        } finally {
            setPasswordLoading(false);
        }
    };


    // =========================
    // Open Delete Modal
    // =========================

    const openDeleteModal = () => {
        setDeleteError("");
        setShowDeleteModal(true);
    };


    // =========================
    // Close Delete Modal
    // =========================

    const closeDeleteModal = () => {
        if (deleteLoading) return;
        setDeleteError("");
        setShowDeleteModal(false);
    };


    // =========================
    // Delete Account
    // =========================

    const handleDeleteAccount = async () => {

        setDeleteError("");

        try {

            setDeleteLoading(true);

            const response = await authFetch("/account", {
                method: "DELETE",
            });

            const data = await response.json();

            if (!response.ok) {
                setDeleteError(data.message || "Unable to delete account.");
                return;
            }

            localStorage.removeItem("token");
            localStorage.removeItem("user");

            setShowDeleteModal(false);

            navigate("/login", { replace: true });

        } catch (error) {

            console.error("Delete Account Error:", error);
            setDeleteError("Something went wrong while deleting your account.");

        } finally {
            setDeleteLoading(false);
        }
    };


    // =========================
    // Export Data
    // =========================

    const handleExportData = async () => {

        setExportError("");

        try {

            setExportLoading(true);

            const response = await authFetch("/export", {
                method: "GET",
            });

            if (!response.ok) {

                // Error responses are still JSON, success responses are a PDF blob.
                const data = await response.json();
                setExportError(data.message || "Unable to export data.");
                return;
            }

            // Trigger a PDF file download in the browser
            const blob = await response.blob();

            const url = window.URL.createObjectURL(blob);

            const link = document.createElement("a");
            link.href = url;
            link.download = "my-data-export.pdf";
            document.body.appendChild(link);
            link.click();
            link.remove();

            window.URL.revokeObjectURL(url);

        } catch (error) {

            console.error("Export Data Error:", error);
            setExportError("Something went wrong while exporting your data.");

        } finally {
            setExportLoading(false);
        }
    };


    return (

        <div className="user-settings-page">

            <div className="user-settings-card">

                <h2>User Settings</h2>

                {/* SECURITY */}
                <div className="settings-section">

                    <h3>Security</h3>

                    <p>Manage your account password.</p>

                    <button className="secondary-btn" onClick={openPasswordModal}>
                        Change Password
                    </button>

                </div>

                {/* DATA */}
                <div className="settings-section">

                    <h3>Your Data</h3>

                    <p>Download a copy of your profile, tasks, and notifications.</p>

                    {exportError && (
                        <p className="error-text">{exportError}</p>
                    )}

                    <button
                        className="secondary-btn"
                        onClick={handleExportData}
                        disabled={exportLoading}
                    >
                        {exportLoading ? "Exporting..." : "Export Data"}
                    </button>

                </div>

                {/* DANGER ZONE */}
                <div className="danger-section">

                    <h3>Danger Zone</h3>

                    <p>
                        Permanently delete your account and
                        associated data.
                    </p>

                    <button className="delete-btn" onClick={openDeleteModal}>
                        <span className="btn-icon"></span>
                        Delete Account
                    </button>

                </div>

            </div>


            {/* =====================================================
                CHANGE PASSWORD MODAL (OTP FLOW, INLINE)
            ===================================================== */}

            {showPasswordModal && (

                <div className="modal-overlay" onClick={closePasswordModal}>

                    <div className="modal-card" onClick={(e) => e.stopPropagation()}>

                        <h3>Change Password</h3>

                        {passwordStep === "email" && (
                            <p className="modal-description">
                                Enter your registered email. We'll send a one-time
                                password (OTP) to verify it's you.
                            </p>
                        )}

                        {passwordStep === "otp" && (
                            <p className="modal-description">
                                Enter the OTP sent to <strong>{email}</strong>, then
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
                            <div className="settings-input">
                                <label>Email</label>
                                <input
                                    type="email"
                                    placeholder="Enter your registered email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        )}


                        {/* STEP 2: OTP + NEW PASSWORD */}
                        {passwordStep === "otp" && (
                            <>
                                <div className="settings-input">
                                    <label>OTP</label>
                                    <input
                                        type="text"
                                        placeholder="Enter the 6-digit OTP"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                    />
                                </div>

                                <div className="settings-input">
                                    <label>New Password</label>
                                    <input
                                        type="password"
                                        placeholder="Enter new password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                    />
                                </div>

                                <div className="settings-input">
                                    <label>Confirm New Password</label>
                                    <input
                                        type="password"
                                        placeholder="Confirm new password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                    />
                                </div>

                                <p
                                    className="modal-description"
                                    style={{ cursor: resendLoading ? "default" : "pointer", textDecoration: "underline" }}
                                    onClick={!resendLoading ? handleResendOtp : undefined}
                                >
                                    {resendLoading ? "Resending OTP..." : "Didn't get the code? Resend OTP"}
                                </p>
                            </>
                        )}


                        <div className="modal-actions">

                            <button
                                className="secondary-btn"
                                onClick={closePasswordModal}
                                disabled={passwordLoading || resendLoading}
                            >
                                Cancel
                            </button>

                            {passwordStep === "email" && (
                                <button
                                    className="save-settings-btn"
                                    onClick={handleSendOtp}
                                    disabled={passwordLoading}
                                >
                                    {passwordLoading ? "Sending..." : "Send OTP"}
                                </button>
                            )}

                            {passwordStep === "otp" && (
                                <button
                                    className="save-settings-btn"
                                    onClick={handleVerifyAndChangePassword}
                                    disabled={passwordLoading}
                                >
                                    {passwordLoading ? "Changing..." : "Confirm"}
                                </button>
                            )}

                        </div>

                    </div>

                </div>

            )}


            {/* =====================================================
                DELETE ACCOUNT MODAL
            ===================================================== */}

            {showDeleteModal && (

                <div className="modal-overlay" onClick={closeDeleteModal}>

                    <div className="modal-card delete-modal" onClick={(e) => e.stopPropagation()}>

                        <h3>Delete Account?</h3>

                        <p className="delete-warning">
                            This action is permanent and cannot be undone.
                        </p>

                        <p>
                            Your account credentials, profile
                            information and tasks will be
                            permanently deleted.
                        </p>

                        {deleteError && (
                            <p className="error-text">{deleteError}</p>
                        )}

                        <div className="modal-actions">

                            <button
                                className="secondary-btn"
                                onClick={closeDeleteModal}
                                disabled={deleteLoading}
                            >
                                No, Keep Account
                            </button>

                            <button
                                className="delete-btn"
                                onClick={handleDeleteAccount}
                                disabled={deleteLoading}
                            >
                                {deleteLoading ? "Deleting..." : "Yes, Delete My Account"}
                            </button>

                        </div>

                    </div>

                </div>

            )}

        </div>
    );
}

export default UserSettings;
