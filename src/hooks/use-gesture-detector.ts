import { useRef, useState, useCallback, useEffect } from "react";
import { GESTURE_LABELS } from "@/lib/gesture-data";

export interface DetectionResult {
  label: string;
  confidence: number;
  landmarks: number[][] | null;
}

/**
 * Simulated gesture detector.
 * In production, this would use MediaPipe Hands + a TensorFlow.js model.
 * Currently simulates detection for demo purposes.
 */
export function useGestureDetector() {
  const [isDetecting, setIsDetecting] = useState(false);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<number | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraReady(true);
      }
    } catch (err) {
      console.error("Camera access denied:", err);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraReady(false);
    setResult(null);
  }, []);

  const simulateDetection = useCallback(() => {
    // Simulate random gesture detection with varying confidence
    const shouldDetect = Math.random() > 0.3;
    if (shouldDetect) {
      const label = GESTURE_LABELS[Math.floor(Math.random() * GESTURE_LABELS.length)];
      const confidence = Math.round(70 + Math.random() * 28);
      // Generate simulated landmarks (21 points with x,y,z)
      const landmarks = Array.from({ length: 21 }, () => [
        Math.random() * 0.4 + 0.3,
        Math.random() * 0.4 + 0.3,
        Math.random() * 0.1,
      ]);
      setResult({ label, confidence, landmarks });
    } else {
      setResult(null);
    }
  }, []);

  const startDetection = useCallback(
    (intervalMs = 500) => {
      if (intervalRef.current) return;
      setIsDetecting(true);
      intervalRef.current = window.setInterval(simulateDetection, intervalMs);
    },
    [simulateDetection]
  );

  const stopDetection = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsDetecting(false);
    setResult(null);
  }, []);

  useEffect(() => {
    return () => {
      stopDetection();
      stopCamera();
    };
  }, [stopDetection, stopCamera]);

  return {
    videoRef,
    canvasRef,
    isDetecting,
    cameraReady,
    result,
    startCamera,
    stopCamera,
    startDetection,
    stopDetection,
  };
}
