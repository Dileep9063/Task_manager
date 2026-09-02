import { useEffect, useState } from "react";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

import "./Reports.css";
import { API_BASE_URL } from "../../config/api";

function getScreenTier(width) {
  if (width <= 640) return "mobile";
  if (width <= 1024) return "tablet";
  if (width <= 1440) return "desktop";
  return "large";
}

function Reports() {
  const [reports, setReports] = useState({
    totalUsers: 0,
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
  });

  const [tier, setTier] = useState(getScreenTier(window.innerWidth));

  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/api/admin/reports`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
      .then((response) => {
        setReports(response.data);
      })
      .catch((error) => {
        console.log(error);
      });
  }, []);

  useEffect(() => {
    const handleResize = () => setTier(getScreenTier(window.innerWidth));
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = tier === "mobile";

  // Chart heights scale up with screen size instead of being capped
  const barHeight = { mobile: 260, tablet: 340, desktop: 400, large: 460 }[tier];
  const pieHeight = { mobile: 300, tablet: 380, desktop: 440, large: 500 }[tier];
  const pieOuterRadius = { mobile: "55%", tablet: "65%", desktop: "70%", large: "72%" }[tier];

  const barData = [
    { name: "Users", count: reports.totalUsers },
    { name: "Tasks", count: reports.totalTasks },
    { name: "Completed", count: reports.completedTasks },
    { name: "Pending", count: reports.pendingTasks },
  ];

  const pieData = [
    { name: "Completed", value: reports.completedTasks },
    { name: "Pending", value: reports.pendingTasks },
  ];

  return (
    <div className="reports">
      <div className="reports-header">
        <h1>Reports</h1>
        <p>Analyze your Task Manager performance.</p>
      </div>

      <div className="reports-cards">
        <div className="report-card">
          <h3>Total Users</h3>
          <h2>{reports.totalUsers}</h2>
        </div>

        <div className="report-card">
          <h3>Total Tasks</h3>
          <h2>{reports.totalTasks}</h2>
        </div>

        <div className="report-card">
          <h3>Completed Tasks</h3>
          <h2>{reports.completedTasks}</h2>
        </div>

        <div className="report-card">
          <h3>Pending Tasks</h3>
          <h2>{reports.pendingTasks}</h2>
        </div>
      </div>

      <div className="charts-container">
        <div className="chart-box">
          <h2>User &amp; Task Overview</h2>

          <ResponsiveContainer width="100%" height={barHeight}>
            <BarChart
              data={barData}
              margin={{ top: 10, right: isMobile ? 5 : 20, left: isMobile ? -20 : 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" fontSize={isMobile ? 11 : 13} />
              <YAxis fontSize={isMobile ? 11 : 13} width={isMobile ? 28 : 40} />
              <Tooltip />
              <Bar dataKey="count" fill="#2563eb" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-box">
          <h2>Task Status</h2>

          <ResponsiveContainer width="100%" height={pieHeight}>
            <PieChart margin={{ top: 20, right: 10, bottom: 20, left: 10 }}>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={pieOuterRadius}
                labelLine={false}
                label={({ name, percent }) =>
                  isMobile
                    ? `${(percent * 100).toFixed(0)}%`
                    : `${name} ${(percent * 100).toFixed(0)}%`
                }
              >
                <Cell fill="#22c55e" />
                <Cell fill="#ef4444" />
              </Pie>

              <Tooltip />
              <Legend verticalAlign="bottom" align="center" />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default Reports;