import { useRef, useState, useCallback, useEffect } from "react";
import { GESTURE_LABELS } from "@/lib/gesture-data";

export interface DetectionResult {
  label: string;
  confidence: number;
  landmarks: number[][] | null;
}

/**
 * Gesture detector that uses the webcam.
 * Currently uses simulated detection only when a hand-like motion is
 * detected via frame differencing (no random spam).
 * In production, replace with MediaPipe Hands + TensorFlow.js.
 */
export function useGestureDetector() {
  const [isDetecting, setIsDetecting] = useState(false);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [waitingForHand, setWaitingForHand] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<number | null>(null);
  const prevFrameRef = useRef<ImageData | null>(null);
  const stableCountRef = useRef(0);
  const lastLabelRef = useRef<string | null>(null);

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
    setWaitingForHand(false);
    prevFrameRef.current = null;
    stableCountRef.current = 0;
    lastLabelRef.current = null;
  }, []);

  /**
   * Detect motion by comparing current frame to previous frame.
   * Returns a value 0-1 representing how much of the frame changed.
   */
  const detectMotion = useCallback((): number => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return 0;

    // Create an offscreen canvas for frame analysis
    const canvas = document.createElement("canvas");
    const w = 160; // downscale for performance
    const h = 120;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return 0;

    ctx.drawImage(video, 0, 0, w, h);
    const currentFrame = ctx.getImageData(0, 0, w, h);

    if (!prevFrameRef.current) {
      prevFrameRef.current = currentFrame;
      return 0;
    }

    const prev = prevFrameRef.current.data;
    const curr = currentFrame.data;
    let changedPixels = 0;
    const totalPixels = w * h;
    const threshold = 30; // per-channel difference threshold

    for (let i = 0; i < curr.length; i += 4) {
      const dr = Math.abs(curr[i] - prev[i]);
      const dg = Math.abs(curr[i + 1] - prev[i + 1]);
      const db = Math.abs(curr[i + 2] - prev[i + 2]);
      if (dr + dg + db > threshold * 3) {
        changedPixels++;
      }
    }

    prevFrameRef.current = currentFrame;
    return changedPixels / totalPixels;
  }, []);

  /**
   * Only "detect" a gesture when there is significant motion in the frame,
   * simulating waiting for a user to show a hand gesture.
   * Requires the motion to be stable (present for multiple frames) before
   * committing to a detection.
   */
  const analyzeFrame = useCallback(() => {
    const motionLevel = detectMotion();

    // Need at least 5% of pixels changing to consider it a hand
    if (motionLevel < 0.05) {
      stableCountRef.current = 0;
      lastLabelRef.current = null;
      setResult(null);
      setWaitingForHand(true);
      return;
    }

    setWaitingForHand(false);

    // Pick a label and require it to be "stable" for 3 consecutive frames
    if (!lastLabelRef.current) {
      lastLabelRef.current =
        GESTURE_LABELS[Math.floor(Math.random() * GESTURE_LABELS.length)];
      stableCountRef.current = 1;
      return;
    }

    stableCountRef.current++;

    // Only emit a result after 3 stable frames (~1.5s at 500ms interval)
    if (stableCountRef.current >= 3) {
      const confidence = Math.round(75 + Math.random() * 23);
      const landmarks = Array.from({ length: 21 }, () => [
        Math.random() * 0.4 + 0.3,
        Math.random() * 0.4 + 0.3,
        Math.random() * 0.1,
      ]);
      setResult({
        label: lastLabelRef.current,
        confidence,
        landmarks,
      });
      // Reset so next detection needs fresh motion
      stableCountRef.current = 0;
      lastLabelRef.current = null;
    }
  }, [detectMotion]);

  const startDetection = useCallback(
    (intervalMs = 500) => {
      if (intervalRef.current) return;
      setIsDetecting(true);
      setWaitingForHand(true);
      prevFrameRef.current = null;
      stableCountRef.current = 0;
      lastLabelRef.current = null;
      intervalRef.current = window.setInterval(analyzeFrame, intervalMs);
    },
    [analyzeFrame]
  );

  const stopDetection = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsDetecting(false);
    setResult(null);
    setWaitingForHand(false);
    prevFrameRef.current = null;
    stableCountRef.current = 0;
    lastLabelRef.current = null;
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
    waitingForHand,
    result,
    startCamera,
    stopCamera,
    startDetection,
    stopDetection,
  };
}
