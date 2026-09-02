import { useEffect, useState } from "react";
import axios from "axios";
import { FaEye, FaChevronDown, FaPlus } from "react-icons/fa";

import NewTicketModal from "./NewTicketModal";
import "./Support.css";
import { API_BASE_URL } from "../../config/api";

function Support() {

    const [tickets, setTickets] = useState([]);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [reply, setReply] = useState("");
    const [openFaq, setOpenFaq] = useState(null);

    const token = localStorage.getItem("token");


    // ======================================================
    // Fetch My Tickets
    // ======================================================

    const fetchTickets = async () => {
        try {
            const response = await axios.get(
                `${API_BASE_URL}/api/user/support/tickets`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setTickets(response.data);
        } catch (error) {
            console.log("Fetch tickets error:", error);
        }
    };

    useEffect(() => {
        fetchTickets();
    }, []);


    // ======================================================
    // Filter + Search
    // ======================================================

    const filteredTickets = tickets.filter(ticket => {
        const matchesSearch = ticket.title.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
        return matchesSearch && matchesStatus;
    });


    // ======================================================
    // View Ticket
    // ======================================================

    const viewTicket = (ticket) => {
        setSelectedTicket(ticket);
        setReply("");
    };


    // ======================================================
    // Send Reply On A Ticket
    // ======================================================

    const sendReply = async () => {

        if (!reply.trim() || !selectedTicket) return;

        try {
            const response = await axios.post(
                `${API_BASE_URL}/api/user/support/tickets/${selectedTicket.id}/reply`,
                { message: reply.trim() },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setSelectedTicket(response.data.ticket);
            setReply("");
            fetchTickets();
        } catch (error) {
            console.log("Reply error:", error);
            alert(
                error.response?.data?.message ||
                "Could not send reply"
            );
        }
    };


    // ======================================================
    // Format Date
    // ======================================================

    const formatDate = (dateString) => {
        if (!dateString) return "Not available";

        const date = new Date(dateString);

        if (isNaN(date.getTime())) return "Not available";

        return date.toLocaleDateString("en-IN");
    };


    // ======================================================
    // Status Label
    // ======================================================

    const statusLabel = (status) => {
        if (status === "in_progress") return "In Progress";
        if (status === "resolved") return "Resolved";
        return "Submitted";
    };


    // ======================================================
    // FAQ Data
    // ======================================================

    const faqs = [
        {
            q: "How do I create a task?",
            a: "You can create a task from either the Dashboard or the Tasks page — both have a \"Create Task\" button. Click it, fill in the title, description, priority, and due date, then save. Your new task will appear with a status of Pending."
        },
        {
            q: "How do I update my profile?",
            a: "Go to the Profile page. There you can view and edit your details such as name, phone number, and address, then save your changes."
        },
        {
            q: "How do I export my data?",
            a: "Go to the Settings page and use the \"Export Data\" option in the Your Data section. This downloads a PDF with your profile details, all your tasks, notifications, and a report with charts summarizing your task activity."
        },
        {
            q: "How do I raise a complaint?",
            a: "Go to the Support page and click the \"Raise a Complaint\" button. Fill in a title, description, category, and priority for your issue, then submit. You can track its status here and reply if the support team responds."
        },
        {
            q: "Why aren't my tasks syncing across devices?",
            a: "Sync runs automatically every 30 seconds while you're online. Try pulling down on the task list to force a refresh. If tasks still don't match across devices, raise a Sync Issue ticket below and mention which devices are affected."
        },
        {
            q: "How long does it take to hear back on a complaint?",
            a: "High priority issues (data loss, sync failures) are addressed within 24 hours. Medium priority within 2-3 business days. Low priority and feature requests are reviewed weekly."
        }
    ];


    // ======================================================
    // UI
    // ======================================================

    return (
        <div className="support-container">

            <div className="support-header">

                <div>
                    <h2>Support</h2>
                    <p className="support-subtitle">
                        Raise a complaint or find answers to common issues
                    </p>
                </div>

                <button
                    className="new-ticket-btn"
                    onClick={() => setIsModalOpen(true)}
                >
                    <FaPlus /> Raise a Complaint
                </button>

            </div>


            {/* ================= Filters ================= */}

            <div className="support-filters">

                <input
                    type="text"
                    placeholder="Search your tickets..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="search-input"
                />

                <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className="status-filter"
                >
                    <option value="all">All Statuses</option>
                    <option value="submitted">Submitted</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                </select>

            </div>


            {/* ================= Ticket List ================= */}

            {filteredTickets.length === 0 ? (
                <p className="empty-state">
                    {tickets.length === 0
                        ? "You haven't raised any complaints yet"
                        : "No tickets match your search"}
                </p>
            ) : (
                <div className="ticket-list">
                    {filteredTickets.map(ticket => (
                        <div className="ticket-card" key={ticket.id}>

                            <div className="ticket-info">

                                <div className="ticket-top-row">
                                    <span className="ticket-id">#{ticket.id}</span>
                                    <span className={`priority ${ticket.priority.toLowerCase()}`}>
                                        {ticket.priority}
                                    </span>
                                </div>

                                <h3>{ticket.title}</h3>

                                <div className="ticket-meta">
                                    <span className={`ticket-status ${ticket.status}`}>
                                        {statusLabel(ticket.status)}
                                    </span>
                                    <span className="ticket-category">{ticket.category}</span>
                                    <span className="ticket-date">
                                        Raised on: {formatDate(ticket.created_at)}
                                    </span>
                                </div>

                            </div>

                            <div className="ticket-actions">
                                <button className="view-btn" onClick={() => viewTicket(ticket)}>
                                    <FaEye />
                                </button>
                            </div>

                        </div>
                    ))}
                </div>
            )}


            {/* ================= FAQ ================= */}

            <div className="support-faq">

                <h3>Before you raise a complaint</h3>

                <div className="faq-list">
                    {faqs.map((item, index) => (
                        <div className="faq-item" key={index}>

                            <button
                                className="faq-question"
                                onClick={() => setOpenFaq(openFaq === index ? null : index)}
                            >
                                <span>{item.q}</span>
                                <FaChevronDown className={openFaq === index ? "faq-icon open" : "faq-icon"} />
                            </button>

                            {openFaq === index && (
                                <p className="faq-answer">{item.a}</p>
                            )}

                        </div>
                    ))}
                </div>

            </div>


            {/* ================= Ticket Detail Modal ================= */}

            {selectedTicket && (
                <div className="support-modal-overlay" onClick={() => setSelectedTicket(null)}>
                    <div className="support-ticket-modal" onClick={(e) => e.stopPropagation()}>

                        <div className="support-modal-header">
                            <span className="ticket-id">#{selectedTicket.id}</span>
                            <span className={`ticket-status ${selectedTicket.status}`}>
                                {statusLabel(selectedTicket.status)}
                            </span>
                        </div>

                        <h3>{selectedTicket.title}</h3>

                        <p>
                            <b>Description:</b>
                            <br />
                            {selectedTicket.description}
                        </p>

                        <p>
                            <b>Category:</b> {selectedTicket.category}
                        </p>

                        <p>
                            <b>Priority:</b> {selectedTicket.priority}
                        </p>

                        <p>
                            <b>Raised on:</b> {formatDate(selectedTicket.created_at)}
                        </p>

                        {/* Conversation thread */}

                        <div className="ticket-thread">

                            {(!selectedTicket.thread || selectedTicket.thread.length === 0) && (
                                <p className="no-replies">No replies yet</p>
                            )}

                            {selectedTicket.thread && selectedTicket.thread.map((message, index) => (
                                <div
                                    key={index}
                                    className={`thread-message ${message.from === "admin" ? "from-admin" : "from-user"}`}
                                >
                                    <span className="thread-sender">
                                        {message.from === "admin" ? "Support Team" : "You"}
                                    </span>
                                    <p>{message.text}</p>
                                </div>
                            ))}

                        </div>

                        {selectedTicket.status !== "resolved" && (
                            <div className="ticket-reply-box">
                                <textarea
                                    rows="3"
                                    placeholder="Add a reply..."
                                    value={reply}
                                    onChange={(e) => setReply(e.target.value)}
                                />

                                <button className="reply-send-btn" onClick={sendReply}>
                                    Send Reply
                                </button>
                            </div>
                        )}

                        <button className="support-close-btn" onClick={() => setSelectedTicket(null)}>
                            Close
                        </button>

                    </div>
                </div>
            )}


            {/* ================= New Ticket Modal ================= */}

            <NewTicketModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onTicketCreated={() => fetchTickets()}
            />

        </div>
    );
}


export default Support;
