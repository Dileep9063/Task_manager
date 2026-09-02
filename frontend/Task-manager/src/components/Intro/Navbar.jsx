import { useState } from "react";
import { Link } from "react-router-dom";
import "./Navbar.css";
import { useTheme } from "../../context/ThemeContext";
import { FaSun, FaMoon } from "react-icons/fa";
function Navbar() {

    const [menuOpen, setMenuOpen] = useState(false);
    const { theme, toggleTheme } = useTheme();

    const closeMenu = () => {
        setMenuOpen(false);
    };

    return (
        <nav className="navbar">

            {/* Logo */}
            <div className="logo">

                <span className="logo-mark">TM</span>

                <span className="logo-text">
                    <span className="task-text">Task</span>
                    <span className="manager-text">Manager</span>
                </span>

            </div>


            {/* Mobile-only controls: theme toggle + hamburger, always visible on mobile */}
            <div className="mobile-controls">

                <button
                    className="theme-toggle-btn theme-toggle-btn--mobile"
                    onClick={toggleTheme}
                    aria-label="Toggle dark mode"
                    title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                >
                    {theme === "dark" ? <FaSun /> : <FaMoon />}
                </button>

                {/* Hamburger */}
                <button
                    className="hamburger"
                    onClick={() => setMenuOpen(!menuOpen)}
                    aria-label="Toggle navigation menu"
                >

                    <span></span>
                    <span></span>
                    <span></span>

                </button>

            </div>


            {/* Navigation */}
            <div
                className={`navbar-content ${
                    menuOpen ? "menu-open" : ""
                }`}
            >

                <ul className="nav-links">

                    <li>
                        <a href="#home" onClick={closeMenu}>
                            Home
                        </a>
                    </li>

                    <li>
                        <a href="#features" onClick={closeMenu}>
                            Features
                        </a>
                    </li>

                    <li>
                        <a href="#how-it-works" onClick={closeMenu}>
                            How It Works
                        </a>
                    </li>

                    <li>
                        <a href="#contact" onClick={closeMenu}>
                            Contact
                        </a>
                    </li>

                </ul>


                <div className="nav-buttons">

                    <button
                        className="theme-toggle-btn theme-toggle-btn--desktop"
                        onClick={toggleTheme}
                        aria-label="Toggle dark mode"
                        title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                    >
                        {theme === "dark" ? <FaSun /> : <FaMoon />}
                    </button>

                    <Link
                        to="/login"
                        className="nav-btn-link"
                        onClick={closeMenu}
                    >
                        <button className="navbar-login-btn">
                            Login
                        </button>
                    </Link>

                    <Link
                        to="/register"
                        className="nav-btn-link"
                        onClick={closeMenu}
                    >
                        <button className="navbar-register-btn">
                            Register
                        </button>
                    </Link>

                </div>

            </div>

        </nav>
    );
}

export default Navbar;