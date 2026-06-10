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

def download_dataset_via_crawler(base_dir, classes):
    """Downloads real-world images from Bing using icrawler."""
    print("Downloading diverse real-world images from Bing using icrawler...")
    from icrawler.builtin import BingImageCrawler
    import json
    
    # Ensure base directory exists (do not delete so we can resume)
    os.makedirs(base_dir, exist_ok=True)
    
    # Generate search queries dynamically from templates.json
    search_queries = {
        "unknown": ["office desk clutter", "wooden table surface", "hand holding phone", "soap bar package", "blank wall background"]
    }
    
    templates_file = os.path.join(os.path.dirname(__file__), 'modules', 'templates.json')
    if not os.path.exists(templates_file):
        templates_file = "./modules/templates.json"
        
    try:
        with open(templates_file, 'r', encoding='utf-8') as f:
            templates_data = json.load(f)
            for item in templates_data:
                if item.get("category") == "Indian Groceries":
                    key = item.get("key")
                    name = item.get("name")
                    # Clean name for searching
                    cleaned_name = name.replace('"', '').replace('(', '').replace(')', '').replace('\'', '')
                    search_queries[key] = [cleaned_name] # Single query to run crawler once
    except Exception as e:
        print(f"Error loading search queries dynamically: {e}")
        
    for cls in classes:
        cls_dir = os.path.join(base_dir, cls)
        if os.path.exists(cls_dir):
            existing_files = [f for f in os.listdir(cls_dir) if os.path.isfile(os.path.join(cls_dir, f))]
            if len(existing_files) >= 15:
                print(f"Class '{cls}' already has {len(existing_files)} images. Skipping crawling.")
                continue
                
        os.makedirs(cls_dir, exist_ok=True)
        
        queries = search_queries.get(cls, [f"{cls} package"])
        print(f"\nCrawling images for class: {cls}...")
        
        # We download up to 15 images per class (with data augmentation, this is plenty and keeps training fast on CPU)
        images_per_query = 15
        downloaded_count = 0
        
        for q in queries:
            if downloaded_count >= 15:
                break
                
            temp_dir = os.path.join(base_dir, f"temp_{cls}_{q.replace(' ', '_')}")
            os.makedirs(temp_dir, exist_ok=True)
            
            try:
                # Use Bing crawler with 3 threads for speed
                crawler = BingImageCrawler(downloader_threads=3, storage={'root_dir': temp_dir}, log_level=50) # log_level=50 silences logs
                crawler.crawl(keyword=q, max_num=images_per_query)
                
                # Move files from temp_dir to cls_dir and rename to avoid conflicts
                for f in os.listdir(temp_dir):
                    if downloaded_count >= 15:
                        break
                    src = os.path.join(temp_dir, f)
                    if os.path.isfile(src):
                        ext = os.path.splitext(f)[1].lower()
                        if ext in ['.jpg', '.jpeg', '.png']:
                            dest = os.path.join(cls_dir, f"img_{downloaded_count}{ext}")
                            shutil.move(src, dest)
                            downloaded_count += 1
            except Exception as e:
                print(f"  Crawler error for query '{q}': {e}")
            finally:
                # Clean up temp folder
                shutil.rmtree(temp_dir, ignore_errors=True)
                
        print(f"  Total crawled images for {cls}: {downloaded_count}")
        
        # If we didn't get enough images, generate synthetic shapes to top up
        if downloaded_count < 10:
            print(f"  Only got {downloaded_count} images. Generating synthetic fallbacks...")
            generate_synthetic_for_class(cls_dir, cls, (128, 128, 128), num_images=(15 - downloaded_count))

def main():
    dataset_dir = "./dataset"
    
    # Dynamically load classes from templates.json
    import json
    templates_file = "./modules/templates.json"
    if not os.path.exists(templates_file):
        templates_file = "modules/templates.json"
        
    classes = []
    try:
        with open(templates_file, 'r', encoding='utf-8') as f:
            templates_data = json.load(f)
            for item in templates_data:
                if item.get("category") == "Indian Groceries":
                    classes.append(item.get("key"))
    except Exception as e:
        print(f"Error loading classes list: {e}")
        
    # Ensure standard fallbacks are included
    for fallback in ["tata_salt", "maggi", "amul_butter", "atta", "dettol", "haldirams", "mustard_oil", "taj_mahal"]:
        if fallback not in classes:
            classes.append(fallback)
            
    classes.sort()
    if "unknown" not in classes:
        classes.append("unknown")
        
    print(f"Dynamic dataset classes loaded: {len(classes)} classes.")
    
    # 1. Skip Kaggle download as we use icrawler for large dynamic grocery lists
    download_success = False
    
    # Check if dataset actually contains images or folders, otherwise build fallback using Bing Crawler
    if not download_success or not os.path.exists(dataset_dir) or len(os.listdir(dataset_dir)) == 0:
        download_dataset_via_crawler(dataset_dir, classes)
        
    # 2. Get class names
    print("Loading class names from dataset directory...")
    class_names = sorted([d for d in os.listdir(dataset_dir) if os.path.isdir(os.path.join(dataset_dir, d))])
    print(f"Dataset classes loaded: {len(class_names)} classes.")
    
    # 3. Build Prototypical Few-Shot Classifier with Pretrained MobileNetV2
    print("Building Prototypical Few-Shot Classifier with MobileNetV2...")
    base_model = tf.keras.applications.MobileNetV2(
        input_shape=(224, 224, 3),
        include_top=False,
        weights='imagenet',
        pooling='avg'
    )
    base_model.trainable = False
    
    # Embedding model for extracting features
    embedding_model = tf.keras.Sequential([
        tf.keras.layers.Rescaling(1./127.5, offset=-1, input_shape=(224, 224, 3)),
        base_model
    ])
    
    print("Extracting class centroids...")
    num_classes = len(class_names)
    W = np.zeros((1280, num_classes), dtype=np.float32)
    
    for idx, cls in enumerate(class_names):
        cls_dir = os.path.join(dataset_dir, cls)
        img_paths = [os.path.join(cls_dir, f) for f in os.listdir(cls_dir) if os.path.isfile(os.path.join(cls_dir, f))]
        
        embeddings = []
        for img_path in img_paths:
            try:
                img = tf.keras.utils.load_img(img_path, target_size=(224, 224))
                x = tf.keras.utils.img_to_array(img)
                x = np.expand_dims(x, axis=0)
                emb = embedding_model.predict(x, verbose=0)
                embeddings.append(emb[0])
            except Exception as e:
                pass
                
        if len(embeddings) > 0:
            mean_emb = np.mean(embeddings, axis=0)
            norm = np.linalg.norm(mean_emb)
            if norm > 0:
                mean_emb = mean_emb / norm
            W[:, idx] = mean_emb
            print(f"  Class '{cls}': Extracted centroid from {len(embeddings)} images.")
        else:
            W[:, idx] = np.zeros(1280)
            print(f"  Class '{cls}': Warning! No images found. Set to zero vector.")
            
    print("Centroids extracted successfully.")
    
    # 4. Build the final classification model with centroids injected as weights of the Dense layer
    model = tf.keras.Sequential([
        tf.keras.layers.Rescaling(1./127.5, offset=-1, input_shape=(224, 224, 3)),
        base_model,
        tf.keras.layers.Dense(num_classes, use_bias=False, activation='softmax')
    ])
    
    # Inject the centroids into the dense layer weights
    model.layers[2].set_weights([W])
    print("Injected L2-normalized centroids analytically into Dense classification layer weights.")
    
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
        keras_model_path = "./temp_keras_model.keras"
        model.save(keras_model_path)
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
