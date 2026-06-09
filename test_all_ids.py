import requests
import re

def main():
    product_ids = {
        "amul_butter": "104860",
        "atta": "126906",
        "dettol": "40129068",
        "haldirams": "268228",
        "maggi": "266109",
        "mustard_oil": "274145",
        "taj_mahal": "266154",
        "tata_salt": "241600"
    }
    
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'}
    
    for cls, prod_id in product_ids.items():
        url = f"https://www.bigbasket.com/pd/{prod_id}/"
        try:
            resp = requests.get(url, headers=headers, timeout=10)
            images = re.findall(r'(https://www\.bbassets\.com/media/uploads/p/[^\'"\s<>\\#]+?' + prod_id + r'[^"\'\s<>\\#]+?\.(?:jpg|png|jpeg))', resp.text)
            print(f"Class: {cls:12} -> ID: {prod_id} -> Status: {resp.status_code} -> Images: {len(images)}")
        except Exception as e:
            print(f"Class: {cls} -> Error: {e}")

if __name__ == "__main__":
    main()
