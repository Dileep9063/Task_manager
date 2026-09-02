import { useState } from "react";
import axios from "axios";
import "./EditTaskModal.css";
import { API_BASE_URL } from "../../config/api";

function EditTaskModal({
    task,
    isOpen,
    onClose,
    refresh
}) {

    const [title, setTitle] = useState(task.title);

    const [description, setDescription] = useState(task.description);

    const [priority, setPriority] = useState(task.priority);

    const [status, setStatus] = useState(task.status);

    const [dueDate, setDueDate] = useState(
        task.due_date
            ? task.due_date.split("T")[0]
            : ""
    );

    // Get token from localStorage
    const token = localStorage.getItem("token");

    const updateTask = async () => {

        try {

            await axios.put(
                `${API_BASE_URL}/api/tasks/${task.id}`,
                {
                    title,
                    description,
                    priority,
                    status,
                    due_date: dueDate
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            refresh();

            onClose();

        }
        catch (error) {

            console.log("Update Error:", error.response?.data || error);

        }

    };

    if (!isOpen) return null;

    return (

        <div className="edittask-modal-overlay">

            <div className="edit-modal">

                <h2>Edit Task</h2>

                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Task title"
                />

                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Task description"
                />

                <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                >
                    <option value="Low">Low</option>

                    <option value="Medium">Medium</option>

                    <option value="High">High</option>
                </select>

                <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                >
                    <option value="Pending">Pending</option>

                    <option value="In Progress">In Progress</option>

                    <option value="Completed">Completed</option>
                </select>

                <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                />

                <div className="edittask-modal-buttons">

                    <button
                        className="update-btn"
                        onClick={updateTask}
                    >
                        Update Task
                    </button>

                    <button
                        className="edittask-cancel-btn"
                        onClick={onClose}
                    >
                        Cancel
                    </button>

                </div>

            </div>

        </div>

    );

}

export default EditTaskModal;
