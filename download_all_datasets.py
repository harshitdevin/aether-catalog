import os
import sys
import json
import shutil
import requests
import re
import time
from PIL import Image
from io import BytesIO

DATASET_DIR = './dataset'
SCRATCH_DIR = './scratch'

# Target products mapping: key -> BigBasket product ID
PRODUCT_IDS = {
    "tata_salt": "241600",
    "maggi": "266109",
    "amul_butter": "104860",
    "atta": "126906",
    "mustard_oil": "274145",
    "taj_mahal": "266154",
    "haldirams": "40053876",
    "dettol": "266580"
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
            print(f"  Removed old file: {item}")

def download_bigbasket_images(cls_name, prod_id, dest_dir):
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'}
    downloaded = 0
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
                        time.sleep(0.02)
                except Exception as e:
                    print(f"    Failed to download image {url_high_res}: {e}")
        else:
            print(f"    Failed to load BigBasket page. Status code: {page_resp.status_code}")
    except Exception as e:
        print(f"    Request failed for ID {prod_id}: {e}")
        
    return downloaded

def crawl_bing_images(cls_name, queries, dest_dir, max_images=30):
    print(f"  Crawling Bing images for {cls_name}...")
    from icrawler.builtin import BingImageCrawler
    
    downloaded = 0
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
    return downloaded

def gather_unknown_backgrounds():
    print("\n--- Gathering Unknown backgrounds ---")
    unknown_dir = os.path.join(DATASET_DIR, 'unknown')
    os.makedirs(unknown_dir, exist_ok=True)
    
    # Write a dummy black image to guarantee at least one base file
    import cv2
    import numpy as np
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
    crawled = crawl_bing_images("unknown", queries, unknown_dir, max_images=30)
    print(f"  Total Unknown background images: {len(os.listdir(unknown_dir))}")

def main():
    purge_old_dataset()
    
    for cls_name, prod_id in PRODUCT_IDS.items():
        print(f"\n--- Gathering {cls_name} images ---")
        dest_dir = os.path.join(DATASET_DIR, cls_name)
        os.makedirs(dest_dir, exist_ok=True)
        
        downloaded = download_bigbasket_images(cls_name, prod_id, dest_dir)
        print(f"  Total {cls_name} images downloaded: {downloaded}")
        
    gather_unknown_backgrounds()
    print("\nDataset gathering completed successfully!")

if __name__ == "__main__":
    main()
