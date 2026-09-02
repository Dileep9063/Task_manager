import { useState } from "react";
import axios from "axios";
import { FaTimes } from "react-icons/fa";
import "./CreateTaskModal.css";
import { API_BASE_URL } from "../../config/api";

function CreateTaskModal({ isOpen, onClose, onTaskCreated }) {

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [priority, setPriority] = useState("Medium");
    const [dueDate, setDueDate] = useState("");


    // ======================================================
    // Get Today's Date
    // ======================================================

    const today = new Date().toISOString().split("T")[0];


    // ======================================================
    // Submit Task
    // ======================================================

    const handleSubmit = async (e) => {

        e.preventDefault();


        // Prevent past due dates

        if (dueDate && dueDate < today) {

            alert("Due date cannot be in the past.");

            return;
        }


        try {

            const token = localStorage.getItem("token");


            const response = await axios.post(

                `${API_BASE_URL}/api/tasks`,

                {
                    title,
                    description,
                    priority,
                    dueDate
                },

                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }

            );


            console.log(response.data);


            alert("Task created successfully");


            if (onTaskCreated) {

                onTaskCreated(response.data.task);

            }


            // Reset form

            setTitle("");
            setDescription("");
            setPriority("Medium");
            setDueDate("");


            onClose();


        } catch (error) {

            console.log(
                error.response?.data || error.message
            );

            alert(
                error.response?.data?.message ||
                "Task creation failed"
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
            className="createtask-modal-overlay"
            onClick={onClose}
        >

            <div
                className="modal"
                onClick={(e) => e.stopPropagation()}
            >


                {/* Modal Header */}

                <div className="modal-header">

                    <h2>
                        Create New Task
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


                    {/* Task Title */}

                    <div className="form-group">

                        <label>
                            Task Title
                        </label>


                        <input
                            type="text"
                            placeholder="Enter task title"
                            value={title}
                            onChange={(e) =>
                                setTitle(e.target.value)
                            }
                            required
                        />

                    </div>


                    {/* Description */}

                    <div className="form-group">

                        <label>
                            Description
                        </label>


                        <textarea
                            rows="4"
                            placeholder="Enter description"
                            value={description}
                            onChange={(e) =>
                                setDescription(e.target.value)
                            }
                        />

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

                            <option value="High">
                                High
                            </option>

                            <option value="Medium">
                                Medium
                            </option>

                            <option value="Low">
                                Low
                            </option>

                        </select>

                    </div>


                    {/* Due Date */}

                    <div className="form-group">

                        <label>
                            Due Date
                        </label>


                        <input
                            type="date"
                            value={dueDate}
                            min={today}
                            onChange={(e) =>
                                setDueDate(e.target.value)
                            }
                        />

                    </div>


                    {/* Buttons */}

                    <div className="createtask-modal-buttons">

                        <button
                            type="button"
                            className="createtask-cancel-btn"
                            onClick={onClose}
                        >
                            Cancel
                        </button>


                        <button
                            type="submit"
                            className="createtask-save-btn"
                        >
                            Create Task
                        </button>

                    </div>


                </form>

            </div>

        </div>

    );

}


export default CreateTaskModal;
