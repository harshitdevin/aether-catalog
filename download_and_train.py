import os
import sys
import json
import shutil
import zipfile
import numpy as np
from PIL import Image, ImageEnhance, ImageOps
import requests
import re
import urllib.parse
from io import BytesIO
import time

# Mock modules to bypass potential import errors on Windows
from unittest.mock import MagicMock
for m in ['tensorflow_decision_forests', 'tensorflow_hub', 'jax',
          'jax.experimental', 'flax', 'flax.linen']:
    sys.modules[m] = MagicMock()

os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
import tensorflow as tf

DATASET_DIR = './dataset'
WEB_MODEL_DIR = './web_model'
SCRATCH_DIR = './scratch'

def purge_old_dataset():
    print("--- [1] Purging old dataset and model configs ---")
    if os.path.exists(DATASET_DIR):
        for item in os.listdir(DATASET_DIR):
            item_path = os.path.join(DATASET_DIR, item)
            if os.path.isdir(item_path):
                shutil.rmtree(item_path)
            else:
                os.remove(item_path)
        print("  Cleared ./dataset folder.")
    else:
        os.makedirs(DATASET_DIR, exist_ok=True)
        
    for item in ['X.npy', 'y.npy']:
        if os.path.exists(item):
            os.remove(item)
            print(f"  Removed old file: {item}")

def gather_maggi():
    print("\n--- [2] Gathering Maggi images ---")
    maggi_dir = os.path.join(DATASET_DIR, 'maggi')
    os.makedirs(maggi_dir, exist_ok=True)
    
    # 1. BigBasket IDs
    bb_ids = ["266109"]
    bb_downloaded = download_bigbasket_images("maggi", bb_ids, maggi_dir, count_offset=0)
    print(f"  Downloaded {bb_downloaded} Maggi images from BigBasket.")
    
    # 2. Bing Crawling
    queries = [
        "maggi noodles packet 2 minute",
        "maggi masala noodles package",
        "maggi noodles single pack"
    ]
    crawled = crawl_bing_images("maggi", queries, maggi_dir, max_images=30, count_offset=bb_downloaded)
    print(f"  Crawled {crawled} Maggi images from Bing.")
    print(f"  Total Maggi images: {len(os.listdir(maggi_dir))}")

def download_bigbasket_images(cls_name, prod_ids, dest_dir, count_offset=0):
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'}
    downloaded = count_offset
    
    for prod_id in prod_ids:
        bb_url = f"https://www.bigbasket.com/pd/{prod_id}/"
        print(f"  Fetching images from BigBasket for {cls_name} (ID: {prod_id})...")
        try:
            page_resp = requests.get(bb_url, headers=headers, timeout=10)
            if page_resp.status_code == 200:
                html_text = page_resp.text
                img_pattern = r'(https://www\.bbassets\.com/media/uploads/p/[^"\'\s<>\\#]+?' + prod_id + r'[^"\'\s<>\\#]+?\.(?:jpg|jpeg|png))'
                img_urls = re.findall(img_pattern, html_text)
                unique_urls = list(set(img_urls))
                
                for url in unique_urls:
                    # Upgrade to high resolution '/l/' path
                    url_high_res = re.sub(r'/media/uploads/p/[a-z]+/', '/media/uploads/p/l/', url)
                    try:
                        img_resp = requests.get(url_high_res, headers=headers, timeout=10)
                        if img_resp.status_code == 200:
                            img = Image.open(BytesIO(img_resp.content))
                            img = img.convert("RGB")
                            save_path = os.path.join(dest_dir, f"img_bb_{downloaded}.jpg")
                            img.save(save_path, "JPEG")
                            downloaded += 1
                            time.sleep(0.05)
                    except Exception as e:
                        print(f"    Failed to download image {url_high_res}: {e}")
            else:
                print(f"    Failed to load BigBasket page. Status code: {page_resp.status_code}")
        except Exception as e:
            print(f"    Request failed for ID {prod_id}: {e}")
            
    return downloaded - count_offset

def crawl_bing_images(cls_name, queries, dest_dir, max_images=30, count_offset=0):
    print(f"  Crawling Bing images for {cls_name}...")
    from icrawler.builtin import BingImageCrawler
    
    downloaded = count_offset
    temp_root = os.path.join(SCRATCH_DIR, f"temp_crawl_{cls_name}")
    shutil.rmtree(temp_root, ignore_errors=True)
    os.makedirs(temp_root, exist_ok=True)
    
    images_per_query = max(5, int(max_images / len(queries)))
    
    for q in queries:
        temp_dir = os.path.join(temp_root, q.replace(' ', '_'))
        os.makedirs(temp_dir, exist_ok=True)
        try:
            crawler = BingImageCrawler(downloader_threads=2, storage={'root_dir': temp_dir}, log_level=50)
            crawler.crawl(keyword=q, max_num=images_per_query)
            
            # Copy to target directory
            for f in os.listdir(temp_dir):
                src = os.path.join(temp_dir, f)
                if os.path.isfile(src):
                    ext = os.path.splitext(f)[1].lower()
                    if ext in ['.jpg', '.jpeg', '.png']:
                        dest = os.path.join(dest_dir, f"img_crawl_{downloaded}{ext}")
                        shutil.copy(src, dest)
                        downloaded += 1
        except Exception as e:
            print(f"    Crawler error for query '{q}': {e}")
            
    shutil.rmtree(temp_root, ignore_errors=True)
    return downloaded - count_offset

def gather_surfexcel():
    print("\n--- [3] Gathering Surf Excel images ---")
    surf_dir = os.path.join(DATASET_DIR, 'surfexcel')
    os.makedirs(surf_dir, exist_ok=True)
    
    # 1. BigBasket IDs
    bb_ids = ["40019234", "120287", "1215356", "100585"]
    bb_downloaded = download_bigbasket_images("surfexcel", bb_ids, surf_dir, count_offset=0)
    print(f"  Downloaded {bb_downloaded} Surf Excel images from BigBasket.")
    
    # 2. Bing Crawling
    queries = [
        "surf excel powder packet",
        "surf excel liquid detergent bottle",
        "surf excel bar soap",
        "surf excel easy wash 1kg"
    ]
    crawled = crawl_bing_images("surfexcel", queries, surf_dir, max_images=30, count_offset=bb_downloaded)
    print(f"  Crawled {crawled} Surf Excel images from Bing.")
    print(f"  Total Surf Excel images: {len(os.listdir(surf_dir))}")

def gather_tata_salt():
    print("\n--- [4] Gathering Tata Salt images ---")
    salt_dir = os.path.join(DATASET_DIR, 'tata_salt')
    os.makedirs(salt_dir, exist_ok=True)
    
    # 1. BigBasket IDs
    bb_ids = ["241600"]
    bb_downloaded = download_bigbasket_images("tata_salt", bb_ids, salt_dir, count_offset=0)
    print(f"  Downloaded {bb_downloaded} Tata Salt images from BigBasket.")
    
    # 2. Bing Crawling
    queries = [
        "tata salt packet 1kg",
        "tata iodized salt pack",
        "tata salt active package"
    ]
    crawled = crawl_bing_images("tata_salt", queries, salt_dir, max_images=30, count_offset=bb_downloaded)
    print(f"  Crawled {crawled} Tata Salt images from Bing.")
    print(f"  Total Tata Salt images: {len(os.listdir(salt_dir))}")

def gather_unknown_backgrounds():
    print("\n--- [5] Gathering robust Unknown background images ---")
    unknown_dir = os.path.join(DATASET_DIR, 'unknown')
    os.makedirs(unknown_dir, exist_ok=True)
    
    # Write a dummy black image to guarantee at least one base file
    import cv2
    dummy_img = np.zeros((224, 224, 3), dtype=np.uint8)
    cv2.imwrite(os.path.join(unknown_dir, 'dummy.jpg'), dummy_img)
    
    # Crawl real backgrounds to prevent false positives/wild guesses
    queries = [
        "empty kitchen counter wooden table",
        "hand holding nothing background",
        "office desk surface top view",
        "empty shelf background",
        "human palm close up background"
    ]
    crawled = crawl_bing_images("unknown", queries, unknown_dir, max_images=30, count_offset=1)
    print(f"  Crawled {crawled} background images for unknown class.")
    print(f"  Total Unknown background images: {len(os.listdir(unknown_dir))}")

def augment_image(image, index):
    """Generates a variation of the image using random crops, rotations, flips, and brightness."""
    # Start with a copy
    img = image.copy()
    
    # Random horizontal flip (50% chance)
    if np.random.rand() > 0.5:
        img = ImageOps.mirror(img)
        
    # Random rotation (-15 to 15 degrees)
    angle = np.random.uniform(-15, 15)
    img = img.rotate(angle, resample=Image.BICUBIC, expand=False, fillcolor=(128, 128, 128))
    
    # Random brightness adjustment (0.8 to 1.2)
    enhancer = ImageEnhance.Brightness(img)
    factor = np.random.uniform(0.8, 1.2)
    img = enhancer.enhance(factor)
    
    # Random crop (between 0% and 12% margin)
    w, h = img.size
    crop_margin = np.random.uniform(0.0, 0.12)
    if crop_margin > 0:
        left = int(w * crop_margin * np.random.rand())
        top = int(h * crop_margin * np.random.rand())
        right = w - int(w * crop_margin * np.random.rand())
        bottom = h - int(h * crop_margin * np.random.rand())
        if right > left + 50 and bottom > top + 50:
            img = img.crop((left, top, right, bottom))
            
    # Resize back to target
    img = img.resize((224, 224), Image.Resampling.LANCZOS)
    return img

def extract_features_and_train():
    print("\n--- [6] Extracting features and training model ---")
    # Get sorted classes list
    classes = sorted([d for d in os.listdir(DATASET_DIR) if os.path.isdir(os.path.join(DATASET_DIR, d))])
    num_classes = len(classes)
    print(f"  Target classes list: {classes}")
    
    # Build MobileNetV2 embedding extractor
    base = tf.keras.applications.MobileNetV2(
        input_shape=(224, 224, 3),
        include_top=False,
        weights='imagenet',
        pooling='avg'
    )
    base.trainable = False
    
    embed_in  = tf.keras.Input(shape=(224, 224, 3), dtype='float32')
    embed_x   = tf.keras.layers.Rescaling(1./127.5, offset=-1)(embed_in)
    embed_out = base(embed_x, training=False)
    embed_model = tf.keras.Model(embed_in, embed_out)
    
    X_list = []
    y_list = []
    
    # Define how many augmented images to create per base image
    # If a class has fewer images, we augment more to balance the dataset
    TARGET_IMAGES_PER_CLASS = 150
    
    for class_idx, cls in enumerate(classes):
        cls_dir = os.path.join(DATASET_DIR, cls)
        files = [os.path.join(cls_dir, f) for f in os.listdir(cls_dir) if os.path.isfile(os.path.join(cls_dir, f))]
        
        # Load all base images
        base_imgs = []
        for p in files:
            try:
                img = Image.open(p).convert("RGB")
                base_imgs.append(img)
            except Exception:
                pass
                
        if not base_imgs:
            print(f"  Warning: No valid images found for class {cls}!")
            continue
            
        print(f"  Class '{cls}': {len(base_imgs)} base images found. Augmenting to {TARGET_IMAGES_PER_CLASS} images...")
        
        augmented_batch = []
        
        # Keep base resized images
        for img in base_imgs:
            resized_img = img.resize((224, 224), Image.Resampling.LANCZOS)
            augmented_batch.append(tf.keras.utils.img_to_array(resized_img))
            
        # Create augmented variations
        augment_count = TARGET_IMAGES_PER_CLASS - len(base_imgs)
        for i in range(max(0, augment_count)):
            base_img = base_imgs[i % len(base_imgs)]
            aug_img = augment_image(base_img, i)
            augmented_batch.append(tf.keras.utils.img_to_array(aug_img))
            
        # Run prediction to get embeddings
        arr = np.stack(augmented_batch).astype(np.float32)
        embs = embed_model.predict(arr, batch_size=16, verbose=0)
        
        # L2-normalize embeddings to match frontend logic
        norms = np.linalg.norm(embs, axis=1, keepdims=True)
        norms[norms == 0] = 1e-8
        embs_norm = embs / norms
        
        X_list.append(embs_norm)
        y_list.append(np.full((len(embs_norm),), class_idx, dtype=np.int32))
        
        print(f"    Extracted {len(embs_norm)} embeddings for '{cls}'")
        
    X = np.concatenate(X_list, axis=0)
    y = np.concatenate(y_list, axis=0)
    
    # Save arrays
    np.save('X.npy', X)
    np.save('y.npy', y)
    print(f"  Saved features to X.npy ({X.shape}) and y.npy ({y.shape})")
    
    # 1. Compute Centroids
    print("\n  Computing centroids...")
    centroids_payload = {"classes": classes, "centroids": {}}
    W = np.zeros((1280, num_classes), dtype=np.float32)
    
    for idx, cls in enumerate(classes):
        class_features = X[y == idx]
        mean_feat = np.mean(class_features, axis=0)
        norm = np.linalg.norm(mean_feat)
        if norm > 0:
            mean_feat /= norm
        centroids_payload["centroids"][cls] = mean_feat.tolist()
        W[:, idx] = mean_feat
        print(f"    Centroid computed for '{cls}' (norm={np.linalg.norm(mean_feat):.4f})")
        
    os.makedirs(WEB_MODEL_DIR, exist_ok=True)
    with open(os.path.join(WEB_MODEL_DIR, 'centroids.json'), 'w', encoding='utf-8') as f:
        json.dump(centroids_payload, f)
    print("    Saved web_model/centroids.json")
    
    # 2. Train Dense Softmax classifier
    print("\n  Training Dense classifier...")
    # Shuffle dataset
    indices = np.arange(len(X))
    np.random.seed(42)
    np.random.shuffle(indices)
    X_shuffled = X[indices]
    y_shuffled = y[indices]
    
    # Split
    split = int(0.85 * len(X))
    X_train, y_train = X_shuffled[:split], y_shuffled[:split]
    X_val, y_val = X_shuffled[split:], y_shuffled[split:]
    
    clf = tf.keras.Sequential([
        tf.keras.layers.Input(shape=(1280,)),
        tf.keras.layers.Dropout(0.35),
        tf.keras.layers.Dense(num_classes, activation='softmax')
    ])
    
    clf.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=0.005),
        loss='sparse_categorical_crossentropy',
        metrics=['accuracy']
    )
    
    history = clf.fit(
        X_train, y_train,
        validation_data=(X_val, y_val),
        epochs=80,
        batch_size=32,
        verbose=1
    )
    
    # Retrain on full dataset
    print("  Retraining on full dataset for final weights...")
    final_clf = tf.keras.Sequential([
        tf.keras.layers.Input(shape=(1280,)),
        tf.keras.layers.Dense(num_classes, activation='softmax')
    ])
    final_clf.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=0.003),
        loss='sparse_categorical_crossentropy',
        metrics=['accuracy']
    )
    final_clf.fit(X, y, epochs=50, batch_size=32, verbose=0)
    
    loss, acc = final_clf.evaluate(X, y, verbose=0)
    print(f"  Final training accuracy on entire dataset: {acc*100:.2f}%")
    
    # Extract weights & biases
    dense_layer = final_clf.layers[0]
    weights, biases = dense_layer.get_weights()
    
    classifier_payload = {
        "classes": classes,
        "weights": weights.tolist(),
        "biases": biases.tolist()
    }
    with open(os.path.join(WEB_MODEL_DIR, 'classifier.json'), 'w', encoding='utf-8') as f:
        json.dump(classifier_payload, f)
    print("    Saved web_model/classifier.json")
    
    # Save labels.json
    with open(os.path.join(WEB_MODEL_DIR, 'labels.json'), 'w', encoding='utf-8') as f:
        json.dump(classes, f)
    print("    Saved web_model/labels.json")
    
    print("\nModel training completed successfully!")

if __name__ == "__main__":
    purge_old_dataset()
    gather_maggi()
    gather_surfexcel()
    gather_tata_salt()
    gather_unknown_backgrounds()
    extract_features_and_train()
