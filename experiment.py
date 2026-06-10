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
IMG_SIZE = (224, 224)
BATCH = 16

# 1. Get classes
class_names = sorted([
    d for d in os.listdir(DATASET_DIR)
    if os.path.isdir(os.path.join(DATASET_DIR, d))
])
num_classes = len(class_names)

# 2. Embed model
inp  = tf.keras.Input(shape=(224, 224, 3), dtype='float32')
x    = tf.keras.layers.Rescaling(1./127.5, offset=-1)(inp)
base = tf.keras.applications.MobileNetV2(
    input_shape=(224, 224, 3), include_top=False,
    weights='imagenet', pooling='avg')
base.trainable = False
out  = base(x, training=False)
embed_model = tf.keras.Model(inp, out)

# 3. Extract all
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
    if not batch: continue
    arr  = np.stack(batch).astype(np.float32)
    embs = embed_model.predict(arr, batch_size=BATCH, verbose=0)
    norms = np.linalg.norm(embs, axis=1, keepdims=True)
    norms[norms == 0] = 1e-8
    embs_norm = embs / norms
    X_data.append(embs_norm)
    y_data.append(np.full((len(embs_norm),), idx, dtype=np.int32))

X = np.concatenate(X_data, axis=0)
y = np.concatenate(y_data, axis=0)

# Save X and y temporarily
np.save('X.npy', X)
np.save('y.npy', y)
print("Saved X.npy and y.npy. Now running experiments...")

for lr in [0.01, 0.05, 0.1, 0.3, 0.5]:
    model = tf.keras.Sequential([
        tf.keras.layers.Input(shape=(1280,)),
        tf.keras.layers.Dense(num_classes, activation='softmax')
    ])
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=lr),
        loss='sparse_categorical_crossentropy',
        metrics=['accuracy']
    )
    h = model.fit(X, y, epochs=100, batch_size=32, verbose=0)
    print(f"LR: {lr} -> Epoch 50 Acc: {h.history['accuracy'][49]:.4f}, Epoch 100 Acc: {h.history['accuracy'][99]:.4f}")
