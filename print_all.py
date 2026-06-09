import requests
import re
import urllib.parse

def main():
    classes = ["amul_butter", "tata_salt"]
    search_queries = {
        "amul_butter": "amul butter 500g",
        "tata_salt": "tata salt 1kg"
    }
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'}
    for cls in classes:
        query = search_queries[cls]
        url = f"https://www.jiomart.com/search/{urllib.parse.quote(query)}"
        resp = requests.get(url, headers=headers, timeout=10)
        html = resp.text.replace('\\u002F', '/')
        img_urls = re.findall(r'(https://[^\'"\s<>]+?/products/pictures/[^\'"\s<>]+?\.(?:png|jpg|jpeg|webp))', html)
        unique_urls = list(set(img_urls))
        print(f"Class: {cls}")
        for i, u in enumerate(unique_urls):
            print(f"  {i}: {u}")

if __name__ == "__main__":
    main()
