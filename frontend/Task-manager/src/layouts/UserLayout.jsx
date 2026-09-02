import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";

import UserSidebar from "../components/User/UserSidebar";
import UserNavbar from "../components/User/UserNavbar";
import AiChatWidget from "../components/AiAssistant/AiChatWidget";
import "./AdminLayout.css";

function UserLayout() {

    const [search, setSearch] = useState("");
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        document.body.style.overflow = sidebarOpen ? "hidden" : "";
        return () => {
            document.body.style.overflow = "";
        };
    }, [sidebarOpen]);

    return (

        <div className="admin-layout">

            <UserNavbar
                search={search}
                setSearch={setSearch}
                onMenuClick={() => setSidebarOpen((prev) => !prev)}
            />

            <UserSidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />

            <div
                className={`sidebar-overlay ${sidebarOpen ? "show" : ""}`}
                onClick={() => setSidebarOpen(false)}
            />

            <main className="admin-main">

                <div className="page-wrapper">

                    <Outlet context={{ search, setSearch }} />

                </div>

            </main>

            <AiChatWidget role="user" />

        </div>

    );

}

export default UserLayout;
