#!/bin/bash

# SignBridge Connect - Model Conversion Script
# Converts trained Keras H5 model to TensorFlow.js format for web deployment

set -e  # Exit on any error

# Configuration
MODEL_NAME="sign_language_model"
H5_MODEL_PATH="${MODEL_NAME}.h5"
TFJS_MODEL_PATH="tfjs_model"
PUBLIC_PATH="../public/models"

echo "=== SignBridge Model Conversion ==="
echo "Converting ${H5_MODEL_PATH} to TensorFlow.js format..."

# Check if H5 model exists
if [ ! -f "$H5_MODEL_PATH" ]; then
    echo "Error: H5 model not found at ${H5_MODEL_PATH}"
    echo "Please train the model first using: python train_cnn_comprehensive.py"
    exit 1
fi

# Check if tensorflowjs_converter is installed
if ! command -v tensorflowjs_converter &> /dev/null; then
    echo "Installing tensorflowjs_converter..."
    pip install tensorflowjs
fi

# Clean previous TFJS model directory
if [ -d "$TFJS_MODEL_PATH" ]; then
    echo "Cleaning previous TFJS model..."
    rm -rf "$TFJS_MODEL_PATH"
fi

# Convert H5 to TFJS
echo "Starting conversion..."
tensorflowjs_converter \
    --input_format=keras \
    --output_format=tfjs_graph_model \
    --signature_name=serving_default \
    --saved_model_tags=serve \
    "$H5_MODEL_PATH" \
    "$TFJS_MODEL_PATH"

# Check if conversion was successful
if [ -d "$TFJS_MODEL_PATH" ]; then
    echo "Conversion successful!"
    echo "TFJS model created in: ${TFJS_MODEL_PATH}"
    
    # List generated files
    echo "Generated files:"
    ls -la "$TFJS_MODEL_PATH"
    
    # Copy to React public folder
    if [ -d "$PUBLIC_PATH" ]; then
        echo "Copying model to React public folder..."
        mkdir -p "$PUBLIC_PATH"
        cp -r "$TFJS_MODEL_PATH" "$PUBLIC_PATH/${MODEL_NAME}"
        echo "Model copied to: ${PUBLIC_PATH}/${MODEL_NAME}"
    else
        echo "Warning: React public folder not found at ${PUBLIC_PATH}"
        echo "Please manually copy ${TFJS_MODEL_PATH} to your React public/models folder"
    fi
    
    # Create model info file
    cat > "${TFJS_MODEL_PATH}/model_info.json" << EOF
{
    "model_name": "${MODEL_NAME}",
    "conversion_date": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "input_shape": [21, 3],
    "output_classes": 46,
    "format": "tfjs_graph_model",
    "version": "1.0.0"
}
EOF
    
    echo "Model info created: ${TFJS_MODEL_PATH}/model_info.json"
    
else
    echo "Error: Conversion failed - no TFJS model directory created"
    exit 1
fi

echo ""
echo "=== Conversion Complete ==="
echo "Next steps:"
echo "1. The model is ready for use in your React application"
echo "2. Use the SignLanguageDetector component to load and run the model"
echo "3. Test the model in your browser console"
echo ""
echo "Model files:"
echo "- H5: ${H5_MODEL_PATH}"
echo "- TFJS: ${TFJS_MODEL_PATH}"
echo "- React: ${PUBLIC_PATH}/${MODEL_NAME}"
