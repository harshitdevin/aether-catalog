import requests
import re
import urllib.parse

def get_bigbasket_url(query):
    ddg_url = "https://lite.duckduckgo.com/lite/"
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'}
    try:
        resp = requests.post(ddg_url, data={'q': query}, headers=headers, timeout=10)
        if resp.status_code == 200:
            links = re.findall(r'href="(https://www\.bigbasket\.com/pd/[^"]+)"', resp.text)
            if links:
                return links[0]
    except Exception as e:
        print(f"Error: {e}")
    return None

def main():
    queries = {
        "amul_butter": "amul butter 500g",
        "atta": "aashirvaad atta 10kg",
        "dettol": "dettol liquid handwash original",
        "haldirams": "haldirams bhujia sev",
        "maggi": "maggi noodles masala",
        "mustard_oil": "fortune mustard oil",
        "taj_mahal": "taj mahal tea",
        "tata_salt": "tata salt 1kg"
    }
    
    for cls, q in queries.items():
        search_query = f"{q} site:bigbasket.com/pd/"
        url = get_bigbasket_url(search_query)
        print(f"Query: '{search_query}' -> Link: {url}")

if __name__ == "__main__":
    main()
