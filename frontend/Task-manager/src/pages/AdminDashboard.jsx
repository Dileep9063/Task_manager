import {
  FaUsers,
  FaTasks,
  FaCheckCircle,
  FaClock,
  FaUserCog,
  FaChartBar,
  FaTrash
} from "react-icons/fa";

import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import StatCard from "../components/admin/StatCard";

import "./AdminDashboard.css";
import { API_BASE_URL } from "../config/api";

const ONE_HOUR_MS = 60 * 60 * 1000;

function AdminDashboard() {

  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTasks: 0,
    completed: 0,
    pending: 0
  });

  const [userGrowth, setUserGrowth] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [deletedIds, setDeletedIds] = useState(() => new Set());
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {

    const fetchDashboard = () => {
      axios
        .get(`${API_BASE_URL}/api/admin/dashboard`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        })
        .then((response) => {
          setStats({
            totalUsers: response.data.totalUsers,
            totalTasks: response.data.totalTasks,
            completed: response.data.completed,
            pending: response.data.pending
          });

          setUserGrowth(response.data.monthlyGrowth);

          // Stable key: entityType + real db id
          const withIds = response.data.recentActivities.map((activity) => ({
            ...activity,
            _id: `${activity.entityType}-${activity.id}`
          }));

          setRecentActivities(withIds);
        })
        .catch((error) => {
          console.log(error);
        });
    };

    // Load immediately
    fetchDashboard();

    // Refresh every 5 seconds
    const interval = setInterval(fetchDashboard, 3000);

    // Cleanup
    return () => clearInterval(interval);

  }, []);

  // Keep "now" ticking so the 1-hour filter re-evaluates without
  // calling Date.now() directly during render (impure)
  useEffect(() => {
    const tick = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(tick);
  }, []);

  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  const handleActivityClick = (id) => {
    setSelectedActivity((prev) => (prev === id ? null : id));
  };

  const handleDeleteActivity = (activity) => {

    const confirmed = window.confirm(
      activity.entityType === "user"
        ? "This will permanently delete this user account. Continue?"
        : "This will permanently delete this task. Continue?"
    );

    if (!confirmed) return;

    const key = activity._id;

    // Optimistically remove from UI
    setDeletedIds((prev) => new Set(prev).add(key));
    setSelectedActivity(null);

    const url =
      activity.entityType === "user"
        ? `${API_BASE_URL}/api/admin/users/${activity.id}`
        : `${API_BASE_URL}/api/admin/tasks/${activity.id}`;

    axios.delete(url).catch((error) => {
      console.log(error);
      // Roll back if the request failed
      setDeletedIds((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    });
  };

  // Only keep activities from the last hour AND not deleted
  const visibleActivities = recentActivities.filter((activity) => {
    const activityTime = new Date(activity.time).getTime();
    const withinLastHour = now - activityTime < ONE_HOUR_MS;
    const notDeleted = !deletedIds.has(activity._id);
    return withinLastHour && notDeleted;
  });

  return (

    <>

      {/* Welcome Banner */}

      <div className="welcome-card">

        <h1>Welcome Back, Admin</h1>

        <p>
          Manage users, tasks and monitor your application.
        </p>

      </div>


      {/* Statistics */}

      <div className="stats-container">

        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          icon={<FaUsers />}
          color="blue"
        />

        <StatCard
          title="Total Tasks"
          value={stats.totalTasks}
          icon={<FaTasks />}
          color="purple"
        />

        <StatCard
          title="Completed"
          value={stats.completed}
          icon={<FaCheckCircle />}
          color="green"
        />

        <StatCard
          title="Pending"
          value={stats.pending}
          icon={<FaClock />}
          color="orange"
        />

      </div>


      {/* Monthly User Growth */}

      <div className="growth-card">

        <h2>Monthly User Growth</h2>

        <div className="growth-list">

          {userGrowth.map((item) => (

            <div
              className="growth-row"
              key={item.month}
            >

              <span>{item.month}</span>

              <div className="growth-progress">

                <div
                  className="growth-fill"
                  style={{
                    width: `${item.users * 25}px`
                  }}
                />

              </div>

              <strong>{item.users}</strong>

            </div>

          ))}

        </div>

      </div>


      {/* Bottom Section */}

      <div className="dashboard-grid">

        {/* Recent Activity */}

        <div className="activity-card">

          <h2>Recent Activity</h2>

          {

            visibleActivities.length === 0 ? (

              <p>No Recent Activity</p>

            ) : (

              visibleActivities.map((activity) => (

                <div
                  key={activity._id}
                  className="activity-row"
                  onClick={() => handleActivityClick(activity._id)}
                >

                  <div className="activity-main">

                    <p className="activity-message">
                      {activity.message}
                    </p>

                    <small className="activity-time">
                      {formatDate(activity.time)}
                    </small>

                  </div>

                  {selectedActivity === activity._id && (

                    <button
                      className="activity-delete-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteActivity(activity);
                      }}
                    >
                      <FaTrash /> Delete
                    </button>

                  )}

                </div>

              ))

            )

          }

        </div>


        {/* Quick Actions */}

        <div className="quick-card">

          <h2>Quick Actions</h2>

          <button
            onClick={() => navigate("/admin/users")}
          >

            <FaUserCog />

            Manage Users

          </button>

          <button
            onClick={() => navigate("/admin/reports")}
          >

            <FaChartBar />

            View Reports

          </button>

        </div>

      </div>

    </>

  );

}

export default AdminDashboard;