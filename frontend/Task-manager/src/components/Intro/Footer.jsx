import "./Footer.css";
import { FaEnvelope, FaPhoneAlt } from "react-icons/fa";

function Footer() {
  return (
    <footer className="footer" id="footer">
      <div className="footer-container">

        <div className="footer-section">
          <h3>TaskManager</h3>

          <p>
            Organize your work, manage tasks, and improve productivity with our
            simple and modern task management application.
          </p>
        </div>

        <div className="footer-section quick-links">
          <h3>Quick Links</h3>

          <ul>
            <li><a href="#home">Home</a></li>
            <li><a href="#features">Features</a></li>
            <li><a href="#how-it-works">How It Works</a></li>
            <li><a href="#contact">Contact</a></li>
          </ul>
        </div>

        <div className="footer-section contact-section" id="contact">
          <h3>Contact</h3>
            <p>
              <FaEnvelope className="footer-icon" />
              <a href="mailto:chinthaladileep2@gmail.com">
                chinthaladileep2@gmail.com
              </a>
            </p>

          <p>
            <FaPhoneAlt className="footer-icon" />
            <a href="tel:+919063279439">
              +91 9063279439
            </a>
          </p>

        </div>

      </div>

      <hr />

      <div className="footer-bottom">
        <p className="copyright">
          © 2026 TaskManager. All Rights Reserved.
        </p>

        <ul className="legal-links">
          <li><a href="/privacy-policy">Privacy Policy</a></li>
          <li><a href="/terms-and-conditions">Terms & Conditions</a></li>
          <li><a href="/cookie-policy">Cookie Policy</a></li>
        </ul>
      </div>

    </footer>
  );
}

export default Footer;
