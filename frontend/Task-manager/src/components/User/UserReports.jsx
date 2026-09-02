import { useEffect, useState } from "react";
import axios from "axios";

import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement
} from "chart.js";

import { Doughnut, Bar, Pie } from "react-chartjs-2";

import "./UserReports.css";
import { API_BASE_URL } from "../../config/api";

ChartJS.register(
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement
);

function UserReports() {
    const [tasks, setTasks] = useState([]);

    const token = localStorage.getItem("token");

    // ================= Fetch Tasks =================
    const fetchTasks = async () => {
        try {
            const response = await axios.get(
                `${API_BASE_URL}/api/tasks/reports`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setTasks(response.data);
        } catch (error) {
            console.log(error);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, []);

    // ================= Statistics =================
    const totalTasks = tasks.length;

    const completed = tasks.filter(
        task => task.status?.toLowerCase() === "completed"
    ).length;

    const pending = tasks.filter(
        task => task.status?.toLowerCase() === "pending"
    ).length;

    const progress = tasks.filter(
        task => task.status?.toLowerCase() === "in progress"
    ).length;

    const high = tasks.filter(
        task => task.priority?.toLowerCase() === "high"
    ).length;

    const medium = tasks.filter(
        task => task.priority?.toLowerCase() === "medium"
    ).length;

    const low = tasks.filter(
        task => task.priority?.toLowerCase() === "low"
    ).length;

    // ================= Status Chart =================
    const statusData = {
        labels: ["Pending", "In Progress", "Completed"],
        datasets: [{
            data: [pending, progress, completed],
            backgroundColor: ["#f59e0b", "#3b82f6", "#22c55e"],
            borderWidth: 1
        }]
    };

    // ================= Priority Chart =================
    const priorityData = {
        labels: ["Low", "Medium", "High"],
        datasets: [{
            data: [low, medium, high],
            backgroundColor: ["#22c55e", "#f59e0b", "#ef4444"],
            borderWidth: 1
        }]
    };

    // ================= Completion Rate =================
    const completionData = {
        labels: ["Completed", "Remaining"],
        datasets: [{
            data: [completed, totalTasks - completed],
            backgroundColor: ["#22c55e", "#94a3b8"],
            borderWidth: 1
        }]
    };

    // ================= Monthly Tasks =================
    const monthCount = {};

    tasks.forEach(task => {
        const month = new Date(task.created_at).toLocaleString("en-US", { month: "short" });
        monthCount[month] = (monthCount[month] || 0) + 1;
    });

    const monthlyData = {
        labels: Object.keys(monthCount),
        datasets: [{
            label: "Tasks Created",
            data: Object.values(monthCount),
            backgroundColor: "#3b82f6",
            borderWidth: 1
        }]
    };

    // Shared chart options so charts resize with their container
    // instead of overflowing or staying a fixed pixel size
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: "bottom"
            }
        }
    };

    return (
        <div className="user-reports-page">

            <h2>Task Reports</h2>

            {/* Statistics */}
            <div className="report-stats">
                <div className="user-report-card">
                    <h3>Total Tasks</h3>
                    <h1>{totalTasks}</h1>
                </div>

                <div className="user-report-card">
                    <h3>Completed</h3>
                    <h1>{completed}</h1>
                </div>

                <div className="user-report-card">
                    <h3>Pending</h3>
                    <h1>{pending}</h1>
                </div>

                <div className="user-report-card">
                    <h3>Progress</h3>
                    <h1>{progress}</h1>
                </div>
            </div>

            <div className="charts-container">

                <div className="chart-card">
                    <h3>Task Status</h3>
                    <div className="chart-canvas-wrapper">
                        <Doughnut data={statusData} options={chartOptions} />
                    </div>
                </div>

                <div className="chart-card">
                    <h3>Task Priority</h3>
                    <div className="chart-canvas-wrapper">
                        <Doughnut data={priorityData} options={chartOptions} />
                    </div>
                </div>

                <div className="chart-card">
                    <h3>Completion Rate</h3>
                    <div className="chart-canvas-wrapper">
                        <Pie data={completionData} options={chartOptions} />
                    </div>
                </div>

                <div className="chart-card large-chart">
                    <h3>Monthly Task Creation</h3>
                    <div className="chart-canvas-wrapper">
                        <Bar data={monthlyData} options={chartOptions} />
                    </div>
                </div>

            </div>

        </div>
    );
}

export default UserReports;
