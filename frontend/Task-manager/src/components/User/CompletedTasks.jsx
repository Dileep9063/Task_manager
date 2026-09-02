import { useEffect, useState } from "react";
import axios from "axios";
import { FaEye, FaTrash } from "react-icons/fa";

import "./CompletedTasks.css";
import { API_BASE_URL } from "../../config/api";

function CompletedTasks() {
    const [tasks, setCompletedTasks] = useState([]);
    const [search, setSearch] = useState("");
    const [selectedTask, setSelectedTask] = useState(null);

    const token = localStorage.getItem("token");

    // ================= Fetch Completed Tasks =================
    const fetchCompletedTasks = async () => {
        try {
            const response = await axios.get(
                `${API_BASE_URL}/api/tasks/completed`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setCompletedTasks(response.data);
            console.log("CHECK:", JSON.stringify(response.data[0], null, 2));
        } catch (error) {
            console.log(error);
        }
    };

    useEffect(() => {
        fetchCompletedTasks();
    }, []);

    // ================= Search =================
    const filteredTasks = tasks.filter(task =>
        task.title.toLowerCase().includes(search.toLowerCase())
    );

    // ================= Delete =================
    const deleteTask = async (id) => {
        try {
            await axios.delete(
                `${API_BASE_URL}/api/tasks/${id}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            fetchCompletedTasks();
        } catch (error) {
            console.log(error);
        }
    };

    // ================= View Task =================
    const viewTask = (task) => {
        setSelectedTask(task);
    };

    // Formats a completion date safely - shows a fallback instead of
    // "Invalid Date" if updated_at is missing from the API response
    const formatCompletedDate = (dateString) => {
        if (!dateString) return "Not available";

        const date = new Date(dateString);

        if (isNaN(date.getTime())) return "Not available";

        return date.toLocaleDateString("en-IN");
    };

    return (
        <div className="completed-container">

            <h2>{tasks.length} Completed Tasks</h2>

            <input
                type="text"
                placeholder="Search completed tasks..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="search-input"
            />

            {filteredTasks.length === 0 ? (
                <p className="empty-state">No completed tasks</p>
            ) : (
                <div className="completed-list">
                    {filteredTasks.map(task => (
                        <div className="completed-card" key={task.id}>

                            <div className="task-info">
                                <h3>{task.title}</h3>

                                <p>{task.description}</p>

                                <span className={`priority ${task.priority.toLowerCase()}`}>
                                    {task.priority}
                                </span>

                                <p className="completed-date">
                                    Completed on: {formatCompletedDate(task.updated_at)}
                                </p>
                            </div>

                            <div className="task-actions">
                                <button className="view-btn" onClick={() => viewTask(task)}>
                                    <FaEye />
                                </button>

                                <button className="delete-btn" onClick={() => deleteTask(task.id)}>
                                    <FaTrash />
                                </button>
                            </div>

                        </div>
                    ))}
                </div>
            )}

            {/* ================= Task Details Modal ================= */}
            {selectedTask && (
                <div className="completedtasks-modal-overlay" onClick={() => setSelectedTask(null)}>
                    <div className="completedtasks-task-modal" onClick={(e) => e.stopPropagation()}>

                        <h2>Task Details</h2>

                        <h3>{selectedTask.title}</h3>

                        <p>
                            <b>Description:</b>
                            <br />
                            {selectedTask.description}
                        </p>

                        <p>
                            <b>Priority:</b> {selectedTask.priority}
                        </p>

                        <p>
                            <b>Status:</b> {selectedTask.status}
                        </p>

                        <p>
                            <b>Completed Date:</b> {formatCompletedDate(selectedTask.updated_at)}
                        </p>

                        <button className="completedtasks-close-btn" onClick={() => setSelectedTask(null)}>
                            Close
                        </button>

                    </div>
                </div>
            )}

        </div>
    );
}

export default CompletedTasks;
