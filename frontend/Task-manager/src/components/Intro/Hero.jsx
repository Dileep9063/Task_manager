import { Link } from "react-router-dom";
import "./Hero.css";

function Hero() {
  return (
    <section className="hero blueprint-grid" id="home">
      <div className="hero-content">
        <span className="hero-eyebrow">Task &amp; Team Operations</span>

        <h1>
          Organize the work.
          <br />
          <span className="hero-accent">Ship with confidence.</span>
        </h1>

        <p>
          A structured task manager built for teams that need clear
          ownership, dependable deadlines, and reporting they can trust.
        </p>

        <div className="hero-buttons">
          <Link to="/register">
            <button className="get-started-btn">Get Started →</button>
          </Link>

          <Link to="/login">
            <button className="hero-login-btn">Sign In</button>
          </Link>
        </div>

        <div className="hero-trust">
          <span>✓ Role-based access</span>
          <span>✓ Audit-ready reports</span>
          <span>✓ Built-in support desk</span>
        </div>
      </div>

      <div className="hero-panel">
        <div className="hero-panel-frame bracket-card">
          <div className="hero-panel-topbar">
            <div className="hero-panel-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <span className="hero-panel-title">Dashboard</span>
          </div>

          <div className="hero-panel-body">
            <div className="hero-stat-row">
              <div className="hero-stat">
                <span className="hero-stat-label">Total Tasks</span>
                <span className="hero-stat-value stat-figure">24</span>
              </div>
              <div className="hero-stat">
                <span className="hero-stat-label">Completed</span>
                <span className="hero-stat-value stat-figure">16</span>
              </div>
              <div className="hero-stat">
                <span className="hero-stat-label">Pending</span>
                <span className="hero-stat-value stat-figure">08</span>
              </div>
            </div>

            <div className="hero-progress">
              <div className="hero-progress-header">
                <span>Sprint Progress</span>
                <span className="stat-figure">67%</span>
              </div>
              <div className="hero-progress-track">
                <div className="hero-progress-fill"></div>
              </div>
            </div>

            <ul className="hero-task-list">
              <li>
                <span className="hero-task-check hero-task-check--done">✓</span>
                <span>Design system audit</span>
                <span className="hero-task-tag hero-task-tag--done">Done</span>
              </li>
              <li>
                <span className="hero-task-check">•</span>
                <span>API rate-limit rollout</span>
                <span className="hero-task-tag hero-task-tag--progress">
                  In progress
                </span>
              </li>
              <li>
                <span className="hero-task-check">•</span>
                <span>Q3 reporting review</span>
                <span className="hero-task-tag hero-task-tag--pending">
                  Pending
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
