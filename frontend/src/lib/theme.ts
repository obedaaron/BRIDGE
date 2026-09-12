import { useEffect, useState } from "react";

export type BridgeTheme = "dark" | "light";

const storageKey = "bridge-theme";

function initialTheme(): BridgeTheme {
  try {
    return window.localStorage.getItem(storageKey) === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

export function useBridgeTheme() {
  const [theme, setTheme] = useState<BridgeTheme>(initialTheme);

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, theme);
    } catch {
      // The interface remains usable when storage is unavailable.
    }
  }, [theme]);

  return { theme, setTheme, toggleTheme: () => setTheme((current) => current === "dark" ? "light" : "dark") };
}