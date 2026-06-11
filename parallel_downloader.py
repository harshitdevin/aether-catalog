import os
import json
import shutil
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from icrawler.builtin import BingImageCrawler

DATASET_DIR = './dataset'
SCRATCH_DIR = './scratch'
MAX_WORKERS = 8
IMAGES_PER_PRODUCT = 8

def crawl_single_class(cls, q):
    cls_dir = os.path.join(DATASET_DIR, cls)
    
    # Check if we already have enough images
    if os.path.exists(cls_dir):
        existing_files = [f for f in os.listdir(cls_dir) if os.path.isfile(os.path.join(cls_dir, f))]
        if len(existing_files) >= IMAGES_PER_PRODUCT:
            print(f"  [Skip] '{cls}' already has {len(existing_files)} images.")
            return cls, len(existing_files)
            
    os.makedirs(cls_dir, exist_ok=True)
    temp_dir = os.path.join(SCRATCH_DIR, f"temp_{cls}_{int(time.time() * 1000) % 100000}")
    shutil.rmtree(temp_dir, ignore_errors=True)
    os.makedirs(temp_dir, exist_ok=True)
    
    print(f"  [Start] Crawling '{cls}' using query: '{q}'...")
    downloaded = 0
    try:
        # Silenced log_level=50 to prevent terminal flooding
        crawler = BingImageCrawler(downloader_threads=2, storage={'root_dir': temp_dir}, log_level=50)
        crawler.crawl(keyword=q, max_num=IMAGES_PER_PRODUCT)
        
        # Copy to dataset directory
        for f in os.listdir(temp_dir):
            src = os.path.join(temp_dir, f)
            if os.path.isfile(src):
                ext = os.path.splitext(f)[1].lower()
                if ext in ['.jpg', '.jpeg', '.png']:
                    dest = os.path.join(cls_dir, f"img_{downloaded}{ext}")
                    shutil.copy(src, dest)
                    downloaded += 1
    except Exception as e:
        print(f"  [Error] '{cls}': {e}")
    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)
        
    print(f"  [Finished] '{cls}': Downloaded {downloaded} images.")
    return cls, downloaded

def main():
    templates_file = "./modules/templates.json"
    if not os.path.exists(templates_file):
        templates_file = "modules/templates.json"
        
    classes_to_crawl = {}
    
    try:
        with open(templates_file, 'r', encoding='utf-8') as f:
            templates_data = json.load(f)
            for item in templates_data:
                if item.get("category") == "Indian Groceries":
                    key = item.get("key")
                    name = item.get("name")
                    cleaned_name = name.replace('"', '').replace('(', '').replace(')', '').replace('\'', '')
                    classes_to_crawl[key] = cleaned_name
    except Exception as e:
        print(f"Error loading templates: {e}")
        return
        
    # Standard fallbacks
    for fallback in ["tata_salt", "maggi", "amul_butter", "atta", "dettol", "haldirams", "mustard_oil", "taj_mahal"]:
        if fallback not in classes_to_crawl:
            classes_to_crawl[fallback] = fallback.replace('_', ' ')
            
    print(f"Loaded {len(classes_to_crawl)} grocery classes. Starting parallel crawling...")
    
    start_time = time.time()
    
    results = {}
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = {executor.submit(crawl_single_class, cls, q): cls for cls, q in classes_to_crawl.items()}
        for future in as_completed(futures):
            cls, count = future.result()
            results[cls] = count
            
    elapsed = time.time() - start_time
    print(f"\nAll parallel downloads completed in {elapsed:.2f}s!")
    print(f"Successfully processed {len(results)} classes.")

if __name__ == "__main__":
    main()
