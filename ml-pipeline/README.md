# Pipeline Execution Instructions

## 1. Setup Python Environment
Create a virtual environment and install the requirements:
```bash
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
```

## 2. Collect Dataset
Run the data collector to capture your hand gestures. Press your keyboard keys according to the prompts to capture 1000 frames for each gesture. Focus on moving your hand around (left, right, close, far) to allow the model to learn spatial invariance.
```bash
python dataset_collection.py
```

## 3. Train your CNN
Run the training script perfectly. It will normalize the landmark coordinates relative to the wrist so that distance from the camera doesn't cripple prediction accuracy. It will use a fast 1D Convolutional Neural Network perfect for real-time.
```bash
python train_cnn.py
```

## 4. Convert to TensorFlow.js
You must convert your output `.h5` model so that React can consume it without a backend!
```bash
tensorflowjs_converter --input_format=keras sign_model.h5 ./tfjs_model
```
Once converted, copy the entire `./tfjs_model` directory (which contains `model.json` and `.bin` weights files) directly into your React app's `public/` directory so the browser can serve it stably.

## Install React Dependencies
You need the following in your `signbridge-connect` folder:
```bash
npm install @tensorflow/tfjs @mediapipe/camera_utils @mediapipe/drawing_utils @mediapipe/hands
```
