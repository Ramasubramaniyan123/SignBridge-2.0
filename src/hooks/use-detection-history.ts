import { useState, useCallback } from "react";
import type { DetectionRecord } from "@/lib/gesture-data";

const STORAGE_KEY = "signbridge-history";

function loadHistory(): DetectionRecord[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored).map((r: any) => ({ ...r, timestamp: new Date(r.timestamp) }));
    }
  } catch {}
  return [];
}

export function useDetectionHistory() {
  const [history, setHistory] = useState<DetectionRecord[]>(loadHistory);

  const addRecord = useCallback((label: string, confidence: number) => {
    const record: DetectionRecord = {
      id: crypto.randomUUID(),
      label,
      confidence,
      timestamp: new Date(),
    };
    setHistory((prev) => {
      const updated = [record, ...prev].slice(0, 200);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { history, addRecord, clearHistory };
}
