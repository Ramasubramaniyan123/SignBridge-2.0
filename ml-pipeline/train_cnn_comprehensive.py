import pandas as pd
import numpy as np
import tensorflow as tf
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score, precision_score, recall_score, f1_score
from sklearn.preprocessing import LabelEncoder
import matplotlib.pyplot as plt
import seaborn as sns
import os
import json
from datetime import datetime

# Configuration
DATASET_PATH = 'dataset/landmarks.csv'
MODEL_SAVE_PATH = 'sign_language_model.h5'
TFJS_MODEL_PATH = 'tfjs_model/'
METRICS_SAVE_PATH = 'training_metrics.json'

# Extended classes for comprehensive sign language
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

NUM_CLASSES = len(CLASSES)

class SignLanguageTrainer:
    def __init__(self):
        self.model = None
        self.history = None
        self.label_encoder = LabelEncoder()
        self.classes = CLASSES
        
    def load_dataset(self, dataset_path):
        """Load and preprocess the landmark dataset"""
        print(f"Loading dataset from {dataset_path}...")
        
        if not os.path.exists(dataset_path):
            raise FileNotFoundError(f"Dataset not found at {dataset_path}. Please run dataset collection first.")
        
        df = pd.read_csv(dataset_path)
        print(f"Dataset shape: {df.shape}")
        print(f"Classes found: {df['label'].nunique()}")
        
        # Separate features and labels
        X = df.drop('label', axis=1).values
        y = df['label'].values
        
        # Filter to only include classes in our predefined list
        valid_indices = y < len(self.classes)
        X = X[valid_indices]
        y = y[valid_indices]
        
        print(f"Filtered dataset shape: {X.shape}")
        print(f"Valid classes: {len(np.unique(y))}")
        
        return X, y
    
    def augment_data(self, X, y):
        """Apply data augmentation techniques"""
        print("Applying data augmentation...")
        
        augmented_X = []
        augmented_y = []
        
        # Original data
        augmented_X.append(X)
        augmented_y.append(y)
        
        # 1. Add Gaussian noise (jittering)
        noise = np.random.normal(0, 0.005, X.shape)
        augmented_X.append(X + noise)
        augmented_y.append(y)
        
        # 2. Slight rotation simulation (coordinate transformation)
        for angle in [0.05, -0.05]:  # Small angles in radians
            rotated_X = X.copy()
            # Apply rotation to x,y coordinates (z remains unchanged)
            cos_a, sin_a = np.cos(angle), np.sin(angle)
            for i in range(0, X.shape[1], 3):  # Process each landmark
                if i + 1 < X.shape[1]:
                    x, y_coord = rotated_X[:, i], rotated_X[:, i + 1]
                    rotated_X[:, i] = x * cos_a - y_coord * sin_a
                    rotated_X[:, i + 1] = x * sin_a + y_coord * cos_a
            
            augmented_X.append(rotated_X)
            augmented_y.append(y)
        
        # 3. Scaling variations
        for scale in [0.9, 1.1]:
            scaled_X = X * scale
            augmented_X.append(scaled_X)
            augmented_y.append(y)
        
        # Combine all augmented data
        X_augmented = np.vstack(augmented_X)
        y_augmented = np.concatenate(augmented_y)
        
        print(f"Original samples: {len(X)}")
        print(f"Augmented samples: {len(X_augmented)}")
        
        return X_augmented, y_augmented
    
    def preprocess_data(self, X, y):
        """Preprocess and reshape data for CNN"""
        print("Preprocessing data...")
        
        # Reshape for Conv1D: (samples, time_steps, features) -> (samples, 21, 3)
        X = X.reshape(-1, 21, 3)
        
        # Convert labels to categorical
        y_categorical = tf.keras.utils.to_categorical(y, num_classes=NUM_CLASSES)
        
        return X, y_categorical
    
    def build_cnn_model(self):
        """Build the 1D CNN model for landmark classification"""
        print("Building 1D CNN Model...")
        
        model = tf.keras.Sequential([
            # First Conv Block
            tf.keras.layers.Conv1D(filters=128, kernel_size=3, activation='relu', 
                                 input_shape=(21, 3), padding='same'),
            tf.keras.layers.BatchNormalization(),
            tf.keras.layers.MaxPooling1D(pool_size=2),
            tf.keras.layers.Dropout(0.2),
            
            # Second Conv Block
            tf.keras.layers.Conv1D(filters=256, kernel_size=3, activation='relu', padding='same'),
            tf.keras.layers.BatchNormalization(),
            tf.keras.layers.MaxPooling1D(pool_size=2),
            tf.keras.layers.Dropout(0.3),
            
            # Third Conv Block
            tf.keras.layers.Conv1D(filters=512, kernel_size=3, activation='relu', padding='same'),
            tf.keras.layers.BatchNormalization(),
            tf.keras.layers.GlobalAveragePooling1D(),
            tf.keras.layers.Dropout(0.4),
            
            # Dense Layers
            tf.keras.layers.Dense(256, activation='relu'),
            tf.keras.layers.BatchNormalization(),
            tf.keras.layers.Dropout(0.3),
            
            tf.keras.layers.Dense(128, activation='relu'),
            tf.keras.layers.Dropout(0.2),
            
            # Output Layer
            tf.keras.layers.Dense(NUM_CLASSES, activation='softmax')
        ])
        
        # Compile model
        model.compile(
            optimizer=tf.keras.optimizers.Adam(learning_rate=0.001),
            loss='categorical_crossentropy',
            metrics=['accuracy', tf.keras.metrics.Precision(), tf.keras.metrics.Recall()]
        )
        
        model.summary()
        self.model = model
        return model
    
    def train_model(self, X_train, y_train, X_val, y_val):
        """Train the CNN model with callbacks"""
        print("Training model...")
        
        # Callbacks for better training
        callbacks = [
            tf.keras.callbacks.EarlyStopping(
                monitor='val_loss', 
                patience=15, 
                restore_best_weights=True,
                verbose=1
            ),
            tf.keras.callbacks.ReduceLROnPlateau(
                monitor='val_loss',
                factor=0.5,
                patience=5,
                min_lr=1e-7,
                verbose=1
            ),
            tf.keras.callbacks.ModelCheckpoint(
                'best_model.h5',
                monitor='val_accuracy',
                save_best_only=True,
                verbose=1
            )
        ]
        
        # Train model
        history = self.model.fit(
            X_train, y_train,
            validation_data=(X_val, y_val),
            epochs=100,
            batch_size=32,
            callbacks=callbacks,
            verbose=1
        )
        
        self.history = history
        return history
    
    def evaluate_model(self, X_test, y_test):
        """Comprehensive model evaluation"""
        print("Evaluating model...")
        
        # Basic metrics
        loss, accuracy, precision, recall = self.model.evaluate(X_test, y_test, verbose=0)
        f1 = 2 * (precision * recall) / (precision + recall)
        
        print(f"\n=== MODEL PERFORMANCE ===")
        print(f"Test Loss: {loss:.4f}")
        print(f"Test Accuracy: {accuracy:.4f} ({accuracy*100:.2f}%)")
        print(f"Test Precision: {precision:.4f}")
        print(f"Test Recall: {recall:.4f}")
        print(f"Test F1 Score: {f1:.4f}")
        
        # Detailed classification report
        y_pred_probs = self.model.predict(X_test)
        y_pred = np.argmax(y_pred_probs, axis=1)
        y_true = np.argmax(y_test, axis=1)
        
        # Filter classes that actually exist in test set
        present_classes = np.unique(y_true)
        present_class_names = [self.classes[i] for i in present_classes]
        
        print("\n=== CLASSIFICATION REPORT ===")
        print(classification_report(
            y_true, y_pred, 
            target_names=present_class_names,
            zero_division=0
        ))
        
        # Confusion Matrix
        cm = confusion_matrix(y_true, y_pred)
        
        # Plot confusion matrix
        plt.figure(figsize=(15, 12))
        sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', 
                   xticklabels=present_class_names, 
                   yticklabels=present_class_names)
        plt.title('Confusion Matrix', fontsize=16)
        plt.xlabel('Predicted Label', fontsize=12)
        plt.ylabel('True Label', fontsize=12)
        plt.xticks(rotation=45)
        plt.yticks(rotation=0)
        plt.tight_layout()
        plt.savefig('confusion_matrix.png', dpi=300, bbox_inches='tight')
        plt.show()
        
        # Training history plots
        if self.history:
            self.plot_training_history()
        
        # Save metrics
        metrics = {
            'accuracy': float(accuracy),
            'precision': float(precision),
            'recall': float(recall),
            'f1_score': float(f1),
            'loss': float(loss),
            'confusion_matrix': cm.tolist(),
            'training_date': datetime.now().isoformat()
        }
        
        with open(METRICS_SAVE_PATH, 'w') as f:
            json.dump(metrics, f, indent=2)
        
        return metrics
    
    def plot_training_history(self):
        """Plot training history"""
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(15, 5))
        
        # Accuracy plot
        ax1.plot(self.history.history['accuracy'], label='Training Accuracy')
        ax1.plot(self.history.history['val_accuracy'], label='Validation Accuracy')
        ax1.set_title('Model Accuracy', fontsize=14)
        ax1.set_xlabel('Epoch')
        ax1.set_ylabel('Accuracy')
        ax1.legend()
        ax1.grid(True)
        
        # Loss plot
        ax2.plot(self.history.history['loss'], label='Training Loss')
        ax2.plot(self.history.history['val_loss'], label='Validation Loss')
        ax2.set_title('Model Loss', fontsize=14)
        ax2.set_xlabel('Epoch')
        ax2.set_ylabel('Loss')
        ax2.legend()
        ax2.grid(True)
        
        plt.tight_layout()
        plt.savefig('training_history.png', dpi=300, bbox_inches='tight')
        plt.show()
    
    def save_model(self, path):
        """Save the trained model"""
        print(f"Saving model to {path}...")
        self.model.save(path)
        print("Model saved successfully!")
        
        # Save class names for React integration
        class_info = {
            'classes': self.classes,
            'num_classes': NUM_CLASSES,
            'input_shape': [21, 3]
        }
        
        with open('class_info.json', 'w') as f:
            json.dump(class_info, f, indent=2)
        
        print("Class information saved to class_info.json")

def main():
    """Main training pipeline"""
    print("=== SignBridge Connect - CNN Training Pipeline ===")
    print(f"Training {NUM_CLASSES} classes: {CLASSES[:10]}...")  # Show first 10 classes
    
    # Initialize trainer
    trainer = SignLanguageTrainer()
    
    try:
        # Load dataset
        X, y = trainer.load_dataset(DATASET_PATH)
        
        # Data augmentation
        X_aug, y_aug = trainer.augment_data(X, y)
        
        # Preprocess
        X_processed, y_processed = trainer.preprocess_data(X_aug, y_aug)
        
        # Split dataset
        X_train, X_temp, y_train, y_temp = train_test_split(
            X_processed, y_processed, test_size=0.3, random_state=42, stratify=y_processed
        )
        X_val, X_test, y_val, y_test = train_test_split(
            X_temp, y_temp, test_size=0.5, random_state=42, stratify=y_temp
        )
        
        print(f"Training set: {X_train.shape[0]} samples")
        print(f"Validation set: {X_val.shape[0]} samples")
        print(f"Test set: {X_test.shape[0]} samples")
        
        # Build model
        model = trainer.build_cnn_model()
        
        # Train model
        trainer.train_model(X_train, y_train, X_val, y_val)
        
        # Evaluate model
        metrics = trainer.evaluate_model(X_test, y_test)
        
        # Save model
        trainer.save_model(MODEL_SAVE_PATH)
        
        print(f"\n=== TRAINING COMPLETE ===")
        print(f"Final Accuracy: {metrics['accuracy']*100:.2f}%")
        print(f"Model saved to: {MODEL_SAVE_PATH}")
        print(f"Metrics saved to: {METRICS_SAVE_PATH}")
        
        print(f"\n=== NEXT STEPS ===")
        print(f"1. Convert to TensorFlow.js: tensorflowjs_converter --input_format=keras {MODEL_SAVE_PATH} {TFJS_MODEL_PATH}")
        print(f"2. Copy {TFJS_MODEL_PATH} to your React public folder")
        print(f"3. Update your React component to use the new model")
        
    except Exception as e:
        print(f"Error during training: {str(e)}")
        raise

if __name__ == "__main__":
    main()
