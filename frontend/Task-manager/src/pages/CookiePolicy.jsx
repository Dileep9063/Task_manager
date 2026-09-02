import "./LegalPages.css";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";

function CookiePolicy() {
  const navigate = useNavigate();
  const { theme } = useTheme();

  return (
    <div className="legal-page-wrapper" data-theme={theme}>
      <main className="legal-page">
        <button className="legal-back-home-btn" onClick={() => navigate("/")}>
          Back to Home
        </button>

        <div className="legal-header">
          <h1>Cookie Policy</h1>
          <p className="legal-updated">Last updated: August 14, 2026</p>
        </div>

        <section>
          <h2>1. What Are Cookies</h2>
          <p>
            Cookies are small text files placed on your device when you visit
            TaskManager. They help the app function properly and allow us to
            understand how it's used.
          </p>
        </section>

        <section>
          <h2>2. Types of Cookies We Use</h2>
          <ul>
            <li>
              <strong>Essential cookies:</strong> required for core
              functionality such as login and session management.
            </li>
            <li>
              <strong>Performance cookies:</strong> help us understand how
              visitors interact with the app so we can improve it.
            </li>
            <li>
              <strong>Preference cookies:</strong> remember your settings,
              such as theme or layout preferences.
            </li>
            <li>
              <strong>Analytics cookies:</strong> collect anonymized usage
              data to help us measure performance.
            </li>
          </ul>
        </section>

        <section>
          <h2>3. Managing Cookies</h2>
          <p>
            Most browsers let you control cookies through their settings.
            You can choose to block or delete cookies, but doing so may
            affect the functionality of TaskManager.
          </p>
        </section>

        <section>
          <h2>4. Third-Party Cookies</h2>
          <p>
            We may use trusted third-party services (such as analytics
            providers) that place their own cookies on your device. These
            third parties have their own privacy and cookie policies.
          </p>
        </section>

        <section>
          <h2>5. Changes to This Policy</h2>
          <p>
            We may update this Cookie Policy periodically. Any changes will
            be posted on this page with a revised update date.
          </p>
        </section>

        <div className="legal-contact">
          <h2>Contact Us</h2>
          <p>
            Questions about our use of cookies? Contact us at{" "}
            <a href="mailto:chinthaladileep2@gmail.com">
              chinthaladileep2@gmail.com
            </a>{" "}
            or call{" "}
            <a href="tel:+919063279439">+91 9063279439</a>.
          </p>
        </div>
      </main>
    </div>
  );
}

export default CookiePolicy;