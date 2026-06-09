import os
import sys
from unittest.mock import MagicMock
# Mock modules to bypass Windows import and missing dependency errors in tensorflowjs
sys.modules['tensorflow_decision_forests'] = MagicMock()
sys.modules['tensorflow_hub'] = MagicMock()
sys.modules['jax'] = MagicMock()
sys.modules['jax.experimental'] = MagicMock()
sys.modules['flax'] = MagicMock()
sys.modules['flax.linen'] = MagicMock()

import json
import shutil
import numpy as np
from PIL import Image, ImageDraw, ImageFont
import requests
import re
import urllib.parse
from io import BytesIO
import time

# Set environment variables to silence TF logs
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

import tensorflow as tf

def generate_synthetic_for_class(cls_dir, cls, bg_color, num_images=20):
    """Generates synthetic images for a specific class as a fallback."""
    print(f"Generating {num_images} synthetic backup images for class: {cls}...")
    for i in range(num_images):
        if cls == "unknown":
            # 50% skin tones, 50% neutral backgrounds
            if i % 2 == 0:
                # Skin tone hand representation
                r = np.random.randint(100, 245)
                g = int(r * np.random.uniform(0.6, 0.8))
                b = int(g * np.random.uniform(0.6, 0.8))
                curr_bg = (r, g, b)
            else:
                # Neutral background color (beige, grey, wood, brown)
                bg_type = np.random.randint(0, 3)
                if bg_type == 0: # Grey
                    val = np.random.randint(100, 220)
                    curr_bg = (val, val, val)
                elif bg_type == 1: # Beige/wood
                    r = np.random.randint(130, 220)
                    g = int(r * np.random.uniform(0.8, 0.9))
                    b = int(g * np.random.uniform(0.7, 0.8))
                    curr_bg = (r, g, b)
                else: # Dark/brown
                    r = np.random.randint(50, 110)
                    g = int(r * np.random.uniform(0.5, 0.7))
                    b = int(g * np.random.uniform(0.4, 0.6))
                    curr_bg = (r, g, b)
            img = Image.new('RGB', (224, 224), curr_bg)
            draw = ImageDraw.Draw(img)
            # Add random lines to simulate texture/clutter
            for _ in range(np.random.randint(2, 6)):
                draw.line([np.random.randint(0, 224), np.random.randint(0, 224), 
                           np.random.randint(0, 224), np.random.randint(0, 224)], 
                          fill=tuple(np.random.randint(0, 256, 3)), width=np.random.randint(1, 4))
        else:
            img = Image.new('RGB', (224, 224), bg_color)
            draw = ImageDraw.Draw(img)
            shape_color = tuple((c + np.random.randint(-30, 30)) % 256 for c in bg_color)
            draw.rectangle([np.random.randint(10, 50), np.random.randint(10, 50), 
                            np.random.randint(170, 210), np.random.randint(170, 210)], 
                           fill=shape_color, outline=(255, 255, 255))
            label_color = (255, 255, 255) if sum(bg_color) < 380 else (0, 0, 0)
            draw.rectangle([20, 90, 204, 130], fill=label_color)
        img_path = os.path.join(cls_dir, f"synth_img_{i}.jpg")
        img.save(img_path, "JPEG")

def download_real_dataset_fallback(base_dir, classes):
    """Downloads real product images directly from BigBasket using static product IDs."""
    print("Kaggle download failed or empty. Downloading real product images directly from BigBasket...")
    
    if os.path.exists(base_dir):
        # Clean any old folders
        shutil.rmtree(base_dir)
    os.makedirs(base_dir, exist_ok=True)
    
    product_ids = {
        "amul_butter": ["104860"],
        "atta": ["126906"],
        "dettol": ["266580"],
        "haldirams": ["40053876"],
        "maggi": ["266109"],
        "mustard_oil": ["274145"],
        "taj_mahal": ["266154"],
        "tata_salt": ["241600"],
        "unknown": ["100003", "40019234", "120287", "200039", "120006", "266585", "40003582", "253541"]
    }
    
    colors = {
        "amul_butter": (250, 240, 190),
        "atta": (234, 88, 12),
        "dettol": (22, 163, 74),
        "haldirams": (220, 38, 38),
        "maggi": (234, 179, 8),
        "mustard_oil": (202, 138, 4),
        "taj_mahal": (30, 27, 75),
        "tata_salt": (59, 130, 246),
        "unknown": (128, 128, 128)
    }
    
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'}
    
    for cls in classes:
        cls_dir = os.path.join(base_dir, cls)
        os.makedirs(cls_dir, exist_ok=True)
        
        prod_ids = product_ids.get(cls, [])
        if not prod_ids:
            print(f"\nNo product IDs mapped for class '{cls}'. Generating synthetic shapes...")
            bg_color = colors.get(cls, (128, 128, 128))
            generate_synthetic_for_class(cls_dir, cls, bg_color, num_images=20)
            continue
            
        downloaded = 0
        for prod_id in prod_ids:
            if downloaded >= 25:
                break
                
            bb_url = f"https://www.bigbasket.com/pd/{prod_id}/"
            print(f"\nFetching images for class: {cls} (ID: {prod_id})...")
            
            try:
                page_resp = requests.get(bb_url, headers=headers, timeout=10)
                if page_resp.status_code == 200:
                    html_text = page_resp.text
                    img_pattern = r'(https://www\.bbassets\.com/media/uploads/p/[^"\'\s<>\\#]+?' + prod_id + r'[^"\'\s<>\\#]+?\.(?:jpg|jpeg|png))'
                    img_urls = re.findall(img_pattern, html_text)
                    unique_urls = list(set(img_urls))
                    print(f"  Found {len(unique_urls)} raw image URLs for ID {prod_id}")
                    
                    for url in unique_urls:
                        if downloaded >= 25:
                            break
                        # Standardize to high-res '/l/'
                        url_high_res = re.sub(r'/media/uploads/p/[a-z]+/', '/media/uploads/p/l/', url)
                        try:
                            img_resp = requests.get(url_high_res, headers=headers, timeout=10)
                            if img_resp.status_code == 200:
                                img = Image.open(BytesIO(img_resp.content))
                                img = img.convert("RGB")
                                save_path = os.path.join(cls_dir, f"img_{downloaded}.jpg")
                                img.save(save_path, "JPEG")
                                downloaded += 1
                                time.sleep(0.02)
                        except Exception:
                            pass
                else:
                    print(f"  Failed to load page. Status: {page_resp.status_code}")
            except Exception as err:
                print(f"  Request failed: {err}")
                
        print(f"  Downloaded {downloaded} real images for class: {cls}")
        
        # If we got less than 15 real images, top up with synthetic fallback
        if downloaded < 15:
            bg_color = colors.get(cls, (128, 128, 128))
            generate_synthetic_for_class(cls_dir, cls, bg_color, num_images=(20 - downloaded))

def main():
    dataset_dir = "./dataset"
    classes = [
        "amul_butter", "atta", "dettol", "haldirams", 
        "maggi", "mustard_oil", "taj_mahal", "tata_salt", "unknown"
    ]
    
    # 1. Download dataset from Kaggle
    download_success = False
    if not os.path.exists(dataset_dir):
        print("Dataset directory not found. Attempting to download from Kaggle...")
        try:
            import kaggle
            print("Kaggle API found. Authenticating and downloading dataset 'themrityunjaypathak/indian-groceries-dataset'...")
            kaggle.api.dataset_download_files(
                'themrityunjaypathak/indian-groceries-dataset', 
                path=dataset_dir, 
                unzip=True
            )
            print("Download and extraction complete!")
            download_success = True
        except Exception as e:
            print(f"Kaggle download failed: {e}")
            print("Please ensure kaggle.json is correctly placed and configured.")
    else:
        print("Dataset directory already exists. Skipping download.")
        download_success = True
        
    # Check if dataset actually contains images or folders, otherwise build fallback using DDG Lite + BigBasket
    if not download_success or not os.path.exists(dataset_dir) or len(os.listdir(dataset_dir)) == 0:
        download_real_dataset_fallback(dataset_dir, classes)
        
    # 2. Load dataset
    print("Loading and preprocessing dataset...")
    img_size = (224, 224)
    batch_size = 8
    
    # In case folders have slightly different names, map/list directories
    actual_classes = [d for d in os.listdir(dataset_dir) if os.path.isdir(os.path.join(dataset_dir, d))]
    print(f"Found directories: {actual_classes}")
    
    # Filter classes we want to map to (or use whatever is in dataset if custom)
    if len(actual_classes) == 0:
        print("Error: No class directories found.")
        sys.exit(1)
        
    # Load training and validation sets
    train_ds = tf.keras.utils.image_dataset_from_directory(
        dataset_dir,
        validation_split=0.2,
        subset="training",
        seed=123,
        image_size=img_size,
        batch_size=batch_size,
        label_mode='categorical'
    )
    
    val_ds = tf.keras.utils.image_dataset_from_directory(
        dataset_dir,
        validation_split=0.2,
        subset="validation",
        seed=123,
        image_size=img_size,
        batch_size=batch_size,
        label_mode='categorical'
    )
    
    class_names = train_ds.class_names
    print(f"Dataset classes loaded: {class_names}")
    
    # Apply data augmentation pipeline to train_ds to expand dataset and prevent overfitting
    print("Applying data augmentation pipeline to training dataset...")
    data_augmentation = tf.keras.Sequential([
        tf.keras.layers.RandomFlip("horizontal"),
        tf.keras.layers.RandomRotation(0.15),
        tf.keras.layers.RandomZoom(0.15),
        tf.keras.layers.RandomTranslation(0.1, 0.1)
    ])
    train_ds = train_ds.map(lambda x, y: (data_augmentation(x, training=True), y))
    
    # 3. Build Model (MobileNetV2 Transfer Learning)
    print("Building transfer learning classifier with MobileNetV2...")
    base_model = tf.keras.applications.MobileNetV2(
        input_shape=(224, 224, 3),
        include_top=False,
        weights='imagenet'
    )
    base_model.trainable = False  # Freeze pretrained weights for fast CPU training
    
    # Build Keras sequential model
    model = tf.keras.Sequential([
        tf.keras.layers.Rescaling(1./127.5, offset=-1, input_shape=(224, 224, 3)), # MobileNetV2 input normalization
        base_model,
        tf.keras.layers.GlobalAveragePooling2D(),
        tf.keras.layers.Dense(64, activation='relu'),
        tf.keras.layers.Dropout(0.2),
        tf.keras.layers.Dense(len(class_names), activation='softmax')
    ])
    
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=0.001),
        loss='categorical_crossentropy',
        metrics=['accuracy']
    )
    
    model.summary()
    
    # 4. Train Model
    epochs = 5
    print(f"Starting model training for {epochs} epochs...")
    history = model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=epochs
    )
    
    # 5. Export to TensorFlow.js
    print("Converting model to TensorFlow.js web format...")
    output_dir = "./web_model"
    if os.path.exists(output_dir):
        shutil.rmtree(output_dir)
    os.makedirs(output_dir, exist_ok=True)
    
    # Export using tfjs-converter
    import tensorflowjs as tfjs
    try:
        tfjs.converters.save_keras_model(model, output_dir)
        print("TensorFlow.js model exported successfully!")
    except Exception as conv_err:
        print(f"tfjs export failed: {conv_err}")
        print("Attempting command line conversion fallback...")
        # Save as keras model first
        keras_model_path = "./temp_keras_model.keras"
        model.save(keras_model_path)
        # Use tfjs_converter command line
        os.system(f"tensorflowjs_converter --input_format=keras {keras_model_path} {output_dir}")
        if os.path.exists(keras_model_path):
            os.remove(keras_model_path)
            
    # Write label mapping
    labels_file = os.path.join(output_dir, "labels.json")
    with open(labels_file, "w") as lf:
        json.dump(class_names, lf)
        
    print(f"Saved labels list to {labels_file}")
    print("All done! Model is ready for browser integration.")

if __name__ == "__main__":
    main()
