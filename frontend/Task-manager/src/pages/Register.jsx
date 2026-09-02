import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useGoogleLogin } from "@react-oauth/google";
import "./Register.css";
import { useTheme } from "../context/ThemeContext";
import { FaCheckCircle, FaRegCircle, FaArrowLeft } from "react-icons/fa";
import { API_BASE_URL } from "../config/api";

// Keep this list in sync with `_validate_password` on the backend
// (auth_views.py) so the UI and the API never disagree on the rules.
const PASSWORD_REQUIREMENTS = [
  { id: "length", label: "At least 8 characters", test: (pw) => pw.length >= 8 },
  { id: "uppercaseStart", label: "Starts with an uppercase letter", test: (pw) => /^[A-Z]/.test(pw) },
  { id: "number", label: "Contains a number", test: (pw) => /\d/.test(pw) },
  { id: "special", label: "Contains a special character", test: (pw) => /[^A-Za-z0-9]/.test(pw) },
];

function Register() {
  const { theme } = useTheme();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  const passwordStatus = useMemo(
    () => PASSWORD_REQUIREMENTS.map((req) => ({ ...req, met: req.test(formData.password) })),
    [formData.password]
  );

  const isPasswordValid = passwordStatus.every((req) => req.met);
  const passwordsMatch = confirmPassword.length > 0 && formData.password === confirmPassword;
  const canSubmit = isPasswordValid && passwordsMatch && formData.name.trim() && formData.email.trim();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!isPasswordValid) {
      setMessage("Please meet all password requirements");
      return;
    }

    if (formData.password !== confirmPassword) {
      setMessage("Passwords do not match");
      return;
    }

    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/auth/register`,
        formData
      );

      setMessage(res.data.message);

      setFormData({
        name: "",
        email: "",
        password: "",
      });

      setConfirmPassword("");
      setPasswordTouched(false);

    } catch (err) {
      setMessage(
        err.response?.data?.message || "Registration Failed"
      );
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setGoogleLoading(true);
      try {
        const res = await axios.post(
          `${API_BASE_URL}/api/auth/google`,
          { access_token: tokenResponse.access_token }
        );

        setMessage(res.data.message || "Registered with Google successfully");

      } catch (err) {
        setMessage(
          err.response?.data?.message || "Google registration failed"
        );
      } finally {
        setGoogleLoading(false);
      }
    },
    onError: () => {
      setMessage("Google sign-in was cancelled or failed");
    },
  });

  return (
    <div className="register-container" data-theme={theme}>

      {/* Left Side */}

      <div className="left-panel">

        <div className="left-panel-grid"></div>

        <span className="left-panel-mark">TM</span>

        <h2>Organize Your Work Smarter</h2>

        <p className="quote">
          "Every great achievement begins with one completed task."
        </p>

        <div className="register-features">
            <div><FaCheckCircle className="feature-check-icon" /> Manage Tasks Efficiently</div>
            <div><FaCheckCircle className="feature-check-icon" /> Collaborate with Your Team</div>
            <div><FaCheckCircle className="feature-check-icon" /> Stay Organized Every Day</div>
        </div>

      </div>

      {/* Right Side */}

      <div className="right-panel">

        <div className="register-card">
         <button
            type="button"
            className="register-back-home-btn"
            onClick={() => navigate("/")}
          >
          <FaArrowLeft className="back-home-icon" /> Back to Home
          </button>
          <h1>Create Your Account </h1>

          <p className="register-subtitle">
            Join thousands of professionals managing their work efficiently.
          </p>

          <form onSubmit={handleRegister}>

            <input
              type="text"
              name="name"
              placeholder="Full Name"
              value={formData.name}
              onChange={handleChange}
              required
            />

            <input
              type="email"
              name="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={handleChange}
              required
            />

            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
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

            <button type="submit" className="register-btn" disabled={!canSubmit}>
              Create Account
            </button>

          </form>

          <p className="register-security">
             Your information is securely encrypted.
          </p>

          {message && (
            <p className="register-message">
              {message}
            </p>
          )}

          <p className="register-login-link">
            Already have an account?
            <Link to="/login"> Login</Link>
          </p>

          <button
            type="button"
            className="register-google-btn"
            onClick={() => googleLogin()}
            disabled={googleLoading}
          >
            {googleLoading ? "Signing in..." : "Continue With Google"}
          </button>

        </div>

      </div>

    </div>
  );
}

export default Register;
