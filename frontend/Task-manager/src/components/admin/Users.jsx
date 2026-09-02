import { useEffect, useState } from "react";
import axios from "axios";
import "./Users.css";
import { API_BASE_URL } from "../../config/api";

function Users() {
    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState("");

    // ==========================================
    // Fetch Users
    // ==========================================

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const token = localStorage.getItem("token");

                // Mark all new users as seen
                await axios.put(
                    `${API_BASE_URL}/api/admin/users/seen`,
                    {},
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                // Get users
                const response = await axios.get(
                    `${API_BASE_URL}/api/admin/users`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                setUsers(response.data);
            } catch (error) {
                console.log("Fetch users error:", error);
            }
        };

        fetchUsers();
    }, []);

    // ==========================================
    // Block / Unblock User
    // ==========================================

    const handleStatus = async (id, status) => {
        try {
            const newStatus =
                status === "active"
                    ? "blocked"
                    : "active";

            const token = localStorage.getItem("token");

            await axios.put(
                `${API_BASE_URL}/api/admin/users/${id}/status`,
                {
                    status: newStatus,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            setUsers((prevUsers) =>
                prevUsers.map((user) =>
                    user.id === id
                        ? {
                              ...user,
                              status: newStatus,
                          }
                        : user
                )
            );
        } catch (error) {
            console.log("Update user status error:", error);
        }
    };

    // ==========================================
    // Delete User
    // ==========================================

    const handleDelete = async (id) => {
        const confirmDelete = window.confirm(
            "Are you sure you want to delete this user?"
        );

        if (!confirmDelete) {
            return;
        }

        try {
            const token = localStorage.getItem("token");

            await axios.delete(
                `${API_BASE_URL}/api/admin/users/${id}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            setUsers((prevUsers) =>
                prevUsers.filter(
                    (user) => user.id !== id
                )
            );

            alert("User deleted successfully");
        } catch (error) {
            console.log("Delete user error:", error);
        }
    };

    // ==========================================
    // Search
    // ==========================================

    const filteredUsers = users.filter((user) => {
        const searchText = search.toLowerCase();

        return (
            user.name
                ?.toLowerCase()
                .includes(searchText) ||
            user.email
                ?.toLowerCase()
                .includes(searchText) ||
            user.role
                ?.toLowerCase()
                .includes(searchText) ||
            user.status
                ?.toLowerCase()
                .includes(searchText)
        );
    });

    // ==========================================
    // JSX
    // ==========================================

    return (
        <div className="users-page">

            {/* =================================
                PAGE TITLE
            ================================= */}

            <h1>
                Users Management
            </h1>


            {/* =================================
                TABLE CONTAINER
            ================================= */}

            {/* Search stays fixed while table scrolls */}

<div className="users-search">

    <input
        type="text"
        placeholder="Search users..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="search-box"
    />

</div>


{/* Only the table scrolls horizontally */}

<div className="users-table">

    <table>

        <thead>
            <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Created Date</th>
                <th>Status</th>
                <th>Actions</th>
            </tr>
        </thead>

        <tbody>
            {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                    <tr key={user.id}>

                        <td>{user.id}</td>

                        <td>{user.name}</td>

                        <td>{user.email}</td>

                        <td>{user.role}</td>

                        <td>
                            {user.created_at
                                ? new Date(
                                      user.created_at
                                  ).toLocaleDateString()
                                : "N/A"}
                        </td>

                        <td>
                            <span
                                className={
                                    user.status === "active"
                                        ? "active-status"
                                        : "blocked-status"
                                }
                            >
                                {user.status || "active"}
                            </span>
                        </td>

                        <td>
                            <div className="user-actions">

                                <button
                                    className="status-btn"
                                    onClick={() =>
                                        handleStatus(
                                            user.id,
                                            user.status
                                        )
                                    }
                                >
                                    {user.status === "active"
                                        ? "Block"
                                        : "Unblock"}
                                </button>

                                <button
                                    className="delete-user-btn"
                                    onClick={() =>
                                        handleDelete(user.id)
                                    }
                                >
                                    Delete
                                </button>

                            </div>
                        </td>

                    </tr>
                ))
            ) : (
                <tr>
                    <td
                        colSpan="7"
                        className="no-users"
                    >
                        No users found
                    </td>
                </tr>
            )}
        </tbody>

    </table>

</div>

        </div>
    );
}

export default Users;