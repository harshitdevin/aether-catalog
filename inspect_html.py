import re

def main():
    with open("google.html", "r", encoding="utf-8") as f:
        html = f.read()
    
    print("Total len:", len(html))
    
    # Print all occurrences of <body and some characters after
    body_pos = html.lower().find("<body")
    if body_pos != -1:
        print("Body snippet:", html[body_pos:body_pos+500])
    
    # Check for any img tags
    img_tags = re.findall(r'<img[^>]+src=["\']([^"\']+)["\']', html)
    print("img src matches:", len(img_tags))
    
    # Search for all strings starting with https://
    urls = re.findall(r'(https?://[^\'"\s<>]+)', html)
    print("Total HTTP/HTTPS URLs found:", len(urls))
    if len(urls) > 0:
        print("Sample URLs:", list(set(urls))[:10])

if __name__ == "__main__":
    main()
