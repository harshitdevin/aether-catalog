import requests
import urllib.parse

def main():
    query = "tata salt packet"
    url = f"https://www.bing.com/images/search?q={urllib.parse.quote(query)}"
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'}
    try:
        resp = requests.get(url, headers=headers, timeout=10)
        print("Status code:", resp.status_code)
        with open("bing.html", "w", encoding="utf-8") as f:
            f.write(resp.text)
        print("Wrote HTML to bing.html. Length:", len(resp.text))
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    main()
