import requests
import re
import urllib.parse

def main():
    query = "tata salt packet"
    url = f"https://www.google.com/search?q={urllib.parse.quote(query)}&tbm=isch"
    # An old User-Agent that triggers Google's legacy HTML search
    headers = {'User-Agent': 'Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1; SV1)'}
    try:
        resp = requests.get(url, headers=headers, timeout=10)
        print("Status code:", resp.status_code)
        html = resp.text
        print("HTML length:", len(html))
        
        # Check for legacy img tags which look like: <img src="https://encrypted-tbn0.gstatic.com/images?q=..."
        img_srcs = re.findall(r'<img[^>]+src="([^"]+)"', html)
        print("Gstatic images found:", len(img_srcs))
        if len(img_srcs) > 0:
            print("Legacy img sample:", img_srcs[:5])
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    main()
