import "./LegalPages.css";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";

function TermsAndConditions() {
  const navigate = useNavigate();
  const { theme } = useTheme();

  return (
    <div className="legal-page-wrapper" data-theme={theme}>
      <main className="legal-page">
        <button className="legal-back-home-btn" onClick={() => navigate("/")}>
          Back to Home
        </button>

        <div className="legal-header">
          <h1>Terms & Conditions</h1>
          <p className="legal-updated">Last updated: August 14, 2026</p>
        </div>

        <section>
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing or using TaskManager, you agree to be bound by these
            Terms & Conditions. If you do not agree, please do not use the
            application.
          </p>
        </section>

        <section>
          <h2>2. Use of the Service</h2>
          <ul>
            <li>You must be at least 13 years old to use TaskManager.</li>
            <li>You are responsible for maintaining the confidentiality of your account.</li>
            <li>You agree not to misuse the service or attempt unauthorized access.</li>
            <li>You are responsible for the content and tasks you create.</li>
          </ul>
        </section>

        <section>
          <h2>3. Intellectual Property</h2>
          <p>
            All content, design, and code provided by TaskManager, excluding
            content you create, remain the property of TaskManager and its
            licensors.
          </p>
        </section>

        <section>
          <h2>4. Termination</h2>
          <p>
            We reserve the right to suspend or terminate your access to
            TaskManager at our discretion, including for violations of these
            Terms.
          </p>
        </section>

        <section>
          <h2>5. Disclaimer of Warranties</h2>
          <p>
            TaskManager is provided "as is" without warranties of any kind,
            express or implied. We do not guarantee that the service will be
            uninterrupted or error-free.
          </p>
        </section>

        <section>
          <h2>6. Limitation of Liability</h2>
          <p>
            To the fullest extent permitted by law, TaskManager shall not be
            liable for any indirect, incidental, or consequential damages
            arising from your use of the service.
          </p>
        </section>

        <section>
          <h2>7. Changes to These Terms</h2>
          <p>
            We may revise these Terms from time to time. Continued use of the
            app after changes are posted constitutes acceptance of the
            revised Terms.
          </p>
        </section>

        <section>
          <h2>8. Governing Law</h2>
          <p>
            These Terms shall be governed by and construed in accordance with
            applicable local laws, without regard to conflict of law
            principles.
          </p>
        </section>

        <div className="legal-contact">
          <h2>Contact Us</h2>
          <p>
            Questions about these Terms? Contact us at{" "}
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

export default TermsAndConditions;