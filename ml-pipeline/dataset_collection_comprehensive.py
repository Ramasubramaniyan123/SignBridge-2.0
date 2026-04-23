import cv2
import mediapipe as mp
import csv
import os
import time
import numpy as np
import json
from datetime import datetime
import argparse

# Configuration
CAMERA_INDEX = 0
DATASET_PATH = 'dataset/landmarks.csv'
METADATA_PATH = 'dataset/metadata.json'

# Comprehensive sign language classes
CLASSES = [
    # Alphabets
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
    'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
    # Numbers
    '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
    # Common words
    'Hello', 'Yes', 'No', 'ThankYou', 'Please', 'Sorry', 'Help', 'Love',
    'Good', 'Bad', 'Stop', 'Go', 'Come', 'Eat', 'Drink', 'Water', 'Food'
]

FRAMES_PER_CLASS = 1000
MIN_DETECTION_CONFIDENCE = 0.7
MIN_TRACKING_CONFIDENCE = 0.7

class DatasetCollector:
    def __init__(self, camera_index=CAMERA_INDEX):
        self.camera_index = camera_index
        self.mp_hands = mp.solutions.hands
        self.mp_drawing = mp.solutions.drawing_utils
        self.mp_drawing_styles = mp.solutions.drawing_styles
        
        # Initialize MediaPipe Hands with optimized settings
        self.hands = self.mp_hands.Hands(
            static_image_mode=False,
            max_num_hands=1,
            min_detection_confidence=MIN_DETECTION_CONFIDENCE,
            min_tracking_confidence=MIN_TRACKING_CONFIDENCE
        )
        
        self.cap = None
        self.dataset_stats = {}
        
    def initialize_camera(self):
        """Initialize camera with error handling"""
        self.cap = cv2.VideoCapture(self.camera_index)
        
        if not self.cap.isOpened():
            raise RuntimeError(f"Cannot open camera with index {self.camera_index}")
        
        # Set camera properties for better quality
        self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
        self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
        self.cap.set(cv2.CAP_PROP_FPS, 30)
        
        print("Camera initialized successfully")
    
    def create_dataset_directory(self):
        """Create dataset directory and initialize CSV file"""
        os.makedirs('dataset', exist_ok=True)
        
        # Create CSV file with headers if it doesn't exist
        if not os.path.exists(DATASET_PATH):
            with open(DATASET_PATH, mode='w', newline='') as f:
                writer = csv.writer(f)
                header = ['label']
                for i in range(21):
                    header.extend([f'x_{i}', f'y_{i}', f'z_{i}'])
                writer.writerow(header)
            print(f"Created new dataset file: {DATASET_PATH}")
        else:
            print(f"Appending to existing dataset file: {DATASET_PATH}")
    
    def normalize_landmarks(self, landmarks):
        """
        Normalize landmarks relative to wrist position for scale invariance
        This is crucial for achieving high accuracy
        """
        if not landmarks:
            return None
            
        # Get wrist position (landmark 0) as reference
        wrist_x, wrist_y, wrist_z = landmarks[0].x, landmarks[0].y, landmarks[0].z
        
        normalized = []
        for lm in landmarks:
            # Translate all points so wrist is at origin (0, 0, 0)
            normalized.extend([
                lm.x - wrist_x,
                lm.y - wrist_y,
                lm.z - wrist_z
            ])
        
        return normalized
    
    def augment_landmarks(self, landmarks):
        """
        Generate augmented landmark data for better generalization
        This creates variations without requiring additional camera captures
        """
        augmented = []
        
        # Original landmarks
        augmented.append(landmarks)
        
        # 1. Small random noise (jittering)
        noise = np.random.normal(0, 0.002, len(landmarks))
        augmented.append(landmarks + noise)
        
        # 2. Slight scaling variations
        for scale in [0.95, 1.05]:
            scaled = landmarks * scale
            augmented.append(scaled)
        
        return augmented
    
    def collect_class_data(self, class_name, class_id):
        """Collect data for a specific class"""
        print(f"\n{'='*50}")
        print(f"Collecting data for: {class_name} (ID: {class_id})")
        print(f"Target frames: {FRAMES_PER_CLASS}")
        print(f"{'='*50}")
        
        frames_collected = 0
        total_samples = 0
        last_save_time = time.time()
        
        # Instructions for the user
        print("\nInstructions:")
        print(f"- Position your hand to make the '{class_name}' sign")
        print("- Keep your hand visible in the camera frame")
        print("- Move your hand slightly to capture variations")
        print("- Press SPACE when ready to start recording")
        print("- Press 'q' to quit current class")
        print("- Press 'r' to reset current class collection")
        
        # Wait for user to be ready
        while True:
            ret, frame = self.cap.read()
            if not ret:
                continue
                
            frame = cv2.flip(frame, 1)
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = self.hands.process(frame_rgb)
            
            # Draw hand landmarks if detected
            if results.multi_hand_landmarks:
                for hand_landmarks in results.multi_hand_landmarks:
                    self.mp_drawing.draw_landmarks(
                        frame,
                        hand_landmarks,
                        self.mp_hands.HAND_CONNECTIONS,
                        self.mp_drawing_styles.get_default_hand_landmarks_style(),
                        self.mp_drawing_styles.get_default_hand_connections_style()
                    )
            
            # Display instructions
            cv2.putText(frame, f"Class: {class_name}", (10, 30), 
                       cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
            cv2.putText(frame, "Press SPACE to start recording", (10, 70), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
            cv2.putText(frame, "Press 'q' to skip, 'r' to reset", (10, 100), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
            
            cv2.imshow("SignBridge Dataset Collector", frame)
            
            key = cv2.waitKey(1) & 0xFF
            if key == ord(' '):
                break
            elif key == ord('q'):
                return False  # Skip this class
            elif key == ord('r'):
                frames_collected = 0
                total_samples = 0
                print(f"Reset {class_name} collection")
        
        # Start collection
        print(f"\nRecording {class_name}...")
        
        with open(DATASET_PATH, mode='a', newline='') as f:
            writer = csv.writer(f)
            
            while frames_collected < FRAMES_PER_CLASS:
                ret, frame = self.cap.read()
                if not ret:
                    continue
                
                frame = cv2.flip(frame, 1)
                frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                results = self.hands.process(frame_rgb)
                
                # Process detected hands
                if results.multi_hand_landmarks:
                    for hand_landmarks in results.multi_hand_landmarks:
                        # Draw landmarks
                        self.mp_drawing.draw_landmarks(
                            frame,
                            hand_landmarks,
                            self.mp_hands.HAND_CONNECTIONS,
                            self.mp_drawing_styles.get_default_hand_landmarks_style(),
                            self.mp_drawing_styles.get_default_hand_connections_style()
                        )
                        
                        # Extract and normalize landmarks
                        normalized = self.normalize_landmarks(hand_landmarks.landmark)
                        
                        if normalized:
                            # Apply augmentation for better generalization
                            augmented_landmarks = self.augment_landmarks(np.array(normalized))
                            
                            for aug_landmarks in augmented_landmarks:
                                # Save to CSV
                                writer.writerow([class_id] + aug_landmarks.tolist())
                                total_samples += 1
                            
                            frames_collected += 1
                
                # Display progress
                progress = (frames_collected / FRAMES_PER_CLASS) * 100
                cv2.putText(frame, f"Class: {class_name}", (10, 30), 
                           cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
                cv2.putText(frame, f"Progress: {frames_collected}/{FRAMES_PER_CLASS} ({progress:.1f}%)", 
                           (10, 70), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
                cv2.putText(frame, f"Total samples: {total_samples}", (10, 110), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
                
                # Progress bar
                bar_width = 400
                bar_height = 20
                bar_x = 10
                bar_y = 140
                cv2.rectangle(frame, (bar_x, bar_y), (bar_x + bar_width, bar_y + bar_height), 
                            (255, 255, 255), 2)
                cv2.rectangle(frame, (bar_x, bar_y), 
                            (bar_x + int(bar_width * progress / 100), bar_y + bar_height), 
                            (0, 255, 0), -1)
                
                cv2.imshow("SignBridge Dataset Collector", frame)
                
                key = cv2.waitKey(1) & 0xFF
                if key == ord('q'):
                    break  # Stop early
                elif key == ord('r'):
                    frames_collected = 0
                    total_samples = 0
                    print(f"Reset {class_name} collection")
                
                # Auto-save every 100 frames
                if time.time() - last_save_time > 5:  # Save every 5 seconds
                    f.flush()
                    last_save_time = time.time()
        
        # Update statistics
        self.dataset_stats[class_name] = {
            'frames_collected': frames_collected,
            'total_samples': total_samples,
            'timestamp': datetime.now().isoformat()
        }
        
        print(f"Completed {class_name}: {frames_collected} frames, {total_samples} total samples")
        return True
    
    def collect_all_classes(self, start_class=0):
        """Collect data for all classes"""
        print("=== SignBridge Dataset Collection ===")
        print(f"Total classes to collect: {len(CLASSES)}")
        print(f"Starting from class index: {start_class}")
        
        self.create_dataset_directory()
        self.initialize_camera()
        
        try:
            for i, class_name in enumerate(CLASSES[start_class:], start=start_class):
                success = self.collect_class_data(class_name, i)
                
                if not success:
                    print(f"Skipped {class_name}")
                    continue
                
                # Brief pause between classes
                print("2-second pause before next class...")
                time.sleep(2)
        
        except KeyboardInterrupt:
            print("\nCollection interrupted by user")
        except Exception as e:
            print(f"Error during collection: {str(e)}")
        finally:
            self.cleanup()
    
    def cleanup(self):
        """Clean up resources"""
        if self.cap:
            self.cap.release()
        cv2.destroyAllWindows()
        
        # Save metadata
        self.save_metadata()
    
    def save_metadata(self):
        """Save dataset metadata"""
        metadata = {
            'collection_date': datetime.now().isoformat(),
            'total_classes': len(CLASSES),
            'classes': CLASSES,
            'frames_per_class': FRAMES_PER_CLASS,
            'detection_confidence': MIN_DETECTION_CONFIDENCE,
            'tracking_confidence': MIN_TRACKING_CONFIDENCE,
            'stats': self.dataset_stats
        }
        
        with open(METADATA_PATH, 'w') as f:
            json.dump(metadata, f, indent=2)
        
        print(f"Dataset metadata saved to {METADATA_PATH}")
    
    def show_dataset_stats(self):
        """Display current dataset statistics"""
        if not os.path.exists(DATASET_PATH):
            print("No dataset found. Please collect data first.")
            return
        
        df = pd.read_csv(DATASET_PATH)
        print(f"\n=== Dataset Statistics ===")
        print(f"Total samples: {len(df)}")
        print(f"Classes present: {df['label'].nunique()}")
        
        # Count samples per class
        class_counts = df['label'].value_counts().sort_index()
        print("\nSamples per class:")
        for label, count in class_counts.items():
            if label < len(CLASSES):
                print(f"  {CLASSES[label]}: {count}")

def main():
    """Main function with command line arguments"""
    parser = argparse.ArgumentParser(description='SignBridge Dataset Collector')
    parser.add_argument('--start', type=int, default=0, 
                       help='Start collecting from specific class index')
    parser.add_argument('--camera', type=int, default=CAMERA_INDEX,
                       help='Camera index to use')
    parser.add_argument('--stats', action='store_true',
                       help='Show dataset statistics and exit')
    
    args = parser.parse_args()
    
    collector = DatasetCollector(camera_index=args.camera)
    
    if args.stats:
        collector.show_dataset_stats()
        return
    
    try:
        collector.collect_all_classes(start_class=args.start)
    except Exception as e:
        print(f"Error: {str(e)}")
    finally:
        collector.cleanup()

if __name__ == "__main__":
    main()
