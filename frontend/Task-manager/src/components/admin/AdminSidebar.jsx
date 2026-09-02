import { NavLink } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import "./AdminSidebar.css";
import { API_BASE_URL } from "../../config/api";
import {
  LuLayoutDashboard,
  LuUsers,
  LuListTodo,
  LuChartColumn,
  LuBell,
  LuSettings,
  LuLifeBuoy,
} from "react-icons/lu";

function AdminSidebar({ isOpen, onLinkClick, onLogout }) {

  const [counts, setCounts] = useState({
    users: 0,
    tasks: 0,
    notifications: 0,
    support: 0
  });

  useEffect(() => {

    const fetchCounts = async () => {

      try {

        const res = await axios.get(
          `${API_BASE_URL}/api/admin/notification-counts`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        setCounts({
          users: res.data.users || 0,
          tasks: res.data.tasks || 0,
          notifications: res.data.notifications || 0,
          support: res.data.support || 0
        });

      } catch (error) {

        console.error(error);

      }

    };

    fetchCounts();

    const interval = setInterval(fetchCounts, 3000);

    return () => clearInterval(interval);

  }, []);

  return (

    <aside className={`admin-sidebar ${isOpen ? "mobile-open" : ""}`}>

      <div className="sidebar-brand">
        <span className="sidebar-brand-mark">TM</span>
        <span className="sidebar-brand-text">Admin</span>
      </div>

      <div className="sidebar-top">

        <NavLink to="/admin" end className="menu-item" onClick={onLinkClick}>
          <LuLayoutDashboard />
          Dashboard
        </NavLink>

        <NavLink to="/admin/users" className="menu-item" onClick={onLinkClick}>
          <LuUsers />
          <span>Users</span>

          {counts.users > 0 && (
            <span className="sidebar-badge">
              {counts.users}
            </span>
          )}
        </NavLink>

        <NavLink to="/admin/tasks" className="menu-item" onClick={onLinkClick}>
          <LuListTodo />
          <span>Tasks</span>

          {counts.tasks > 0 && (
            <span className="sidebar-badge">
              {counts.tasks}
            </span>
          )}
        </NavLink>

        <NavLink to="/admin/reports" className="menu-item" onClick={onLinkClick}>
          <LuChartColumn />
          Reports
        </NavLink>

        <NavLink to="/admin/notifications" className="menu-item" onClick={onLinkClick}>
          <LuBell />
          <span>Notifications</span>

          {counts.notifications > 0 && (
            <span className="sidebar-badge">
              {counts.notifications}
            </span>
          )}
        </NavLink>

        <NavLink to="/admin/settings" className="menu-item" onClick={onLinkClick}>
          <LuSettings />
          Settings
        </NavLink>

        <NavLink to="/admin/support" className="menu-item" onClick={onLinkClick}>
          <LuLifeBuoy />
          <span>Support</span>

          {counts.support > 0 && (
            <span className="sidebar-badge">
              {counts.support}
            </span>
          )}
        </NavLink>

      </div>

      {/* Only visible on mobile widths — desktop keeps logout in the navbar */}
      <button
        className="sidebar-logout-btn"
        onClick={onLogout}
      >
        Logout
      </button>

    </aside>

  );

}

export default AdminSidebar;
