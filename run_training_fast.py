import os, sys, json
sys.stdout.reconfigure(encoding='utf-8')

from unittest.mock import MagicMock
for m in ['tensorflow_decision_forests','tensorflow_hub','jax',
          'jax.experimental','flax','flax.linen']:
    sys.modules[m] = MagicMock()

os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'

import numpy as np
import tensorflow as tf

DATASET_DIR = './dataset'
OUTPUT_FILE = './web_model/classifier.json'

# Get class names
class_names = sorted([
    d for d in os.listdir(DATASET_DIR)
    if os.path.isdir(os.path.join(DATASET_DIR, d))
])
num_classes = len(class_names)

# Load pre-extracted features
if not os.path.exists('X.npy') or not os.path.exists('y.npy'):
    print("Error: X.npy or y.npy not found!")
    sys.exit(1)

X = np.load('X.npy')
y = np.load('y.npy')

print(f"Loaded X shape: {X.shape}, y shape: {y.shape}")

# Build and compile model
model = tf.keras.Sequential([
    tf.keras.layers.Input(shape=(1280,)),
    tf.keras.layers.Dense(num_classes, activation='softmax')
])

model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=0.1),
    loss='sparse_categorical_crossentropy',
    metrics=['accuracy']
)

print("Training classifier head for 150 epochs...")
h = model.fit(X, y, epochs=150, batch_size=32, verbose=1)

final_acc = h.history['accuracy'][-1]
print(f"Final training accuracy: {final_acc*100:.2f}%")

# Extract weights and biases
dense_layer = model.layers[0]
weights, biases = dense_layer.get_weights()

# Save to JSON
payload = {
    "classes": class_names,
    "weights": weights.tolist(), # shape: (1280, 111)
    "biases": biases.tolist()   # shape: (111,)
}

os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
    json.dump(payload, f)

print(f"Classifier saved successfully to {OUTPUT_FILE}!")
print(f"File size: {os.path.getsize(OUTPUT_FILE)/1024:.1f} KB")
