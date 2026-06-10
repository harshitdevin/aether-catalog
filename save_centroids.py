"""
save_centroids.py
Extracts MobileNetV2 centroids from dataset and saves them as centroids.json.
No model export needed — JS loads MobileNet from CDN and does matching.
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
OUTPUT_FILE = './web_model/centroids.json'
IMG_SIZE    = (224, 224)
BATCH       = 16

def main():
    class_names = sorted([
        d for d in os.listdir(DATASET_DIR)
        if os.path.isdir(os.path.join(DATASET_DIR, d))
    ])
    num_classes = len(class_names)
    print(f"[1] Classes: {num_classes}")

    # MobileNetV2 — same weights the browser TF.js mobilenet package uses
    print("[2] Building MobileNetV2 feature extractor...")
    inp  = tf.keras.Input(shape=(224, 224, 3), dtype='float32')
    x    = tf.keras.layers.Rescaling(1./127.5, offset=-1)(inp)
    base = tf.keras.applications.MobileNetV2(
        input_shape=(224, 224, 3), include_top=False,
        weights='imagenet', pooling='avg')
    base.trainable = False
    out  = base(x, training=False)
    embed_model = tf.keras.Model(inp, out)

    print("[3] Extracting centroids...")
    centroids = {}

    for idx, cls in enumerate(class_names):
        cls_dir = os.path.join(DATASET_DIR, cls)
        paths = [
            os.path.join(cls_dir, f) for f in os.listdir(cls_dir)
            if os.path.isfile(os.path.join(cls_dir, f))
            and os.path.splitext(f)[1].lower() in ('.jpg','.jpeg','.png','.webp')
        ]
        if not paths:
            print(f"  [{idx+1}/{num_classes}] {cls}: no images, skipping")
            continue

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
        c    = embs.mean(axis=0)
        n    = np.linalg.norm(c)
        if n > 0:
            c /= n

        centroids[cls] = c.tolist()
        print(f"  [{idx+1}/{num_classes}] {cls}: {len(batch)} imgs OK")

    print(f"[4] Saving {len(centroids)} centroids to {OUTPUT_FILE}...")
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump({'classes': class_names, 'centroids': centroids}, f)

    print(f"Done! {len(centroids)} class centroids saved.")
    print(f"File size: {os.path.getsize(OUTPUT_FILE) / 1024:.1f} KB")

if __name__ == '__main__':
    main()
