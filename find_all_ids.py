import requests
import re

def get_link(q):
    url = "https://lite.duckduckgo.com/lite/"
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'}
    try:
        resp = requests.post(url, data={'q': q}, headers=headers, timeout=10)
        links = re.findall(r'href="(https://www\.bigbasket\.com/pd/[^"]+)"', resp.text)
        return links[0] if links else None
    except Exception as e:
        print("Error for query:", q, "->", e)
    return None

def main():
    queries = {
        "amul_butter": "amul butter 500g site:bigbasket.com/pd/",
        "atta": "aashirvaad shudh chakki atta 10kg site:bigbasket.com/pd/",
        "mustard_oil": "fortune mustard oil 1l site:bigbasket.com/pd/",
        "taj_mahal": "brooke bond taj mahal tea 500g site:bigbasket.com/pd/",
        "dettol": "dettol liquid handwash original site:bigbasket.com/pd/",
        "haldirams": "haldirams bhujia sev 400g site:bigbasket.com/pd/"
    }
    for cls, q in queries.items():
        link = get_link(q)
        print(f"Class: {cls} -> Link: {link}")

if __name__ == "__main__":
    main()
