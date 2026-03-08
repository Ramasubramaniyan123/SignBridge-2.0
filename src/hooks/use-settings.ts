import { useState, useEffect, useCallback } from "react";

interface Settings {
  speechEnabled: boolean;
  darkMode: boolean;
  confidenceThreshold: number;
  detectionInterval: number;
}

const DEFAULT_SETTINGS: Settings = {
  speechEnabled: true,
  darkMode: false,
  confidenceThreshold: 70,
  detectionInterval: 500,
};

const STORAGE_KEY = "signbridge-settings";

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    } catch {}
    return DEFAULT_SETTINGS;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [settings.darkMode]);

  const updateSetting = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  return { settings, updateSetting };
}
