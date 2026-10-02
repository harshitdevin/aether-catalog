import os
import sys
import json
import shutil
import requests
import re
import time
from PIL import Image, ImageOps
from io import BytesIO

DATASET_DIR = './dataset'
SCRATCH_DIR = './scratch'

# Indian Grocery Beverages classes mapping
BEVERAGE_PRODUCTS = {
    "thums_up": {
        "bb_ids": ["266044", "100080", "251037"],
        "bing_queries": [
            "thums up soft drink bottle 750ml",
            "thums up can 300ml india",
            "thums up cold drink plastic bottle",
            "thums up bottle 225ml"
        ]
    },
    "coca_cola": {
        "bb_ids": ["251006", "100083", "266041"],
        "bing_queries": [
            "coca cola bottle 750ml india",
            "coca cola soft drink can 300ml",
            "coca cola plastic bottle product",
            "coca cola cold drink bottle"
        ]
    },
    "sprite": {
        "bb_ids": ["251014", "100085", "266045"],
        "bing_queries": [
            "sprite bottle 750ml india",
            "sprite soft drink can 300ml",
            "sprite cold drink plastic bottle",
            "sprite 2L bottle product"
        ]
    },
    "maaza": {
        "bb_ids": ["266042", "100078", "251035"],
        "bing_queries": [
            "maaza mango drink bottle 1.2L",
            "maaza tetra pack 200ml",
            "maaza mango juice bottle product",
            "frooti maaza mango drink pack"
        ]
    },
    "real_juice": {
        "bb_ids": ["266068", "100007", "251044"],
        "bing_queries": [
            "real fruit power juice pack 1L",
            "real mixed fruit juice tetra pack",
            "real apple juice pack india",
            "real orange juice pack product"
        ]
    },
    "amul_kool": {
        "bb_ids": ["100285499", "258284", "40004543"],
        "bing_queries": [
            "amul kool bottle flavoured milk",
            "amul kool kesar glass bottle",
            "amul lassi tetra pack 200ml",
            "amul kool elaichi drink bottle"
        ]
    },
    "nescafe_coffee": {
        "bb_ids": ["266155", "100004", "251070"],
        "bing_queries": [
            "nescafe classic coffee jar 50g",
            "nescafe instant coffee glass jar",
            "nescafe classic coffee pouch india",
            "nescafe gold coffee jar product"
        ]
    },
    "taj_mahal_tea": {
        "bb_ids": ["266154", "100005", "251071"],
        "bing_queries": [
            "taj mahal tea pack 500g box",
            "brooke bond taj mahal tea pack",
            "taj mahal tea pouch india",
            "taj mahal tea box product"
        ]
    }
}

def purge_old_dataset():
    print("--- [1] Purging old dataset folders ---")
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

def try_kaggle_download():
    """Attempts downloading Kaggle Indian Grocery / Beverage datasets if API token configured."""
    print("--- Checking Kaggle API integration ---")
    try:
        import kaggle
        print("  Kaggle API package detected. Attempting dataset query...")
        kaggle.api.dataset_list(search="indian grocery beverages")
        print("  Kaggle API successfully authenticated.")
    except Exception as e:
        print(f"  Kaggle API notice: {e}. Falling back to automated BigBasket & Bing web dataset scraper.")

def download_bigbasket_images(cls_name, prod_ids, dest_dir, count_offset=0):
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'}
    downloaded = count_offset
    
    for prod_id in prod_ids:
        bb_url = f"https://www.bigbasket.com/pd/{prod_id}/"
        try:
            page_resp = requests.get(bb_url, headers=headers, timeout=8)
            if page_resp.status_code == 200:
                html_text = page_resp.text
                img_pattern = r'(https://www\.bbassets\.com/media/uploads/p/[^"\'\s<>\\#]+?' + prod_id + r'[^"\'\s<>\\#]+?\.(?:jpg|jpeg|png))'
                img_urls = re.findall(img_pattern, html_text)
                unique_urls = list(set(img_urls))
                
                for url in unique_urls:
                    url_high_res = re.sub(r'/media/uploads/p/[a-z]+/', '/media/uploads/p/l/', url)
                    try:
                        img_resp = requests.get(url_high_res, headers=headers, timeout=8)
                        if img_resp.status_code == 200:
                            img = Image.open(BytesIO(img_resp.content)).convert("RGB")
                            save_path = os.path.join(dest_dir, f"img_bb_{downloaded}.jpg")
                            img.save(save_path, "JPEG")
                            downloaded += 1
                            time.sleep(0.02)
                    except Exception:
                        pass
        except Exception:
            pass
            
    return downloaded - count_offset

def crawl_bing_images(cls_name, queries, dest_dir, max_images=60, count_offset=0):
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
            
            for f in os.listdir(temp_dir):
                src = os.path.join(temp_dir, f)
                if os.path.isfile(src):
                    ext = os.path.splitext(f)[1].lower()
                    if ext in ['.jpg', '.jpeg', '.png']:
                        dest = os.path.join(dest_dir, f"img_crawl_{downloaded}{ext}")
                        shutil.copy(src, dest)
                        downloaded += 1
        except Exception as e:
            print(f"    Crawler note for '{q}': {e}")
            
    shutil.rmtree(temp_root, ignore_errors=True)
    return downloaded - count_offset

def gather_unknown_class():
    print("\n--- Gathering Unknown class (hands & background surfaces) ---")
    unknown_dir = os.path.join(DATASET_DIR, 'unknown')
    os.makedirs(unknown_dir, exist_ok=True)
    
    import cv2
    import numpy as np
    dummy_img = np.zeros((224, 224, 3), dtype=np.uint8)
    cv2.imwrite(os.path.join(unknown_dir, 'dummy.jpg'), dummy_img)
    
    queries = [
        "human hand holding nothing close up",
        "human palm skin texture background",
        "empty wooden table top view",
        "empty kitchen counter background",
        "empty store shelf background"
    ]
    crawled = crawl_bing_images("unknown", queries, unknown_dir, max_images=60, count_offset=1)
    print(f"  Total Unknown background & hand images: {len(os.listdir(unknown_dir))}")

def main():
    purge_old_dataset()
    try_kaggle_download()
    
    for cls_name, info in BEVERAGE_PRODUCTS.items():
        print(f"\n--- Gathering '{cls_name}' Indian Beverage images ---")
        dest_dir = os.path.join(DATASET_DIR, cls_name)
        os.makedirs(dest_dir, exist_ok=True)
        
        bb_count = download_bigbasket_images(cls_name, info["bb_ids"], dest_dir)
        print(f"  BigBasket downloaded: {bb_count}")
        bing_count = crawl_bing_images(cls_name, info["bing_queries"], dest_dir, max_images=50, count_offset=bb_count)
        print(f"  Bing crawled: {bing_count}")
        print(f"  Total for '{cls_name}': {len(os.listdir(dest_dir))}")
        
    gather_unknown_class()
    print("\nIndian Grocery Beverages dataset downloaded successfully!")

if __name__ == "__main__":
    main()
