def main():
    with open("bing.html", "r", encoding="utf-8") as f:
        html = f.read().lower()
        
    print("tata occurrences:", html.count("tata"))
    print("salt occurrences:", html.count("salt"))
    print("packet occurrences:", html.count("packet"))
    print("flosa occurrences:", html.count("flosa"))
    print("flower occurrences:", html.count("flower"))

if __name__ == "__main__":
    main()
