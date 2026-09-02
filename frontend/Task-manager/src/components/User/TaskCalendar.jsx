import { useEffect, useState, useCallback, useMemo } from "react";
import axios from "axios";

import "./TaskCalendar.css";
import { API_BASE_URL } from "../../config/api";

const MONTH_NAMES = [
    "January", "February", "March", "April",
    "May", "June", "July", "August",
    "September", "October", "November", "December"
];

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// How many years to show on either side of the current year in the
// year dropdown.
const YEAR_RANGE = 5;

function TaskCalendar() {
    const [tasks, setTasks] = useState([]);
    const [selectedDate, setSelectedDate] = useState(null);

    const today = new Date();
    const [calendarMonth, setCalendarMonth] = useState(today.getMonth()); // 0-11
    const [calendarYear, setCalendarYear] = useState(today.getFullYear());

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

    // Keep the calendar automatically on the current month/year on mount
    useEffect(() => {
        const now = new Date();
        setCalendarMonth(now.getMonth());
        setCalendarYear(now.getFullYear());
    }, []);

    // ================= Year dropdown options =================
    const yearOptions = useMemo(() => {
        const currentYear = today.getFullYear();
        const years = [];

        for (let y = currentYear - YEAR_RANGE; y <= currentYear + YEAR_RANGE; y++) {
            years.push(y);
        }

        // Always include whatever year is currently selected, even if it
        // falls outside the default range (e.g. after repeated "next" clicks).
        if (!years.includes(calendarYear)) {
            years.push(calendarYear);
            years.sort((a, b) => a - b);
        }

        return years;
    }, [calendarYear, today]);

    // ================= Calendar grid =================
    const calendarCells = useMemo(() => {
        const firstWeekday = new Date(calendarYear, calendarMonth, 1).getDay(); // 0 = Sunday
        const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();

        const cells = [];

        for (let i = 0; i < firstWeekday; i++) {
            cells.push(null);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            cells.push(day);
        }

        return cells;
    }, [calendarMonth, calendarYear]);

    const getTasksForDay = (day) => {
        return tasks.filter(task => {
            if (!task.due_date) return false;

            const date = new Date(task.due_date);

            return (
                date.getDate() === day &&
                date.getMonth() === calendarMonth &&
                date.getFullYear() === calendarYear
            );
        });
    };

    const isToday = (day) => {
        return (
            day === today.getDate() &&
            calendarMonth === today.getMonth() &&
            calendarYear === today.getFullYear()
        );
    };

    const goToPrevMonth = () => {
        setCalendarMonth(prev => {
            if (prev === 0) {
                setCalendarYear(y => y - 1);
                return 11;
            }
            return prev - 1;
        });
    };

    const goToNextMonth = () => {
        setCalendarMonth(prev => {
            if (prev === 11) {
                setCalendarYear(y => y + 1);
                return 0;
            }
            return prev + 1;
        });
    };

    const goToToday = () => {
        const now = new Date();
        setCalendarMonth(now.getMonth());
        setCalendarYear(now.getFullYear());
    };

    // ======================================================
    // Render
    // ======================================================

    return (
        <div className="calendar-page-container">

            <div className="calendar-page-header">
                <h2>Task Calendar</h2>
            </div>

            <div className="task-calendar-wrapper">
                <div className="calendar-header-row">
                    <div className="calendar-nav-buttons">
                        <button className="calendar-nav-btn" onClick={goToPrevMonth}>
                            &lt;
                        </button>

                        <select
                            className="calendar-month-select"
                            value={calendarMonth}
                            onChange={(e) => setCalendarMonth(Number(e.target.value))}
                        >
                            {MONTH_NAMES.map((name, index) => (
                                <option key={name} value={index}>
                                    {name}
                                </option>
                            ))}
                        </select>

                        <select
                            className="calendar-year-select"
                            value={calendarYear}
                            onChange={(e) => setCalendarYear(Number(e.target.value))}
                        >
                            {yearOptions.map((year) => (
                                <option key={year} value={year}>
                                    {year}
                                </option>
                            ))}
                        </select>

                        <button className="calendar-nav-btn" onClick={goToNextMonth}>
                            &gt;
                        </button>

                        <button
                            className="calendar-today-btn"
                            onClick={goToToday}
                            title="Jump to today"
                        >
                            Today
                        </button>
                    </div>
                </div>

                {/* Weekday header row */}
                <div className="calendar-weekdays">
                    {WEEKDAY_LABELS.map(label => (
                        <div key={label} className="calendar-weekday-label">{label}</div>
                    ))}
                </div>

                <div className="task-calendar">
                    {calendarCells.map((day, index) => {
                        if (day === null) {
                            return <div key={`blank-${index}`} className="calendar-day empty" />;
                        }

                        const dayTasks = getTasksForDay(day);

                        return (
                            <div
                                key={day}
                                className={
                                    `calendar-day` +
                                    (dayTasks.length ? " has-task" : "") +
                                    (isToday(day) ? " today" : "")
                                }
                                onClick={() => setSelectedDate(day)}
                            >
                                <h3>{day}</h3>

                                {dayTasks.length > 0 && (
                                    <span className="calendar-task-count">
                                        {dayTasks.length} task{dayTasks.length > 1 ? "s" : ""}
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Day Details Popup */}
            {selectedDate && (
                <div className="calendar-modal-overlay" onClick={() => setSelectedDate(null)}>
                    <div className="calendar-task-modal" onClick={(e) => e.stopPropagation()}>
                        <h2>
                            Tasks on {MONTH_NAMES[calendarMonth]} {selectedDate}, {calendarYear}
                        </h2>

                        {getTasksForDay(selectedDate).length === 0 && (
                            <p>No tasks due on this day.</p>
                        )}

                        {getTasksForDay(selectedDate).map(task => (
                            <div key={task.id} className="calendar-modal-task">
                                <p><strong>Title:</strong><br />{task.title}</p>
                                <p><strong>Priority:</strong><br />{task.priority}</p>
                                <p><strong>Status:</strong><br />{task.status}</p>
                            </div>
                        ))}

                        <button className="calendar-close-btn" onClick={() => setSelectedDate(null)}>
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default TaskCalendar;
