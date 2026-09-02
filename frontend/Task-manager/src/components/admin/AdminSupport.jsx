import { useEffect, useState } from "react";
import axios from "axios";
import "./AdminSupport.css";
import { FaEye } from "react-icons/fa";
import { API_BASE_URL } from "../../config/api";

function AdminSupport() {
    const [tickets, setTickets] = useState([]);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all");
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [replyText, setReplyText] = useState("");
    const [sending, setSending] = useState(false);

    // ==========================================
    // Fetch Tickets
    // ==========================================

    const fetchTickets = () => {
        const token = localStorage.getItem("token");

        axios
            .get(`${API_BASE_URL}/api/admin/support/tickets`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            .then((response) => {
                setTickets(response.data);
            })
            .catch((error) => {
                console.log("Fetch tickets error:", error);
            });
    };

    useEffect(() => {
        fetchTickets();

        // Refresh every 5 seconds, same interval Tasks.jsx uses
        const interval = setInterval(fetchTickets, 5000);

        return () => clearInterval(interval);
    }, []);

    // ==========================================
    // Update Status / Priority
    // ==========================================

    const updateTicket = async (id, changes) => {
        try {
            const token = localStorage.getItem("token");

            await axios.patch(
                `${API_BASE_URL}/api/admin/support/tickets/${id}`,
                changes,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            setTickets((prev) =>
                prev.map((ticket) =>
                    ticket.id === id ? { ...ticket, ...changes } : ticket
                )
            );

            setSelectedTicket((prev) =>
                prev && prev.id === id ? { ...prev, ...changes } : prev
            );
        } catch (error) {
            console.log("Update ticket error:", error);
        }
    };

    // ==========================================
    // Reply to Ticket
    // ==========================================

    const handleReply = async () => {
        if (!replyText.trim() || !selectedTicket) {
            return;
        }

        try {
            setSending(true);

            const token = localStorage.getItem("token");

            const response = await axios.post(
                `${API_BASE_URL}/api/admin/support/tickets/${selectedTicket.id}/reply`,
                { message: replyText },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            // Backend returns the full updated ticket (with thread) on
            // reply, same as the user-side replySupportTicket endpoint.
            const updatedTicket = response.data.ticket;

            setSelectedTicket(updatedTicket);

            setTickets((prev) =>
                prev.map((ticket) =>
                    ticket.id === selectedTicket.id ? updatedTicket : ticket
                )
            );

            setReplyText("");
        } catch (error) {
            console.log("Reply error:", error);
        } finally {
            setSending(false);
        }
    };

    // ==========================================
    // Statistics
    // ==========================================

    const submittedCount = tickets.filter(
        (t) => t.status?.toLowerCase() === "submitted"
    ).length;

    const inProgressCount = tickets.filter(
        (t) => t.status?.toLowerCase() === "in_progress"
    ).length;

    const resolvedCount = tickets.filter(
        (t) => t.status?.toLowerCase() === "resolved"
    ).length;

    // ==========================================
    // Search + Filter
    // ==========================================

    const filteredTickets = tickets.filter((ticket) => {
        const searchText = search.toLowerCase();

        const searchMatch =
            ticket.title?.toLowerCase().includes(searchText) ||
            ticket.category?.toLowerCase().includes(searchText) ||
            ticket.user_name?.toLowerCase().includes(searchText) ||
            ticket.user_email?.toLowerCase().includes(searchText);

        const filterMatch =
            filter === "all" || ticket.status?.toLowerCase() === filter;

        return searchMatch && filterMatch;
    });

    // ==========================================
    // View Ticket
    // ==========================================

    const handleView = (ticket) => {
        setSelectedTicket(ticket);
        setReplyText("");
    };

    // ==========================================
    // JSX
    // ==========================================

    return (
        <div className="support-page">

            {/* =================================
                PAGE TITLE
            ================================= */}

            <h1>Support Tickets</h1>


            {/* =================================
                STATISTICS
            ================================= */}

            <div className="support-stats">

                <div className="support-box">
                    <h3>Total Tickets</h3>
                    <h2>{tickets.length}</h2>
                </div>

                <div className="support-box open-box">
                    <h3>Submitted</h3>
                    <h2>{submittedCount}</h2>
                </div>

                <div className="support-box progress-box">
                    <h3>In Progress</h3>
                    <h2>{inProgressCount}</h2>
                </div>

                <div className="support-box resolved-box">
                    <h3>Resolved</h3>
                    <h2>{resolvedCount}</h2>
                </div>

            </div>


            {/* =================================
                SEARCH
            ================================= */}

            <input
                type="text"
                placeholder="Search by title, category, name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="support-search"
            />


            {/* =================================
                FILTER BUTTONS
            ================================= */}

            <div className="filter-buttons">

                <button
                    className={filter === "all" ? "active-filter" : ""}
                    onClick={() => setFilter("all")}
                >
                    All
                </button>

                <button
                    className={filter === "submitted" ? "active-filter" : ""}
                    onClick={() => setFilter("submitted")}
                >
                    Submitted
                </button>

                <button
                    className={filter === "in_progress" ? "active-filter" : ""}
                    onClick={() => setFilter("in_progress")}
                >
                    In Progress
                </button>

                <button
                    className={filter === "resolved" ? "active-filter" : ""}
                    onClick={() => setFilter("resolved")}
                >
                    Resolved
                </button>

            </div>


            {/* =================================
                TABLE
            ================================= */}

            <div className="support-table">

                <table>

                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Title</th>
                            <th>User</th>
                            <th>Priority</th>
                            <th>Status</th>
                            <th>Created</th>
                            <th>Actions</th>
                        </tr>
                    </thead>

                    <tbody>
                        {filteredTickets.length > 0 ? (
                            filteredTickets.map((ticket) => (
                                <tr key={ticket.id}>

                                    <td>{ticket.id}</td>

                                    <td>{ticket.title}</td>

                                    <td>
                                        <strong>{ticket.user_name}</strong>
                                        <br />
                                        <small>{ticket.user_email}</small>
                                    </td>

                                    <td>
                                        <span
                                            className={`priority-badge priority-${ticket.priority?.toLowerCase()}`}
                                        >
                                            {ticket.priority}
                                        </span>
                                    </td>

                                    <td>
                                        <span
                                            className={`status-badge status-${ticket.status?.toLowerCase()}`}
                                        >
                                            {ticket.status?.replace("_", " ")}
                                        </span>
                                    </td>

                                    <td>
                                        {ticket.created_at
                                            ? new Date(ticket.created_at).toLocaleDateString()
                                            : "N/A"}
                                    </td>

                                    <td>
                                        <div className="support-actions">
                                            <button
                                                className="view-btn"
                                                onClick={() => handleView(ticket)}
                                                title="View Ticket"
                                            >
                                                <FaEye />
                                            </button>
                                        </div>
                                    </td>

                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="7" className="no-tickets">
                                    No support tickets found
                                </td>
                            </tr>
                        )}
                    </tbody>

                </table>

            </div>


            {/* =================================
                TICKET DETAIL / REPLY MODAL
            ================================= */}

            {selectedTicket && (

                <div
                    className="adminsupport-modal-overlay"
                    onClick={() => setSelectedTicket(null)}
                >

                    <div
                        className="adminsupport-ticket-modal"
                        onClick={(e) => e.stopPropagation()}
                    >

                        <h2>{selectedTicket.title}</h2>

                        <p>
                            <strong>From:</strong>
                            <br />
                            {selectedTicket.user_name} ({selectedTicket.user_email})
                        </p>

                        <p>
                            <strong>Category:</strong>
                            <br />
                            {selectedTicket.category}
                        </p>

                        {/* Status + Priority controls */}
                        <div className="ticket-controls">

                            <div className="control-group">
                                <label>Status</label>
                                <select
                                    value={selectedTicket.status}
                                    onChange={(e) =>
                                        updateTicket(selectedTicket.id, {
                                            status: e.target.value,
                                        })
                                    }
                                >
                                    <option value="submitted">Submitted</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="resolved">Resolved</option>
                                </select>
                            </div>

                            <div className="control-group">
                                <label>Priority</label>
                                <select
                                    value={selectedTicket.priority}
                                    onChange={(e) =>
                                        updateTicket(selectedTicket.id, {
                                            priority: e.target.value,
                                        })
                                    }
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                </select>
                            </div>

                        </div>

                        {/* Original description + thread */}
                        <div className="ticket-thread">

                            <div className="thread-message user-message">
                                <div className="thread-meta">
                                    <strong>{selectedTicket.user_name}</strong>
                                    <span>
                                        {selectedTicket.created_at
                                            ? new Date(selectedTicket.created_at).toLocaleString()
                                            : ""}
                                    </span>
                                </div>
                                <p>{selectedTicket.description}</p>
                            </div>

                            {(selectedTicket.thread || []).map((entry, idx) => (
                                <div
                                    key={idx}
                                    className={`thread-message ${
                                        entry.from === "admin"
                                            ? "admin-message"
                                            : "user-message"
                                    }`}
                                >
                                    <div className="thread-meta">
                                        <strong>
                                            {entry.from === "admin"
                                                ? "You (Admin)"
                                                : selectedTicket.user_name}
                                        </strong>
                                        <span>{entry.time}</span>
                                    </div>
                                    <p>{entry.text}</p>
                                </div>
                            ))}

                        </div>

                        {/* Reply box */}
                        <div className="reply-box">
                            <textarea
                                placeholder="Type your reply..."
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                rows={3}
                            />
                        </div>

                        {/* Footer actions - kept in one row so both
                            buttons share the same height/alignment */}
                        <div className="modal-actions">

                            <button
                                className="adminsupport-close-btn"
                                onClick={() => setSelectedTicket(null)}
                            >
                                Cancel
                            </button>

                            <button
                                className="send-reply-btn"
                                onClick={handleReply}
                                disabled={sending || !replyText.trim()}
                            >
                                {sending ? "Sending..." : "Send Reply"}
                            </button>

                        </div>

                    </div>

                </div>

            )}

        </div>
    );
}

export default AdminSupport;
