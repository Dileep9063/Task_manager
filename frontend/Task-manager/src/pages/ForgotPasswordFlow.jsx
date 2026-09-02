import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "./ForgotPasswordFlow.css";
import { useTheme } from "../context/ThemeContext";
import { FaArrowLeft, FaCheckCircle, FaRegCircle } from "react-icons/fa";
import { API_BASE_URL } from "../config/api";

const AUTH_API_BASE = `${API_BASE_URL}/api/auth`;

// Keep this list in sync with `_validate_password` on the backend
// (auth_views.py) so the UI and the API never disagree on the rules.
const PASSWORD_REQUIREMENTS = [
  { id: "length", label: "At least 8 characters", test: (pw) => pw.length >= 8 },
  { id: "uppercaseStart", label: "Starts with an uppercase letter", test: (pw) => /^[A-Z]/.test(pw) },
  { id: "number", label: "Contains a number", test: (pw) => /\d/.test(pw) },
  { id: "special", label: "Contains a special character", test: (pw) => /[^A-Za-z0-9]/.test(pw) },
];

function ForgotPasswordFlow() {

    const { theme } = useTheme();

    // "email" -> "otp" -> "reset"
    const [step, setStep] = useState("email");

    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordTouched, setPasswordTouched] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);

    const navigate = useNavigate();

    const passwordStatus = useMemo(
        () => PASSWORD_REQUIREMENTS.map((req) => ({ ...req, met: req.test(password) })),
        [password]
    );

    const isPasswordValid = passwordStatus.every((req) => req.met);
    const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;


    // =========================
    // Step 1: Send OTP
    // =========================

    const handleSendOtp = async (e) => {

        e.preventDefault();

        setError("");
        setSuccess("");

        if (!email) {
            setError("Please enter your email.");
            return;
        }

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(email)) {
            setError("Please enter a valid email address.");
            return;
        }

        try {

            setLoading(true);

            const response = await axios.post(
                `${AUTH_API_BASE}/forgot-password`,
                { email }
            );

            setSuccess(response.data.message || "OTP sent to your email.");
            setStep("otp");

        } catch (error) {

            console.log(error);

            setError(
                error.response?.data?.message || "Unable to send OTP."
            );

        } finally {
            setLoading(false);
        }

    };


    // =========================
    // Resend OTP
    // =========================

    const handleResendOtp = async () => {

        setError("");
        setSuccess("");

        try {

            setResendLoading(true);

            const response = await axios.post(
                `${AUTH_API_BASE}/forgot-password`,
                { email }
            );

            setSuccess(response.data.message || "A new OTP has been sent.");

        } catch (error) {

            console.log(error);

            setError(
                error.response?.data?.message || "Unable to resend OTP."
            );

        } finally {
            setResendLoading(false);
        }

    };


    // =========================
    // Step 2: Verify OTP
    // =========================

    const handleVerifyOtp = async (e) => {

        e.preventDefault();

        setError("");
        setSuccess("");

        if (!otp) {
            setError("Please enter the OTP.");
            return;
        }

        try {

            setLoading(true);

            const response = await axios.post(
                `${AUTH_API_BASE}/verify-otp`,
                { email, otp }
            );

            setSuccess(response.data.message || "OTP verified.");
            setStep("reset");

        } catch (error) {

            console.log(error);

            setError(
                error.response?.data?.message || "OTP verification failed."
            );

        } finally {
            setLoading(false);
        }

    };


    // =========================
    // Step 3: Reset Password
    // =========================

    const handleResetPassword = async (e) => {

        e.preventDefault();

        setError("");
        setSuccess("");

        if (!password || !confirmPassword) {
            setError("Please fill all fields.");
            return;
        }

        if (!isPasswordValid) {
            setError("Please meet all password requirements.");
            return;
        }

        if (password !== confirmPassword) {
            setError("New password and confirm password do not match.");
            return;
        }

        try {

            setLoading(true);

            const response = await axios.post(
                `${AUTH_API_BASE}/reset-password`,
                { email, otp, password }
            );

            setSuccess(response.data.message || "Password reset successfully.");

            setPassword("");
            setConfirmPassword("");
            setPasswordTouched(false);

            setTimeout(() => {
                navigate("/login");
            }, 1500);

        } catch (error) {

            console.log(error);

            setError(
                error.response?.data?.message || "Password Reset Failed"
            );

        } finally {
            setLoading(false);
        }

    };


    // =========================
    // Back navigation
    // =========================

    const handleBack = () => {

        setError("");
        setSuccess("");

        if (step === "otp") {
            setStep("email");
        } else if (step === "reset") {
            setStep("otp");
        }

    };

    // Top-of-card back link: goes to the previous step if mid-flow,
    // otherwise takes the user to the landing page.
    const handleTopBack = (e) => {

        if (step === "email") {
            // let the Link's default navigation to "/" happen
            return;
        }

        e.preventDefault();

        setError("");
        setSuccess("");

        if (step === "otp") {
            setStep("email");
        } else if (step === "reset") {
            setStep("otp");
        }

    };


    return (

        <div className="forgot-password-container" data-theme={theme}>

            <div className="forgot-password-card">

                <Link
                    to="/"
                    className="forgot-password-back-home-btn"
                    onClick={handleTopBack}
                >
                    <FaArrowLeft />
                    {step === "email" ? "Back to Home" : "Back"}
                </Link>

                <h1>Task Manager</h1>

                {step === "email" && (
                    <>
                        <h2>Forgot Password</h2>

                        {error && <p className="forgot-password-error-text">{error}</p>}
                        {success && <p className="forgot-password-success-text">{success}</p>}

                        <form onSubmit={handleSendOtp}>

                            <input
                                type="email"
                                placeholder="Enter your registered email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />

                            <button type="submit" disabled={loading}>
                                {loading ? "Sending..." : "Send OTP"}
                            </button>

                        </form>

                        <p>
                            <Link to="/login">Back to Login</Link>
                        </p>
                    </>
                )}

                {step === "otp" && (
                    <>
                        <h2>Verify OTP</h2>

                        <p className="forgot-password-modal-description">
                            Enter the OTP sent to <strong>{email}</strong>.
                        </p>

                        {error && <p className="forgot-password-error-text">{error}</p>}
                        {success && <p className="forgot-password-success-text">{success}</p>}

                        <form onSubmit={handleVerifyOtp}>

                            <input
                                type="text"
                                placeholder="Enter OTP"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                required
                            />

                            <span
                                className={`forgot-password-modal-resend${resendLoading ? " disabled" : ""}`}
                                onClick={!resendLoading ? handleResendOtp : undefined}
                            >
                                {resendLoading ? "Resending OTP..." : "Didn't get the code? Resend OTP"}
                            </span>

                            <button type="submit" disabled={loading}>
                                {loading ? "Verifying..." : "Verify OTP"}
                            </button>

                            <button
                                type="button"
                                className="forgot-password-back-btn"
                                onClick={handleBack}
                                disabled={loading || resendLoading}
                            >
                                Back
                            </button>

                        </form>
                    </>
                )}

                {step === "reset" && (
                    <>
                        <h2>Reset Password</h2>

                        {error && <p className="forgot-password-error-text">{error}</p>}
                        {success && <p className="forgot-password-success-text">{success}</p>}

                        <form onSubmit={handleResetPassword}>

                            <input
                                type="password"
                                placeholder="New Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onFocus={() => setPasswordTouched(true)}
                                required
                            />

                            {passwordTouched && (
                                <ul className="password-requirements-list">
                                    {passwordStatus.map((req) => (
                                        <li
                                            key={req.id}
                                            className={`password-requirement-item ${req.met ? "met" : ""}`}
                                        >
                                            {req.met ? (
                                                <FaCheckCircle className="requirement-icon met" />
                                            ) : (
                                                <FaRegCircle className="requirement-icon" />
                                            )}
                                            <span>{req.label}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}

                            <input
                                type="password"
                                placeholder="Confirm Password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />

                            {confirmPassword.length > 0 && !passwordsMatch && (
                                <p className="password-mismatch-text">Passwords do not match</p>
                            )}

                            <button
                                type="submit"
                                disabled={loading || !isPasswordValid || !passwordsMatch}
                            >
                                {loading ? "Resetting..." : "Reset Password"}
                            </button>

                            <button
                                type="button"
                                className="forgot-password-back-btn"
                                onClick={handleBack}
                                disabled={loading}
                            >
                                Back
                            </button>

                        </form>
                    </>
                )}

            </div>

        </div>

    );

}

export default ForgotPasswordFlow;
