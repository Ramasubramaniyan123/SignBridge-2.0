#!/bin/bash
echo "Converting Keras Model (.h5) to TensorFlow.js Model..."
tensorflowjs_converter --input_format=keras sign_model.h5 ./tfjs_model
echo "Conversion complete. Copy the 'tfjs_model' directory into your React 'public/' folder."
