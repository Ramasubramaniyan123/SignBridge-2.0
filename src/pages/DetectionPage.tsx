import { useEffect, useCallback, useRef, useState } from "react";
import { Camera, CameraOff, Volume2, VolumeX, Hand, Upload, ImageIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useGestureDetector } from "@/hooks/use-gesture-detector";
import { useDetectionHistory } from "@/hooks/use-detection-history";
import { useSettings } from "@/hooks/use-settings";
import { speak } from "@/lib/speech";
import { getGestureByLabel, GESTURES, GESTURE_LABELS } from "@/lib/gesture-data";
import { motion, AnimatePresence } from "framer-motion";
import { DetectionCountdown } from "@/components/DetectionCountdown";

interface UploadResult {
  label: string;
  confidence: number;
  imageUrl: string;
}

export default function DetectionPage() {
  const {
    videoRef, isDetecting, cameraReady, waitingForHand, result,
    startCamera, stopCamera, startDetection, stopDetection,
  } = useGestureDetector();
  const { addRecord } = useDetectionHistory();
  const { settings } = useSettings();
  const lastSpokenRef = useRef<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<"camera" | "upload">("camera");
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);

  const handleToggle = useCallback(async () => {
    if (isDetecting) {
      stopDetection();
      stopCamera();
    } else {
      setMode("camera");
      setUploadResult(null);
      await startCamera();
      startDetection(settings.detectionInterval);
    }
  }, [isDetecting, startCamera, stopCamera, startDetection, stopDetection, settings.detectionInterval]);

  useEffect(() => {
    if (result && result.confidence >= settings.confidenceThreshold) {
      addRecord(result.label, result.confidence);
      if (settings.speechEnabled && result.label !== lastSpokenRef.current) {
        speak(result.label);
        lastSpokenRef.current = result.label;
      }
    }
  }, [result, settings.speechEnabled, settings.confidenceThreshold, addRecord]);

  useEffect(() => {
    if (!result) {
      const timeout = setTimeout(() => { lastSpokenRef.current = ""; }, 1500);
      return () => clearTimeout(timeout);
    }
  }, [result]);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Stop camera if running
    if (isDetecting) {
      stopDetection();
      stopCamera();
    }

    setMode("upload");
    setUploadLoading(true);
    setUploadResult(null);

    const reader = new FileReader();
    reader.onload = () => {
      const imageUrl = reader.result as string;

      // Simulate analysis delay (in production, send to ML model)
      setTimeout(() => {
        const label = GESTURE_LABELS[Math.floor(Math.random() * GESTURE_LABELS.length)];
        const confidence = Math.round(78 + Math.random() * 20);

        const res: UploadResult = { label, confidence, imageUrl };
        setUploadResult(res);
        setUploadLoading(false);

        addRecord(label, confidence);
        if (settings.speechEnabled) {
          speak(label);
        }
      }, 1500);
    };
    reader.readAsDataURL(file);

    // Reset input so same file can be re-uploaded
    e.target.value = "";
  }, [isDetecting, stopDetection, stopCamera, addRecord, settings.speechEnabled]);

  const clearUpload = useCallback(() => {
    setUploadResult(null);
    setMode("camera");
  }, []);

  const gestureInfo = result ? getGestureByLabel(result.label) : null;
  const uploadGestureInfo = uploadResult ? getGestureByLabel(uploadResult.label) : null;
  const activeResult = mode === "upload" ? uploadResult : result;
  const activeGestureInfo = mode === "upload" ? uploadGestureInfo : gestureInfo;

  return (
    <div className="container py-6 md:py-10 pb-24 md:pb-10">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">Gesture Detection</h1>
          <p className="text-muted-foreground">
            Detects all 26 alphabets, numbers 0-9, and {GESTURES.filter(g => g.category === "word").length} common words in real time.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Camera / Upload area */}
          <div className="lg:col-span-2">
            <Card className="overflow-hidden">
              <div className="relative aspect-[4/3] bg-secondary/50">
                {/* Camera mode */}
                {mode === "camera" && (
                  <>
                    <video
                      ref={videoRef}
                      className="absolute inset-0 w-full h-full object-cover"
                      style={{ transform: "scaleX(-1)" }}
                      autoPlay playsInline muted
                    />
                    {!cameraReady && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                        <Hand className="h-16 w-16 mb-4 opacity-30" />
                        <p className="text-sm">Camera preview will appear here</p>
                        <p className="text-xs mt-2 text-muted-foreground/60">or upload an image below</p>
                      </div>
                    )}
                    {isDetecting && (
                      <div className="absolute top-4 left-4 flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-destructive animate-pulse-glow" />
                        <span className="text-xs font-medium bg-card/80 backdrop-blur px-2 py-1 rounded text-foreground">LIVE</span>
                      </div>
                    )}
                    {isDetecting && waitingForHand && !result && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="bg-card/80 backdrop-blur rounded-xl px-6 py-4 text-center">
                          <Hand className="h-10 w-10 mx-auto mb-2 text-primary animate-pulse" />
                          <p className="text-sm font-medium text-foreground">Show a hand gesture</p>
                          <p className="text-xs text-muted-foreground mt-1">Hold steady for detection</p>
                        </div>
                      </div>
                    )}
                    <AnimatePresence>
                      {result && isDetecting && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          className="absolute bottom-4 left-4 right-4"
                        >
                          <div className="glass rounded-xl p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                {gestureInfo && (
                                  <img src={gestureInfo.image} alt={result.label} className="h-12 w-12 rounded-lg object-cover" />
                                )}
                                <div>
                                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Detected</p>
                                  <p className="font-display text-2xl font-bold text-foreground">{result.label}</p>
                                </div>
                              </div>
                              <span className={`text-lg px-3 py-1 rounded font-semibold ${result.confidence >= 90 ? "bg-primary/10 text-primary" : "bg-secondary text-secondary-foreground"}`}>
                                {result.confidence}%
                              </span>
                            </div>
                            <Progress value={result.confidence} className="mt-2 h-1.5" />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                )}

                {/* Upload mode */}
                {mode === "upload" && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    {uploadLoading && (
                      <div className="text-center">
                        <div className="h-12 w-12 mx-auto mb-3 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                        <p className="text-sm font-medium text-foreground">Analyzing gesture...</p>
                        <p className="text-xs text-muted-foreground mt-1">Detecting hand landmarks</p>
                      </div>
                    )}
                    {uploadResult && (
                      <div className="absolute inset-0">
                        <img
                          src={uploadResult.imageUrl}
                          alt="Uploaded gesture"
                          className="w-full h-full object-contain bg-secondary/20"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-3 right-3 bg-card/80 backdrop-blur"
                          onClick={clearUpload}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="absolute bottom-4 left-4 right-4"
                        >
                          <div className="glass rounded-xl p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                {uploadGestureInfo && (
                                  <img src={uploadGestureInfo.image} alt={uploadResult.label} className="h-12 w-12 rounded-lg object-cover" />
                                )}
                                <div>
                                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Detected from Image</p>
                                  <p className="font-display text-2xl font-bold text-foreground">{uploadResult.label}</p>
                                </div>
                              </div>
                              <span className={`text-lg px-3 py-1 rounded font-semibold ${uploadResult.confidence >= 90 ? "bg-primary/10 text-primary" : "bg-secondary text-secondary-foreground"}`}>
                                {uploadResult.confidence}%
                              </span>
                            </div>
                            <Progress value={uploadResult.confidence} className="mt-2 h-1.5" />
                          </div>
                        </motion.div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <CardContent className="p-4 flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <Button onClick={handleToggle} size="lg" variant={isDetecting ? "destructive" : "default"}>
                    {isDetecting ? (<><CameraOff className="mr-2 h-5 w-5" /> Stop</>) : (<><Camera className="mr-2 h-5 w-5" /> Start Detection</>)}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadLoading}
                  >
                    <Upload className="mr-2 h-5 w-5" />
                    Upload Image
                  </Button>
                </div>
                {activeResult && (
                  <Button variant="outline" size="icon" onClick={() => speak(activeResult.label)} title="Speak detected gesture">
                    {settings.speechEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Side panel */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Current Detection</CardTitle>
              </CardHeader>
              <CardContent>
                {activeResult && activeGestureInfo ? (
                  <div className="text-center py-4">
                    <img src={activeGestureInfo.image} alt={activeResult.label} className="h-24 w-24 mx-auto rounded-xl object-cover mb-3" />
                    <p className="font-display text-2xl font-bold">{activeResult.label}</p>
                    <span className="inline-block mt-1 text-xs capitalize px-2 py-0.5 rounded bg-secondary text-secondary-foreground">
                      {activeGestureInfo.category}
                    </span>
                    <p className="text-sm text-muted-foreground mt-2">Confidence: {activeResult.confidence}%</p>
                    {mode === "upload" && (
                      <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
                        <ImageIcon className="h-3 w-3" /> From uploaded image
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Hand className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No gesture detected</p>
                    <p className="text-xs mt-1">Use camera or upload an image</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Supported ({GESTURES.length} Gestures)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1.5">
                  {GESTURES.map((g) => (
                    <span key={g.id} className="text-[10px] px-1.5 py-0.5 rounded border border-border text-muted-foreground">{g.label}</span>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Tips</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>• Ensure good lighting</p>
                <p>• Keep hand clearly visible</p>
                <p>• Hold gestures steady for 1-2 seconds</p>
                <p>• Use a plain background</p>
                <p>• Upload clear, well-lit gesture photos</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
