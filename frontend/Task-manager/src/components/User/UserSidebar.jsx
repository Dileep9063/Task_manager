import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import axios from "axios";

import "../admin/AdminSidebar.css";
import { API_BASE_URL } from "../../config/api";
import {
  LuLayoutDashboard,
  LuListTodo,
  LuCalendarDays,
  LuCircleCheck,
  LuChartColumn,
  LuBell,
  LuUser,
  LuSettings,
  LuLifeBuoy,
} from "react-icons/lu";


function UserSidebar({ isOpen, onClose }) {

    const [unreadCount, setUnreadCount] = useState(0);

    const navigate = useNavigate();
    const token = localStorage.getItem("token");


    // ======================================================
    // Fetch Unread Notifications
    // ======================================================

    const fetchUnreadNotifications = async () => {

        try {

            const response = await axios.get(
                `${API_BASE_URL}/api/user/notifications`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );


            const unreadCount =
                response.data.filter(
                    notification =>
                        !notification.is_read
                ).length;


            setUnreadCount(unreadCount);

        }
        catch (error) {

            console.log(
                "Unread notification error:",
                error
            );

        }

    };


    useEffect(() => {

        fetchUnreadNotifications();


        const interval = setInterval(() => {

            fetchUnreadNotifications();

        }, 5000);


        return () => {

            clearInterval(interval);

        };

    }, []);


    // close the drawer after navigating (mobile only — no-op on desktop)
    const handleLinkClick = () => {
        if (onClose) onClose();
    };


    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/");
    };


    // ======================================================
    // Sidebar
    // ======================================================

    return (

        <aside className={`admin-sidebar ${isOpen ? "mobile-open" : ""}`}>

            <div className="sidebar-brand">
                <span className="sidebar-brand-mark">TM</span>
                <span className="sidebar-brand-text">TaskManager</span>
            </div>

            <nav className="sidebar-top">


                {/* ================= Dashboard ================= */}

                <NavLink
                    to="/user"
                    end
                    className="menu-item"
                    onClick={handleLinkClick}
                >
                    <LuLayoutDashboard />
                    Dashboard
                </NavLink>



                {/* ================= My Tasks ================= */}

                <NavLink
                    to="/user/tasks"
                    className="menu-item"
                    onClick={handleLinkClick}
                >
                    <LuListTodo />
                    My Tasks
                </NavLink>



                {/* ================= Calendar ================= */}

                <NavLink
                    to="/user/calendar"
                    className="menu-item"
                    onClick={handleLinkClick}
                >
                    <LuCalendarDays />
                    Calendar
                </NavLink>



                {/* ================= Completed ================= */}

                <NavLink
                    to="/user/completed"
                    className="menu-item"
                    onClick={handleLinkClick}
                >
                    <LuCircleCheck />
                    Completed
                </NavLink>



                {/* ================= Reports ================= */}

                <NavLink
                    to="/user/reports"
                    className="menu-item"
                    onClick={handleLinkClick}
                >
                    <LuChartColumn />
                    Reports
                </NavLink>



                {/* ================= Notifications ================= */}

                <NavLink
                    to="/user/notifications"
                    className="menu-item"
                    onClick={handleLinkClick}
                >
                    <LuBell />
                    <span>
                        Notifications
                    </span>


                    {
                        unreadCount > 0 && (

                            <span className="sidebar-badge">

                                {
                                    unreadCount > 99
                                        ? "99+"
                                        : unreadCount
                                }

                            </span>

                        )
                    }

                </NavLink>



                {/* ================= Profile ================= */}

                <NavLink
                    to="/user/profile"
                    className="menu-item"
                    onClick={handleLinkClick}
                >
                    <LuUser />
                    Profile
                </NavLink>



                {/* ================= Settings ================= */}

                <NavLink
                    to="/user/settings"
                    className="menu-item"
                    onClick={handleLinkClick}
                >
                    <LuSettings />
                    Settings
                </NavLink>



                {/* ================= Support ================= */}

                <NavLink
                    to="/user/support"
                    className="menu-item"
                    onClick={handleLinkClick}
                >
                    <LuLifeBuoy />
                    Support
                </NavLink>


            </nav>


            {/* Only visible on mobile per AdminSidebar.css (.sidebar-logout-btn) */}
            <button
                className="sidebar-logout-btn"
                onClick={handleLogout}
            >
                Logout
            </button>


        </aside>

    );

}


export default UserSidebar;
