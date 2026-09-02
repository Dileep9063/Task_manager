import React from "react";
import ReactDOM from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";
import App from "./App";
import { ThemeProvider } from "./context/ThemeContext";
import "./theme.css";

document.title = "Task-Manager";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider>
      <GoogleOAuthProvider clientId="939148480834-di11m5b8m8j9kpegejudlm5f875iu4rr.apps.googleusercontent.com">
        <App />
      </GoogleOAuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);
