"""
rebuild_model.py
Rebuilds web_model from existing dataset without re-crawling.
Uses SavedModel export + tensorflowjs_converter CLI for maximum TF.js compatibility.
"""
import os, sys, json, shutil
sys.stdout.reconfigure(encoding='utf-8')

# Mock unused modules
from unittest.mock import MagicMock
for m in ['tensorflow_decision_forests','tensorflow_hub','jax',
          'jax.experimental','flax','flax.linen']:
    sys.modules[m] = MagicMock()

os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'

import numpy as np
import tensorflow as tf

DATASET_DIR = './dataset'
OUTPUT_DIR  = './web_model'
SAVED_DIR   = './saved_model_tmp'
IMG_SIZE    = (224, 224)
BATCH       = 16

def main():
    # 1. Class names
    class_names = sorted([
        d for d in os.listdir(DATASET_DIR)
        if os.path.isdir(os.path.join(DATASET_DIR, d))
        and not d.startswith('temp_')
    ])
    num_classes = len(class_names)
    print(f"[1] Classes found: {num_classes}")
    print(f"    First 5: {class_names[:5]}")

    # 2. MobileNetV2 embedding model (input = raw 0-255 float32)
    print("[2] Building MobileNetV2 feature extractor...")
    base = tf.keras.applications.MobileNetV2(
        input_shape=(224, 224, 3),
        include_top=False,
        weights='imagenet',
        pooling='avg'
    )
    base.trainable = False
    # preprocess inside model: /127.5 - 1
    embed_in  = tf.keras.Input(shape=(224, 224, 3), dtype='float32')
    embed_x   = tf.keras.layers.Rescaling(1./127.5, offset=-1)(embed_in)
    embed_out = base(embed_x, training=False)
    embed_model = tf.keras.Model(embed_in, embed_out)

    # 3. Extract centroids
    print("[3] Extracting class centroids...")
    DIM = 1280
    W   = np.zeros((DIM, num_classes), dtype=np.float32)

    for idx, cls in enumerate(class_names):
        cls_dir = os.path.join(DATASET_DIR, cls)
        paths = [
            os.path.join(cls_dir, f) for f in os.listdir(cls_dir)
            if os.path.isfile(os.path.join(cls_dir, f))
            and os.path.splitext(f)[1].lower() in ('.jpg','.jpeg','.png','.webp')
        ]
        if not paths:
            print(f"  [{idx+1}/{num_classes}] {cls}: NO images - zero vector")
            continue

        batch = []
        for p in paths:
            try:
                img = tf.keras.utils.load_img(p, target_size=IMG_SIZE)
                batch.append(tf.keras.utils.img_to_array(img))
            except Exception:
                pass

        if not batch:
            print(f"  [{idx+1}/{num_classes}] {cls}: all images unreadable")
            continue

        arr  = np.stack(batch).astype(np.float32)      # (N,224,224,3)
        embs = embed_model.predict(arr, batch_size=BATCH, verbose=0)  # (N,1280)
        c    = embs.mean(axis=0)
        n    = np.linalg.norm(c)
        if n > 0:
            c /= n
        W[:, idx] = c
        print(f"  [{idx+1}/{num_classes}] {cls}: {len(batch)} imgs OK")

    print("[3] Centroids extracted.")

    # 4. Build final Sequential model
    print("[4] Building classification model...")
    model = tf.keras.Sequential(name='grocery_classifier')
    model.add(tf.keras.layers.InputLayer(input_shape=(224, 224, 3), dtype='float32'))
    model.add(tf.keras.layers.Rescaling(1./127.5, offset=-1))
    model.add(base)
    model.add(tf.keras.layers.Dense(num_classes, activation='softmax',
                                     use_bias=False, name='predictions'))
    model.build((None, 224, 224, 3))

    # Inject centroids
    model.get_layer('predictions').set_weights([W])
    print("    Centroids injected.")

    # Sanity
    dummy = np.random.randint(0, 256, (1, 224, 224, 3)).astype(np.float32)
    pred  = model.predict(dummy, verbose=0)
    top   = int(np.argmax(pred[0]))
    print(f"    Sanity: top='{class_names[top]}' ({pred[0][top]*100:.1f}%)  sum={pred[0].sum():.4f}")

    # 5. Save as SavedModel, then convert via CLI
    print("[5] Saving as TF SavedModel...")
    if os.path.exists(SAVED_DIR):
        shutil.rmtree(SAVED_DIR)
    model.export(SAVED_DIR)
    print(f"    SavedModel written to {SAVED_DIR}")

    print("[6] Converting to TF.js format via CLI...")
    if os.path.exists(OUTPUT_DIR):
        shutil.rmtree(OUTPUT_DIR)
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    cmd = (f'tensorflowjs_converter '
           f'--input_format=tf_saved_model '
           f'--output_format=tfjs_graph_model '
           f'--signature_name=serving_default '
           f'--saved_model_tags=serve '
           f'"{SAVED_DIR}" "{OUTPUT_DIR}"')
    print(f"    Running: {cmd}")
    ret = os.system(cmd)

    if ret != 0:
        print("    CLI failed - trying tfjs Python API fallback...")
        import tensorflowjs as tfjs
        if os.path.exists(OUTPUT_DIR):
            shutil.rmtree(OUTPUT_DIR)
        os.makedirs(OUTPUT_DIR, exist_ok=True)
        tfjs.converters.save_keras_model(model, OUTPUT_DIR)
        print("    tfjs Python API export done.")

    # Check output
    if os.path.exists(OUTPUT_DIR):
        files = os.listdir(OUTPUT_DIR)
        print(f"    Output files: {files}")
    else:
        print("    ERROR: output dir not created!")
        return

    # 7. Write labels
    print("[7] Writing labels.json...")
    with open(os.path.join(OUTPUT_DIR, 'labels.json'), 'w') as f:
        json.dump(class_names, f)
    print(f"    Done. {num_classes} labels saved.")

    # Save classifier.json (for backward compatibility)
    print("    Writing classifier.json...")
    biases = np.zeros(num_classes, dtype=np.float32)
    payload = {
        "classes": class_names,
        "weights": W.tolist(),
        "biases": biases.tolist()
    }
    with open(os.path.join(OUTPUT_DIR, 'classifier.json'), 'w', encoding='utf-8') as f:
        json.dump(payload, f)
    print("    Saved classifier.json")
    
    # Save high-performance classifier.bin (flat Float32Array)
    print("    Writing classifier.bin...")
    flat_weights = np.concatenate([W.flatten(), biases.flatten()]).astype(np.float32)
    bin_output = os.path.join(OUTPUT_DIR, 'classifier.bin')
    with open(bin_output, 'wb') as f:
        f.write(flat_weights.tobytes())
    print(f"    Saved binary weights to {bin_output}")

    # Save centroids.json (required by the server-side OOD centroid check)
    print("    Writing centroids.json...")
    centroids_payload = {
        "classes": class_names,
        "centroids": {cls: W[:, idx].tolist() for idx, cls in enumerate(class_names)}
    }
    with open(os.path.join(OUTPUT_DIR, 'centroids.json'), 'w', encoding='utf-8') as f:
        json.dump(centroids_payload, f)
    print("    Saved centroids.json")

    # Cleanup
    if os.path.exists(SAVED_DIR):
        shutil.rmtree(SAVED_DIR)

    print("\nDone! Restart server + hard-refresh browser (Ctrl+Shift+R).")

if __name__ == '__main__':
    main()
