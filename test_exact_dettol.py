import requests
import re

def main():
    url = "https://www.bigbasket.com/pd/40129068/dettol-liquid-handwash-refill-original-175-ml-pouch/"
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'}
    try:
        resp = requests.get(url, headers=headers, timeout=10)
        print("Status:", resp.status_code)
        print("Final URL:", resp.url)
        print("HTML length:", len(resp.text))
        
        # Search for all bbassets image links
        images = re.findall(r'(https://www\.bbassets\.com/media/uploads/p/[^\'"\s<>\\#]+?\.(?:jpg|png|jpeg))', resp.text)
        print("bbassets images found:", len(images))
        if len(images) > 0:
            print("Unique images count:", len(set(images)))
            for img in list(set(images))[:5]:
                print("  ", img)
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    main()
