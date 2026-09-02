import { useState } from "react";
import axios from "axios";
import { FaTimes } from "react-icons/fa";
import "./NewTicketModal.css";
import { API_BASE_URL } from "../../config/api";

function NewTicketModal({ isOpen, onClose, onTicketCreated }) {

    const [title, setTitle] = useState("");
    const [category, setCategory] = useState("Sync Issue");
    const [priority, setPriority] = useState("Medium");
    const [description, setDescription] = useState("");


    // ======================================================
    // Submit Complaint
    // ======================================================

    const handleSubmit = async (e) => {

        e.preventDefault();

        try {

            const token = localStorage.getItem("token");

            const response = await axios.post(

                `${API_BASE_URL}/api/user/support/tickets`,

                {
                    title,
                    category,
                    priority,
                    description
                },

                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }

            );

            console.log(response.data);

            alert("Complaint raised successfully");

            if (onTicketCreated) {
                onTicketCreated(response.data.ticket);
            }

            // Reset form

            setTitle("");
            setCategory("Sync Issue");
            setPriority("Medium");
            setDescription("");

            onClose();

        } catch (error) {

            console.log(
                error.response?.data || error.message
            );

            alert(
                error.response?.data?.message ||
                "Could not raise complaint"
            );

        }

    };


    // ======================================================
    // Don't Render Modal
    // ======================================================

    if (!isOpen) {
        return null;
    }


    // ======================================================
    // UI
    // ======================================================

    return (

        <div
            className="newticket-modal-overlay"
            onClick={onClose}
        >

            <div
                className="modal"
                onClick={(e) => e.stopPropagation()}
            >

                {/* Modal Header */}

                <div className="modal-header">

                    <h2>
                        Raise a Complaint
                    </h2>

                    <button
                        type="button"
                        className="close-btn"
                        onClick={onClose}
                        aria-label="Close"
                    >
                        <FaTimes />
                    </button>

                </div>


                {/* Form */}

                <form onSubmit={handleSubmit}>

                    {/* Title */}

                    <div className="form-group">

                        <label>
                            Title
                        </label>

                        <input
                            type="text"
                            placeholder="e.g. Tasks not syncing on mobile"
                            value={title}
                            onChange={(e) =>
                                setTitle(e.target.value)
                            }
                            required
                        />

                    </div>


                    {/* Category */}

                    <div className="form-group">

                        <label>
                            Category
                        </label>

                        <select
                            value={category}
                            onChange={(e) =>
                                setCategory(e.target.value)
                            }
                        >

                            <option value="Sync Issue">Sync Issue</option>
                            <option value="Bug">Bug</option>
                            <option value="Missing Feature">Missing Feature</option>
                            <option value="Login Issue">Login Issue</option>
                            <option value="Other">Other</option>

                        </select>

                    </div>


                    {/* Priority */}

                    <div className="form-group">

                        <label>
                            Priority
                        </label>

                        <select
                            value={priority}
                            onChange={(e) =>
                                setPriority(e.target.value)
                            }
                        >

                            <option value="High">High</option>
                            <option value="Medium">Medium</option>
                            <option value="Low">Low</option>

                        </select>

                    </div>


                    {/* Description */}

                    <div className="form-group">

                        <label>
                            What happened?
                        </label>

                        <textarea
                            rows="4"
                            placeholder="Describe what you expected and what happened instead. Include steps to reproduce if you can."
                            value={description}
                            onChange={(e) =>
                                setDescription(e.target.value)
                            }
                            required
                        />

                    </div>


                    {/* Buttons */}

                    <div className="newticket-modal-buttons">

                        <button
                            type="button"
                            className="newticket-cancel-btn"
                            onClick={onClose}
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            className="newticket-save-btn"
                        >
                            Submit Complaint
                        </button>

                    </div>

                </form>

            </div>

        </div>

    );

}


export default NewTicketModal;
