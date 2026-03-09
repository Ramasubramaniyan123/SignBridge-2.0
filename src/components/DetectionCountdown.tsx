import { useEffect, useState } from "react";
import { Timer } from "lucide-react";
import { motion } from "framer-motion";

interface DetectionCountdownProps {
  intervalMs: number;
  isDetecting: boolean;
}

export function DetectionCountdown({ intervalMs, isDetecting }: DetectionCountdownProps) {
  const [remaining, setRemaining] = useState(intervalMs);

  useEffect(() => {
    if (!isDetecting) {
      setRemaining(intervalMs);
      return;
    }

    // Reset on each new interval cycle
    setRemaining(intervalMs);
    const tick = 100;
    const timer = setInterval(() => {
      setRemaining((prev) => {
        const next = prev - tick;
        if (next <= 0) return intervalMs; // loop back
        return next;
      });
    }, tick);

    return () => clearInterval(timer);
  }, [isDetecting, intervalMs]);

  if (!isDetecting) return null;

  const seconds = Math.ceil(remaining / 1000);
  const progress = ((intervalMs - remaining) / intervalMs) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center gap-2 bg-card/80 backdrop-blur px-3 py-1.5 rounded-lg"
    >
      <Timer className="h-3.5 w-3.5 text-primary" />
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-foreground tabular-nums">
          Next scan: {seconds}s
        </span>
        <div className="w-16 h-1.5 rounded-full bg-secondary overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            style={{ width: `${progress}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>
      </div>
    </motion.div>
  );
}
