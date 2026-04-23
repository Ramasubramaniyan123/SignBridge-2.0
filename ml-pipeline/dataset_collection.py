import cv2
import mediapipe as mp
import csv
import os
import time

# Options
CAMERA_INDEX = 0
DATASET_PATH = 'dataset/landmarks.csv'
CLASSES = ['A', 'B', 'C', 'Hello', 'Yes', 'No']
FRAMES_PER_CLASS = 1000

# Initialize MediaPipe Hands
mp_hands = mp.solutions.hands
hands = mp_hands.Hands(static_image_mode=False, max_num_hands=1, min_detection_confidence=0.7)
mp_drawing = mp.solutions.drawing_utils

# Create dataset directory if not exists
os.makedirs('dataset', exist_ok=True)

# Create CSV and write headers if it doesn't exist
if not os.path.exists(DATASET_PATH):
    with open(DATASET_PATH, mode='w', newline='') as f:
        writer = csv.writer(f)
        header = ['label']
        for i in range(21):
            header.extend([f'x_{i}', f'y_{i}', f'z_{i}'])
        writer.writerow(header)

def normalize_landmarks(landmarks):
    # Normalize coordinates relative to wrist (landmark 0)
    base_x, base_y, base_z = landmarks[0].x, landmarks[0].y, landmarks[0].z
    normalized = []
    for lm in landmarks:
        normalized.extend([lm.x - base_x, lm.y - base_y, lm.z - base_z])
    return normalized

cap = cv2.VideoCapture(CAMERA_INDEX)

print("SignBridge Dataset Collector")
print("============================")
for class_id, class_name in enumerate(CLASSES):
    print(f"\nPrepare to record for class: {class_name}")
    print("Press 's' to start recording 1000 frames. Move your hand around slightly to capture variations!")
    
    # Wait for user to be ready
    while True:
        ret, frame = cap.read()
        frame = cv2.flip(frame, 1)
        cv2.putText(frame, f"Ready for: {class_name}. Press 's' to start.", (10, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        cv2.imshow("Dataset Collector", frame)
        if cv2.waitKey(1) & 0xFF == ord('s'):
            break

    frames_collected = 0
    with open(DATASET_PATH, mode='a', newline='') as f:
        writer = csv.writer(f)
        
        while frames_collected < FRAMES_PER_CLASS:
            ret, frame = cap.read()
            if not ret: continue
            
            frame = cv2.flip(frame, 1)
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            result = hands.process(frame_rgb)
            
            if result.multi_hand_landmarks:
                for hand_landmarks in result.multi_hand_landmarks:
                    mp_drawing.draw_landmarks(frame, hand_landmarks, mp_hands.HAND_CONNECTIONS)
                    
                    # Extract and normalize
                    normalized = normalize_landmarks(hand_landmarks.landmark)
                    
                    # Store in CSV
                    writer.writerow([class_id] + normalized)
                    frames_collected += 1
            
            cv2.putText(frame, f"Recording {class_name} ({frames_collected}/{FRAMES_PER_CLASS})", 
                        (10, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
            cv2.imshow("Dataset Collector", frame)
            cv2.waitKey(1)

print("\nDataset collection complete!")
cap.release()
cv2.destroyAllWindows()
