import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { FaPlus } from "react-icons/fa";
import { useOutletContext } from "react-router-dom";

import CreateTaskModal from "../components/User/CreateTaskModal";
import "./UserDashboard.css";
import { API_BASE_URL } from "../config/api";

function UserDashboard() {

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [tasks, setTasks] = useState([]);

    const { search } = useOutletContext();

    const user = JSON.parse(localStorage.getItem("user"));
    const token = localStorage.getItem("token");


    // ================= Fetch Tasks =================

    const loadTasks = useCallback(async () => {

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

        }
        catch (error) {

            console.log("Error fetching tasks:", error);

        }

    }, [token]);


    // ================= Initial Load =================

    useEffect(() => {

        loadTasks();

    }, [loadTasks]);


    if (!user) {
        return <h2>Loading...</h2>;
    }


    // ================= Search Filter =================

    const filteredTasks = tasks.filter((task) => {

        const keyword = search.toLowerCase();

        return (

            task.title?.toLowerCase().includes(keyword) ||
            task.description?.toLowerCase().includes(keyword) ||
            task.status?.toLowerCase().includes(keyword) ||
            task.priority?.toLowerCase().includes(keyword)

        );

    });


    // ================= Statistics =================

    const totalTasks = tasks.length;

    const completedTasks = tasks.filter(
        task => task.status?.toLowerCase() === "completed"
    ).length;

    const pendingTasks = tasks.filter(
        task => task.status?.toLowerCase() === "pending"
    ).length;

    const inProgressTasks = tasks.filter(
        task => task.status?.toLowerCase() === "in progress"
    ).length;

    return (

        <div className="user-dashboard">

            {/* Header */}

            <div className="dashboard-header">

                <div>

                    <h1>
                        Welcome Back {user.name}
                    </h1>

                    <p>
                        Manage your tasks efficiently
                    </p>

                </div>

                <button
                    className="create-btn"
                    onClick={() => setIsModalOpen(true)}
                >

                    <FaPlus />

                    Create Task

                </button>

            </div>

            {/* Statistics */}

            <div className="stats-container">

                <div className="user-stat-card">

                    <h3>Total Tasks</h3>

                    <h2>{totalTasks}</h2>

                    <p>All tasks</p>

                </div>

                <div className="user-stat-card">

                    <h3>Completed</h3>

                    <h2>{completedTasks}</h2>

                    <p>Finished tasks</p>

                </div>

                <div className="user-stat-card">

                    <h3>Pending</h3>

                    <h2>{pendingTasks}</h2>

                    <p>Remaining tasks</p>

                </div>

                <div className="user-stat-card">

                    <h3>In Progress</h3>

                    <h2>{inProgressTasks}</h2>

                    <p>Active tasks</p>

                </div>

            </div>

            {/* Recent Tasks */}

            <div className="recent-task-section">

                <div className="section-header">

                    <h2>Recent Tasks</h2>

                    <button>
                        View All
                    </button>

                </div>

                <div className="task-list">

                    {
                        filteredTasks.length === 0 ?

                            <p>No matching tasks found</p>

                            :

                            filteredTasks.slice(0, 5).map(task => (

                                <div
                                    className="task-card"
                                    key={task.id}
                                >

                                    <h3>
                                        {task.title}
                                    </h3>

                                    <p>
                                        {task.description}
                                    </p>

                                    <span
                                        className={
                                            task.status
                                                ?.toLowerCase()
                                                .replace(" ", "-")
                                        }
                                    >
                                        {task.status}
                                    </span>

                                </div>

                            ))

                    }

                </div>

            </div>

            {/* Create Task Modal */}

            {
                isModalOpen &&

                <CreateTaskModal

                    isOpen={isModalOpen}

                    onClose={() => setIsModalOpen(false)}

                    onSubmit={async () => {

                        await loadTasks();

                        setIsModalOpen(false);

                    }}

                />
            }

        </div>

    );

}

export default UserDashboard;