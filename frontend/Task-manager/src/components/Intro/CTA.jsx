import { Link } from "react-router-dom";
import "./CTA.css";

function CTA() {
  return (
    <section className="cta">
      <div className="cta-content">
        <h2>Ready to Get Organized?</h2>
        <p>
          Start managing your tasks efficiently and boost your productivity
          today.
        </p>
        <Link to="/register">
          <button className="cta-btn">Get Started Now</button>
        </Link>
      </div>
    </section>
  );
}

export default CTA;