import { BrowserRouter, Routes, Route } from "react-router-dom";

import LandingPage from "./pages/LandingPage";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsAndConditions from "./pages/TermsAndConditions";
import CookiePolicy from "./pages/CookiePolicy";
import Login from "./pages/Login";
import Register from "./pages/Register";

import AdminDashboard from "./pages/AdminDashboard";
import UserDashboard from "./pages/UserDashboard";

import ForgotPasswordFlow from "./pages/ForgotPasswordFlow";
import Users from "./components/admin/Users";
import Tasks from "./components/admin/Tasks";
import Reports from "./components/admin/Reports";
import Settings from "./components/admin/Settings";
import Notifications from "./components/admin/Notifications";
import AdminSupport from "./components/admin/AdminSupport";

import MyTasks from "./components/User/MyTasks";
import CompletedTasks from "./components/User/CompletedTasks";
import Profile from "./components/User/Profile";
import UserSettings from "./components/User/UserSettings";
import UserReports from "./components/User/UserReports";
import UserNotifications from "./components/User/UserNotifications";
import TaskCalendar from "./components/User/TaskCalendar";
import Support from "./components/User/Support";

import ProtectedRoute from "./components/ProtectedRoute";

import AdminLayout from "./layouts/AdminLayout";
import UserLayout from "./layouts/UserLayout";

function App() {

    return (

        <BrowserRouter>

            <Routes>

                {/* PUBLIC ROUTES */}

                <Route
                    path="/"
                    element={<LandingPage />}
                />

                <Route path="/privacy-policy" 
                    element={<PrivacyPolicy />} 
                />
                <Route path="/terms-and-conditions"
                     element={<TermsAndConditions />} 
                />
                <Route path="/cookie-policy" 
                element={<CookiePolicy />}
                />
                <Route
                    path="/login"
                    element={<Login />}
                />

                <Route
                    path="/register"
                    element={<Register />}
                />

                <Route
                    path="/forgot-password"
                    element={<ForgotPasswordFlow />}
                />



                {/* ADMIN ROUTES */}

                <Route
                    path="/admin"
                    element={
                        <ProtectedRoute role="admin">
                            <AdminLayout />
                        </ProtectedRoute>
                    }
                >

                    <Route
                        index
                        element={<AdminDashboard />}
                    />

                    <Route
                        path="users"
                        element={<Users />}
                    />

                    <Route
                        path="tasks"
                        element={<Tasks />}
                    />

                    <Route
                        path="reports"
                        element={<Reports />}
                    />

                    <Route
                        path="notifications"
                        element={<Notifications />}
                    />

                    <Route
                        path="settings"
                        element={<Settings />}
                    />

                    <Route
                        path="support"
                        element={<AdminSupport />}
                    />

                </Route>



                {/* USER ROUTES */}

                <Route
                    path="/user"
                    element={
                        <ProtectedRoute role="user">
                            <UserLayout />
                        </ProtectedRoute>
                    }
                >

                    <Route
                        index
                        element={<UserDashboard />}
                    />

                    <Route
                        path="tasks"
                        element={<MyTasks />}
                    />

                    <Route
                        path="calendar"
                        element={<TaskCalendar />}
                    />

                    <Route
                        path="completed"
                        element={<CompletedTasks />}
                    />

                    <Route
                        path="reports"
                        element={<UserReports />}
                    />

                    <Route
                        path="notifications"
                        element={<UserNotifications />}
                    />

                    <Route
                        path="support"
                        element={<Support />}
                    />

                    <Route
                        path="profile"
                        element={<Profile />}
                    />

                    <Route
                        path="settings"
                        element={<UserSettings />}
                    />

                </Route>

            </Routes>

        </BrowserRouter>

    );

}

export default App;
