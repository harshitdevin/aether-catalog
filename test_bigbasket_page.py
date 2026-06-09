import requests
import re
import urllib.parse

def main():
    query = "tata salt 1kg"
    url = f"https://www.bigbasket.com/ps/?q={urllib.parse.quote(query)}"
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'}
    try:
        resp = requests.get(url, headers=headers, timeout=10)
        print("Status code:", resp.status_code)
        html = resp.text
        print("HTML length:", len(html))
        
        # Look for bbassets.com image links
        images = re.findall(r'(https://www\.bbassets\.com/media/uploads/p/[^\'"\s<>\\#]+?\.(?:jpg|png|jpeg))', html)
        print("bbassets image URLs found:", len(images))
        if len(images) > 0:
            print("Unique images count:", len(set(images)))
            print("Samples:")
            for img in list(set(images))[:10]:
                print("  ", img)
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    main()
