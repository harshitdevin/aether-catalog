import requests
import re

def main():
    product_id = "241600"
    url = f"https://www.bigbasket.com/pd/{product_id}/"
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'}
    try:
        # Allow redirects
        resp = requests.get(url, headers=headers, timeout=10, allow_redirects=True)
        print("Final URL after redirects:", resp.url)
        print("Status code:", resp.status_code)
        print("HTML length:", len(resp.text))
        
        # Check if the product images exist in HTML
        images = re.findall(r'(https://www\.bbassets\.com/media/uploads/p/[^\'"\s<>\\#]+?' + product_id + r'[^"\'\s<>\\#]+?\.(?:jpg|png|jpeg))', resp.text)
        print("Images found:", len(images))
        if len(images) > 0:
            print("Samples:")
            for img in list(set(images))[:5]:
                print("  ", img)
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    main()
