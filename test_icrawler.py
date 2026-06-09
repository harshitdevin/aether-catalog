from icrawler.builtin import GoogleImageCrawler, BingImageCrawler
import os
import shutil

def run_test():
    queries = ["tata salt 1kg", "tata salt packet"]
    
    # 1. Test Bing
    for q in queries:
        save_dir = f"./dataset/bing_{q.replace(' ', '_')}"
        if os.path.exists(save_dir):
            shutil.rmtree(save_dir)
        os.makedirs(save_dir, exist_ok=True)
        
        print(f"\n--- Testing Bing for '{q}' ---")
        crawler = BingImageCrawler(downloader_threads=2, storage={'root_dir': save_dir})
        crawler.crawl(keyword=q, max_num=10)
        print("Downloaded files:", len(os.listdir(save_dir)))
        
    # 2. Test Google
    for q in queries:
        save_dir = f"./dataset/google_{q.replace(' ', '_')}"
        if os.path.exists(save_dir):
            shutil.rmtree(save_dir)
        os.makedirs(save_dir, exist_ok=True)
        
        print(f"\n--- Testing Google for '{q}' ---")
        crawler = GoogleImageCrawler(downloader_threads=2, storage={'root_dir': save_dir})
        crawler.crawl(keyword=q, max_num=10)
        print("Downloaded files:", len(os.listdir(save_dir)))

if __name__ == "__main__":
    run_test()
