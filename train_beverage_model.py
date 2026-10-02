import os
import sys
import json
import shutil
import numpy as np
from PIL import Image, ImageEnhance, ImageOps

# Mock modules to bypass potential import errors on Windows
from unittest.mock import MagicMock
for m in ['tensorflow_decision_forests', 'tensorflow_hub', 'jax',
          'jax.experimental', 'flax', 'flax.linen']:
    sys.modules[m] = MagicMock()

os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
import tensorflow as tf

DATASET_DIR = './dataset'
WEB_MODEL_DIR = './web_model'

def augment_image(image):
    """Generates a variation of the image using random crops, rotations, flips, and brightness."""
    img = image.copy()
    
    if np.random.rand() > 0.5:
        img = ImageOps.mirror(img)
        
    angle = np.random.uniform(-15, 15)
    img = img.rotate(angle, resample=Image.BICUBIC, expand=False, fillcolor=(128, 128, 128))
    
    enhancer = ImageEnhance.Brightness(img)
    factor = np.random.uniform(0.8, 1.2)
    img = enhancer.enhance(factor)
    
    w, h = img.size
    crop_margin = np.random.uniform(0.0, 0.12)
    if crop_margin > 0:
        left = int(w * crop_margin * np.random.rand())
        top = int(h * crop_margin * np.random.rand())
        right = w - int(w * crop_margin * np.random.rand())
        bottom = h - int(h * crop_margin * np.random.rand())
        if right > left + 50 and bottom > top + 50:
            img = img.crop((left, top, right, bottom))
            
    img = img.resize((224, 224), Image.Resampling.LANCZOS)
    return img

def train_model():
    print("--- [1] Extracting features & training Indian Grocery Beverages classifier ---")
    classes = sorted([d for d in os.listdir(DATASET_DIR) if os.path.isdir(os.path.join(DATASET_DIR, d))])
    num_classes = len(classes)
    print(f"Target classes list ({num_classes}): {classes}")
    
    base = tf.keras.applications.MobileNetV2(
        input_shape=(224, 224, 3),
        include_top=False,
        weights='imagenet',
        pooling='avg'
    )
    base.trainable = False
    
    embed_in = tf.keras.Input(shape=(224, 224, 3), dtype='float32')
    embed_x = tf.keras.layers.Rescaling(1./127.5, offset=-1)(embed_in)
    embed_out = base(embed_x, training=False)
    embed_model = tf.keras.Model(embed_in, embed_out)
    
    X_list = []
    y_list = []
    TARGET_IMAGES_PER_CLASS = 250
    
    for class_idx, cls in enumerate(classes):
        cls_dir = os.path.join(DATASET_DIR, cls)
        files = [os.path.join(cls_dir, f) for f in os.listdir(cls_dir) if os.path.isfile(os.path.join(cls_dir, f))]
        
        base_imgs = []
        for p in files:
            try:
                img = Image.open(p).convert("RGB")
                base_imgs.append(img)
            except Exception:
                pass
                
        if not base_imgs:
            print(f"Warning: No valid images found for class {cls}!")
            continue
            
        print(f"Class '{cls}': {len(base_imgs)} base images. Augmenting to {TARGET_IMAGES_PER_CLASS}...")
        augmented_batch = []
        
        for img in base_imgs:
            resized_img = img.resize((224, 224), Image.Resampling.LANCZOS)
            augmented_batch.append(tf.keras.utils.img_to_array(resized_img))
            
        augment_count = TARGET_IMAGES_PER_CLASS - len(base_imgs)
        for i in range(max(0, augment_count)):
            base_img = base_imgs[i % len(base_imgs)]
            aug_img = augment_image(base_img)
            augmented_batch.append(tf.keras.utils.img_to_array(aug_img))
            
        arr = np.stack(augmented_batch).astype(np.float32)
        embs = embed_model.predict(arr, batch_size=16, verbose=0)
        
        norms = np.linalg.norm(embs, axis=1, keepdims=True)
        norms[norms == 0] = 1e-8
        embs_norm = embs / norms
        
        X_list.append(embs_norm)
        y_list.append(np.full((len(embs_norm),), class_idx, dtype=np.int32))
        
    X = np.concatenate(X_list, axis=0)
    y = np.concatenate(y_list, axis=0)
    
    np.save('X.npy', X)
    np.save('y.npy', y)
    print(f"Saved feature embeddings to X.npy {X.shape} and y.npy {y.shape}")
    
    # 1. Compute Centroids
    print("\n--- [2] Computing Centroids ---")
    centroids_payload = {"classes": classes, "centroids": {}}
    for idx, cls in enumerate(classes):
        class_features = X[y == idx]
        mean_feat = np.mean(class_features, axis=0)
        norm = np.linalg.norm(mean_feat)
        if norm > 0:
            mean_feat /= norm
        centroids_payload["centroids"][cls] = mean_feat.tolist()
        print(f"  Centroid computed for '{cls}' (norm={np.linalg.norm(mean_feat):.4f})")
        
    os.makedirs(WEB_MODEL_DIR, exist_ok=True)
    with open(os.path.join(WEB_MODEL_DIR, 'centroids.json'), 'w', encoding='utf-8') as f:
        json.dump(centroids_payload, f)
    print("  Saved web_model/centroids.json")
    
    # 2. Train Classifier
    print("\n--- [3] Training Dense Softmax Classifier ---")
    final_clf = tf.keras.Sequential([
        tf.keras.layers.Input(shape=(1280,)),
        tf.keras.layers.Dense(num_classes, activation='softmax')
    ])
    final_clf.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=0.003),
        loss='sparse_categorical_crossentropy',
        metrics=['accuracy']
    )
    final_clf.fit(X, y, epochs=150, batch_size=32, verbose=0)
    
    loss, acc = final_clf.evaluate(X, y, verbose=0)
    print(f"Final dataset training accuracy: {acc*100:.2f}%")
    
    dense_layer = final_clf.layers[0]
    weights, biases = dense_layer.get_weights()
    
    classifier_payload = {
        "classes": classes,
        "weights": weights.tolist(),
        "biases": biases.tolist()
    }
    with open(os.path.join(WEB_MODEL_DIR, 'classifier.json'), 'w', encoding='utf-8') as f:
        json.dump(classifier_payload, f)
    print("  Saved web_model/classifier.json")
    
    flat_weights = np.concatenate([weights.flatten(), biases.flatten()]).astype(np.float32)
    bin_output = os.path.join(WEB_MODEL_DIR, 'classifier.bin')
    with open(bin_output, 'wb') as f:
        f.write(flat_weights.tobytes())
    print(f"  Saved binary weights to {bin_output}")
    
    with open(os.path.join(WEB_MODEL_DIR, 'labels.json'), 'w', encoding='utf-8') as f:
        json.dump(classes, f)
    print("  Saved web_model/labels.json")
    
    print("\nIndian Grocery Beverages model training completed successfully!")

if __name__ == "__main__":
    train_model()
