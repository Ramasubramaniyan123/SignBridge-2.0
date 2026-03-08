import { useRef, useState, useCallback, useEffect } from "react";
import { toast } from "@/hooks/use-toast";

export interface DetectionResult {
  label: string;
  confidence: number;
  landmarks: number[][] | null;
  reasoning?: string;
}

const DETECT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/detect-gesture`;

/**
 * Gesture detector that captures webcam frames and sends them
 * to the Lovable AI backend for Indian Sign Language recognition.
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
  const busyRef = useRef(false);
  const backoffRef = useRef(0);
  const pausedUntilRef = useRef(0);

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
  }, []);

  /** Capture the current video frame as a base64 data URL */
  const captureFrame = useCallback((): string | null => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return null;

    const canvas = document.createElement("canvas");
    canvas.width = 320; // smaller for faster upload
    canvas.height = 240;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0, 320, 240);
    return canvas.toDataURL("image/jpeg", 0.7);
  }, []);

  /** Send a frame to the AI backend for gesture detection */
  const analyzeFrame = useCallback(async () => {
    if (busyRef.current) return;

    if (Date.now() < pausedUntilRef.current) {
      return;
    }

    // Skip cycles if backing off from rate limit
    if (backoffRef.current > 0) {
      backoffRef.current--;
      return;
    }

    busyRef.current = true;

    try {
      const image = captureFrame();
      if (!image) {
        setWaitingForHand(true);
        busyRef.current = false;
        return;
      }

      const resp = await fetch(DETECT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ image }),
      });

      if (!resp.ok) {
        if (resp.status === 429) {
          backoffRef.current = Math.min((backoffRef.current || 1) * 2, 5);
          console.warn(`Rate limited. Backing off ${backoffRef.current} cycles.`);
          toast({
            title: "Detection paused briefly",
            description: "Rate limit reached. Will resume automatically in a few seconds.",
            variant: "destructive",
          });
        } else if (resp.status === 402) {
          toast({
            title: "AI credits exhausted",
            description: "Please add credits in your workspace settings to continue.",
            variant: "destructive",
          });
        }
        console.error("Detection API error:", resp.status);
        busyRef.current = false;
        return;
      }

      // Reset backoff on success
      backoffRef.current = 0;

      const data = await resp.json();

      if (!data.label || data.label === "none" || data.confidence < 30) {
        setResult(null);
        setWaitingForHand(true);
      } else {
        setResult({
          label: data.label,
          confidence: data.confidence,
          landmarks: null,
          reasoning: data.reasoning,
        });
        setWaitingForHand(false);
      }
    } catch (err) {
      console.error("Detection error:", err);
    } finally {
      busyRef.current = false;
    }
  }, [captureFrame]);

  const startDetection = useCallback(
    (intervalMs = 5000) => {
      if (intervalRef.current) return;
      setIsDetecting(true);
      setWaitingForHand(true);
      busyRef.current = false;
      backoffRef.current = 0;
      // Minimum 5s between AI API calls to avoid rate limits
      const effectiveInterval = Math.max(intervalMs, 5000);
      intervalRef.current = window.setInterval(analyzeFrame, effectiveInterval);
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
    busyRef.current = false;
    backoffRef.current = 0;
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
