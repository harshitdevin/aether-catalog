import requests
import re

def main():
    # A list of common Haldiram's product IDs on BigBasket
    ids = [
        "100022424", "268228", "100114092", "30006389",
        "40053876", "268224", "40101416", "100114068",
        "268227", "100114056", "268241", "268233", "268235"
    ]
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'}
    for pid in ids:
        url = f"https://www.bigbasket.com/pd/{pid}/"
        try:
            resp = requests.get(url, headers=headers, timeout=10)
            images = re.findall(r'(https://www\.bbassets\.com/media/uploads/p/[^\'"\s<>\\#]+?' + pid + r'[^"\'\s<>\\#]+?\.(?:jpg|png|jpeg))', resp.text)
            if len(images) > 0 or len(resp.text) > 50000:
                print(f"FOUND ACTIVE - ID: {pid:8} -> Status: {resp.status_code} -> HTML Len: {len(resp.text):6} -> Images: {len(images)}")
            else:
                print(f"Inactive - ID: {pid:8} -> HTML Len: {len(resp.text):6}")
        except Exception as e:
            print(f"ID: {pid} -> Error: {e}")

if __name__ == "__main__":
    main()
