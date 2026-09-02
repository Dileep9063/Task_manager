import { useEffect, useState, useCallback, useMemo } from "react";
import axios from "axios";
import { FaPlus, FaEdit, FaTrash, FaCheck } from "react-icons/fa";

import CreateTaskModal from "./CreateTaskModal";
import EditTaskModal from "./EditTaskModal";

import "./MyTasks.css";
import { API_BASE_URL } from "../../config/api";



const getDateOnly = (value) => {
    if (!value) return null;
    const str = typeof value === "string" ? value : new Date(value).toISOString();
    return str.split("T")[0]; // "YYYY-MM-DD"
};

const getTodayStr = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

const isCompletedTask = (task) => task.status?.toLowerCase() === "completed";

const isOverdueTask = (task) => {
    if (!task.due_date || isCompletedTask(task)) return false;
    const due = getDateOnly(task.due_date);
    return due !== null && due < getTodayStr();
};

const isDueTodayTask = (task) => {
    if (!task.due_date) return false;
    const due = getDateOnly(task.due_date);
    return due === getTodayStr();
};

function MyTasks() {
    const [tasks, setTasks] = useState([]);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);

    const token = localStorage.getItem("token");

    // ================= Fetch Tasks =================
    const fetchTasks = useCallback(async () => {
        try {
            const response = await axios.get(
                `${API_BASE_URL}/api/tasks/user`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setTasks(response.data);
        } catch (error) {
            console.log("Fetch task error", error);
        }
    }, [token]);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    // ================= Delete Task =================
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

            fetchTasks();
        } catch (error) {
            console.log(error);
        }
    };

    // ================= Complete Task =================
    const completeTask = async (id) => {
        try {
            await axios.patch(
                `${API_BASE_URL}/api/tasks/${id}/status`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            fetchTasks();
        } catch (error) {
            console.log(error);
        }
    };

    // ================= Dynamic Overview Counts =================
    const overdueCount = useMemo(
        () => tasks.filter(isOverdueTask).length,
        [tasks]
    );

    const dueTodayCount = useMemo(
        () => tasks.filter(isDueTodayTask).length,
        [tasks]
    );

    const completedCount = useMemo(
        () => tasks.filter(isCompletedTask).length,
        [tasks]
    );

    const totalCount = tasks.length;

    // Quick-filter cards shown in the side panel. Clicking a card toggles
    // that filter on the table (clicking the active one resets to "all").
    const overviewCards = [
        { key: "all", label: "Total Tasks", count: totalCount, className: "total" },
        { key: "overdue", label: "Overdue", count: overdueCount, className: "overdue" },
        { key: "due-today", label: "Due Today", count: dueTodayCount, className: "due-today" },
        { key: "completed", label: "Completed", count: completedCount, className: "completed" }
    ];

    const handleCardClick = (key) => {
        setFilter(prev => (prev === key ? "all" : key));
    };

    // ================= Search + Filter =================
    const filteredTasks = tasks.filter(task => {
        const query = search.toLowerCase();

        const searchMatch = task.title?.toLowerCase().includes(query);

        const filterMatch =
            filter === "all" ? true :
            filter === "overdue" ? isOverdueTask(task) :
            filter === "due-today" ? isDueTodayTask(task) :
            task.status?.toLowerCase() === filter;

        return searchMatch && filterMatch;
    });

    return (
        <div className="mytasks-container">

            {/* Header */}
            <div className="mytasks-header">
                <h2>My Tasks</h2>

                <button className="create-btn" onClick={() => setIsModalOpen(true)}>
                    <FaPlus />
                    Create Task
                </button>
            </div>

            {/* Two-column layout: task list on one side, overview on the other */}
            <div className="mytasks-layout">

                {/* ================= Main: Search + Table ================= */}
                <div className="mytasks-main">

                    <div className="task-toolbar">
                        <input
                            type="text"
                            placeholder="Search by task name..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />

                        <select value={filter} onChange={e => setFilter(e.target.value)}>
                            <option value="all">All</option>
                            <option value="pending">Pending</option>
                            <option value="in progress">In Progress</option>
                            <option value="completed">Completed</option>
                            <option value="overdue">Overdue</option>
                            <option value="due-today">Due Today</option>
                        </select>
                    </div>

                    <div className="task-table-wrapper">
                        <table className="task-table">
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Priority</th>
                                    <th>Due Date</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredTasks.map(task => (
                                    <tr key={task.id}>
                                        <td data-label="Title">{task.title}</td>

                                        <td data-label="Priority">
                                            <span className={task.priority?.toLowerCase() ?? "unset"}>
                                                {task.priority ?? "—"}
                                            </span>
                                        </td>

                                        <td data-label="Due Date">
                                            {task.due_date}
                                            {isOverdueTask(task) && (
                                                <span className="badge-overdue">Overdue</span>
                                            )}
                                            {isDueTodayTask(task) && !isCompletedTask(task) && (
                                                <span className="badge-due-today">Due Today</span>
                                            )}
                                        </td>

                                        <td data-label="Status">{task.status}</td>

                                        <td data-label="Actions">
                                            <button
                                                className="action-btn edit"
                                                onClick={() => {
                                                    setSelectedTask(task);
                                                    setEditOpen(true);
                                                }}
                                            >
                                                <FaEdit />
                                            </button>

                                            <button
                                                className="action-btn delete"
                                                onClick={() => deleteTask(task.id)}
                                            >
                                                <FaTrash />
                                            </button>

                                            <button
                                                className="action-btn complete"
                                                onClick={() => completeTask(task.id)}
                                            >
                                                <FaCheck />
                                            </button>
                                        </td>
                                    </tr>
                                ))}

                                {filteredTasks.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="no-tasks-row">
                                            No tasks match this view.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                </div>

                {/* ================= Side: Overview Panel ================= */}
                <aside className="mytasks-side">
                    <h3>Overview</h3>

                    <div className="status-cards">
                        {overviewCards.map(card => (
                            <button
                                key={card.key}
                                className={
                                    `status-card ${card.className}` +
                                    (filter === card.key ? " active" : "")
                                }
                                onClick={() => handleCardClick(card.key)}
                            >
                                <span className="status-count">{card.count}</span>
                                <span className="status-label">{card.label}</span>
                            </button>
                        ))}
                    </div>
                </aside>

            </div>

            {/* Create Modal */}
            {isModalOpen && (
                <CreateTaskModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSubmit={() => {
                        fetchTasks();
                        setIsModalOpen(false);
                    }}
                />
            )}

            {/* Edit Modal */}
            {editOpen && (
                <EditTaskModal
                    task={selectedTask}
                    isOpen={editOpen}
                    onClose={() => setEditOpen(false)}
                    refresh={fetchTasks}
                />
            )}
        </div>
    );
}

export default MyTasks;
