import requests

def main():
    queries = ["dettol", "haldiram bhujia"]
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'}
    for q in queries:
        url = f"https://www.bigbasket.com/doc/v1/store/search/?q={q}"
        try:
            resp = requests.get(url, headers=headers, timeout=10)
            print(f"Query: {q} -> Status: {resp.status_code}")
            data = resp.json()
            # Inspect the products returned
            products = data.get("tab_info", {}).get("product_list", {}).get("products", [])
            print(f"  Products found in API: {len(products)}")
            for p in products[:3]:
                print(f"    ID: {p.get('id')} -> Title: {p.get('p_desc')} -> Image: {p.get('p_img_url')}")
        except Exception as e:
            print(f"Query: {q} -> Error: {e}")

if __name__ == "__main__":
    main()
