import { useEffect, useCallback, useRef } from "react";
import { Camera, CameraOff, Volume2, VolumeX, Hand } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useGestureDetector } from "@/hooks/use-gesture-detector";
import { useDetectionHistory } from "@/hooks/use-detection-history";
import { useSettings } from "@/hooks/use-settings";
import { speak } from "@/lib/speech";
import { getGestureByLabel, GESTURES } from "@/lib/gesture-data";
import { motion, AnimatePresence } from "framer-motion";

export default function DetectionPage() {
  const {
    videoRef, isDetecting, cameraReady, result,
    startCamera, stopCamera, startDetection, stopDetection,
  } = useGestureDetector();
  const { addRecord } = useDetectionHistory();
  const { settings } = useSettings();
  const lastSpokenRef = useRef<string>("");

  const handleToggle = useCallback(async () => {
    if (isDetecting) {
      stopDetection();
      stopCamera();
    } else {
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

  const gestureInfo = result ? getGestureByLabel(result.label) : null;

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
          {/* Camera feed */}
          <div className="lg:col-span-2">
            <Card className="overflow-hidden">
              <div className="relative aspect-[4/3] bg-secondary/50">
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
                  </div>
                )}
                {isDetecting && (
                  <div className="absolute top-4 left-4 flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-destructive animate-pulse-glow" />
                    <span className="text-xs font-medium bg-card/80 backdrop-blur px-2 py-1 rounded text-foreground">LIVE</span>
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
                          <Badge variant={result.confidence >= 90 ? "default" : "secondary"} className="text-lg px-3 py-1">
                            {result.confidence}%
                          </Badge>
                        </div>
                        <Progress value={result.confidence} className="mt-2 h-1.5" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <CardContent className="p-4 flex items-center justify-between">
                <Button onClick={handleToggle} size="lg" variant={isDetecting ? "destructive" : "default"}>
                  {isDetecting ? (<><CameraOff className="mr-2 h-5 w-5" /> Stop</>) : (<><Camera className="mr-2 h-5 w-5" /> Start Detection</>)}
                </Button>
                {result && (
                  <Button variant="outline" size="icon" onClick={() => speak(result.label)} title="Speak detected gesture">
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
                {result && gestureInfo ? (
                  <div className="text-center py-4">
                    <img src={gestureInfo.image} alt={result.label} className="h-24 w-24 mx-auto rounded-xl object-cover mb-3" />
                    <p className="font-display text-2xl font-bold">{result.label}</p>
                    <Badge variant="secondary" className="mt-1 text-xs capitalize">{gestureInfo.category}</Badge>
                    <p className="text-sm text-muted-foreground mt-2">Confidence: {result.confidence}%</p>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Hand className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No gesture detected</p>
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
                    <Badge key={g.id} variant="outline" className="text-[10px]">{g.label}</Badge>
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
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
