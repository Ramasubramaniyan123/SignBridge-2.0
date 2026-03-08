import { useState, useEffect, useCallback } from "react";

interface Settings {
  speechEnabled: boolean;
  confidenceThreshold: number;
  detectionInterval: number;
}

const DEFAULT_SETTINGS: Settings = {
  speechEnabled: true,
  confidenceThreshold: 70,
  detectionInterval: 5000,
};

const STORAGE_KEY = "signbridge-settings";

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Remove deprecated darkMode key
        const { darkMode, ...rest } = parsed;
        // Force minimum detection interval for AI-based detection
        const merged = { ...DEFAULT_SETTINGS, ...rest };
        if (merged.detectionInterval < 5000) {
          merged.detectionInterval = 5000;
        }
        return merged;
      }
    } catch {}
    return DEFAULT_SETTINGS;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const updateSetting = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  return { settings, updateSetting };
}
