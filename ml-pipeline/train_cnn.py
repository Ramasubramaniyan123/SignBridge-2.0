import pandas as pd
import numpy as np
import tensorflow as tf
from sklearn.model_selection import train_test_split
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Conv1D, MaxPooling1D, Dense, Dropout, Flatten
from sklearn.metrics import classification_report, confusion_matrix
import matplotlib.pyplot as plt
import seaborn as sns
import os

# Configuration
DATASET_PATH = 'dataset/landmarks.csv'
MODEL_SAVE_PATH = 'sign_model.h5'
CLASSES = ['A', 'B', 'C', 'Hello', 'Yes', 'No']
NUM_CLASSES = len(CLASSES)

# 1. Load Dataset
print("Loading dataset...")
df = pd.read_csv(DATASET_PATH)
X = df.drop('label', axis=1).values
y = df['label'].values

# Data Augmentation (Jittering) for robustness
noise = np.random.normal(0, 0.005, X.shape)
X_aug = X + noise
X = np.vstack((X, X_aug))
y = np.concatenate((y, y))

# Reshape X for Conv1D: (samples, time_steps, features) -> (samples, 21, 3)
X = X.reshape(-1, 21, 3)
y = tf.keras.utils.to_categorical(y, num_classes=NUM_CLASSES)

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# 2. Build CNN Model
print("Building CNN Model...")
model = Sequential([
    Conv1D(filters=64, kernel_size=3, activation='relu', input_shape=(21, 3)),
    MaxPooling1D(pool_size=2),
    Conv1D(filters=128, kernel_size=3, activation='relu'),
    MaxPooling1D(pool_size=2),
    Flatten(),
    Dense(128, activation='relu'),
    Dropout(0.3),
    Dense(64, activation='relu'),
    Dropout(0.2),
    Dense(NUM_CLASSES, activation='softmax')
])

model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])
model.summary()

# 3. Train Model
print("Training Model...")
early_stop = tf.keras.callbacks.EarlyStopping(monitor='val_loss', patience=10, restore_best_weights=True)
history = model.fit(X_train, y_train, epochs=50, validation_split=0.2, callbacks=[early_stop])

# 4. Evaluate Model
print("Evaluating Model...")
loss, accuracy = model.evaluate(X_test, y_test)
print(f"Test Accuracy: {accuracy * 100:.2f}%")

y_pred = np.argmax(model.predict(X_test), axis=1)
y_true = np.argmax(y_test, axis=1)

print("\nClassification Report:")
print(classification_report(y_true, y_pred, target_names=CLASSES))

# Confusion Matrix
cm = confusion_matrix(y_true, y_pred)
plt.figure(figsize=(8,6))
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', xticklabels=CLASSES, yticklabels=CLASSES)
plt.title('Confusion Matrix')
plt.xlabel('Predicted Label')
plt.ylabel('True Label')
plt.savefig('confusion_matrix.png')
print("Confusion matrix saved to confusion_matrix.png")

# 5. Save Model
model.save(MODEL_SAVE_PATH)
print(f"Model saved to {MODEL_SAVE_PATH}")

print("\nTo convert to TFJS, run:")
print(f"tensorflowjs_converter --input_format=keras {MODEL_SAVE_PATH} tfjs_model/")
