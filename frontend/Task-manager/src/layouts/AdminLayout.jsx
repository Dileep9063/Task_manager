import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";

import AdminNavbar from "../components/admin/AdminNavbar";
import AdminSidebar from "../components/admin/AdminSidebar";
import { useTheme } from "../context/ThemeContext";

import "./AdminLayout.css";

function AdminLayout() {

    const navigate = useNavigate();
    const { theme } = useTheme();

    const [sidebarOpen, setSidebarOpen] = useState(false);

    const closeSidebar = () => setSidebarOpen(false);

    const handleLogout = () => {

        localStorage.removeItem("token");
        localStorage.removeItem("user");

        closeSidebar();

        navigate("/");

    };

    return (

        <div className="admin-layout" data-theme={theme}>

            <AdminNavbar
                onToggleSidebar={() => setSidebarOpen((open) => !open)}
                onLogout={handleLogout}
            />

            <AdminSidebar
                isOpen={sidebarOpen}
                onToggle={() => setSidebarOpen((open) => !open)}
                onLinkClick={closeSidebar}
                onLogout={handleLogout}
            />

            {/* Dims the page and closes the drawer when tapped, mobile only */}
            <div
                className={`sidebar-overlay ${sidebarOpen ? "show" : ""}`}
                onClick={closeSidebar}
            />

            <main className="admin-main">

                <div className="page-wrapper">

                    <Outlet />

                </div>

            </main>

        </div>

    );

}

export default AdminLayout;
