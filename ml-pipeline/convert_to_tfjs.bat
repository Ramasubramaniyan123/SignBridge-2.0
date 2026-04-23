@echo off
REM SignBridge Connect - Model Conversion Script (Windows)
REM Converts trained Keras H5 model to TensorFlow.js format for web deployment

setlocal enabledelayedexpansion

REM Configuration
set MODEL_NAME=sign_language_model
set H5_MODEL_PATH=%MODEL_NAME%.h5
set TFJS_MODEL_PATH=tfjs_model
set PUBLIC_PATH=..\public\models

echo === SignBridge Model Conversion ===
echo Converting %H5_MODEL_PATH% to TensorFlow.js format...

REM Check if H5 model exists
if not exist "%H5_MODEL_PATH%" (
    echo Error: H5 model not found at %H5_MODEL_PATH%
    echo Please train the model first using: python train_cnn_comprehensive.py
    pause
    exit /b 1
)

REM Check if tensorflowjs_converter is installed
python -c "import tensorflowjs_converter" 2>nul
if errorlevel 1 (
    echo Installing tensorflowjs_converter...
    pip install tensorflowjs
)

REM Clean previous TFJS model directory
if exist "%TFJS_MODEL_PATH%" (
    echo Cleaning previous TFJS model...
    rmdir /s /q "%TFJS_MODEL_PATH%"
)

REM Convert H5 to TFJS
echo Starting conversion...
tensorflowjs_converter ^
    --input_format=keras ^
    --output_format=tfjs_graph_model ^
    --signature_name=serving_default ^
    --saved_model_tags=serve ^
    "%H5_MODEL_PATH%" ^
    "%TFJS_MODEL_PATH%"

REM Check if conversion was successful
if exist "%TFJS_MODEL_PATH%" (
    echo Conversion successful!
    echo TFJS model created in: %TFJS_MODEL_PATH%
    
    REM List generated files
    echo Generated files:
    dir "%TFJS_MODEL_PATH%"
    
    REM Copy to React public folder
    if exist "%PUBLIC_PATH%" (
        echo Copying model to React public folder...
        if not exist "%PUBLIC_PATH%\%MODEL_NAME%" mkdir "%PUBLIC_PATH%\%MODEL_NAME%"
        xcopy /s /e /y "%TFJS_MODEL_PATH%" "%PUBLIC_PATH%\%MODEL_NAME%\"
        echo Model copied to: %PUBLIC_PATH%\%MODEL_NAME%
    ) else (
        echo Warning: React public folder not found at %PUBLIC_PATH%
        echo Please manually copy %TFJS_MODEL_PATH% to your React public\models folder
    )
    
    REM Create model info file
    echo { > "%TFJS_MODEL_PATH%\model_info.json"
    echo     "model_name": "%MODEL_NAME%", >> "%TFJS_MODEL_PATH%\model_info.json"
    echo     "conversion_date": "%date% %time%", >> "%TFJS_MODEL_PATH%\model_info.json"
    echo     "input_shape": [21, 3], >> "%TFJS_MODEL_PATH%\model_info.json"
    echo     "output_classes": 46, >> "%TFJS_MODEL_PATH%\model_info.json"
    echo     "format": "tfjs_graph_model", >> "%TFJS_MODEL_PATH%\model_info.json"
    echo     "version": "1.0.0" >> "%TFJS_MODEL_PATH%\model_info.json"
    echo } >> "%TFJS_MODEL_PATH%\model_info.json"
    
    echo Model info created: %TFJS_MODEL_PATH%\model_info.json
    
) else (
    echo Error: Conversion failed - no TFJS model directory created
    pause
    exit /b 1
)

echo.
echo === Conversion Complete ===
echo Next steps:
echo 1. The model is ready for use in your React application
echo 2. Use the SignLanguageDetector component to load and run the model
echo 3. Test the model in your browser console
echo.
echo Model files:
echo - H5: %H5_MODEL_PATH%
echo - TFJS: %TFJS_MODEL_PATH%
echo - React: %PUBLIC_PATH%\%MODEL_NAME%

pause
