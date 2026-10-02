import os
import sys
import requests
import re
import time
import shutil
from PIL import Image, ImageEnhance, ImageOps
from io import BytesIO

sys.stdout.reconfigure(encoding='utf-8')

DATASET_DIR = './dataset'
SCRATCH_DIR = './scratch'

TARGETS = {
    "maggi": {
        "bb_ids": ["266109", "100004245", "100004250"],
        "queries": [
            "maggi noodles packet 2 minute yellow",
            "nestle maggi masala noodles pack",
            "maggi single pack front view",
            "maggi noodles pouch"
        ]
    },
    "surfexcel": {
        "bb_ids": ["266580", "100004085", "40045434"],
        "queries": [
            "surf excel easy wash powder pack",
            "surf excel detergent powder 1kg green packet",
            "surf excel matic front load powder",
            "surf excel packet"
        ]
    },
    "tata_salt": {
        "bb_ids": ["241600", "100004200"],
        "queries": [
            "tata salt 1kg packet vacuum evaporated",
            "tata salt packet front photo",
            "tata iodized salt pack blue",
            "tata salt pouch"
        ]
    },
    "colgate_toothpaste": {
        "bb_ids": ["266547", "100004120", "20002598"],
        "queries": [
            "colgate strong teeth toothpaste tube box",
            "colgate max fresh red toothpaste box",
            "colgate toothpaste red box packet",
            "colgate oral care toothpaste tube"
        ]
    }
}

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'}

def download_bb(cls_name, ids, target_dir):
    count = 0
    for pid in ids:
        url = f"https://www.bigbasket.com/pd/{pid}/"
        try:
            r = requests.get(url, headers=headers, timeout=8)
            if r.status_code == 200:
                pattern = r'(https://www\.bbassets\.com/media/uploads/p/[^"\'\s<>\\#]+?' + pid + r'[^"\'\s<>\\#]+?\.(?:jpg|jpeg|png))'
                matches = list(set(re.findall(pattern, r.text)))
                for m_url in matches:
                    high_res = re.sub(r'/media/uploads/p/[a-z]+/', '/media/uploads/p/l/', m_url)
                    try:
                        ir = requests.get(high_res, headers=headers, timeout=8)
                        if ir.status_code == 200:
                            img = Image.open(BytesIO(ir.content)).convert("RGB")
                            out_path = os.path.join(target_dir, f"bb_extra_{pid}_{count}.jpg")
                            img.save(out_path, "JPEG")
                            count += 1
                    except Exception:
                        pass
        except Exception:
            pass
    return count

def crawl_bing(cls_name, queries, target_dir):
    try:
        from icrawler.builtin import BingImageCrawler
    except ImportError:
        return 0

    temp_root = os.path.join(SCRATCH_DIR, f"temp_{cls_name}")
    shutil.rmtree(temp_root, ignore_errors=True)
    os.makedirs(temp_root, exist_ok=True)
    
    total = 0
    for idx, q in enumerate(queries):
        sub_dir = os.path.join(temp_root, f"q_{idx}")
        os.makedirs(sub_dir, exist_ok=True)
        try:
            crawler = BingImageCrawler(downloader_threads=2, storage={'root_dir': sub_dir}, log_level=50)
            crawler.crawl(keyword=q, max_num=30)
            for f in os.listdir(sub_dir):
                sp = os.path.join(sub_dir, f)
                if os.path.isfile(sp):
                    try:
                        im = Image.open(sp).convert("RGB")
                        if im.width >= 100 and im.height >= 100:
                            dp = os.path.join(target_dir, f"bing_{idx}_{total}_{f}")
                            im.save(dp, "JPEG")
                            total += 1
                    except Exception:
                        pass
        except Exception:
            pass
    shutil.rmtree(temp_root, ignore_errors=True)
    return total

def augment(target_dir):
    images = [f for f in os.listdir(target_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp'))]
    aug_count = 0
    for img_name in images:
        if img_name.startswith("aug_"):
            continue
        p = os.path.join(target_dir, img_name)
        try:
            im = Image.open(p).convert("RGB")
            # Horizontal flip
            im_flip = ImageOps.mirror(im)
            im_flip.save(os.path.join(target_dir, f"aug_flip_{aug_count}_{img_name}"), "JPEG")
            aug_count += 1
            
            # Brightness variation
            enh = ImageEnhance.Brightness(im)
            im_b1 = enh.enhance(1.15)
            im_b1.save(os.path.join(target_dir, f"aug_b1_{aug_count}_{img_name}"), "JPEG")
            aug_count += 1
            
            im_b2 = enh.enhance(0.85)
            im_b2.save(os.path.join(target_dir, f"aug_b2_{aug_count}_{img_name}"), "JPEG")
            aug_count += 1
        except Exception:
            pass
    return aug_count

def main():
    print("=== TARGET PRODUCTS ENHANCEMENT ===")
    for cls_name, info in TARGETS.items():
        tdir = os.path.join(DATASET_DIR, cls_name)
        os.makedirs(tdir, exist_ok=True)
        init_cnt = len(os.listdir(tdir))
        print(f"\nTarget: {cls_name} (Initial count: {init_cnt})")
        
        bb_added = download_bb(cls_name, info["bb_ids"], tdir)
        print(f"  BigBasket added: {bb_added}")
        
        bing_added = crawl_bing(cls_name, info["queries"], tdir)
        print(f"  Bing crawled: {bing_added}")
        
        aug_added = augment(tdir)
        print(f"  Augmentations added: {aug_added}")
        
        final_cnt = len(os.listdir(tdir))
        print(f"  Total images for {cls_name}: {final_cnt}")

if __name__ == '__main__':
    main()
