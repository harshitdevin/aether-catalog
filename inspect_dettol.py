import requests
import re

def main():
    url = "https://www.bigbasket.com/pd/40129068/"
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'}
    try:
        resp = requests.get(url, headers=headers, timeout=10)
        html = resp.text
        # Print all bbassets image URLs
        images = re.findall(r'(https://www\.bbassets\.com/media/uploads/p/[^\'"\s<>\\#]+?\.(?:jpg|png|jpeg))', html)
        print("Total images on Dettol page:", len(images))
        unique_images = list(set(images))
        print("Unique images on Dettol page:", len(unique_images))
        for img in unique_images[:15]:
            print("  ", img)
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    main()
