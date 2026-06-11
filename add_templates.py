import json
import os

TEMPLATES_FILE = os.path.join('modules', 'templates.json')

new_templates = [
    {
        "key": "amul_butter",
        "name": "Amul Butter Pasteurised",
        "category": "Indian Groceries",
        "value": 275.0,
        "manufacturer": "Amul",
        "model": "500g Pack",
        "tags": ["butter", "dairy", "amul", "cooking"],
        "notes": "Amul Pasteurised Butter (500g Pack). Keep refrigerated.",
        "image": "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><rect width='100' height='100' fill='%231e293b'/><text x='50' y='55' fill='%236366f1' font-family='sans-serif' font-size='10' font-weight='bold' text-anchor='middle'>amul_butter</text></svg>"
    },
    {
        "key": "atta",
        "name": "Aashirvaad Shudh Chakki Atta",
        "category": "Indian Groceries",
        "value": 460.0,
        "manufacturer": "ITC",
        "model": "10kg Bag",
        "tags": ["atta", "flour", "wheat", "roti"],
        "notes": "Aashirvaad Shudh Chakki Atta (10kg Bag). 100% pure whole wheat flour.",
        "image": "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><rect width='100' height='100' fill='%231e293b'/><text x='50' y='55' fill='%236366f1' font-family='sans-serif' font-size='10' font-weight='bold' text-anchor='middle'>atta</text></svg>"
    },
    {
        "key": "mustard_oil",
        "name": "Fortune Kachi Ghani Mustard Oil",
        "category": "Indian Groceries",
        "value": 175.0,
        "manufacturer": "Fortune",
        "model": "1L Bottle",
        "tags": ["oil", "mustard oil", "cooking", "groceries"],
        "notes": "Fortune Kachi Ghani Pure Mustard Oil (1L Bottle).",
        "image": "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><rect width='100' height='100' fill='%231e293b'/><text x='50' y='55' fill='%236366f1' font-family='sans-serif' font-size='10' font-weight='bold' text-anchor='middle'>mustard_oil</text></svg>"
    },
    {
        "key": "taj_mahal",
        "name": "Brooke Bond Taj Mahal Tea",
        "category": "Indian Groceries",
        "value": 350.0,
        "manufacturer": "HUL",
        "model": "500g Pack",
        "tags": ["tea", "chai", "taj mahal", "beverage"],
        "notes": "Brooke Bond Taj Mahal Tea (500g Pack). Premium tea blend.",
        "image": "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><rect width='100' height='100' fill='%231e293b'/><text x='50' y='55' fill='%236366f1' font-family='sans-serif' font-size='10' font-weight='bold' text-anchor='middle'>taj_mahal</text></svg>"
    },
    {
        "key": "haldirams",
        "name": "Haldiram's Bhujia Sev",
        "category": "Indian Groceries",
        "value": 110.0,
        "manufacturer": "Haldiram's",
        "model": "400g Pack",
        "tags": ["snacks", "bhujia", "haldirams", "namkeen"],
        "notes": "Haldiram's Bhujia Sev (400g Pack). Crispy and spicy chickpea flour noodles.",
        "image": "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><rect width='100' height='100' fill='%231e293b'/><text x='50' y='55' fill='%236366f1' font-family='sans-serif' font-size='10' font-weight='bold' text-anchor='middle'>haldirams</text></svg>"
    },
    {
        "key": "dettol",
        "name": "Dettol Antiseptic Liquid",
        "category": "Indian Groceries",
        "value": 220.0,
        "manufacturer": "Reckitt Benckiser",
        "model": "500ml Bottle",
        "tags": ["dettol", "handwash", "antiseptic", "hygiene"],
        "notes": "Dettol Liquid Antiseptic (500ml Bottle) for first aid and personal hygiene.",
        "image": "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><rect width='100' height='100' fill='%231e293b'/><text x='50' y='55' fill='%236366f1' font-family='sans-serif' font-size='10' font-weight='bold' text-anchor='middle'>dettol</text></svg>"
    }
]

def add_templates():
    if not os.path.exists(TEMPLATES_FILE):
        print(f"Error: {TEMPLATES_FILE} not found.")
        return
        
    with open(TEMPLATES_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    existing_keys = {item['key'] for item in data}
    added_count = 0
    
    for t in new_templates:
        if t['key'] not in existing_keys:
            data.append(t)
            added_count += 1
            print(f"Adding template for key: {t['key']}")
            
    if added_count > 0:
        with open(TEMPLATES_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2)
        print(f"Success: Added {added_count} templates to {TEMPLATES_FILE}.")
    else:
        print("All templates already exist.")

if __name__ == "__main__":
    add_templates()
