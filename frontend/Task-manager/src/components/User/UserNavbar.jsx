import { useNavigate } from "react-router-dom";
import { FaBars } from "react-icons/fa";
import ThemeToggle from "../admin/ThemeToggle";
import "../admin/AdminNavbar.css";

function UserNavbar({ onMenuClick }) {

    const navigate = useNavigate();

    const user = JSON.parse(localStorage.getItem("user"));

    const handleLogout = () => {

        localStorage.removeItem("token");
        localStorage.removeItem("user");

        navigate("/");

    };

    return (

        <header className="admin-navbar">

            <div className="navbar-left">

                <button
                    className="sidebar-toggle-btn"
                    onClick={onMenuClick}
                    aria-label="Toggle sidebar"
                >
                    <FaBars />
                </button>

                <div className="navbar-heading">
                    <span className="navbar-eyebrow">Task Manager</span>
                    <h2 className="navbar-title">
                        Welcome back{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
                    </h2>
                </div>

            </div>

            <div className="navbar-right">

                <ThemeToggle />

                <div className="profile">

                    <h4>{user?.name || "User"}</h4>

                    <p>{user?.email || "Task Manager User"}</p>

                </div>

                <button
                    className="logout-btn"
                    onClick={handleLogout}
                >
                    Logout
                </button>

            </div>

        </header>

    );

}

export default UserNavbar;
