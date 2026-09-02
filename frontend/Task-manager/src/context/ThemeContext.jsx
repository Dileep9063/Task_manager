import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    // 1. Respect a saved choice
    const saved = localStorage.getItem("admin-theme");
    if (saved === "light" || saved === "dark") return saved;

    // 2. Otherwise fall back to the OS preference
    const prefersDark = window.matchMedia?.(
      "(prefers-color-scheme: dark)"
    ).matches;
    return prefersDark ? "dark" : "light";
  });

 useEffect(() => {
    localStorage.setItem("admin-theme", theme);
    document.documentElement.setAttribute("data-theme", theme);
    console.log("Theme effect ran →", theme, "| html now has:", document.documentElement.getAttribute("data-theme"));
}, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside a ThemeProvider");
  return ctx;
}
