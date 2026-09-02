// Central place for the backend API base URL.
//
// In development, this defaults to http://localhost:5000 (same as before).
// For a real deployment, set VITE_API_BASE_URL in a .env file (or your
// hosting platform's environment variables) to point at your deployed
// backend, e.g. VITE_API_BASE_URL=https://api.yourdomain.com
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
