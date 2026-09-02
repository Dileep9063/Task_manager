import { useEffect, useState } from "react";
import axios from "axios";
import "./Tasks.css";
import { FaEye, FaTrash } from "react-icons/fa";
import { API_BASE_URL } from "../../config/api";

function Tasks() {
    const [tasks, setTasks] = useState([]);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all");
    const [selectedTask, setSelectedTask] = useState(null);

    // ==========================================
    // Fetch Tasks
    // ==========================================

    const fetchTasks = () => {
        const token = localStorage.getItem("token");

        axios
            .get(`${API_BASE_URL}/api/admin/tasks`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            .then((response) => {
                setTasks(response.data);
            })
            .catch((error) => {
                console.log("Fetch tasks error:", error);
            });
    };

    // ==========================================
    // Mark Tasks As Seen
    // ==========================================

    const markTasksAsSeen = () => {
        const token = localStorage.getItem("token");

        axios
            .put(
                `${API_BASE_URL}/api/admin/tasks/seen`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            )
            .catch((error) => {
                console.log("Mark tasks seen error:", error);
            });
    };

    // ==========================================
    // Load Tasks
    // ==========================================

    useEffect(() => {
        fetchTasks();

        // Mark tasks as seen when admin opens page
        markTasksAsSeen();

        // Refresh tasks every 5 seconds
        const interval = setInterval(() => {
            fetchTasks();
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    // ==========================================
    // Delete Task
    // ==========================================

    const handleDelete = (id) => {
        const confirmDelete = window.confirm(
            "Are you sure you want to delete this task?"
        );

        if (!confirmDelete) {
            return;
        }

        const token = localStorage.getItem("token");

        axios
            .delete(`${API_BASE_URL}/api/admin/tasks/${id}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            .then(() => {
                setTasks((prevTasks) =>
                    prevTasks.filter((task) => task.id !== id)
                );

                // Close modal if deleted task was selected
                if (selectedTask?.id === id) {
                    setSelectedTask(null);
                }
            })
            .catch((error) => {
                console.log("Delete task error:", error);
            });
    };

    // ==========================================
    // Statistics
    // ==========================================

    const completed = tasks.filter(
        (task) => task.status?.toLowerCase() === "completed"
    ).length;

    const pending = tasks.filter(
        (task) => task.status?.toLowerCase() === "pending"
    ).length;

    // ==========================================
    // Search + Filter
    // ==========================================

    const filteredTasks = tasks.filter((task) => {
        const searchText = search.toLowerCase();

        const searchMatch =
            task.title?.toLowerCase().includes(searchText) ||
            task.description?.toLowerCase().includes(searchText) ||
            task.username?.toLowerCase().includes(searchText) ||
            task.email?.toLowerCase().includes(searchText);

        const filterMatch =
            filter === "all" ||
            task.status?.toLowerCase() === filter;

        return searchMatch && filterMatch;
    });

    // ==========================================
    // View Task
    // ==========================================

    const handleView = (task) => {
        setSelectedTask(task);
    };

    // ==========================================
    // JSX
    // ==========================================

    return (
        <div className="tasks-page">

            {/* =================================
                PAGE TITLE
            ================================= */}

            <h1>Task Management</h1>


            {/* =================================
                TASK STATISTICS
            ================================= */}

            <div className="task-stats">

                <div className="task-box">
                    <h3>Total Tasks</h3>
                    <h2>{tasks.length}</h2>
                </div>

                <div className="task-box completed-box">
                    <h3>Completed</h3>
                    <h2>{completed}</h2>
                </div>

                <div className="task-box pending-box">
                    <h3>Pending</h3>
                    <h2>{pending}</h2>
                </div>

            </div>


            {/* =================================
                SEARCH
            ================================= */}

            <input
                type="text"
                placeholder="Search tasks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="task-search"
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
                    className={filter === "completed" ? "active-filter" : ""}
                    onClick={() => setFilter("completed")}
                >
                    Completed
                </button>

                <button
                    className={filter === "pending" ? "active-filter" : ""}
                    onClick={() => setFilter("pending")}
                >
                    Pending
                </button>

            </div>


            {/* =================================
                TABLE SCROLL CONTAINER
            ================================= */}

            <div className="tasks-table">

                <table>

                    <thead>

                        <tr>
                            <th>ID</th>
                            <th>Title</th>
                            <th>Description</th>
                            <th>Status</th>
                            <th>Created By</th>
                            <th>Actions</th>
                        </tr>

                    </thead>


                    <tbody>

                        {filteredTasks.length > 0 ? (

                            filteredTasks.map((task) => (

                                <tr key={task.id}>

                                    {/* ID */}

                                    <td>
                                        {task.id}
                                    </td>


                                    {/* TITLE */}

                                    <td>
                                        {task.title}
                                    </td>


                                    {/* DESCRIPTION */}

                                    <td>
                                        {task.description}
                                    </td>


                                    {/* STATUS */}

                                    <td>

                                        <span
                                            className={`status ${task.status?.toLowerCase()}`}
                                        >
                                            {task.status}
                                        </span>

                                    </td>


                                    {/* CREATED BY */}

                                    <td>

                                        <strong>
                                            {task.username}
                                        </strong>

                                        <br />

                                        <small>
                                            {task.email}
                                        </small>

                                    </td>


                                    {/* ACTIONS */}

                                    <td>

                                        <div className="action-btns">

                                            <button
                                                className="view-btn"
                                                onClick={() =>
                                                    handleView(task)
                                                }
                                                title="View Task"
                                            >
                                                <FaEye />
                                            </button>


                                            <button
                                                className="delete-btn"
                                                onClick={() =>
                                                    handleDelete(task.id)
                                                }
                                                title="Delete Task"
                                            >
                                                <FaTrash />
                                            </button>

                                        </div>

                                    </td>

                                </tr>

                            ))

                        ) : (

                            <tr>

                                <td colSpan="6">
                                    No tasks found
                                </td>

                            </tr>

                        )}

                    </tbody>

                </table>

            </div>


            {/* =================================
                TASK DETAILS MODAL
            ================================= */}

            {selectedTask && (

                <div
                    className="admintasks-modal-overlay"
                    onClick={() => setSelectedTask(null)}
                >

                    <div
                        className="admintasks-task-modal"
                        onClick={(e) => e.stopPropagation()}
                    >

                        <h2>
                            Task Details
                        </h2>


                        <p>
                            <strong>Title:</strong>
                            <br />
                            {selectedTask.title}
                        </p>


                        <p>
                            <strong>Description:</strong>
                            <br />
                            {selectedTask.description}
                        </p>


                        <p>
                            <strong>Created By:</strong>
                            <br />
                            {selectedTask.username}
                        </p>


                        <p>
                            <strong>Email:</strong>
                            <br />
                            {selectedTask.email}
                        </p>


                        <p>
                            <strong>Status:</strong>
                            <br />

                            <span
                                className={`status ${selectedTask.status?.toLowerCase()}`}
                            >
                                {selectedTask.status}
                            </span>

                        </p>


                        <button
                            className="admintasks-close-btn"
                            onClick={() => setSelectedTask(null)}
                        >
                            Close
                        </button>

                    </div>

                </div>

            )}

        </div>
    );
}

export default Tasks;
