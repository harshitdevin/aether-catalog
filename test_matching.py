"""
test_matching.py
Tests the accuracy of centroid-based cosine similarity classification on the dataset.
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
CENTROIDS_FILE = './web_model/centroids.json'
IMG_SIZE = (224, 224)

def main():
    # 1. Load centroids.json
    if not os.path.exists(CENTROIDS_FILE):
        print(f"Error: {CENTROIDS_FILE} does not exist.")
        return
        
    with open(CENTROIDS_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    classes = data['classes']
    centroids = data['centroids']
    print(f"Loaded {len(classes)} classes from centroids.json")
    
    # Convert centroids dict to numpy matrix for fast cosine similarity check
    # centroids shape: (num_classes, 1280)
    num_classes = len(classes)
    centroid_matrix = np.zeros((num_classes, 1280), dtype=np.float32)
    for idx, cls in enumerate(classes):
        centroid_matrix[idx] = centroids[cls]
        
    # 2. Build MobileNetV2 embedding model
    inp  = tf.keras.Input(shape=(224, 224, 3), dtype='float32')
    x    = tf.keras.layers.Rescaling(1./127.5, offset=-1)(inp)
    base = tf.keras.applications.MobileNetV2(
        input_shape=(224, 224, 3), include_top=False,
        weights='imagenet', pooling='avg')
    base.trainable = False
    out  = base(x, training=False)
    embed_model = tf.keras.Model(inp, out)
    
    # 3. Predict each image in dataset
    correct = 0
    total = 0
    
    # Sample a few classes or run on all
    for idx, cls in enumerate(classes):
        cls_dir = os.path.join(DATASET_DIR, cls)
        if not os.path.isdir(cls_dir):
            continue
            
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
        embs = embed_model.predict(arr, batch_size=16, verbose=0) # (N, 1280)
        
        # Normalize each embedding
        norms = np.linalg.norm(embs, axis=1, keepdims=True)
        norms[norms == 0] = 1e-8
        embs_norm = embs / norms # (N, 1280)
        
        # Calculate dot products (cosine similarity) against all centroids
        # embs_norm: (N, 1280)
        # centroid_matrix.T: (1280, num_classes)
        # sims: (N, num_classes)
        sims = np.dot(preprocessed_embs := embs_norm, centroid_matrix.T)
        
        preds = np.argmax(sims, axis=1)
        for p_idx in preds:
            pred_cls = classes[p_idx]
            if pred_cls == cls:
                correct += 1
            total += 1
            
    accuracy = (correct / total) * 100 if total > 0 else 0
    print(f"Centroid matching accuracy on dataset: {correct}/{total} ({accuracy:.2f}%)")

if __name__ == '__main__':
    main()
