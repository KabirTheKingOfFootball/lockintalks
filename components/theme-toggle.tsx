"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";

type ThemeMode = "light" | "dark";

const storageKey = "lockintalks-theme";

function getCurrentTheme(): ThemeMode {
  if (typeof document === "undefined") return "light";
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function applyTheme(theme: ThemeMode) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

function subscribeToTheme(callback: () => void) {
  if (typeof window === "undefined") return () => {};

  window.addEventListener("storage", callback);
  window.addEventListener("lockintalks-theme-changed", callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("lockintalks-theme-changed", callback);
  };
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribeToTheme, getCurrentTheme, () => "light");

  function toggleTheme() {
    const nextTheme = getCurrentTheme() === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
    localStorage.setItem(storageKey, nextTheme);
    window.dispatchEvent(new Event("lockintalks-theme-changed"));
  }

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      className="theme-toggle focus-ring"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={isDark}
      onClick={toggleTheme}
    >
      <Sun className="theme-toggle-sun" size={17} />
      <Moon className="theme-toggle-moon" size={17} />
      <span className="theme-toggle-knob" />
    </button>
  );
}
