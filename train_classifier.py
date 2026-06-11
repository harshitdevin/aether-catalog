"""
train_classifier.py
Trains a Dense Softmax classifier head on MobileNetV2 feature embeddings of our dataset.
Saves weights and biases to web_model/classifier.json.
"""
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
IMG_SIZE    = (224, 224)
BATCH       = 16

def main():
    # 1. Get class names
    class_names = sorted([
        d for d in os.listdir(DATASET_DIR)
        if os.path.isdir(os.path.join(DATASET_DIR, d))
    ])
    num_classes = len(class_names)
    print(f"[1] Found {num_classes} classes.")
    
    # 2. Build MobileNetV2 feature extractor
    print("[2] Building MobileNetV2 feature extractor...")
    inp  = tf.keras.Input(shape=(224, 224, 3), dtype='float32')
    x    = tf.keras.layers.Rescaling(1./127.5, offset=-1)(inp)
    base = tf.keras.applications.MobileNetV2(
        input_shape=(224, 224, 3), include_top=False,
        weights='imagenet', pooling='avg')
    base.trainable = False
    out  = base(x, training=False)
    embed_model = tf.keras.Model(inp, out)
    
    # 3. Extract features & labels
    print("[3] Extracting features from dataset...")
    X_data = []
    y_data = []
    
    for idx, cls in enumerate(class_names):
        cls_dir = os.path.join(DATASET_DIR, cls)
        paths = [
            os.path.join(cls_dir, f) for f in os.listdir(cls_dir)
            if os.path.isfile(os.path.join(cls_dir, f))
            and os.path.splitext(f)[1].lower() in ('.jpg','.jpeg','.png','.webp')
        ]
        
        batch = []
        for p in paths:
            try:
                img = tf.keras.utils.load_img(p, target_size=IMG_SIZE)
                batch.append(tf.keras.utils.img_to_array(img))
            except Exception:
                pass
                
        if not batch:
            continue
            
        arr  = np.stack(batch).astype(np.float32)
        embs = embed_model.predict(arr, batch_size=BATCH, verbose=0)
        
        # Normalize embeddings to match browser-side L2 normalization
        norms = np.linalg.norm(embs, axis=1, keepdims=True)
        norms[norms == 0] = 1e-8
        embs_norm = embs / norms
        
        X_data.append(embs_norm)
        y_data.append(np.full((len(embs_norm),), idx, dtype=np.int32))
        print(f"  [{idx+1}/{num_classes}] {cls}: {len(embs_norm)} features extracted")
        
    X = np.concatenate(X_data, axis=0)
    y = np.concatenate(y_data, axis=0)
    print(f"Total dataset size: {len(X)} images.")
    
    # 4. Train Dense classification head
    print("[4] Training classification head...")
    
    # Split for validation check
    indices = np.arange(len(X))
    np.random.seed(42)
    np.random.shuffle(indices)
    split = int(0.85 * len(X))
    train_idx, val_idx = indices[:split], indices[split:]
    
    X_train, y_train = X[train_idx], y[train_idx]
    X_val, y_val = X[val_idx], y[val_idx]
    
    clf = tf.keras.Sequential([
        tf.keras.layers.Input(shape=(1280,)),
        tf.keras.layers.Dropout(0.3),
        tf.keras.layers.Dense(num_classes, activation='softmax')
    ])
    
    clf.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=0.002),
        loss='sparse_categorical_crossentropy',
        metrics=['accuracy']
    )
    
    # Train with validation split to monitor overfitting
    history = clf.fit(
        X_train, y_train,
        validation_data=(X_val, y_val),
        epochs=80,
        batch_size=32,
        verbose=1
    )
    
    # Retrain on full dataset for final deployment weights
    print("\n[5] Retraining on full dataset for final weights...")
    final_clf = tf.keras.Sequential([
        tf.keras.layers.Input(shape=(1280,)),
        tf.keras.layers.Dense(num_classes, activation='softmax')
    ])
    final_clf.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=0.002),
        loss='sparse_categorical_crossentropy',
        metrics=['accuracy']
    )
    final_clf.fit(X, y, epochs=60, batch_size=32, verbose=0)
    
    # Evaluate final model
    loss, acc = final_clf.evaluate(X, y, verbose=0)
    print(f"Final training accuracy on entire dataset: {acc*100:.2f}%")
    
    # Extract weights & biases
    dense_layer = final_clf.layers[0]
    weights, biases = dense_layer.get_weights() # weights: (1280, num_classes), biases: (num_classes,)
    
    # Save classifier payload
    payload = {
        "classes": class_names,
        "weights": weights.tolist(),
        "biases": biases.tolist()
    }
    
    print(f"[6] Saving classifier to {OUTPUT_FILE}...")
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(payload, f)
        
    # Save high-performance binary weights
    flat_weights = np.concatenate([weights.flatten(), biases.flatten()]).astype(np.float32)
    bin_output = os.path.join(os.path.dirname(OUTPUT_FILE), 'classifier.bin')
    with open(bin_output, 'wb') as f:
        f.write(flat_weights.tobytes())
    print(f"    Saved binary weights to {bin_output}")
    
    # Save labels mapping
    labels_output = os.path.join(os.path.dirname(OUTPUT_FILE), 'labels.json')
    with open(labels_output, 'w', encoding='utf-8') as f:
        json.dump(class_names, f)
    print(f"    Saved labels mapping to {labels_output}")
        
    print("Done! Classifier generated successfully.")

if __name__ == '__main__':
    main()
