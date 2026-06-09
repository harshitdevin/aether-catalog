import html
import re

def main():
    with open("bing.html", "r", encoding="utf-8") as f:
        text = f.read()
        
    text_unescaped = html.unescape(text)
    
    # Count iusc class occurrences
    iusc_count = text.lower().count("class=\"iusc\"") or text.lower().count("class='iusc'") or text.lower().count("class=iusc")
    print("iusc count:", iusc_count)
    
    # Find all iusc elements
    # <a class="iusc" ... m="..." ...>
    iusc_matches = re.findall(r'<a[^>]+class=["\']iusc["\'][^>]*m=["\']([^"\']+)["\']', text)
    print("iusc matches using regex:", len(iusc_matches))
    
    # Let's inspect the first 5 iusc matches
    for i, m in enumerate(iusc_matches[:5]):
        unescaped_m = html.unescape(m)
        print(f"Match {i}: {unescaped_m[:300]}")

if __name__ == "__main__":
    main()
