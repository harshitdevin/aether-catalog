import requests
import urllib.parse

def main():
    query = "tata salt 1kg"
    url = f"https://www.jiomart.com/search/{urllib.parse.quote(query)}"
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'}
    try:
        resp = requests.get(url, headers=headers, timeout=10)
        html = resp.text
        
        # Check if the product name appears in the text
        print("tata salt in html:", "tata salt" in html.lower())
        print("iodized in html:", "iodized" in html.lower())
        print("salt in html:", "salt" in html.lower())
        
        # Print some count of occurrences
        print("Occurrences of 'tata':", html.lower().count("tata"))
        print("Occurrences of 'salt':", html.lower().count("salt"))
        
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    main()
