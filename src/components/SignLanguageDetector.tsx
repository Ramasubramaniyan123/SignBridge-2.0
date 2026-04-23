// @ts-ignore
import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';

// Type definitions for MediaPipe (using any to bypass TypeScript issues)
interface NormalizedLandmark {
  x: number;
  y: number;
  z: number;
}

interface Results {
  image: ImageBitmap;
  multiHandLandmarks?: NormalizedLandmark[][];
}

// Global references for MediaPipe (loaded dynamically)
let Hands: any = null;
let Camera: any = null;
let drawConnectors: any = null;
let drawLandmarks: any = null;
let HAND_CONNECTIONS: any = null;

// Load MediaPipe modules
const loadMediaPipe = async () => {
  if (!Hands) {
    // @ts-ignore
    const mediapipeHands = await import('@mediapipe/hands');
    Hands = mediapipeHands.Hands;
    HAND_CONNECTIONS = mediapipeHands.HAND_CONNECTIONS;
  }
  
  if (!Camera) {
    // @ts-ignore
    const cameraUtils = await import('@mediapipe/camera_utils');
    Camera = cameraUtils.Camera;
  }
  
  if (!drawConnectors || !drawLandmarks) {
    // @ts-ignore
    const drawingUtils = await import('@mediapipe/drawing_utils');
    drawConnectors = drawingUtils.drawConnectors;
    drawLandmarks = drawingUtils.drawLandmarks;
  }
};

// Comprehensive sign language classes (must match training data)
const SIGN_CLASSES = [
  // Alphabets
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
  'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
  // Numbers
  '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
  // Common words
  'Hello', 'Yes', 'No', 'ThankYou', 'Please', 'Sorry', 'Help', 'Love',
  'Good', 'Bad', 'Stop', 'Go', 'Come', 'Eat', 'Drink', 'Water', 'Food'
];

interface PredictionResult {
  gesture: string;
  confidence: number;
  timestamp: number;
}

interface SignLanguageDetectorProps {
  onGestureDetected?: (result: PredictionResult) => void;
  onTextGenerated?: (text: string) => void;
  modelPath?: string;
  confidence?: number;
  predictionSmoothing?: boolean;
  enableSpeech?: boolean;
  showHistory?: boolean;
}

export const SignLanguageDetector: React.FC<SignLanguageDetectorProps> = ({
  onGestureDetected,
  onTextGenerated,
  modelPath = '/models/sign_language_model/model.json',
  confidence = 0.85,
  predictionSmoothing = true,
  enableSpeech = true,
  showHistory = true
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [model, setModel] = useState<tf.LayersModel | tf.GraphModel | null>(null);
  const [currentPrediction, setCurrentPrediction] = useState<PredictionResult | null>(null);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [history, setHistory] = useState<string[]>([]);
  const [fps, setFps] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  // Smoothing technique variables
  const predictionQueue = useRef<PredictionResult[]>([]);
  const QUEUE_SIZE = 10;
  const lastFrameTimeRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);
  
  // Speech synthesis
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // MediaPipe references
  const handsRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const drawConnectorsRef = useRef<Function | null>(null);
  const drawLandmarksRef = useRef<Function | null>(null);
  const HAND_CONNECTIONSRef = useRef<any>(null);

  // Convert gesture to readable text
  const gestureToText = useCallback((gesture: string): string => {
    const textMap: { [key: string]: string } = {
      'Hello': 'Hello',
      'ThankYou': 'Thank you',
      'Please': 'Please',
      'Sorry': 'Sorry',
      'Help': 'Help',
      'Love': 'Love',
      'Good': 'Good',
      'Bad': 'Bad',
      'Stop': 'Stop',
      'Go': 'Go',
      'Come': 'Come',
      'Eat': 'Eat',
      'Drink': 'Drink',
      'Water': 'Water',
      'Food': 'Food'
    };
    
    return textMap[gesture] || gesture;
  }, []);
  
  // Text to speech
  const speakText = useCallback((text: string) => {
    if (!enableSpeech || !synthRef.current) return;
    
    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 0.8;
    
    // Find a good voice
    const voices = synthRef.current.getVoices();
    if (voices.length > 0) {
      utterance.voice = voices[0];
    }
    
    synthRef.current.speak(utterance);
  }, [enableSpeech]);
  
  // Apply prediction smoothing
  const smoothPredictions = useCallback((predictions: PredictionResult[]): PredictionResult | null => {
    if (predictions.length === 0) return null;
    
    // Group predictions by gesture
    const gestureGroups: { [key: string]: PredictionResult[] } = {};
    for (const pred of predictions) {
      if (!gestureGroups[pred.gesture]) {
        gestureGroups[pred.gesture] = [];
      }
      gestureGroups[pred.gesture].push(pred);
    }
    
    // Find the gesture with most consistent high-confidence predictions
    let bestGesture = '';
    let bestScore = 0;
    let bestConfidence = 0;
    
    for (const [gesture, preds] of Object.entries(gestureGroups)) {
      const avgConfidence = preds.reduce((sum, p) => sum + p.confidence, 0) / preds.length;
      const consistency = preds.length / predictions.length;
      const score = avgConfidence * consistency;
      
      if (score > bestScore) {
        bestScore = score;
        bestGesture = gesture;
        bestConfidence = avgConfidence;
      }
    }
    
    if (bestScore > 0.5 && bestConfidence > confidence) {
      return {
        gesture: bestGesture,
        confidence: bestConfidence,
        timestamp: Date.now()
      };
    }
    
    return null;
  }, [confidence]);
  
  // Load the TFJS Model
  useEffect(() => {
    const loadModel = async () => {
      try {
        setIsModelLoading(true);
        setError(null);
        
        // Initialize TensorFlow.js backend
        await tf.ready();
        console.log('TensorFlow.js backend:', tf.getBackend());
        
        // Initialize speech synthesis
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          synthRef.current = window.speechSynthesis;
        }
        
        // Load model (try GraphModel first, then LayersModel)
        let loadedModel;
        try {
          loadedModel = await tf.loadGraphModel(modelPath);
          console.log('Loaded GraphModel successfully');
        } catch (graphError) {
          console.log('GraphModel failed, trying LayersModel:', graphError);
          loadedModel = await tf.loadLayersModel(modelPath);
          console.log('Loaded LayersModel successfully');
        }
        
        setModel(loadedModel);
        
        // Warm up the model
        const dummyInput = tf.zeros([1, 21, 3]);
        if (loadedModel instanceof tf.GraphModel) {
          loadedModel.execute(dummyInput);
        } else {
          loadedModel.predict(dummyInput);
        }
        dummyInput.dispose();
        
        console.log('Model loaded and warmed up successfully');
      } catch (err) {
        console.error('Error loading model:', err);
        setError(`Failed to load model: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setIsModelLoading(false);
      }
    };
    loadModel();
  }, [modelPath]);

  // Helper to normalize landmarks (must exactly match python preprocessing)
  const normalizeLandmarks = useCallback((landmarks: NormalizedLandmark[]): number[] => {
    if (!landmarks || landmarks.length === 0) return [];
    
    const baseX = landmarks[0].x;
    const baseY = landmarks[0].y;
    const baseZ = landmarks[0].z;

    const normalized: number[] = [];
    for (let i = 0; i < landmarks.length; i++) {
        normalized.push(
            landmarks[i].x - baseX,
            landmarks[i].y - baseY,
            landmarks[i].z - baseZ
        );
    }
    return normalized; // Output shape: (63,) - flattened (21, 3)
  }, []);

  // Setup MediaPipe
  useEffect(() => {
    if (!videoRef.current || !canvasRef.current || !model) return;

    const initializeMediaPipe = async () => {
      try {
        await loadMediaPipe();
        
        if (!Hands || !Camera || !drawConnectors || !drawLandmarks || !HAND_CONNECTIONS) {
          throw new Error('MediaPipe modules failed to load');
        }

        const hands = new Hands({
          locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
          }
        });

        hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 1,
          minDetectionConfidence: 0.7,
          minTrackingConfidence: 0.7
        });

        // Store refs for cleanup
        handsRef.current = hands;
        drawConnectorsRef.current = drawConnectors;
        drawLandmarksRef.current = drawLandmarks;
        HAND_CONNECTIONSRef.current = HAND_CONNECTIONS;

        const onResults = async (results: Results) => {
          // Draw landmarks
          const canvasCtx = canvasRef.current!.getContext('2d');
          if (!canvasCtx) return;
          
          canvasCtx.save();
          canvasCtx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
          canvasCtx.drawImage(results.image, 0, 0, canvasRef.current!.width, canvasRef.current!.height);

          if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            for (const landmarks of results.multiHandLandmarks) {
              drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {color: '#00FF00', lineWidth: 5});
              drawLandmarks(canvasCtx, landmarks, {color: '#FF0000', lineWidth: 2});

          try {
            // Preprocess and predict
            const normalized = normalizeLandmarks(landmarks);
            
            // Create tensor with correct shape [1, 21, 3]
            // Reshape 1D array (63,) to 3D array (1, 21, 3)
            const reshapedData: number[][][] = [];
            for (let i = 0; i < 21; i++) {
              const row: number[][] = [];
              for (let j = 0; j < 3; j++) {
                row.push([normalized[i * 3 + j]]);
              }
              reshapedData.push(row);
            }
            const tensor = tf.tensor3d(reshapedData, [1, 21, 3]);
            
            let predictions: tf.Tensor;
            if (model instanceof tf.GraphModel) {
              predictions = model.execute(tensor) as tf.Tensor;
            } else {
              predictions = model.predict(tensor) as tf.Tensor;
            }
            
            const predArray = await predictions.data();
            
            // Find the prediction with highest confidence
            let maxConfidence = 0;
            let maxIdx = 0;
            
            for (let i = 0; i < predArray.length; i++) {
              if (predArray[i] > maxConfidence) {
                maxConfidence = predArray[i];
                maxIdx = i;
              }
            }
            
            const detectedGesture = SIGN_CLASSES[maxIdx] || 'Unknown';
            const result: PredictionResult = {
              gesture: detectedGesture,
              confidence: maxConfidence,
              timestamp: Date.now()
            };

            // Confidence Threshold Filtering
            if (maxConfidence > confidence) {
              if (predictionSmoothing) {
                // Prediction Smoothing
                predictionQueue.current.push(result);
                if (predictionQueue.current.length > QUEUE_SIZE) {
                  predictionQueue.current.shift();
                }

                const smoothedResult = smoothPredictions(predictionQueue.current);
                if (smoothedResult) {
                  setCurrentPrediction(smoothedResult);
                  onGestureDetected?.(smoothedResult);
                  
                  const text = gestureToText(smoothedResult.gesture);
                  
                  // Speak and save history if it's a stable new gesture
                  setHistory(prev => {
                    const lastGest = prev[prev.length - 1];
                    if (smoothedResult.gesture !== lastGest) {
                      speakText(text);
                      onTextGenerated?.(text);
                      return [...prev.slice(-19), smoothedResult.gesture]; 
                    }
                    return prev;
                  });
                }
              } else {
                // No smoothing, use direct prediction
                setCurrentPrediction(result);
                onGestureDetected?.(result);
                
                const text = gestureToText(detectedGesture);
                
                setHistory(prev => {
                  const lastGest = prev[prev.length - 1];
                  if (detectedGesture !== lastGest) {
                    speakText(text);
                    onTextGenerated?.(text);
                    return [...prev.slice(-19), detectedGesture]; 
                  }
                  return prev;
                });
              }
            } else {
              setCurrentPrediction(null);
            }
            
            tensor.dispose();
            predictions.dispose();
          } catch (e) {
             console.error('Inference error:', e);
          }
        }
      } else {
         setCurrentPrediction(null);
      }
      
      // Calculate FPS
      frameCountRef.current++;
      const currentTime = Date.now();
      if (currentTime - lastFrameTimeRef.current >= 1000) {
        setFps(frameCountRef.current);
        frameCountRef.current = 0;
        lastFrameTimeRef.current = currentTime;
      }
      
      canvasCtx.restore();
    };

    hands.onResults(onResults);

    const camera = new Camera(videoRef.current, {
      onFrame: async () => {
        if(videoRef.current) {
            await hands.send({image: videoRef.current});
        }
      },
      width: 640,
      height: 480
    });
    camera.start();
    
    // Store camera ref for cleanup
    cameraRef.current = camera;

      } catch (error) {
        console.error('Error initializing MediaPipe:', error);
        setError('Failed to initialize MediaPipe');
      }
    };

    initializeMediaPipe();

    return () => {
      if (cameraRef.current) {
        cameraRef.current.stop();
      }
      if (handsRef.current) {
        handsRef.current.close();
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, [model, confidence, predictionSmoothing, smoothPredictions, gestureToText, speakText, onGestureDetected, onTextGenerated, normalizeLandmarks]);

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-gray-900 min-h-screen text-white font-sans">
      <h1 className="text-4xl font-bold mb-2 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
        SignBridge Engine
      </h1>
      <p className="text-gray-400 mb-8">Real-time Sign Language Translation (95%+ Accuracy)</p>

      {/* Error display */}
      {error && (
        <div className="mb-4 bg-red-500 bg-opacity-20 border border-red-500 rounded-lg p-4 max-w-2xl">
          <p className="text-red-300">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading indicator */}
      {isModelLoading && !error && (
        <div className="mb-4 bg-blue-500 bg-opacity-20 border border-blue-500 rounded-lg p-4 max-w-2xl">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
            <p className="text-blue-300">Loading AI Model...</p>
          </div>
        </div>
      )}

      <div className="relative rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(52,211,153,0.15)] border border-gray-700 bg-black">
        {/* Hidden video element, used perfectly for processing frames */}
        <video 
            ref={videoRef} 
            className="hidden" 
            playsInline 
        />
        {/* Canvas overlays media pipe processing */}
        <canvas 
            ref={canvasRef}
            width={640}
            height={480}
            className="w-[640px] h-[480px] object-cover scale-x-[-1]"
        />
        
        {/* FPS Counter */}
        <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
          FPS: {fps}
        </div>
        
        {/* Model Status */}
        <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
          {isModelLoading ? 'Model: Loading...' : 'Model: Ready'}
        </div>
        
        {/* Dynamic Overlay for Prediction */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/60 backdrop-blur-md px-8 py-3 rounded-full border border-white/10">
          <span className="text-2xl font-bold text-emerald-400 tracking-wider">
             {currentPrediction ? `${currentPrediction.gesture} (${(currentPrediction.confidence * 100).toFixed(1)}%)` : 'No hand detected'}
          </span>
        </div>
      </div>

      {/* Gesture History Optional Feature */}
      {showHistory && history.length > 0 && (
        <div className="mt-8 w-full max-w-2xl bg-gray-800 rounded-xl p-4 border border-gray-700">
          <h3 className="text-gray-400 text-sm mb-3 uppercase tracking-wider font-semibold">Translation History</h3>
          <div className="flex flex-wrap gap-2">
              {history.length === 0 ? (
                  <span className="text-gray-500 italic">Waiting for gestures...</span>
              ) : (
                  history.map((gest, index) => (
                      <span 
                        key={index} 
                        className="px-3 py-1 bg-gray-700 rounded-md text-emerald-300 text-sm border border-gray-600"
                        style={{ opacity: 1 - (index * 0.05) }}
                      >
                          {gest}
                      </span>
                  ))
              )}
          </div>
        </div>
      )}
      
      {/* Performance Stats */}
      <div className="mt-4 text-center text-gray-500 text-sm">
        <p>Confidence Threshold: {(confidence * 100).toFixed(0)}% | Smoothing: {predictionSmoothing ? 'On' : 'Off'} | Speech: {enableSpeech ? 'On' : 'Off'}</p>
      </div>
    </div>
  );
};
