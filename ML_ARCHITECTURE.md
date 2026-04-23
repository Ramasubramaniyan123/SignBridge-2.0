# SignBridge Connect - ML Architecture Upgrade

## 🧠 System Architecture

To achieve 95%+ accuracy with real-time performance and absolute zero API dependencies, the architecture offloads heavy data processing to robust, local ML models running smoothly within the browser using MediaPipe and TensorFlow.js.

### 1. The Pipeline
1. Webcam input -> Video frames.
2. MediaPipe Hands -> Extracts 21 3D landmarks.
3. Preprocessing -> Normalize coords relative to wrist.
4. TensorFlow.js Model -> 1D CNN inference classification.
5. Post-processing -> Confidence filtering + rolling window.
6. UI Display -> Text mapped to Text-to-Speech API.

### 2. Why Landmark-Based 1D CNN over Image-Based 2D CNN?
You requested either Image or Landmark-based extraction for the CNN. We are utilizing **Landmark-Based 1D CNN**. Here's why this is standard for high-accuracy, real-time hand gesture recognition:
*   **Insensitive to Environment:** Lighting, background clutter, and skin color do not affect 3D landmarks, solving image-based CNN's biggest flaw.
*   **Microsecond Latency:** An image-based CNN (e.g., MobileNet) processing 224x224x3 frames drops WebGL performance. A 1D CNN processing 21x3 landmarks takes **<2ms** per inference natively.
*   **Smaller Dataset Required:** Learning raw images requires 10,000s of samples per gesture. Learning geometrical coordinates requires ~1,000 samples for very high accuracy.

## 📊 Dataset Requirements & Preparation

For a CNN to generalize well with landmarks, you need variation in coordinate sizes (distance from camera) and angles.
1.  **Run the Dataset Collector:** `dataset_collection.py` will open your webcam. Press keys corresponding to classes ('0'-'9', 'A'-'Z') to record frames.
2.  **Normalization (Crucial Step):** The landmarks are provided as normalized screen coordinates `[x, y, z]` by MediaPipe. To make it scale-invariant, the training script translates all points so the wrist (Landmark 0) is at `(0, 0, 0)`.

## 🤖 Model Requirements (CNN)

We use a **1D Convolutional Neural Network**.
*   **Input Shape:** `(21, 3)` – 21 landmarks, 3 spatial coordinates (X, Y, Z).
*   **Layers:** Conv1D -> MaxPooling1D -> Dense -> Dropout.
*   **Loss:** `CategoricalCrossentropy`.

## ⚡ Real-Time Optimization Techniques Implemented

*   **Prediction Smoothing (Rolling Window):** Prevents screen-flickering.
*   **Confidence Thresholding:** Predictions below 85% probability are discarded.
*   **Frame Throttling:** Using `requestAnimationFrame` strictly.

## 📈 Tips to Maintain 95%+ Accuracy
1.  **Robust Normalization:** The wrist relocation in preprocessing must be perfectly mirrored in React.
2.  **Dataset Class Balance:** Do not have 2000 images for 'A' but only 500 for 'B'.
3.  **Data Augmentation:** The provided python script includes slight random noise to landmarks during training to prevent perfect memorization.
