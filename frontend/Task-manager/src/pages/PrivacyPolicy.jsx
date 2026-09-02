import "./LegalPages.css";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";

function PrivacyPolicy() {
  const navigate = useNavigate();
  const { theme } = useTheme();

  return (
    <div className="legal-page-wrapper" data-theme={theme}>
      <main className="legal-page">
        <button className="legal-back-home-btn" onClick={() => navigate("/")}>
          Back to Home
        </button>

        <div className="legal-header">
          <h1>Privacy Policy</h1>
          <p className="legal-updated">Last updated: August 14, 2026</p>
        </div>

        <section>
          <h2>1. Introduction</h2>
          <p>
            TaskManager ("we", "our", or "us") respects your privacy and is
            committed to protecting the personal data you share with us. This
            Privacy Policy explains what information we collect, how we use
            it, and the choices you have.
          </p>
        </section>

        <section>
          <h2>2. Information We Collect</h2>
          <ul>
            <li>Account information such as your name and email address.</li>
            <li>Task and productivity data you create within the app.</li>
            <li>Usage data, including log files, device, and browser type.</li>
            <li>Cookies and similar tracking technologies (see our Cookie Policy).</li>
          </ul>
        </section>

        <section>
          <h2>3. How We Use Your Information</h2>
          <ul>
            <li>To provide, operate, and maintain the TaskManager application.</li>
            <li>To personalize your experience and improve our features.</li>
            <li>To communicate with you about updates, support, or security alerts.</li>
            <li>To detect, prevent, and address technical issues or misuse.</li>
          </ul>
        </section>

        <section>
          <h2>4. Sharing Your Information</h2>
          <p>
            We do not sell your personal data. We may share information with
            trusted service providers who help us operate the app (such as
            hosting or analytics providers), or when required by law.
          </p>
        </section>

        <section>
          <h2>5. Data Security</h2>
          <p>
            We use reasonable administrative, technical, and physical
            safeguards to protect your information. However, no method of
            transmission or storage is 100% secure.
          </p>
        </section>

        <section>
          <h2>6. Your Rights</h2>
          <p>
            Depending on your location, you may have the right to access,
            correct, delete, or export your personal data. To exercise these
            rights, contact us using the details below.
          </p>
        </section>

        <section>
          <h2>7. Children's Privacy</h2>
          <p>
            TaskManager is not directed at children under 13, and we do not
            knowingly collect personal information from children.
          </p>
        </section>

        <section>
          <h2>8. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will
            notify you of significant changes by posting the new policy on
            this page with an updated revision date.
          </p>
        </section>

        <div className="legal-contact">
          <h2>Contact Us</h2>
          <p>
            If you have questions about this Privacy Policy, reach out at{" "}
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

export default PrivacyPolicy;